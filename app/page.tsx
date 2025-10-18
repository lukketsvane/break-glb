"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { useGLTF } from "@react-three/drei"

const CHAIR_MODELS = [
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/0dea0e59-f817-4bb8-aaef-d8c4b9797bf5-1760736947725.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/6e729cd0-c916-45e3-a883-21c2eff80f07-1760730635582.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/2d562fd7-1b1e-47d1-bf7b-6677df43a85a-1760731239060.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/3379d98b-b8dd-4df6-b6a1-f09942476b8a-1760736470035.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/2821c681-5f78-8135-b56d-e68ce40a5132-1760737361275.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/2821c681-5f78-8175-b43c-c8ba2d47198e-1760737208918.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/1f607997-8018-4aee-9b0c-4d8e0b481037-1760730750047.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/23b125dc-07df-423e-8407-fed2430ba4cc-1760736644040.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/5d158b49-2e51-4595-8fdc-4855bb99b5ca-1760737138838.glb",
]

export default function Home() {
  const [currentChairIndex, setCurrentChairIndex] = useState(0)
  const [isExploded, setIsExploded] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(true)
  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const modelUrl = CHAIR_MODELS[currentChairIndex]

  useEffect(() => {
    CHAIR_MODELS.forEach((url) => {
      useGLTF.preload(url)
    })
  }, [])

  useEffect(() => {
    if (explosionTimeoutRef.current) {
      clearTimeout(explosionTimeoutRef.current)
    }

    explosionTimeoutRef.current = setTimeout(() => {
      setIsExploded(true)
      setShowInfo(true)
    }, 2000)

    return () => {
      if (explosionTimeoutRef.current) {
        clearTimeout(explosionTimeoutRef.current)
      }
    }
  }, [currentChairIndex])

  useEffect(() => {
    if (showInfo) {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current)
      }
      infoTimeoutRef.current = setTimeout(() => {
        setShowInfo(false)
      }, 4000)
    }
    return () => {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current)
      }
    }
  }, [showInfo, isExploded, currentChairIndex])

  const handlePreviousChair = useCallback(() => {
    setCurrentChairIndex((prev) => (prev === 0 ? CHAIR_MODELS.length - 1 : prev - 1))
    setIsExploded(false)
    setSelectedPart(null)
    setShowInfo(true)
  }, [])

  const handleNextChair = useCallback(() => {
    setCurrentChairIndex((prev) => (prev === CHAIR_MODELS.length - 1 ? 0 : prev + 1))
    setIsExploded(false)
    setSelectedPart(null)
    setShowInfo(true)
  }, [])

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      <div className="h-full w-full relative bg-black">
        <ModelViewer
          modelUrl={modelUrl}
          isExploded={isExploded}
          selectedPart={selectedPart}
          onPartSelect={setSelectedPart}
        />

        <div
          className={`absolute top-6 right-6 transition-opacity duration-500 ${showInfo ? "opacity-30" : "opacity-0"}`}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-3 shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousChair}
              className="rounded-full w-10 h-10 text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-1 px-2">
              {CHAIR_MODELS.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentChairIndex ? "bg-white w-4" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextChair}
              className="rounded-full w-10 h-10 text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="w-px h-8 bg-white/10" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExploded(!isExploded)
                setShowInfo(true)
              }}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                isExploded ? "bg-white/20 text-white" : "text-white hover:bg-white/10"
              }`}
            >
              <Zap className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
