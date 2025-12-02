"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelViewer } from "@/components/model-viewer"
import { ChairInfoOverlay } from "@/components/chair-info-overlay"

export default function HomePage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [isExploded, setIsExploded] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark"
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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
    if (!autoBreakEnabled || !modelUrl) return

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
  }, [modelUrl, autoBreakEnabled])

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
  }, [showInfo, isExploded, modelUrl])

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Revoke previous URL if exists
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl)
      }

      const url = URL.createObjectURL(file)
      setModelUrl(url)
      setIsExploded(false)
      setShowInfo(true)
    },
    [modelUrl],
  )

  const handleCanvasClick = useCallback(() => {
    if (!modelUrl) {
      fileInputRef.current?.click()
    }
  }, [modelUrl])

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

  return (
    <div
      className="h-dvh w-screen relative overflow-hidden"
      style={{ background: theme === "light" ? "#ffffff" : "#000000", transition: "none" }}
    >
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".glb,.gltf" onChange={handleFileUpload} className="hidden" />

      <div className="h-full w-full relative">
        {modelUrl ? (
          <ModelViewer modelUrl={modelUrl} isExploded={isExploded} chairIndex={0} theme={theme} />
        ) : (
          <div className="h-full w-full flex items-center justify-center cursor-pointer" onClick={handleCanvasClick}>
            <div className="text-center px-8">
              <div
                className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  theme === "light" ? "bg-black/5" : "bg-white/5"
                }`}
              >
                <svg
                  className={`w-12 h-12 ${theme === "light" ? "text-black/40" : "text-white/40"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className={`text-lg font-medium mb-2 ${theme === "light" ? "text-black" : "text-white"}`}>
                Tap anywhere to upload
              </p>
              <p className={`text-sm ${theme === "light" ? "text-black/50" : "text-white/50"}`}>
                GLB or GLTF files supported
              </p>
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
          data={null}
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
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                theme === "light" ? "text-black hover:bg-black/10" : "text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </Button>

            <div className={`w-px h-8 ${theme === "light" ? "bg-black/10" : "bg-white/10"}`} />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleExplodeToggle}
              disabled={!modelUrl}
              className={`rounded-full w-10 h-10 transition-all active:scale-95 ${
                theme === "light"
                  ? isExploded
                    ? "bg-black/20 text-black"
                    : "text-black hover:bg-black/10"
                  : isExploded
                    ? "bg-white/20 text-white"
                    : "text-white hover:bg-white/10"
              } ${autoBreakEnabled ? "ring-2 ring-red-500/50" : ""} ${!modelUrl ? "opacity-30" : ""}`}
            >
              <Zap className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
