import type { AnimationConfig } from "./types"

// ============================================================================
// Easing Functions
// ============================================================================

export const easingFunctions = {
  linear: (t: number) => t,

  easeIn: (t: number) => t * t * t,

  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),

  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  bounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75

    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function validateProps(props: any): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (props.explosionDistance !== undefined && props.explosionDistance < 0) {
    warnings.push("explosionDistance should be positive")
  }

  if (props.explosionSpeed !== undefined && props.explosionSpeed < 100) {
    warnings.push("explosionSpeed should be at least 100ms for smooth animations")
  }

  if (props.minDistance !== undefined && props.maxDistance !== undefined) {
    if (props.minDistance >= props.maxDistance) {
      warnings.push("minDistance should be less than maxDistance")
    }
  }

  if (props.ambientLightIntensity !== undefined && props.ambientLightIntensity < 0) {
    warnings.push("ambientLightIntensity should be non-negative")
  }

  if (props.directionalLightIntensity !== undefined && props.directionalLightIntensity < 0) {
    warnings.push("directionalLightIntensity should be non-negative")
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

// ============================================================================
// Color Utilities
// ============================================================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

// ============================================================================
// File Validation
// ============================================================================

export function validateGLBFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" }
  }

  const validExtensions = [".glb"]
  const fileName = file.name.toLowerCase()
  const isValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

  if (!isValidExtension) {
    return { valid: false, error: "Invalid file format. Please upload a .glb file" }
  }

  // Check file size (limit to 100MB)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 100MB" }
  }

  return { valid: true }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60

  update(): number {
    this.frameCount++
    const currentTime = performance.now()
    const delta = currentTime - this.lastTime

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta)
      this.frameCount = 0
      this.lastTime = currentTime
    }

    return this.fps
  }

  getFPS(): number {
    return this.fps
  }
}

// ============================================================================
// Local Storage Helpers
// ============================================================================

export const storage = {
  save(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn("Failed to save to localStorage:", error)
    }
  },

  load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn("Failed to load from localStorage:", error)
      return defaultValue
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error)
    }
  },
}
