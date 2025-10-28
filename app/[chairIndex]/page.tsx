"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { ChairInfoOverlay } from "@/components/chair-info-overlay"
import { useGLTF } from "@react-three/drei"
import { useParams } from "next/navigation"
import { getChairModels, getChairData } from "../actions"

const isMobile = () => {
  if (typeof window === "undefined") return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
}

export default function ChairPage() {
  const params = useParams()
  const initialChairIndex = Number.parseInt(params.chairIndex as string) || 0

  const [chairIndex, setChairIndex] = useState(initialChairIndex)
  const [chairModels, setChairModels] = useState<string[]>([])
  const [isExploded, setIsExploded] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const [chairData, setChairData] = useState<any>(null)
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark"
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  })

  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const lastTapTimeRef = useRef<number>(0)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)")

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "light" : "dark")
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  useEffect(() => {
    getChairModels().then((models) => {
      if (models.length > 0) {
        setChairModels(models)
      }
    })
  }, [])

  useEffect(() => {
    getChairData(chairIndex).then((data) => {
      setChairData(data)
    })
  }, [chairIndex])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newUrl = `/${chairIndex}`
      window.history.replaceState({ chairIndex }, "", newUrl)
    }
  }, [chairIndex])

  useEffect(() => {
    if (chairModels.length === 0) return

    const mobile = isMobile()
    const currentModel = chairModels[chairIndex]

    if (!currentModel) return

    useGLTF.preload(currentModel)

    const preloadRange = mobile ? 1 : 3

    setTimeout(
      () => {
        for (let i = 1; i <= preloadRange; i++) {
          const prevIndex = chairIndex - i
          const nextIndex = chairIndex + i

          if (prevIndex >= 0 && chairModels[prevIndex]) {
            useGLTF.preload(chairModels[prevIndex])
          }
          if (nextIndex < chairModels.length && chairModels[nextIndex]) {
            useGLTF.preload(chairModels[nextIndex])
          }
        }
      },
      mobile ? 500 : 100,
    )
  }, [chairIndex, chairModels])

  useEffect(() => {
    if (!autoBreakEnabled) return

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
  }, [chairIndex, autoBreakEnabled])

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
    (index: number) => {
      if (index < 0 || index >= chairModels.length) return
      setChairIndex(index)
      setShowInfo(true)
    },
    [chairModels.length],
  )

  const handlePrevious = useCallback(() => {
    const newIndex = chairIndex === 0 ? chairModels.length - 1 : chairIndex - 1
    navigateToChair(newIndex)
  }, [chairIndex, chairModels.length, navigateToChair])

  const handleNext = useCallback(() => {
    const newIndex = chairIndex === chairModels.length - 1 ? 0 : chairIndex + 1
    navigateToChair(newIndex)
  }, [chairIndex, chairModels.length, navigateToChair])

  const getVisibleDots = () => {
    const totalChairs = chairModels.length
    const maxDots = Math.min(10, totalChairs)

    if (totalChairs <= maxDots) {
      return Array.from({ length: totalChairs }, (_, i) => i)
    }

    const activeDotPosition = Math.floor((chairIndex / (totalChairs - 1)) * (maxDots - 1))

    return { maxDots, activeDotPosition, totalChairs }
  }

  const dotInfo = getVisibleDots()
  const visibleDots = Array.isArray(dotInfo) ? dotInfo : Array.from({ length: dotInfo.maxDots }, (_, i) => i)
  const activeDotPosition = Array.isArray(dotInfo) ? chairIndex : dotInfo.activeDotPosition

  const handleDotPointerDown = (e: React.PointerEvent, index: number) => {
    if (Array.isArray(dotInfo)) {
      navigateToChair(index)
    } else {
      setIsDragging(true)
      setDragStartX(e.clientX)
      const targetIndex = Math.round((index / (dotInfo.maxDots - 1)) * (dotInfo.totalChairs - 1))
      navigateToChair(targetIndex)
    }
  }

  const handleDotPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !navRef.current || Array.isArray(dotInfo)) return

    const rect = navRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const targetIndex = Math.round(percentage * (dotInfo.totalChairs - 1))

    if (targetIndex !== chairIndex) {
      navigateToChair(targetIndex)
    }
  }

  const handleDotPointerUp = () => {
    setIsDragging(false)
  }

  const handleExplodeToggle = () => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTimeRef.current

    // Double-tap detected (within 300ms)
    if (timeSinceLastTap < 300) {
      setAutoBreakEnabled(!autoBreakEnabled)
      setShowInfo(true)
    } else {
      // Single tap - toggle explosion
      setIsExploded(!isExploded)
      setShowInfo(true)
    }

    lastTapTimeRef.current = now
  }

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (chairModels.length === 0) {
    return (
      <div className="h-dvh w-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    )
  }

  const modelUrl = chairModels[chairIndex]

  if (!modelUrl && chairModels.length > 0) {
    setChairIndex(0)
    return null
  }

  return (
    <div
      className="h-dvh w-screen relative overflow-hidden"
      style={{ background: theme === "light" ? "#ffffff" : "#000000", transition: "none" }}
    >
      <div className="h-full w-full relative">
        <ModelViewer modelUrl={modelUrl} isExploded={isExploded} chairIndex={chairIndex} theme={theme} />

        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoOverlay(!showInfoOverlay)}
            className={`rounded-full w-10 h-10 transition-all ${
              theme === "light"
                ? showInfoOverlay
                  ? "bg-black/20 text-black"
                  : "text-black/60 hover:text-black hover:bg-black/10"
                : showInfoOverlay
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>

        <ChairInfoOverlay
          data={chairData}
          isOpen={showInfoOverlay}
          onClose={() => setShowInfoOverlay(false)}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />

        <div className="absolute bottom-0 left-0 right-0 pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center z-10">
          <div
            className={`flex items-center gap-3 backdrop-blur-xl border rounded-full px-3 py-3 shadow-2xl ${
              theme === "light" ? "bg-white/80 border-black/10" : "bg-black/80 border-white/10"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                theme === "light" ? "text-black hover:bg-black/10" : "text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div
              ref={navRef}
              className="flex items-center gap-1 px-2 cursor-pointer touch-none"
              onPointerDown={(e) => {
                const rect = navRef.current?.getBoundingClientRect()
                if (!rect) return
                const x = e.clientX - rect.left
                const index = Math.floor((x / rect.width) * visibleDots.length)
                handleDotPointerDown(e, index)
              }}
              onPointerMove={handleDotPointerMove}
              onPointerUp={handleDotPointerUp}
              onPointerCancel={handleDotPointerUp}
            >
              {visibleDots.map((_, index) => {
                const isActive = index === activeDotPosition
                const isEdge = index === 0 || index === visibleDots.length - 1
                const opacity = isEdge && !Array.isArray(dotInfo) ? "opacity-30" : "opacity-100"

                return (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${opacity} ${
                      theme === "light"
                        ? isActive
                          ? "bg-black w-4"
                          : "bg-black/30 w-1.5"
                        : isActive
                          ? "bg-white w-4"
                          : "bg-white/30 w-1.5"
                    }`}
                  />
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                theme === "light" ? "text-black hover:bg-black/10" : "text-white hover:bg-white/10"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className={`w-px h-8 ${theme === "light" ? "bg-black/10" : "bg-white/10"}`} />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleExplodeToggle}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                theme === "light"
                  ? isExploded
                    ? "bg-black/20 text-black"
                    : "text-black hover:bg-black/10"
                  : isExploded
                    ? "bg-white/20 text-white"
                    : "text-white hover:bg-white/10"
              } ${autoBreakEnabled ? "ring-2 ring-red-500/50" : ""}`}
            >
              <Zap className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
