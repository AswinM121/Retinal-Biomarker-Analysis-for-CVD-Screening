"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, Info, FileText, Activity, Heart, Brain } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        setSelectedFile(file)

        // Create preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Update the file input
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          fileInputRef.current.files = dataTransfer.files
        }
      } else {
        setFlashMessage("Please upload an image file")
      }
    }
  }

  const simulateUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          // In a real implementation, this would redirect to results
          window.location.href = "/results"
          return 100
        }
        return prev + 5
      })
    }, 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setFlashMessage("Please select a file first")
      return
    }

    // In a real implementation, this would submit to the Flask backend
    // For demo purposes, we'll simulate the upload process
    simulateUpload()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-10 w-10 text-red-500 mr-2" />
            <h1 className="text-3xl font-bold text-blue-900">Cardiovascular Disease Risk Assessment</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced retinal image analysis for early detection of cardiovascular disease risk factors
          </p>
        </header>

        {flashMessage && (
          <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{flashMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="mb-8 shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Retinal Image
                </CardTitle>
                <CardDescription>Upload a high-quality retinal fundus image for comprehensive analysis</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form action="/upload" method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <div
                      className={`flex flex-col items-center justify-center border-2 border-dashed ${selectedFile ? "border-blue-400 bg-blue-50" : "border-blue-200"} rounded-lg p-8 transition-colors hover:bg-blue-50`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        name="file"
                        id="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".png,.jpg,.jpeg,.tif,.tiff,.ppm"
                        required
                      />

                      {previewUrl ? (
                        <div className="text-center">
                          <div className="relative w-64 h-64 mx-auto mb-4 rounded-lg overflow-hidden border border-gray-200">
                            <Image
                              src={previewUrl || "/placeholder.svg"}
                              alt="Image preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{selectedFile?.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl(null)
                              if (fileInputRef.current) fileInputRef.current.value = ""
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="file" className="flex flex-col items-center justify-center cursor-pointer">
                          <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-blue-500" />
                          </div>
                          <span className="text-blue-700 font-medium mb-1">Drag & drop or click to upload</span>
                          <span className="text-xs text-gray-500 mt-2">Supported formats: PNG, JPG, TIFF, PPM</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {isUploading && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Uploading and processing image...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Select Biomarkers Present
                    </h3>

                    <Tabs defaultValue="obm" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="obm"
                          className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
                        >
                          High-Risk Biomarkers
                        </TabsTrigger>
                        <TabsTrigger
                          value="nbm"
                          className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                        >
                          Neutral Biomarkers
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="obm" className="mt-4 border rounded-lg p-4 border-red-100 bg-red-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <BiomarkerCheckbox id="obm_bdr" label="Background Diabetic Retinopathy" type="obm" />
                          <BiomarkerCheckbox id="obm_pdr" label="Proliferative Diabetic Retinopathy" type="obm" />
                          <BiomarkerCheckbox id="obm_cnv" label="Choroidal Neovascularization" type="obm" />
                          <BiomarkerCheckbox id="obm_asr" label="Arteriosclerotic Retinopathy" type="obm" />
                          <BiomarkerCheckbox id="obm_hr" label="Hypertensive Retinopathy" type="obm" />
                          <BiomarkerCheckbox id="obm_crvo" label="Central Retinal Vein Occlusion" type="obm" />
                          <BiomarkerCheckbox id="obm_brvo" label="Branch Retinal Vein Occlusion" type="obm" />
                          <BiomarkerCheckbox id="obm_hcrvo" label="Hemi-Central Retinal Vein Occlusion" type="obm" />
                          <BiomarkerCheckbox id="obm_crao" label="Central Retinal Artery Occlusion" type="obm" />
                          <BiomarkerCheckbox id="obm_brao" label="Branch Retinal Artery Occlusion" type="obm" />
                          <BiomarkerCheckbox id="obm_ma" label="Macroaneurysm" type="obm" />
                        </div>
                      </TabsContent>
                      <TabsContent value="nbm" className="mt-4 border rounded-lg p-4 border-green-100 bg-green-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <BiomarkerCheckbox id="nbm_normal" label="Normal" type="nbm" />
                          <BiomarkerCheckbox id="nbm_coat" label="Coat Disease" type="nbm" />
                          <BiomarkerCheckbox id="nbm_drusen" label="Drusen" type="nbm" />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 transition-all"
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? "Processing..." : "Analyze Image"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg border-blue-100 sticky top-4">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  About CVD Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center text-blue-700">
                      <Activity className="h-5 w-5 mr-2" />
                      Key Biomarkers
                    </h3>
                    <ul className="space-y-3">
                      <BiomarkerInfo
                        title="Cup-to-Disc Ratio (CDR)"
                        description="Ratio of optic cup diameter to optic disc diameter"
                        threshold="> 0.6 indicates risk"
                        color="blue"
                      />
                      <BiomarkerInfo
                        title="Arteriovenous Ratio (AVR)"
                        description="Ratio of arteriolar to venular diameter"
                        threshold="< 0.67 or > 0.75 indicates risk"
                        color="red"
                      />
                      <BiomarkerInfo
                        title="Fractal Dimension (FD)"
                        description="Measure of vascular network complexity"
                        threshold="< 1.3 indicates risk"
                        color="purple"
                      />
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center text-blue-700">
                      <Brain className="h-5 w-5 mr-2" />
                      Technology
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Our system uses advanced deep learning models to analyze retinal images:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5 flex-shrink-0">
                          1
                        </div>
                        <span>TCDDU-Net for vessel segmentation</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5 flex-shrink-0">
                          2
                        </div>
                        <span>RRWNet for artery/vein classification</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5 flex-shrink-0">
                          3
                        </div>
                        <span>YOLOv8 with Focal-EIoU for optic disc/cup segmentation</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        This tool implements the research described in "Dual-Parameter Retinal Biomarker Analysis:
                        Integrating Structural and Vascular Changes for Cardio Vascular Disease Screening"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

interface BiomarkerCheckboxProps {
  id: string
  label: string
  type: "obm" | "nbm"
}

function BiomarkerCheckbox({ id, label, type }: BiomarkerCheckboxProps) {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id={id}
        name="biomarkers[]"
        value={id}
        className={
          type === "obm"
            ? "text-red-500 border-red-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            : "text-green-500 border-green-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        }
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      </div>
    </div>
  )
}

interface BiomarkerInfoProps {
  title: string
  description: string
  threshold: string
  color: "red" | "blue" | "green" | "purple"
}

function BiomarkerInfo({ title, description, threshold, color }: BiomarkerInfoProps) {
  const colorClasses = {
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  }

  return (
    <li className="border rounded-md p-3 bg-white">
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className={`text-xs font-medium px-2 py-1 rounded inline-block ${colorClasses[color]}`}>{threshold}</div>
    </li>
  )
}

