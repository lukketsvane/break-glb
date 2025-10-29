"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { EffectComposer, DepthOfField, Bloom } from "@react-three/postprocessing"
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

function Model({ url, isExploded }: { url: string; isExploded: boolean }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const originalPositions = useRef<Map<THREE.Object3D, THREE.Vector3>>(new Map())

  useEffect(() => {
    if (!groupRef.current) return

    // Store original positions
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!originalPositions.current.has(child)) {
          originalPositions.current.set(child, child.position.clone())
        }
      }
    })
  }, [scene])

  useFrame(() => {
    if (!groupRef.current) return

    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const originalPos = originalPositions.current.get(child)
        if (!originalPos) return

        const targetPos = isExploded ? originalPos.clone().multiplyScalar(2) : originalPos.clone()

        child.position.lerp(targetPos, 0.1)
      }
    })
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function CameraController({
  chairIndex,
  totalChairs,
  onNavigateToChair,
  onToggleExplode,
  onGeneratePngs,
}: {
  chairIndex: number
  totalChairs: number
  onNavigateToChair?: (index: number) => void
  onToggleExplode?: () => void
  onGeneratePngs?: () => void
}) {
  const { camera, scene } = useThree()
  const mainLightRef = useRef<THREE.DirectionalLight | null>(null)
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null)
  const spotLightRef = useRef<THREE.SpotLight | null>(null)
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null)
  const autoRotateSpeedRef = useRef(1.0)
  const spaceKeyDownRef = useRef(false)
  const spaceRightMouseDownRef = useRef(false)
  const lightControlStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    // Find lights in the scene
    scene.traverse((obj) => {
      if (obj instanceof THREE.DirectionalLight) {
        if (!mainLightRef.current) mainLightRef.current = obj
        else if (!fillLightRef.current) fillLightRef.current = obj
        else if (!rimLightRef.current) rimLightRef.current = obj
      } else if (obj instanceof THREE.SpotLight) {
        spotLightRef.current = obj
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation
      if (e.key === "ArrowLeft" && onNavigateToChair) {
        const newIndex = chairIndex > 0 ? chairIndex - 1 : totalChairs - 1
        onNavigateToChair(newIndex)
      } else if (e.key === "ArrowRight" && onNavigateToChair) {
        const newIndex = chairIndex < totalChairs - 1 ? chairIndex + 1 : 0
        onNavigateToChair(newIndex)
      }
      // Explosion toggle
      else if (e.key === "e" && onToggleExplode) {
        onToggleExplode()
      }
      // Auto-rotate speed control (keys 1-9)
      else if (e.key >= "1" && e.key <= "9") {
        autoRotateSpeedRef.current = Number.parseInt(e.key) * 0.2
        console.log(`[v0] Auto-rotate speed set to ${autoRotateSpeedRef.current}`)
      }
      // Randomize lights (N key)
      else if (e.key === "n" || e.key === "N") {
        if (mainLightRef.current) {
          mainLightRef.current.position.set((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 10)
        }
        if (fillLightRef.current) {
          fillLightRef.current.position.set((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 10)
        }
        if (spotLightRef.current) {
          spotLightRef.current.position.set((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 10)
        }
        if (rimLightRef.current) {
          rimLightRef.current.position.set((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 10)
        }
        console.log("[v0] Randomized all light positions")
      }
      // Generate PNGs (J key)
      else if (e.key === "j" || e.key === "J") {
        if (onGeneratePngs) {
          onGeneratePngs()
        }
      }
      // Space key for light control
      else if (e.key === " ") {
        spaceKeyDownRef.current = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceKeyDownRef.current = false
        spaceRightMouseDownRef.current = false
        lightControlStartRef.current = null
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 && spaceKeyDownRef.current) {
        spaceRightMouseDownRef.current = true
        lightControlStartRef.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (spaceRightMouseDownRef.current && lightControlStartRef.current && mainLightRef.current) {
        const deltaX = e.clientX - lightControlStartRef.current.x
        const deltaY = e.clientY - lightControlStartRef.current.y

        mainLightRef.current.position.x += deltaX * 0.01
        mainLightRef.current.position.y -= deltaY * 0.01

        lightControlStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        spaceRightMouseDownRef.current = false
        lightControlStartRef.current = null
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (spaceKeyDownRef.current) {
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("mousedown", handleMouseDown, true)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("contextmenu", handleContextMenu)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("mousedown", handleMouseDown, true)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [chairIndex, totalChairs, onNavigateToChair, onToggleExplode, onGeneratePngs, scene])

  return null
}

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
}: ModelViewerProps) {
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<any>(null)
  const [displayedModelUrl, setDisplayedModelUrl] = useState(modelUrl)
  const [isGeneratingPngs, setIsGeneratingPngs] = useState(false)
  const [pngProgress, setPngProgress] = useState(0)

  // Update displayed model URL when prop changes
  useEffect(() => {
    setDisplayedModelUrl(modelUrl)
  }, [modelUrl])

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
      const originalControlsTarget = controls ? controls.target.clone() : new THREE.Vector3()

      // Set transparent background
      scene.background = null

      // High-res square dimensions (1:1 aspect ratio)
      const size = 2048

      // Set renderer size to square
      gl.setSize(size, size, false)

      // Update camera aspect ratio for square viewport
      camera.aspect = 1
      camera.updateProjectionMatrix()

      const loadedModelUrls: string[] = []
      const modelsToProcess = allModelUrls.length > 0 ? allModelUrls : Array(totalChairs).fill(null)

      for (let i = 0; i < modelsToProcess.length; i++) {
        console.log(`[v0] Generating PNG for chair ${i}/${modelsToProcess.length}`)

        // Navigate to the chair
        if (allModelUrls.length > 0) {
          const url = allModelUrls[i]
          useGLTF.preload(url)
          setDisplayedModelUrl(url)
        } else {
          onNavigateToChair!(i)
        }

        await new Promise((resolve) => setTimeout(resolve, 5000))

        let modelLoaded = false
        for (let attempt = 0; attempt < 20; attempt++) {
          let hasMeshes = false
          scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.visible) {
              hasMeshes = true
            }
          })
          if (hasMeshes) {
            modelLoaded = true
            console.log(`[v0] Model loaded for chair ${i} after ${attempt + 1} attempts`)
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (!modelLoaded) {
          console.warn(`[v0] Model may not have fully loaded for chair ${i}, capturing anyway`)
        }

        // Calculate model bounds and position camera
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
          const angle = Math.PI / 4
          camera.position.set(
            center.x + Math.sin(angle) * distance,
            center.y + maxDim * 0.8,
            center.z + Math.cos(angle) * distance,
          )

          if (controls) {
            controls.target.copy(center)
            controls.update()
          }
        }

        for (let frame = 0; frame < 15; frame++) {
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

      camera.position.copy(originalCameraPosition)
      camera.rotation.copy(originalCameraRotation)
      camera.aspect = originalSize.width / originalSize.height
      camera.updateProjectionMatrix()

      if (controls) {
        controls.target.copy(originalControlsTarget)
        controls.update()
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
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        onCreated={({ gl, camera, scene }) => {
          glRef.current = gl
          cameraRef.current = camera as THREE.PerspectiveCamera
          sceneRef.current = scene
        }}
      >
        <color attach="background" args={[theme === "dark" ? "#000000" : "#ffffff"]} />

        <ambientLight intensity={0.3} />
        {/* Main key light - strong from front-right-top */}
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        {/* Fill light - softer from front-left */}
        <directionalLight position={[-8, 5, 3]} intensity={0.6} />
        {/* Rim light - from back to create edge highlights */}
        <directionalLight position={[0, 3, -10]} intensity={0.8} />
        {/* Spot light - from top for additional highlights */}
        <spotLight position={[0, 15, 0]} intensity={1.2} angle={0.4} penumbra={1} castShadow />

        {/* Model */}
        <Suspense fallback={null}>
          <Model url={displayedModelUrl} isExploded={isExploded} />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: undefined,
          }}
          makeDefault
        />

        {/* Camera Controller */}
        <CameraController
          chairIndex={chairIndex}
          totalChairs={totalChairs}
          onNavigateToChair={onNavigateToChair}
          onToggleExplode={onToggleExplode}
          onGeneratePngs={generatePngSequence}
        />

        {/* Post-processing */}
        {!performanceMode && (
          <EffectComposer>
            <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
            <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} height={300} />
          </EffectComposer>
        )}
      </Canvas>

      {/* PNG Generation Progress */}
      {isGeneratingPngs && (
        <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg">
          <div className="text-sm font-medium">Generating PNGs...</div>
          <div className="text-xs mt-1">{pngProgress}% complete</div>
        </div>
      )}
    </div>
  )
}
