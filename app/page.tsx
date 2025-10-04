"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [isExploded, setIsExploded] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (modelUrl && showInfo) {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current)
      }
      infoTimeoutRef.current = setTimeout(() => {
        setShowInfo(false)
      }, 5000)
    }
    return () => {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current)
      }
    }
  }, [modelUrl, showInfo, isExploded])

  const handleFileUpload = useCallback(
    (file: File) => {
      if (file && file.name.toLowerCase().endsWith(".glb")) {
        if (modelUrl) {
          URL.revokeObjectURL(modelUrl)
        }
        const url = URL.createObjectURL(file)
        setModelUrl(url)
        setIsExploded(false)
        setSelectedPart(null)
        setShowInfo(true)
      }
    },
    [modelUrl],
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const glbFile = files.find((file) => file.name.toLowerCase().endsWith(".glb"))

      if (glbFile) {
        handleFileUpload(glbFile)
      }
    },
    [handleFileUpload],
  )

  const handleFrameClick = useCallback(() => {
    if (!modelUrl) {
      fileInputRef.current?.click()
    }
  }, [modelUrl])

  return (
    <div
      className="h-screen w-screen bg-black relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-white/10 border-2 border-dashed border-white z-50 flex items-center justify-center">
          <div className="text-2xl font-bold text-white">Drop GLB file to load</div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".glb" onChange={handleInputChange} className="hidden" />

      {!modelUrl ? (
        <div className="flex items-center justify-center h-full w-full bg-black">
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
            onClick={handleFrameClick}
          >
            <div className="text-center">
              <Upload className="w-20 h-20 mx-auto mb-4 text-white/50" />
              <p className="text-xl text-white/70 mb-2">Upload a 3D Model</p>
              <p className="text-sm text-white/50">GLB format supported</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full relative bg-black">
          <ModelViewer
            modelUrl={modelUrl}
            isExploded={isExploded}
            selectedPart={selectedPart}
            onPartSelect={setSelectedPart}
          />

          <div
            className={`absolute top-6 left-6 transition-opacity duration-1000 ${showInfo ? "opacity-100" : "opacity-0"}`}
            onMouseEnter={() => setShowInfo(true)}
          >
            <p className="text-sm text-white/70">
              {isExploded
                ? "Tap to focus • Hold & drag to move • 3 fingers to adjust light"
                : "Drag to rotate • Scroll to zoom • 3 fingers to adjust light"}
            </p>
          </div>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full text-white hover:bg-white/20"
                title="Upload new model"
              >
                <Upload className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-white/20" />

              <Button
                variant={isExploded ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                  setIsExploded(!isExploded)
                  setShowInfo(true)
                }}
                className="rounded-full text-white hover:bg-white/20"
                title={isExploded ? "Assemble" : "Explode"}
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
