"use client"

import { Suspense, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { EffectComposer, DepthOfField, Bloom, SSAO } from "@react-three/postprocessing"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  isExploded: boolean
  chairIndex: number
  theme: "light" | "dark"
  performanceMode?: boolean
  onToggleExplode?: () => void
  totalChairs?: number
  onNavigateToChair?: (index: number) => void
  allModelUrls?: string[]
}

const v0 = "v0 value"
const no = "no value"
const op = "op value"
const code = "code value"
const block = "block value"
const prefix = "prefix value"

// Existing code block with updates integrated
;[v0 - no - op - code - block - prefix]

export function ModelViewer({
  modelUrl,
  isExploded,
  chairIndex,
  theme,
  performanceMode = false,
  onToggleExplode,
  totalChairs = 0,
  onNavigateToChair,
  allModelUrls = [],
}: ModelViewerProps & { theme: "light" | "dark" }) {
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<any | null>(null)
  const [displayedModelUrl, setDisplayedModelUrl] = useState(modelUrl)
  const [isGeneratingPngs, setIsGeneratingPngs] = useState(false)
  const [pngProgress, setPngProgress] = useState(0)

  const generatePngSequence = async () => {
    console.log("[v0] PNG sequence generation started")

    if (!glRef.current || !cameraRef.current || !sceneRef.current) {
      console.error("[v0] Cannot generate PNGs: missing required refs")
      return
    }

    if (allModelUrls.length === 0 && (!onNavigateToChair || totalChairs === 0)) {
      console.error("[v0] Cannot generate PNGs: missing model URLs or navigation callback")
      return
    }

    setIsGeneratingPngs(true)
    setPngProgress(0)

    try {
      const gl = glRef.current
      const camera = cameraRef.current
      const scene = sceneRef.current
      const controls = controlsRef.current

      // Store original state
      const originalModelUrl = displayedModelUrl
      const originalBackground = scene.background
      const originalSize = { width: gl.domElement.width, height: gl.domElement.height }
      const originalCameraPosition = camera.position.clone()
      const originalCameraRotation = camera.rotation.clone()
      const originalControlsTarget = controls ? (controls as any).target.clone() : new THREE.Vector3()

      // Set transparent background
      scene.background = null

      // High-res square dimensions (1:1 aspect ratio)
      const size = 2048

      // Set renderer size to square
      gl.setSize(size, size, false)

      // Update camera aspect ratio for square viewport
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = 1 // Square aspect ratio
        camera.updateProjectionMatrix()
      }

      const loadedModelUrls: string[] = []
      const modelsToProcess = allModelUrls.length > 0 ? allModelUrls : Array(totalChairs).fill(null)

      for (let i = 0; i < modelsToProcess.length; i++) {
        console.log(`[v0] Generating PNG for chair ${i}/${modelsToProcess.length}`)

        if (allModelUrls.length > 0) {
          const url = allModelUrls[i]
          useGLTF.preload(url)
          setDisplayedModelUrl(url)
          // Wait for state update and model transition
          await new Promise((resolve) => setTimeout(resolve, 2000))
          // Wait for transition animation to complete
          await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
          onNavigateToChair!(i)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const modelBox = new THREE.Box3()
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.geometry) {
            modelBox.expandByObject(obj)
          }
        })

        if (!modelBox.isEmpty()) {
          const center = modelBox.getCenter(new THREE.Vector3())
          const size = modelBox.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)

          // Position camera at 45-degree angle
          const distance = maxDim * 2.5
          const angle = Math.PI / 4 // 45 degrees
          camera.position.set(
            center.x + Math.sin(angle) * distance,
            center.y + maxDim * 0.8,
            center.z + Math.cos(angle) * distance,
          )

          if (controls) {
            ;(controls as any).target.copy(center)
            ;(controls as any).update()
          }
        }

        for (let frame = 0; frame < 10; frame++) {
          gl.render(scene, camera)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        console.log(`[v0] Capturing PNG for chair ${i}`)

        // Capture and download PNG
        const canvas = gl.domElement
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.href = url
              link.download = `chair-${i.toString().padStart(4, "0")}.png`
              link.click()
              URL.revokeObjectURL(url)
              console.log(`[v0] Downloaded PNG for chair ${i}`)
            } else {
              console.error(`[v0] Failed to create blob for chair ${i}`)
            }
            resolve()
          }, "image/png")
        })

        // Track loaded models for cache management
        const currentUrl = allModelUrls.length > 0 ? allModelUrls[i] : displayedModelUrl
        if (currentUrl) {
          loadedModelUrls.push(currentUrl)
          if (loadedModelUrls.length > 5) {
            const urlToClear = loadedModelUrls.shift()
            if (urlToClear) {
              console.log(`[v0] Clearing model from cache: ${urlToClear}`)
              useGLTF.clear(urlToClear)
            }
          }
        }

        // Update progress
        setPngProgress(Math.round(((i + 1) / modelsToProcess.length) * 100))

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      console.log("[v0] Clearing all remaining models from cache")
      loadedModelUrls.forEach((url) => {
        useGLTF.clear(url)
      })

      // Restore original state
      setDisplayedModelUrl(originalModelUrl)
      scene.background = originalBackground
      gl.setSize(originalSize.width, originalSize.height, false)

      // Restore camera
      camera.position.copy(originalCameraPosition)
      camera.rotation.copy(originalCameraRotation)

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = originalSize.width / originalSize.height
        camera.updateProjectionMatrix()
      }

      if (controls) {
        ;(controls as any).target.copy(originalControlsTarget)
        ;(controls as any).update()
      }

      setIsGeneratingPngs(false)
      setPngProgress(0)
      console.log("[v0] PNG sequence generation complete")
    } catch (error) {
      console.error("[v0] PNG generation failed:", error)
      setIsGeneratingPngs(false)
      setPngProgress(0)
    }
  }

  return (
    <Canvas ref={glRef}>
      <Suspense fallback={null}>
        <OrbitControls ref={controlsRef} />
        {/* Model loading and rendering logic here */}
        {/* Ensure to use the displayedModelUrl state for loading the model */}
      </Suspense>
      <EffectComposer>
        <DepthOfField />
        <Bloom />
        <SSAO />
      </EffectComposer>
    </Canvas>
  )
}
