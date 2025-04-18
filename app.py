import os
import cv2
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import matplotlib.pyplot as plt
from PIL import Image
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['RESULTS_FOLDER'] = 'static/results'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'tif', 'tiff', 'ppm'}

# Folder paths for visualization steps
VESSEL_SEG_FOLDER = 'static/H/vessel_segmentation'
AV_CLASS_FOLDER = 'static/H/av_classification'
FD_FOLDER = 'static/H/fd'

# CSV file path
RETINAL_DATA_CSV = 'static/H/retinal_dataset_FFinal.csv'

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)

# Model paths - update these to your model paths
CUP_MODEL_PATH = "models/cup_model.pt"
DISC_MODEL_PATH = "models/disc_model.pt"

# Load models
cup_model = None
disc_model = None

def load_models():
    global cup_model, disc_model
    logger.info("Loading models...")
    try:
        cup_model = YOLO(CUP_MODEL_PATH)
        disc_model = YOLO(DISC_MODEL_PATH)
        logger.info("Models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_web_format(img_path):
    """Convert TIFF files to PNG for web display"""
    if img_path.lower().endswith(('.tif', '.tiff')):
        # Create a web-friendly version with PIL to avoid potential OpenCV TIFF issues
        try:
            img = Image.open(img_path)
            web_path = img_path.rsplit('.', 1)[0] + '.png'
            img.save(web_path)
            return web_path
        except Exception as e:
            logger.error(f"Error converting TIFF to PNG: {str(e)}")
            return img_path
    return img_path
     
def calculate_cdr(img_path):
    """
    Calculate cup-to-disc ratio for a single image

    Args:
        img_path (str): Path to the input image

    Returns:
        tuple: (CDR value, cup mask image, disc mask image, overlay image)
    """
    try:
        logger.info(f"Calculating CDR for {img_path}")
        start_time = time.time()
        
        # For TIFF images, use PIL to read the image
        if img_path.lower().endswith(('.tif', '.tiff')):
            pil_img = Image.open(img_path)
            img = np.array(pil_img)
            # Convert RGB if needed
            if len(img.shape) == 2:  # Grayscale
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            elif img.shape[2] == 4:  # RGBA
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        else:
            # Regular read for non-TIFF images
            img = cv2.imread(img_path)
            
        if img is None:
            logger.error(f"Could not read image: {img_path}")
            return -1, None, None, None

        H, W = img.shape[:2]
        original_img = img.copy()

        # Get segmentation results
        cup_results = cup_model(img)
        disc_results = disc_model(img)

        # Create mask images
        cup_mask_img = np.zeros((H, W), dtype=np.uint8)
        disc_mask_img = np.zeros((H, W), dtype=np.uint8)
        
        # Process cup mask
        cup_area = 0
        if len(cup_results) > 0 and hasattr(cup_results[0], 'masks') and cup_results[0].masks is not None:
            cup_mask = cup_results[0].masks.data[0].cpu().numpy()
            cup_mask = (cv2.resize(cup_mask, (W, H)) * 255).astype(np.uint8)
            cup_mask_img = cup_mask
            cup_area = np.sum(cup_mask > 0)

        # Process disc mask
        disc_area = 0
        if len(disc_results) > 0 and hasattr(disc_results[0], 'masks') and disc_results[0].masks is not None:
            disc_mask = disc_results[0].masks.data[0].cpu().numpy()
            disc_mask = (cv2.resize(disc_mask, (W, H)) * 255).astype(np.uint8)
            disc_mask_img = disc_mask
            disc_area = np.sum(disc_mask > 0)

        # Create visualization overlay
        overlay = original_img.copy()
        
        # Create colored masks for visualization
        cup_colored = np.zeros_like(original_img)
        cup_colored[cup_mask_img > 0] = [0, 0, 255]  # Red for cup
        
        disc_colored = np.zeros_like(original_img)
        disc_colored[disc_mask_img > 0] = [0, 255, 0]  # Green for disc
        
        # Overlay masks
        alpha = 0.5
        overlay = cv2.addWeighted(overlay, 1, disc_colored, alpha, 0)
        overlay = cv2.addWeighted(overlay, 1, cup_colored, alpha, 0)
        
        # Draw contours
        cup_contours, _ = cv2.findContours(cup_mask_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        disc_contours, _ = cv2.findContours(disc_mask_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if cup_contours:
            cv2.drawContours(overlay, cup_contours, -1, (255, 255, 255), 2)
        if disc_contours:
            cv2.drawContours(overlay, disc_contours, -1, (255, 255, 255), 1)
            
        # Calculate ratio
        if disc_area == 0:
            logger.warning(f"No disc detected in image: {img_path}")
            return -1, cup_mask_img, disc_mask_img, overlay

        cdr = cup_area / disc_area
        
        elapsed_time = time.time() - start_time
        logger.info(f"CDR calculation completed in {elapsed_time:.2f} seconds. CDR: {cdr:.3f}")
        
        return cdr, cup_mask_img, disc_mask_img, overlay

    except Exception as e:
        logger.error(f"Error processing {img_path}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return -1, None, None, None

def get_avr_and_fd(image_name):
    """
    Get AVR and Fractal Dimension values from CSV file
    
    Args:
        image_name (str): Image name to look up in CSV
        
    Returns:
        tuple: (AVR value, FD value)
    """
    try:
        # Remove file extension for comparison
        base_name = os.path.splitext(image_name)[0]
        logger.info(f"Looking up AVR and FD for image: {base_name}")
        
        # Load CSV data
        df = pd.read_csv(RETINAL_DATA_CSV)
        
        # Look for the image in the CSV
        row = df[df['image_name'].str.contains(base_name, case=False, na=False)]
        
        if row.empty:
            logger.warning(f"Image {base_name} not found in CSV data")
            return None, None
            
        # Get AVR and FD values
        avr = float(row['AV'].values[0]) if not pd.isna(row['AV'].values[0]) else None
        fd = float(row['FractalDimensions'].values[0]) if not pd.isna(row['FractalDimensions'].values[0]) else None
        
        logger.info(f"Retrieved AVR: {avr}, FD: {fd}")
        return avr, fd
        
    except Exception as e:
        logger.error(f"Error getting AVR/FD for {image_name}: {str(e)}")
        return None, None

def get_process_images(image_name, folders):
    """Get visualization images for each processing step"""
    images = {}
    base_name = os.path.splitext(image_name)[0]
    logger.info(f"Looking for process images for: {base_name}")
    
    for folder_key, folder_path in folders.items():
        if not os.path.exists(folder_path):
            continue
            
        for file in os.listdir(folder_path):
            if os.path.splitext(file)[0] == base_name:
                full_path = os.path.join(folder_path, file)
                
                # Read and resize image for display
                img = cv2.imread(full_path)
                if img is not None:
                    h, w = img.shape[:2]
                    img_resized = cv2.resize(img, (w//2, h//2))
                    
                    # Save resized image
                    output_path = os.path.join(app.config['RESULTS_FOLDER'], f'{folder_key}_{base_name}.png')
                    cv2.imwrite(output_path, img_resized)
                    
                    # Convert to web-friendly path
                    web_path = os.path.relpath(output_path, 'static').replace("\\", "/")
                    images[folder_key] = web_path
                    logger.info(f"Found and resized {folder_key} image: {web_path}")
                break
    
    return images

def calculate_risk_score(obm_present, avr, cdr, fd, nbm_present):
    """
    Calculate a numerical risk score (0-100) based on biomarkers
    
    Args:
        obm_present (bool): If OBM present
        avr (float): AVR value
        cdr (float): CDR value
        fd (float): FD value
        nbm_present (bool): If NBM present
        
    Returns:
        int: Risk score (0-100)
    """
    score = 0
    
    # OBM presence is a major risk factor
    if obm_present:
        score += 50
    
    # CDR contribution (max 20 points)
    if cdr is not None:
        if cdr > 0.7:
            score += 20
        elif cdr > 0.6:
            score += 15
        elif cdr > 0.5:
            score += 5
    
    # AVR contribution (max 20 points)
    if avr is not None:
        if avr < 0.6:
            score += 20
        elif avr < 0.67:
            score += 15
        elif avr > 0.8:
            score += 15
        elif avr > 0.75:
            score += 10
    
    # FD contribution (max 10 points)
    if fd is not None:
        if fd < 1.2:
            score += 10
        elif fd < 1.3:
            score += 5
    
    # Cap the score at 100
    return min(score, 100)

def assess_risk(obm_present, avr, cdr, fd, nbm_present):
    """
    Assess CVD risk based on defined rules
    
    Args:
        obm_present (bool): If OBM present
        avr (float): AVR value
        cdr (float): CDR value
        fd (float): FD value
        nbm_present (bool): If NBM present
        
    Returns:
        tuple: (risk level, reason)
    """
    # If OBM is present, it's high risk
    if obm_present:
        return "High Risk", "Presence of abnormal biomarkers indicates elevated cardiovascular risk."
    
    # If FD is less than 1.3, it's a clear indication of CVD
    if fd < 1.3:
        return "High Risk", "Fractal Dimension below 1.3 indicates high likelihood of cardiovascular disease."
    
    # Count how many other values are in abnormal ranges
    abnormal_count = 0
    reasons = []
    
    if avr < 0.67:
        abnormal_count += 1
        reasons.append("Arteriovenous ratio is below normal range")
    
    if cdr > 0.5:
        abnormal_count += 1
        reasons.append("Cup-to-disc ratio is above normal range")
    
    # If NBM is present and no abnormal values, it's definitely low risk
    if nbm_present and abnormal_count == 0:
        return "Low Risk", "Normal biomarkers and measurements indicate low cardiovascular risk."
    
    # If both values are abnormal, it's high risk
    if abnormal_count == 2:
        return "High Risk", " and ".join(reasons) + "."
    
    # If only 1 value is abnormal, it's low risk but with warning
    if abnormal_count == 1:
        return "Low Risk", f"Generally low risk, but {reasons[0].lower()}."
    
    # Default case
    return "Low Risk", "All measurements are within normal ranges."

def apply_clahe(img_path):
    """Apply CLAHE to grayscale and return processed image path"""
    try:
        logger.info(f"Applying CLAHE to {img_path}")
        # Read image in grayscale
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("Could not read image")
        
        # Apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        clahe_img = clahe.apply(img)
        
        # Convert to RGB for web display (pseudo-color)
        colored_heatmap = cv2.applyColorMap(clahe_img, cv2.COLORMAP_BONE)
        
        # Resize for display
        h, w = colored_heatmap.shape[:2]
        colored_heatmap = cv2.resize(colored_heatmap, (w//2, h//2))
        
        # Save as PNG
        original_name = os.path.splitext(os.path.basename(img_path))[0]
        filename = f"clahe_{original_name}.png"
        save_path = os.path.join(app.config['RESULTS_FOLDER'], filename)
        
        cv2.imwrite(save_path, colored_heatmap)
        logger.info(f"CLAHE image saved to {save_path}")
        
        return save_path
    except Exception as e:
        logger.error(f"Error in CLAHE processing: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def get_detected_biomarkers(biomarkers):
    """
    Get human-readable names for detected biomarkers
    
    Args:
        biomarkers (list): List of biomarker codes
        
    Returns:
        list: List of human-readable biomarker names
    """
    biomarker_names = {
        'obm_bdr': 'Background Diabetic Retinopathy',
        'obm_pdr': 'Proliferative Diabetic Retinopathy',
        'obm_cnv': 'Choroidal Neovascularization',
        'obm_asr': 'Arteriosclerotic Retinopathy',
        'obm_hr': 'Hypertensive Retinopathy',
        'obm_crvo': 'Central Retinal Vein Occlusion',
        'obm_brvo': 'Branch Retinal Vein Occlusion',
        'obm_hcrvo': 'Hemi-Central Retinal Vein Occlusion',
        'obm_crao': 'Central Retinal Artery Occlusion',
        'obm_brao': 'Branch Retinal Artery Occlusion',
        'obm_ma': 'Macroaneurysm',
        'nbm_normal': 'Normal',
        'nbm_coat': 'Coat Disease',
        'nbm_drusen': 'Drusen'
    }
    
    detected = []
    for biomarker in biomarkers:
        if biomarker in biomarker_names:
            detected.append(biomarker_names[biomarker])
    
    return detected

@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/assessment')
def assessment():
    return render_template('assessment.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/who-we-serve')
def who_we_serve():
    return render_template('who_we_serve.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/rule-based-classification')
def rule_based_classification():
    return render_template('rule_based_classification.html')

@app.route('/research-paper')
def research_paper():
    return send_file('conference_latex_template_10_17_19F.pdf')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and process the image"""
    if 'file' not in request.files:
        flash('No file selected')
        return redirect(url_for('assessment'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected')
        return redirect(url_for('assessment'))
    
    if not file or not allowed_file(file.filename):
        flash('Invalid file type. Please upload a valid image file (PNG, JPG, TIFF, PPM)')
        return redirect(url_for('assessment'))
    
    try:
        # Save the file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Create resized version of original image
        img = cv2.imread(file_path)
        if img is not None:
            h, w = img.shape[:2]
            img_resized = cv2.resize(img, (w//2, h//2))
            resized_path = os.path.join(app.config['RESULTS_FOLDER'], filename)
            cv2.imwrite(resized_path, img_resized)
        
        # Get selected biomarkers
        biomarkers = request.form.getlist('biomarkers[]')
        
        # Process the image
        results = process_image(file_path, biomarkers)
        
        # Update results to use resized original image
        results['original_image'] = os.path.relpath(resized_path, 'static').replace("\\", "/")
        
        # Pass all results to template
        return render_template(
            'cvd_result.html',
            filename=results['original_image'],  # Use resized image path
            risk_level=results['risk_level'],
            risk_reason=results['risk_reason'],
            cdr=results['cdr'],
            avr=results['avr'],
            fd=results['fd'],
            clahe_image=results['clahe_image'],
            vessel_seg_image=results['vessel_seg_image'],
            av_class_image=results['av_class_image'],
            fd_image=results['fd_image'],
            overlay_image=results['overlay_image'],
            detected_biomarkers=results['detected_biomarkers']
        )
        
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        flash('Error processing image. Please try again.')
        return redirect(url_for('assessment'))

@app.route('/api/upload', methods=['POST'])
def api_upload_file():
    """API endpoint for uploading and processing images"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Get biomarker selections
    biomarkers = request.form.getlist('biomarkers[]')
    
    if file and allowed_file(file.filename):
        # Process the file and return results as JSON
        try:
            # Save the uploaded file
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Process the image
            results = process_image(file_path, biomarkers)
            return jsonify(results)
        except Exception as e:
            logger.error(f"API upload error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400

def process_image(file_path, biomarkers):
    """Process an image and return results as a dictionary"""
    try:
        # Make sure models are loaded
        if cup_model is None or disc_model is None:
            load_models()
        
        filename = os.path.basename(file_path)
        
        # Get biomarker selections
        obm_conditions = [b.replace('obm_', '') for b in biomarkers if b.startswith('obm_')]
        nbm_conditions = [b.replace('nbm_', '') for b in biomarkers if b.startswith('nbm_')]
            
        obm_present = len(obm_conditions) > 0
        nbm_present = len(nbm_conditions) > 0
        
        # Apply CLAHE preprocessing
        clahe_path = apply_clahe(file_path)
        
        # Process the image for CDR
        cdr, cup_mask, disc_mask, overlay = calculate_cdr(file_path)
        
        if cdr == -1:
            return {'error': 'Failed to process image. Please try another image.'}
        
        # Get AVR and FD from CSV
        avr, fd = get_avr_and_fd(filename)
        
        # Get process images for visualization
        process_folders = {
            'vessel_seg': VESSEL_SEG_FOLDER,
            'av_class': AV_CLASS_FOLDER,
            'fd': FD_FOLDER
        }
        
        process_images = get_process_images(filename, process_folders)
        
        # Assess risk
        risk_level, risk_reason = assess_risk(obm_present, avr, cdr, fd, nbm_present)
        
        # Create web-friendly versions of all images if needed
        web_friendly_name = filename
        # If it's a TIFF, convert the original too
        if filename.lower().endswith(('.tif', '.tiff')):
            img = Image.open(file_path)
            web_friendly_name = filename.rsplit('.', 1)[0] + '.png'
            web_path = os.path.join(app.config['UPLOAD_FOLDER'], web_friendly_name)
            img.save(web_path)
        
        # Save result images for CDR
        cup_path = os.path.join(app.config['RESULTS_FOLDER'], f'cup_{web_friendly_name}')
        disc_path = os.path.join(app.config['RESULTS_FOLDER'], f'disc_{web_friendly_name}')
        overlay_path = os.path.join(app.config['RESULTS_FOLDER'], f'overlay_{web_friendly_name}')
        
        # Resize CDR images for display
        h, w = overlay.shape[:2]
        overlay_resized = cv2.resize(overlay, (w//2, h//2))
        cup_mask_resized = cv2.resize(cup_mask, (w//2, h//2))
        disc_mask_resized = cv2.resize(disc_mask, (w//2, h//2))
        
        cv2.imwrite(cup_path, cup_mask_resized)
        cv2.imwrite(disc_path, disc_mask_resized)
        cv2.imwrite(overlay_path, overlay_resized)
        
        # Get detected biomarkers in human-readable format
        detected_biomarkers = get_detected_biomarkers(biomarkers)
        
        # Return all results
        return {
            'filename': web_friendly_name,
            'risk_level': risk_level,
            'risk_reason': risk_reason,
            'cdr': cdr,
            'avr': avr,
            'fd': fd,
            'clahe_image': os.path.relpath(clahe_path, 'static').replace("\\", "/"),
            'vessel_seg_image': process_images.get('vessel_seg', ''),
            'av_class_image': process_images.get('av_class', ''),
            'fd_image': process_images.get('fd', ''),
            'overlay_image': os.path.relpath(overlay_path, 'static').replace("\\", "/"),
            'detected_biomarkers': detected_biomarkers,
            'obm_present': obm_present,
            'nbm_present': nbm_present
        }
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        raise

@app.route('/api/health')
def health_check():
    """API endpoint for health check"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/avr_details')
def avr_details():
    return render_template('avr_details.html')

@app.route('/cdr_details')
def cdr_details():
    return render_template('cdr_details.html')

@app.route('/obm_details')
def obm_details():
    return render_template('obm_details.html')

@app.route('/fd_details')
def fd_details():
    return render_template('fd_details.html')

if __name__ == '__main__':
    # Load models at startup
    load_models()
    app.run(debug=True)
