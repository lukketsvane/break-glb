"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { useGLTF } from "@react-three/drei"
import { getChairModels } from "./actions"

export default function Home() {
  const [currentChairIndex, setCurrentChairIndex] = useState(0)
  const [isExploded, setIsExploded] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(true)
  const [chairModels, setChairModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const modelUrl = chairModels[currentChairIndex]

  useEffect(() => {
    async function loadChairModels() {
      setIsLoading(true)
      const models = await getChairModels()
      console.log("[v0] Loaded", models.length, "chair models from blob storage")
      setChairModels(models)
      setIsLoading(false)

      // Preload first 5 models immediately
      models.slice(0, 5).forEach((url) => {
        useGLTF.preload(url)
      })

      // Preload remaining models in batches
      setTimeout(() => {
        models.slice(5, 10).forEach((url) => {
          useGLTF.preload(url)
        })
      }, 1000)

      setTimeout(() => {
        models.slice(10).forEach((url) => {
          useGLTF.preload(url)
        })
      }, 2000)
    }

    loadChairModels()
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
    setCurrentChairIndex((prev) => (prev === 0 ? chairModels.length - 1 : prev - 1))
    setIsExploded(false)
    setSelectedPart(null)
    setShowInfo(true)
  }, [chairModels.length])

  const handleNextChair = useCallback(() => {
    setCurrentChairIndex((prev) => (prev === chairModels.length - 1 ? 0 : prev + 1))
    setIsExploded(false)
    setSelectedPart(null)
    setShowInfo(true)
  }, [chairModels.length])

  if (isLoading || chairModels.length === 0) {
    return (
      <div className="h-dvh w-screen bg-black flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading models...</div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-screen bg-black relative overflow-hidden">
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

        <div className="absolute bottom-0 left-0 right-0 pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
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
              {Array.from({ length: Math.min(10, chairModels.length) }).map((_, index) => {
                const activeDotIndex = Math.floor((currentChairIndex * 9) / Math.max(1, chairModels.length - 1))
                return (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === activeDotIndex ? "bg-white w-4" : "bg-white/30"
                    } ${(index === 0 || index === 9) && chairModels.length > 10 ? "opacity-50" : ""}`}
                  />
                )
              })}
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
