"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

const NAVIGATION_COOLDOWN = 300 // milliseconds between navigations

export default function ChairPage() {
  const router = useRouter()
  const params = useParams()
  const chairIndex = Number.parseInt(params.chairIndex as string) || 0

  const [isExploded, setIsExploded] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)

  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastNavigationRef = useRef<number>(0)
  const navigationCooldownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (chairIndex < 0 || chairIndex >= CHAIR_MODELS.length) {
      router.replace("/0")
    }
  }, [chairIndex, router])

  const modelUrl = CHAIR_MODELS[chairIndex] || CHAIR_MODELS[0]

  useEffect(() => {
    // Preload first 5 chairs immediately
    CHAIR_MODELS.slice(0, 5).forEach((url) => {
      useGLTF.preload(url)
    })

    // Preload remaining chairs after delay
    const timer = setTimeout(() => {
      CHAIR_MODELS.slice(5).forEach((url) => {
        useGLTF.preload(url)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (explosionTimeoutRef.current) {
      clearTimeout(explosionTimeoutRef.current)
    }

    setIsExploded(false)
    explosionTimeoutRef.current = setTimeout(() => {
      setIsExploded(true)
      setShowInfo(true)
    }, 2000)

    return () => {
      if (explosionTimeoutRef.current) {
        clearTimeout(explosionTimeoutRef.current)
      }
    }
  }, [chairIndex])

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
  }, [showInfo, isExploded, chairIndex])

  const navigateToChair = useCallback(
    (newIndex: number) => {
      const now = Date.now()
      const timeSinceLastNav = now - lastNavigationRef.current

      // Prevent navigation if still in cooldown
      if (timeSinceLastNav < NAVIGATION_COOLDOWN) {
        console.log("[v0] Navigation blocked - cooldown active")
        return
      }

      // Clear any pending cooldown
      if (navigationCooldownRef.current) {
        clearTimeout(navigationCooldownRef.current)
      }

      lastNavigationRef.current = now
      setIsNavigating(true)
      setShowInfo(true)

      // Navigate to new route
      router.push(`/${newIndex}`)

      // Reset navigating state after cooldown
      navigationCooldownRef.current = setTimeout(() => {
        setIsNavigating(false)
      }, NAVIGATION_COOLDOWN)
    },
    [router],
  )

  const handlePreviousChair = useCallback(() => {
    if (isNavigating) return
    const newIndex = chairIndex === 0 ? CHAIR_MODELS.length - 1 : chairIndex - 1
    navigateToChair(newIndex)
  }, [chairIndex, isNavigating, navigateToChair])

  const handleNextChair = useCallback(() => {
    if (isNavigating) return
    const newIndex = chairIndex === CHAIR_MODELS.length - 1 ? 0 : chairIndex + 1
    navigateToChair(newIndex)
  }, [chairIndex, isNavigating, navigateToChair])

  const totalDots = Math.min(10, CHAIR_MODELS.length)
  const activeDot = Math.floor((chairIndex * (totalDots - 1)) / (CHAIR_MODELS.length - 1))

  return (
    <div className="h-dvh w-screen bg-black relative overflow-hidden">
      <div className="h-full w-full relative bg-black">
        <ModelViewer key={chairIndex} modelUrl={modelUrl} isExploded={isExploded} />

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
              disabled={isNavigating}
              className="rounded-full w-10 h-10 text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalDots }).map((_, index) => {
                const isEdge = index === 0 || index === totalDots - 1
                const opacity = isEdge && CHAIR_MODELS.length > totalDots ? "opacity-40" : "opacity-100"

                return (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${opacity} ${
                      index === activeDot ? "bg-white w-4" : "bg-white/30"
                    }`}
                  />
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextChair}
              disabled={isNavigating}
              className="rounded-full w-10 h-10 text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
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
