"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { ChairInfoOverlay } from "@/components/chair-info-overlay"
import { useGLTF } from "@react-three/drei"
import { getChairModels, getChairData } from "./actions"

const isMobile = () => {
  if (typeof window === "undefined") return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
}

export default function Home() {
  const [chairIndex, setChairIndex] = useState(() => {
    if (typeof window === "undefined") return 0
    const hash = window.location.hash.slice(1)
    const index = Number.parseInt(hash) || 0
    return index
  })

  const [chairModels, setChairModels] = useState<string[]>([])
  const [isExploded, setIsExploded] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const [chairData, setChairData] = useState<any>(null)
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("performanceMode")
    return saved === "true"
  })
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
      window.location.hash = chairIndex.toString()
    }
  }, [chairIndex])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const index = Number.parseInt(hash) || 0
      if (index !== chairIndex && index >= 0 && index < chairModels.length) {
        setChairIndex(index)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [chairIndex, chairModels.length])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [chairIndex, chairModels.length])

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

    if (timeSinceLastTap < 300) {
      setAutoBreakEnabled(!autoBreakEnabled)
      setShowInfo(true)
    } else {
      setIsExploded(!isExploded)
      setShowInfo(true)
    }

    lastTapTimeRef.current = now
  }

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handlePerformanceModeToggle = () => {
    const newMode = !performanceMode
    setPerformanceMode(newMode)
    if (typeof window !== "undefined") {
      localStorage.setItem("performanceMode", String(newMode))
    }
  }

  if (chairModels.length === 0) {
    return (
      <div
        className="h-dvh w-screen flex items-center justify-center"
        style={{ background: theme === "light" ? "#ffffff" : "#000000" }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: theme === "light" ? "#000000" : "#ffffff" }}
        />
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

        {showInfo && chairData && (
          <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <div
              className={`backdrop-blur-xl border rounded-2xl px-4 py-2 shadow-2xl ${
                theme === "light" ? "bg-white/80 border-black/10 text-black" : "bg-black/80 border-white/10 text-white"
              }`}
            >
              <p className="text-sm font-medium">{chairData?.name || "stol"}</p>
            </div>
          </div>
        )}

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
          performanceMode={performanceMode}
          onPerformanceModeToggle={handlePerformanceModeToggle}
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
