import { useState, useCallback, useEffect, useRef } from "react"
import type { BreakGLBRef, ModelPart } from "./types"

// ============================================================================
// useBreakGLB Hook
// ============================================================================

export function useBreakGLB() {
  const [isExploded, setIsExploded] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [parts, setParts] = useState<ModelPart[]>([])

  const explode = useCallback(() => {
    setIsExploded(true)
  }, [])

  const assemble = useCallback(() => {
    setIsExploded(false)
  }, [])

  const toggleExplode = useCallback(() => {
    setIsExploded((prev) => !prev)
  }, [])

  const selectPart = useCallback((partId: string | null) => {
    setSelectedPart(partId)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isExploded,
    selectedPart,
    isLoading,
    error,
    parts,
    explode,
    assemble,
    toggleExplode,
    selectPart,
    setIsLoading,
    setError,
    setParts,
    clearError,
  }
}

// ============================================================================
// useModelControls Hook - For imperative control
// ============================================================================

export function useModelControls(): [
  React.RefObject<BreakGLBRef | null>,
  {
    explode: () => void
    assemble: () => void
    toggle: () => void
    selectPart: (id: string | null) => void
    resetCamera: () => void
  }
] {
  const ref = useRef<BreakGLBRef | null>(null)

  const controls = {
    explode: useCallback(() => ref.current?.explode(), []),
    assemble: useCallback(() => ref.current?.assemble(), []),
    toggle: useCallback(() => ref.current?.toggleExplode(), []),
    selectPart: useCallback((id: string | null) => ref.current?.selectPart(id), []),
    resetCamera: useCallback(() => ref.current?.resetCamera(), []),
  }

  return [ref, controls]
}

// ============================================================================
// useKeyboardShortcuts Hook
// ============================================================================

export interface KeyboardShortcuts {
  explode?: string
  assemble?: string
  toggle?: string
  resetCamera?: string
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  callbacks: {
    onExplode?: () => void
    onAssemble?: () => void
    onToggle?: () => void
    onResetCamera?: () => void
  }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (shortcuts.explode && key === shortcuts.explode.toLowerCase()) {
        event.preventDefault()
        callbacks.onExplode?.()
      } else if (shortcuts.assemble && key === shortcuts.assemble.toLowerCase()) {
        event.preventDefault()
        callbacks.onAssemble?.()
      } else if (shortcuts.toggle && key === shortcuts.toggle.toLowerCase()) {
        event.preventDefault()
        callbacks.onToggle?.()
      } else if (shortcuts.resetCamera && key === shortcuts.resetCamera.toLowerCase()) {
        event.preventDefault()
        callbacks.onResetCamera?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, callbacks])
}

// ============================================================================
// useFileUpload Hook
// ============================================================================

export function useFileUpload(
  onUpload: (file: File) => void,
  options?: {
    maxSize?: number
    allowedExtensions?: string[]
  }
) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null)

      // Validate file size
      const maxSize = options?.maxSize || 100 * 1024 * 1024 // 100MB default
      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
        return
      }

      // Validate file extension
      const allowedExtensions = options?.allowedExtensions || [".glb"]
      const fileName = file.name.toLowerCase()
      const isValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

      if (!isValidExtension) {
        setError(`Invalid file format. Allowed: ${allowedExtensions.join(", ")}`)
        return
      }

      onUpload(file)
    },
    [onUpload, options]
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
      const allowedExtensions = options?.allowedExtensions || [".glb"]
      const file = files.find((f) =>
        allowedExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
      )

      if (file) {
        handleFileSelect(file)
      } else {
        setError(`No valid file found. Allowed: ${allowedExtensions.join(", ")}`)
      }
    },
    [handleFileSelect, options]
  )

  return {
    isDragging,
    error,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearError: () => setError(null),
  }
}

// ============================================================================
// useAnimationFrame Hook
// ============================================================================

export function useAnimationFrame(callback: (deltaTime: number) => void, deps: any[] = []) {
  const requestRef = useRef<number | undefined>(undefined)
  const previousTimeRef = useRef<number | undefined>(undefined)

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    },
    [callback]
  )

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [animate])
}

// ============================================================================
// useLocalStorage Hook
// ============================================================================

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error saving ${key} to localStorage:`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
