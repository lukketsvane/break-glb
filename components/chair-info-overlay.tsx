"use client"

import { X, ChevronDown, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ChairData {
  name: string
  designer: string
  year: string
  type: string
  period: string
  owner: string
  dimensions: {
    height: number
    width: number
    depth: number
  }
  materials: string
  tags: string[]
  notes: string
  classification: string
  source: string
}

interface ChairInfoOverlayProps {
  data: ChairData | null
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  onThemeToggle: () => void
}

export function ChairInfoOverlay({ data, isOpen, onClose, theme, onThemeToggle }: ChairInfoOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false)

  if (!isOpen || !data) return null

  console.log("[v0] ChairInfoOverlay - materials data:", data.materials)
  console.log("[v0] ChairInfoOverlay - materials length:", data.materials?.length)

  const materialsList = data.materials
    ? data.materials
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
    : []

  console.log("[v0] ChairInfoOverlay - materialsList:", materialsList)

  const bgClass = theme === "light" ? "bg-white/95" : "bg-black/95"
  const borderClass = theme === "light" ? "border-black/10" : "border-white/10"
  const textClass = theme === "light" ? "text-black" : "text-white"
  const textMutedClass = theme === "light" ? "text-black/50" : "text-white/50"
  const cardBgClass = theme === "light" ? "bg-black/5" : "bg-white/5"
  const dimBgClass = theme === "light" ? "bg-white/30" : "bg-black/30"
  const hoverBgClass = theme === "light" ? "hover:bg-black/5" : "hover:bg-white/5"
  const tagBgClass = theme === "light" ? "bg-white/40 border-black/20" : "bg-black/40 border-white/20"
  const bulletClass = theme === "light" ? "bg-black/40" : "bg-white/40"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto animate-in slide-in-from-right duration-300">
        <div className={`${bgClass} backdrop-blur-xl border ${borderClass} rounded-xl shadow-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
            <h2 className={`text-2xl font-serif ${textClass}`}>Chair</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onThemeToggle}
                className={`rounded-full w-8 h-8 ${textMutedClass} ${theme === "light" ? "hover:text-black" : "hover:text-white"} ${hoverBgClass} flex-shrink-0`}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={`rounded-full w-8 h-8 ${textMutedClass} ${theme === "light" ? "hover:text-black" : "hover:text-white"} ${hoverBgClass} flex-shrink-0`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <p className={`${textMutedClass} text-xs mb-1`}>Kunstner/Produsent</p>
                <p className={`${textClass} text-sm font-light`}>{data.designer || "Unknown"}</p>
              </div>
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <p className={`${textMutedClass} text-xs mb-1`}>År</p>
                <p className={`${textClass} text-sm font-light`}>{data.year || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <p className={`${textMutedClass} text-xs mb-1`}>Objekttype</p>
                <p className={`${textClass} text-sm font-light`}>{data.type || data.classification || "—"}</p>
              </div>
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <p className={`${textMutedClass} text-xs mb-1`}>Stilperiode</p>
                <p className={`${textClass} text-sm font-light`}>{data.period || "—"}</p>
              </div>
            </div>

            {data.dimensions.height > 0 && (
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className={`w-4 h-4 ${textMutedClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  <p className={`${textMutedClass} text-xs`}>Dimensjoner (mm)</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`${dimBgClass} rounded-lg p-2 text-center`}>
                    <p className={`${textClass} text-xl font-light mb-0.5`}>{data.dimensions.height}</p>
                    <p className={`${textMutedClass} text-[10px] uppercase tracking-wider`}>H</p>
                  </div>
                  <div className={`${dimBgClass} rounded-lg p-2 text-center`}>
                    <p className={`${textClass} text-xl font-light mb-0.5`}>{data.dimensions.width}</p>
                    <p className={`${textMutedClass} text-[10px] uppercase tracking-wider`}>W</p>
                  </div>
                  <div className={`${dimBgClass} rounded-lg p-2 text-center`}>
                    <p className={`${textClass} text-xl font-light mb-0.5`}>{data.dimensions.depth}</p>
                    <p className={`${textMutedClass} text-[10px] uppercase tracking-wider`}>D</p>
                  </div>
                </div>
              </div>
            )}

            {materialsList.length > 0 && (
              <div className={`${cardBgClass} rounded-lg p-3 border ${borderClass}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className={`w-4 h-4 ${textMutedClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <p className={`${textMutedClass} text-xs`}>Materialer</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {materialsList.map((material, index) => (
                    <span
                      key={index}
                      className={`px-2.5 py-1 ${tagBgClass} rounded-full ${textClass} text-xs border font-light`}
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(data.tags.length > 0 || data.notes || data.source || data.owner) && (
              <div className={`${cardBgClass} rounded-lg border ${borderClass} overflow-hidden`}>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`w-full flex items-center justify-between p-3 ${hoverBgClass} transition-colors`}
                >
                  <p className={`${textMutedClass} text-xs`}>Meir informasjon</p>
                  <ChevronDown
                    className={`w-4 h-4 ${textMutedClass} transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {isExpanded && (
                  <div className={`px-3 pb-3 space-y-3 border-t ${borderClass} pt-3`}>
                    {data.tags.length > 0 && (
                      <div className={`${dimBgClass} rounded-lg border ${borderClass} overflow-hidden`}>
                        <button
                          onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                          className={`w-full flex items-center justify-between p-2.5 ${hoverBgClass} transition-colors`}
                        >
                          <div className="flex items-center gap-1.5">
                            <svg
                              className={`w-4 h-4 ${textMutedClass}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                              />
                            </svg>
                            <p className={`${textMutedClass} text-xs`}>Stikkord</p>
                            <span className={`${textMutedClass} text-xs`}>({data.tags.length})</span>
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 ${textMutedClass} transition-transform ${
                              isKeywordsExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isKeywordsExpanded && (
                          <div className="px-2.5 pb-2.5 space-y-1">
                            {data.tags.map((tag, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-2 py-1.5 px-2 ${cardBgClass} rounded ${textClass} text-xs font-light`}
                              >
                                <span className={`w-1 h-1 rounded-full ${bulletClass} flex-shrink-0`} />
                                {tag}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {data.owner && (
                      <div>
                        <p className={`${textMutedClass} text-xs mb-1.5`}>Eigar/Samling</p>
                        <p className={`${textClass} text-sm font-light leading-snug`}>{data.owner}</p>
                      </div>
                    )}

                    {data.source && (
                      <div>
                        <p className={`${textMutedClass} text-xs mb-1.5`}>Kjelde</p>
                        <p className={`${textClass} text-sm font-light leading-snug break-all`}>{data.source}</p>
                      </div>
                    )}

                    {data.notes && (
                      <div>
                        <p className={`${textMutedClass} text-xs mb-1.5`}>Notater</p>
                        <p className={`${textClass} text-sm font-light leading-snug`}>{data.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
