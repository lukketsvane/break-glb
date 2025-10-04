"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

export default function ModelExploder() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const partsRef = useRef<THREE.Mesh[]>([])
  const originalPositionsRef = useRef<THREE.Vector3[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const controlsRef = useRef({
    isDragging: false,
    previousTouch: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    pinchDistance: 0,
    zoom: 5,
  })

  const [isExploded, setIsExploded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasModel, setHasModel] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x808080)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 2, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(5, 5, 5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(-5, 3, -5)
    scene.add(directionalLight2)

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      if (modelRef.current) {
        modelRef.current.rotation.x = controlsRef.current.rotation.x
        modelRef.current.rotation.y = controlsRef.current.rotation.y
      }

      // Smooth camera zoom transition
      camera.position.z += (controlsRef.current.zoom - camera.position.z) * 0.1
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (
        containerRef.current &&
        rendererRef.current &&
        containerRef.current.contains(rendererRef.current.domElement)
      ) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current?.dispose()
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer])
      const url = URL.createObjectURL(blob)

      const loader = new GLTFLoader()

      loader.load(
        url,
        (gltf) => {
          // Clear previous model
          if (modelRef.current && sceneRef.current) {
            sceneRef.current.remove(modelRef.current)
          }

          const model = gltf.scene
          modelRef.current = model

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim

          model.scale.multiplyScalar(scale)
          model.position.sub(center.multiplyScalar(scale))

          // Extract parts
          partsRef.current = []
          originalPositionsRef.current = []

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              partsRef.current.push(child as THREE.Mesh)
              originalPositionsRef.current.push(child.position.clone())
            }
          })

          if (sceneRef.current) {
            sceneRef.current.add(model)
          }
          setHasModel(true)
          setIsLoading(false)
          URL.revokeObjectURL(url)
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error)
          setIsLoading(false)
          alert("Error loading model. Please try another GLB file.")
        },
      )
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
      alert("Error processing file.")
    }
  }

  const explodeModel = () => {
    if (partsRef.current.length === 0 || !modelRef.current) return

    const center = new THREE.Vector3()
    const box = new THREE.Box3().setFromObject(modelRef.current)
    box.getCenter(center)

    partsRef.current.forEach((part, index) => {
      const direction = new THREE.Vector3()
      part.getWorldPosition(direction)
      direction.sub(center).normalize()

      if (direction.length() === 0) {
        direction.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize()
      }

      const distance = isExploded ? 0 : 1.5
      const targetPos = originalPositionsRef.current[index].clone().add(direction.multiplyScalar(distance))

      // Animate
      const startPos = part.position.clone()
      const duration = 800
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress

        part.position.lerpVectors(startPos, targetPos, eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    })

    setIsExploded(!isExploded)
  }

  const refineModel = () => {
    if (!modelRef.current) return

    // Simple refine animation - subtle rotation wobble
    const originalRotation = { ...controlsRef.current.rotation }
    const duration = 300
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const wobble = Math.sin(progress * Math.PI * 4) * 0.1 * (1 - progress)

      controlsRef.current.rotation.x = originalRotation.x + wobble
      controlsRef.current.rotation.y = originalRotation.y + wobble

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      controlsRef.current.isDragging = true
      controlsRef.current.previousTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      controlsRef.current.pinchDistance = Math.sqrt(dx * dx + dy * dy)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && controlsRef.current.isDragging) {
      const deltaX = e.touches[0].clientX - controlsRef.current.previousTouch.x
      const deltaY = e.touches[0].clientY - controlsRef.current.previousTouch.y

      controlsRef.current.rotation.y += deltaX * 0.01
      controlsRef.current.rotation.x += deltaY * 0.01

      controlsRef.current.previousTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (controlsRef.current.pinchDistance > 0) {
        const delta = controlsRef.current.pinchDistance - distance
        controlsRef.current.zoom = Math.max(2, Math.min(10, controlsRef.current.zoom + delta * 0.01))
      }

      controlsRef.current.pinchDistance = distance
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    controlsRef.current.isDragging = false
    if (e.touches.length < 2) {
      controlsRef.current.pinchDistance = 0
    }
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">3D Model Exploder</h1>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
          {isLoading ? "Loading…" : "Upload GLB"}
          <input type="file" accept=".glb" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
        </label>
      </div>

      {/* 3D Viewer */}
      <div
        ref={containerRef}
        className="flex-1 relative touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!hasModel && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg mb-2">Upload a 3D Model</p>
              <p className="text-sm text-gray-400">GLB format supported</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {hasModel && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
          <button
            onClick={refineModel}
            className="bg-gray-700 bg-opacity-90 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Refine
          </button>
          <button
            onClick={explodeModel}
            className="bg-purple-600 bg-opacity-90 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            {isExploded ? "Assemble" : "Bang"}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-20 left-0 right-0 text-center text-white text-sm px-4">
        {hasModel && (
          <p className="bg-black bg-opacity-50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm">
            Drag to rotate • Pinch to zoom
          </p>
        )}
      </div>
    </div>
  )
}
