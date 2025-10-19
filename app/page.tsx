"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { useGLTF } from "@react-three/drei"

const CHAIR_MODELS = [
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/6464645f-1179-46a4-90b6-94897afb1f91-1760737085523.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/69115c45-d12a-4d4c-af31-52760c6e9e2e-1760730869598.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/7d2f0026-90d2-49a6-9fcd-61a702e5b2a7-1760736571409.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/83c7c65e-c1a8-4ac8-bc05-b5b309537958-1760736255048.glb",
  "https://uzwuhofdakrvvjvq.public.blob.vercel-storage.com/glb/d3a4f7e5-d9a8-4367-ba3f-e7f36d5e4181-1760730545612.glb",
]

export default function Home() {
  const [currentChairIndex, setCurrentChairIndex] = useState(0)
  const [isExploded, setIsExploded] = useState(false)
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
    setShowInfo(true)
  }, [])

  const handleNextChair = useCallback(() => {
    setCurrentChairIndex((prev) => (prev === CHAIR_MODELS.length - 1 ? 0 : prev + 1))
    setIsExploded(false)
    setShowInfo(true)
  }, [])

  return (
    <div className="h-dvh w-screen bg-black relative overflow-hidden">
      <div className="h-full w-full relative bg-black">
        <ModelViewer modelUrl={modelUrl} isExploded={isExploded} />

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
