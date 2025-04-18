"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, AlertTriangle, CheckCircle, Eye, Activity, Heart, Brain, FileText, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// This is a demo page to show the design
// In a real implementation, this would receive data from the Flask backend
export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data from backend
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Demo data - in a real implementation, this would come from the backend
  const results = {
    risk_level: "High Risk",
    risk_reason: "Presence of high-risk ophthalmic biomarkers (OBM) and abnormal CDR (0.72)",
    risk_score: 78,
    cdr: 0.72,
    avr: 0.65,
    fd: 1.25,
    obm_present: true,
    nbm_present: false,
    biomarkers: ["Background Diabetic Retinopathy", "Hypertensive Retinopathy"],
    original_image: "/placeholder.svg?height=400&width=400",
    clahe_image: "/placeholder.svg?height=400&width=400",
    overlay_image: "/placeholder.svg?height=400&width=400",
    cup_image: "/placeholder.svg?height=400&width=400",
    disc_image: "/placeholder.svg?height=400&width=400",
    process_images: {
      vessel_seg: "/placeholder.svg?height=400&width=400",
      av_class: "/placeholder.svg?height=400&width=400",
    },
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-blue-800 font-medium">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Activity className="h-10 w-10 text-blue-500 mr-2" />
            <h1 className="text-3xl font-bold text-blue-900">
              CVD Risk Assessment Results
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-blue-100 sticky top-4">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100 pb-4">
                <CardTitle className="text-blue-800 text-lg">
                  Risk Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className={`p-4 rounded-lg mb-6 flex items-center ${
                  results.risk_level === "High Risk" ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
                }`}>
                  {results.risk_level === "High Risk" ? (
                    <AlertTriangle className="h-8 w-8 text-red-500 mr-3 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <h2 className={`font-bold text-xl ${results.risk_level === "High Risk" ? "text-red-600" : "text-green-600"}`}>
                      {results.risk_level}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {results.risk_reason}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Score</h3>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xl font-semibold inline-block ${
                          results.risk_score > 70 ? "text-red-600" : 
                          results.risk_score > 40 ? "text-amber-600" : "text-green-600"
                        }`}>
                          {results.risk_score}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${results.risk_score}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          results.risk_score > 70 ? "bg-red-500" : 
                          results.risk_score > 40 ? "bg-amber-500" : "bg-green-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Biomarker Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">OBM (High-Risk):</span>
                        <span className={`text-sm font-medium ${results.obm_present ? "text-red-600" : "text-green-600"}`}>
                          {results.obm_present ? "Present" : "Absent"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">NBM (Neutral):</span>
                        <span className={`text-sm font-medium ${results.nbm_present ? "text-amber-600" : "text-green-600"}`}>
                          {results.nbm_present ? "Present" : "Absent"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {results.biomarkers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Detected Biomarkers</h3>
                      <ul className="space-y-1">
                        {results.biomarkers.map((biomarker, index) => (
                          <li key={index} className="text-sm flex items-center">
                            <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                            {biomarker}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-center mt-4">
                  <Link href="/">
                    <Button className="w-full flex items-center justify-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Analyze Another Image
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100 pb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview" className="text-sm">
                      <Activity className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="cdr" className="text-sm">
                      <Eye className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">CDR Analysis</span>
                    </TabsTrigger>
                    <TabsTrigger value="avr" className="text-sm">
                      <Heart className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">AVR Analysis</span>
                    </TabsTrigger>
                    <TabsTrigger value="preprocessing" className="text-sm">
                      <FileText className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Preprocessing</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="overview" className="p-6 m-0">
                  <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500" />
                    Ophthalmic Measurements
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MeasurementCard 
                      title="Cup-to-Disc Ratio (CDR)"
                      value={results.cdr}
                      isAbnormal={results.cdr > 0.6}
                      normalRange="≤ 0.6"
                      abnormalMessage="Above normal range (> 0.6)"
                      normalMessage="Within normal range (≤ 0.6)"
                      icon={<Eye className="h-5 w-5 text-blue-500" />}
                    />
                    
                    <MeasurementCard 
                      title="Arteriovenous  />}
                    />
                    
                    <MeasurementCard 
                      title=\"Arteriovenous Ratio (AVR)"
                      value={results.avr}
                      isAbnormal={results.avr < 0.67 || results.avr > 0.75}
                      normalRange="0.67 - 0.75"
                      abnormalMessage="Outside normal range (0.67-0.75)"
                      normalMessage="Within normal range (0.67-0.75)"
                      icon={<Heart className="h-5 w-5 text-red-500" />}
                    />
                    
                    <MeasurementCard 
                      title="Fractal Dimension (FD)"
                      value={results.fd}
                      isAbnormal={results.fd < 1.3}
                      normalRange="≥ 1.3"
                      abnormalMessage="Below normal range (< 1.3)"
                      normalMessage="Within normal range (≥ 1.3)"
                      icon={<Brain className="h-5 w-5 text-purple-500" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-blue-500" />
                          Combined Segmentation
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="relative h-64 w-full">
                          <Image 
                            src={results.overlay_image || "/placeholder.svg"} 
                            alt="Combined Segmentation"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex justify-center gap-4 mt-3">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 mr-1 rounded-sm"></div>
                            <span className="text-sm">Cup</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 mr-1 rounded-sm"></div>
                            <span className="text-sm">Disc</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-red-500" />
                          A/V Classification
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="relative h-64 w-full">
                          <Image 
                            src={results.process_images.av_class || "/placeholder.svg"} 
                            alt="A/V Classification"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cdr" className="p-6 m-0">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-500" />
                      Cup-to-Disc Ratio (CDR) Analysis
                    </h2>
                    <p className="text-gray-600 mb-4">
                      The Cup-to-Disc Ratio (CDR) is calculated by dividing the area of the optic cup by the area of the optic disc. A CDR value greater than 0.6 may indicate increased risk of cardiovascular disease.
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                      <div className="flex items-start">
                        <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                          <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-800 mb-1">Your CDR Value: {results.cdr.toFixed(2)}</h3>
                          <p className="text-sm text-blue-700">
                            {results.cdr > 0.6 
                              ? "Your CDR value is above the normal range, which may indicate increased cardiovascular risk."
                              : "Your CDR value is within the normal range."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ImageCard 
                      title="Combined Segmentation" 
                      src={results.overlay_image || "/placeholder.svg"} 
                      legend={[
                        { color: "bg-red-500", label: "Cup" },
                        { color: "bg-green-500", label: "Disc" }
                      ]}
                    />
                    <ImageCard title="Optic Disc Segmentation" src={results.disc_image || "/placeholder.svg"} />
                    <ImageCard title="Optic Cup Segmentation" src={results.cup_image || "/placeholder.svg"} />
                  </div>

                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-2">Technical Details</h3>
                    <p className="text-sm text-gray-600">
                      Cup and disc segmentation is performed using YOLOv8 with Focal-EIoU loss function, which improves accuracy by focusing on difficult cases and penalizing discrepancies in center distance and aspect ratio.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="avr" className="p-6 m-0">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-500" />
                      Arteriovenous Ratio (AVR) Analysis
                    </h2>
                    <p className="text-gray-600 mb-4">
                      The Arteriovenous Ratio (AVR) is calculated by dividing the Central Retinal Arteriolar Equivalent (CRAE) by the Central Retinal Venular Equivalent (CRVE). An AVR value outside the range of 0.67-0.75 may indicate increased risk of cardiovascular disease.
                    </p>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                      <div className="flex items-start">
                        <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                          <Heart className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-red-800 mb-1">Your AVR Value: {results.avr.toFixed(2)}</h3>
                          <p className="text-sm text-red-700">
                            {(results.avr < 0.67 || results.avr > 0.75)
                              ? `Your AVR value is ${results.avr < 0.67 ? "below" : "above"} the normal range, which may indicate increased cardiovascular risk.`
                              : "Your AVR value is within the normal range."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageCard title="Vessel Segmentation" src={results.process_images.vessel_seg || "/placeholder.svg"} />
                    <ImageCard title="A/V Classification" src={results.process_images.av_class || "/placeholder.svg"} />
                  </div>

                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-2">Technical Details</h3>
                    <p className="text-sm text-gray-600">
                      Vessel segmentation is performed using TCDDU-Net, and artery/vein classification is performed using RRWNet. The AVR is calculated by measuring the diameters of the six largest arteries and six largest veins within 0.5 to 1.0 disc diameters from the optic disc edge.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="preprocessing" className="p-6 m-0">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Image Preprocessing
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Image preprocessing is an essential step to enhance the quality of retinal images for accurate analysis. We apply Contrast Limited Adaptive Histogram Equalization (CLAHE) to improve local contrast and hybrid filtering techniques to reduce noise.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageCard title="Original Image" src={results.original_image || "/placeholder.svg"} />
                    <ImageCard 
                      title="CLAHE Enhanced" 
                      src={results.clahe_image || "/placeholder.svg"} 
                      description="Contrast Limited Adaptive Histogram Equalization"
                    />
                  </div>

                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-2">Preprocessing Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mt-2">
                      <li>Convert RGB image to grayscale for simplified analysis</li>
                      <li>Apply CLAHE with clipLimit=3.0 and tileGridSize=(8,8) to enhance local contrast</li>
                      <li>Apply hybrid filtering: Gaussian filtering on red channel, median filtering on green channel</li>
                      <li>Normalize image intensity for consistent analysis</li>
                    </ol>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

interface MeasurementCardProps {
  title: string
  value: number
  isAbnormal: boolean
  normalRange: string
  abnormalMessage: string
  normalMessage: string
  icon: React.ReactNode
}

function MeasurementCard({
  title,
  value,
  isAbnormal,
  normalRange,
  abnormalMessage,
  normalMessage,
  icon,
}: MeasurementCardProps) {
  return (
    <div
      className={`rounded-lg p-5 transition-all ${
        isAbnormal
          ? "bg-red-50 border border-red-200 hover:shadow-md"
          : "bg-green-50 border border-green-200 hover:shadow-md"
      }`}
    >
      <h3 className="font-medium text-gray-800 mb-2 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <p className="text-3xl font-bold text-center my-4">{value.toFixed(2)}</p>
      <p className="text-sm text-center">Normal range: {normalRange}</p>
      <p className={`text-sm text-center mt-2 font-medium ${isAbnormal ? "text-red-600" : "text-green-600"}`}>
        {isAbnormal ? abnormalMessage : normalMessage}
      </p>
    </div>
  )
}

interface ImageCardProps {
  title: string
  src: string
  description?: string
  legend?: { color: string; label: string }[]
}

function ImageCard({ title, src, description, legend }: ImageCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <h4 className="font-medium text-gray-800">{title}</h4>
      </div>
      <div className="p-4">
        <div className="relative h-48 md:h-64 w-full">
          <Image src={src || "/placeholder.svg"} alt={title} fill className="object-contain" />
        </div>
        {description && <p className="text-sm text-gray-600 mt-3 text-center">{description}</p>}
        {legend && legend.length > 0 && (
          <div className="flex justify-center gap-4 mt-3">
            {legend.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-4 h-4 ${item.color} mr-1 rounded-sm`}></div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

