"use client"

import type React from "react"
import { Suspense, useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface BreakGLBProps {
  // Model Source
  modelUrl?: string

  // Visual Customization
  backgroundColor?: string
  ambientLightIntensity?: number
  directionalLightIntensity?: number
  shadowsEnabled?: boolean
  cameraFov?: number
  cameraPosition?: [number, number, number]

  // Animation Parameters
  explosionDistance?: number
  explosionSpeed?: number
  animationEasing?: "linear" | "easeInOut" | "easeOut"

  // Behavior Toggles
  showUploadUI?: boolean
  showControls?: boolean
  autoExplode?: boolean
  enablePartSelection?: boolean
  enableLightControl?: boolean

  // Camera Controls
  enableRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  minDistance?: number
  maxDistance?: number

  // Lifecycle Callbacks
  onLoad?: (model: THREE.Group) => void
  onLoadError?: (error: Error) => void
  onExplode?: () => void
  onAssemble?: () => void
  onPartSelect?: (partName: string | null) => void

  // Style Overrides
  className?: string
  containerStyle?: React.CSSProperties
}

interface ModelProps {
  url: string
  isExploded: boolean
  selectedPart: string | null
  onPartSelect: (partName: string | null) => void
  onExplodeComplete?: () => void
  lightPosition: THREE.Vector3
  explosionDistance: number
  enablePartSelection: boolean
}

interface Part {
  object: THREE.Object3D
  originalPosition: THREE.Vector3
  explodedPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity: THREE.Vector3
  angularVelocity: THREE.Euler
  originalRotation: THREE.Euler
  name: string
  center: THREE.Vector3
  floatOffset: number
  rotationSpeed: number
  bobSpeed: number
  boundingBox: THREE.Box3
  collisionRadius: number
  isDragging: boolean
  collisionMesh: THREE.Mesh | null
  grabOffset: THREE.Vector3
}

// ============================================================================
// Internal Model Component
// ============================================================================

function Model({ url, isExploded, selectedPart, onPartSelect, onExplodeComplete, lightPosition, explosionDistance, enablePartSelection }: ModelProps) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const [parts, setParts] = useState<Part[]>([])
  const { camera, controls, gl, raycaster, pointer } = useThree()
  const hasExplodedRef = useRef(false)

  const draggedPartRef = useRef<Part | null>(null)
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane())
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const pointerDownRef = useRef(false)
  const pointerDownTimeRef = useRef(0)
  const previousDragPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const grabPointRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const hasMovedRef = useRef(false)
  const initialPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())

  useEffect(() => {
    if (!scene) return

    const explodableParts: Part[] = []

    const findParts = (obj: THREE.Object3D, depth = 0) => {
      if (obj.type === "Scene") {
        obj.children.forEach((child) => findParts(child, depth + 1))
        return
      }

      if (obj.type === "Group") {
        const directMeshes = obj.children.filter((child) => child.type === "Mesh")

        if (directMeshes.length > 0) {
          const box = new THREE.Box3()
          box.setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          const collisionRadius = Math.max(size.x, size.y, size.z) * 0.45

          const modelBox = new THREE.Box3().setFromObject(scene)
          const modelCenter = modelBox.getCenter(new THREE.Vector3())

          let direction = center.clone().sub(modelCenter)
          if (direction.length() < 0.1) {
            direction =
              obj.position.length() > 0.1
                ? obj.position.clone().normalize()
                : new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
          }
          direction.normalize()

          const distance = explosionDistance + Math.random() * 0.8 + collisionRadius * 1.2
          const explodedPosition = obj.position.clone().add(direction.multiplyScalar(distance))

          let collisionMesh: THREE.Mesh | null = null
          if (directMeshes.length > 0 && directMeshes[0] instanceof THREE.Mesh) {
            collisionMesh = directMeshes[0] as THREE.Mesh
          }

          explodableParts.push({
            object: obj,
            originalPosition: obj.position.clone(),
            explodedPosition: explodedPosition,
            currentPosition: obj.position.clone(),
            velocity: new THREE.Vector3(),
            angularVelocity: new THREE.Euler(0, 0, 0),
            originalRotation: obj.rotation.clone(),
            name: obj.name || `part-${explodableParts.length}`,
            center,
            floatOffset: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.5,
            bobSpeed: 0.2 + Math.random() * 0.2,
            boundingBox: box.clone(),
            collisionRadius,
            isDragging: false,
            collisionMesh,
            grabOffset: new THREE.Vector3(),
          })

          return
        }

        if (obj.children.length > 0) {
          obj.children.forEach((child) => findParts(child, depth + 1))
          return
        }
      }

      if (obj.type === "Mesh" && obj.name && obj.name.length > 0) {
        const box = new THREE.Box3()
        box.setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        const collisionRadius = Math.max(size.x, size.y, size.z) * 0.45

        const modelBox = new THREE.Box3().setFromObject(scene)
        const modelCenter = modelBox.getCenter(new THREE.Vector3())

        let direction = center.clone().sub(modelCenter)
        if (direction.length() < 0.1) {
          direction =
            obj.position.length() > 0.1
              ? obj.position.clone().normalize()
              : new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
        }
        direction.normalize()

        const distance = explosionDistance * 0.8 + Math.random() * 0.6 + collisionRadius * 1.2
        const explodedPosition = obj.position.clone().add(direction.multiplyScalar(distance))

        explodableParts.push({
          object: obj,
          originalPosition: obj.position.clone(),
          explodedPosition: explodedPosition,
          currentPosition: obj.position.clone(),
          velocity: new THREE.Vector3(),
          angularVelocity: new THREE.Euler(0, 0, 0),
          originalRotation: obj.rotation.clone(),
          name: obj.name,
          center,
          floatOffset: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.5,
          bobSpeed: 0.2 + Math.random() * 0.2,
          boundingBox: box.clone(),
          collisionRadius,
          isDragging: false,
          collisionMesh: obj instanceof THREE.Mesh ? obj : null,
          grabOffset: new THREE.Vector3(),
        })
      }

      obj.children.forEach((child) => findParts(child, depth + 1))
    }

    findParts(scene)
    setParts(explodableParts)
  }, [scene, explosionDistance])

  useEffect(() => {
    if (!enablePartSelection) return

    const canvas = gl.domElement

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownRef.current = true
      pointerDownTimeRef.current = Date.now()
      hasMovedRef.current = false

      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object
        const part = parts.find((p) => {
          let current: THREE.Object3D | null = clickedObject
          while (current) {
            if (current === p.object) return true
            current = current.parent
          }
          return false
        })

        if (part) {
          event.stopPropagation()
          event.preventDefault()

          if (controls) {
            ;(controls as any).enabled = false
          }

          const normal = camera.position.clone().sub(part.object.position).normalize()
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, part.object.position)

          const intersection = new THREE.Vector3()
          raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)
          dragOffsetRef.current.copy(part.object.position).sub(intersection)

          grabPointRef.current.copy(intersects[0].point).sub(part.object.position)
          part.grabOffset.copy(grabPointRef.current)
          previousDragPositionRef.current.copy(intersection)
          initialPositionRef.current.copy(part.object.position)

          draggedPartRef.current = part
          part.isDragging = true
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDownRef.current || !draggedPartRef.current) return

      event.stopPropagation()
      event.preventDefault()

      const holdTime = Date.now() - pointerDownTimeRef.current
      if (holdTime < 150) return

      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersection = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)) {
        const newPosition = intersection.add(dragOffsetRef.current)

        if (newPosition.distanceTo(initialPositionRef.current) > 0.01) {
          hasMovedRef.current = true
        }

        const dragDelta = intersection.clone().sub(previousDragPositionRef.current)
        const torqueArm = draggedPartRef.current.grabOffset
        const torque = new THREE.Vector3().crossVectors(torqueArm, dragDelta)

        draggedPartRef.current.angularVelocity.x += torque.x * 2
        draggedPartRef.current.angularVelocity.y += torque.y * 2
        draggedPartRef.current.angularVelocity.z += torque.z * 2

        previousDragPositionRef.current.copy(intersection)

        draggedPartRef.current.object.position.copy(newPosition)
        draggedPartRef.current.currentPosition.copy(newPosition)
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      const holdTime = Date.now() - pointerDownTimeRef.current

      if (draggedPartRef.current) {
        event.stopPropagation()
        event.preventDefault()
      }

      if (holdTime < 150 && draggedPartRef.current && !hasMovedRef.current) {
        const part = draggedPartRef.current
        onPartSelect(selectedPart === part.name ? null : part.name)

        if (selectedPart !== part.name) {
          const box = new THREE.Box3().setFromObject(part.object)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const distance = maxDim * 2.5

          const direction = camera.position.clone().sub(center).normalize()
          const newPosition = center.clone().add(direction.multiplyScalar(distance))

          const startPosition = camera.position.clone()
          const startTime = Date.now()
          const duration = 1000

          const animateCamera = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)

            camera.position.lerpVectors(startPosition, newPosition, eased)
            camera.lookAt(center)

            if (progress < 1) {
              requestAnimationFrame(animateCamera)
            }
          }

          animateCamera()
        }
      }

      pointerDownRef.current = false
      hasMovedRef.current = false
      if (draggedPartRef.current) {
        draggedPartRef.current.isDragging = false
        draggedPartRef.current = null
      }

      if (controls) {
        ;(controls as any).enabled = true
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown, true)
    canvas.addEventListener("pointermove", handlePointerMove, true)
    canvas.addEventListener("pointerup", handlePointerUp, true)
    canvas.addEventListener("pointercancel", handlePointerUp, true)

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown, true)
      canvas.removeEventListener("pointermove", handlePointerMove, true)
      canvas.removeEventListener("pointerup", handlePointerUp, true)
      canvas.removeEventListener("pointercancel", handlePointerUp, true)
    }
  }, [parts, camera, scene, gl, raycaster, pointer, controls, selectedPart, onPartSelect, enablePartSelection])

  useEffect(() => {
    if (!scene || parts.length === 0) return

    const box = new THREE.Box3()

    if (isExploded) {
      parts.forEach((part) => {
        const partBox = new THREE.Box3().setFromObject(part.object)
        const explodedBox = partBox.clone()
        explodedBox.translate(part.explodedPosition.clone().sub(part.originalPosition))
        box.union(explodedBox)
      })
    } else {
      box.setFromObject(scene)
    }

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 50
    const cameraDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360))

    const distance = cameraDistance * 1.8
    camera.position.set(distance, distance * 0.7, distance)
    camera.lookAt(center)

    if (controls && "target" in controls) {
      ;(controls as any).target.copy(center)
      ;(controls as any).update()
    }

    camera.updateProjectionMatrix()
  }, [scene, camera, controls, parts, isExploded])

  useFrame((state, delta) => {
    if (!groupRef.current || parts.length === 0) return

    let allSettled = true

    parts.forEach((part, index) => {
      const {
        object,
        originalPosition,
        explodedPosition,
        currentPosition,
        velocity,
        isDragging,
        angularVelocity,
        originalRotation,
      } = part

      if (isDragging) {
        object.rotation.x += angularVelocity.x * delta
        object.rotation.y += angularVelocity.y * delta
        object.rotation.z += angularVelocity.z * delta

        angularVelocity.x *= 0.95
        angularVelocity.y *= 0.95
        angularVelocity.z *= 0.95
        return
      }

      const targetPosition = isExploded ? explodedPosition : originalPosition

      const distanceFromTarget = currentPosition.distanceTo(targetPosition)
      const maxDistance = 8

      if (distanceFromTarget > 0.01) {
        allSettled = false
      }

      const attractionStrength = Math.min(distanceFromTarget / maxDistance, 1) * 0.008
      const attractionForce = targetPosition.clone().sub(currentPosition).multiplyScalar(attractionStrength)
      velocity.add(attractionForce)

      parts.forEach((otherPart, otherIndex) => {
        if (index === otherIndex || otherPart.isDragging) return

        const distance = currentPosition.distanceTo(otherPart.currentPosition)
        const minDistance = part.collisionRadius + otherPart.collisionRadius

        if (distance < minDistance * 1.1) {
          const partBox = part.boundingBox.clone()
          partBox.translate(currentPosition.clone().sub(part.originalPosition))

          const otherBox = otherPart.boundingBox.clone()
          otherBox.translate(otherPart.currentPosition.clone().sub(otherPart.originalPosition))

          if (partBox.intersectsBox(otherBox)) {
            const repulsionDirection = currentPosition.clone().sub(otherPart.currentPosition).normalize()
            const overlap = minDistance - distance

            const repulsionForce = repulsionDirection.multiplyScalar(overlap * 0.08)

            const relativeVelocity = velocity.clone().sub(otherPart.velocity)
            const velocityAlongNormal = relativeVelocity.dot(repulsionDirection)

            if (velocityAlongNormal < 0) {
              const impulse = repulsionDirection.multiplyScalar(velocityAlongNormal * 0.5)
              velocity.sub(impulse)
            }

            velocity.add(repulsionForce)
          }
        }
      })

      currentPosition.add(velocity)
      velocity.multiplyScalar(0.92)

      object.position.copy(currentPosition)

      if (isExploded) {
        const bobAmount = Math.sin(state.clock.elapsedTime * part.bobSpeed + part.floatOffset) * 0.03
        object.position.y += bobAmount * delta * 5

        object.rotation.x += angularVelocity.x * delta + part.rotationSpeed * 0.3 * delta
        object.rotation.y += angularVelocity.y * delta + part.rotationSpeed * delta
        object.rotation.z += angularVelocity.z * delta + part.rotationSpeed * 0.2 * delta

        angularVelocity.x *= 0.98
        angularVelocity.y *= 0.98
        angularVelocity.z *= 0.98
      } else {
        object.rotation.x += (originalRotation.x - object.rotation.x) * 0.1
        object.rotation.y += (originalRotation.y - object.rotation.y) * 0.1
        object.rotation.z += (originalRotation.z - object.rotation.z) * 0.1

        angularVelocity.x *= 0.9
        angularVelocity.y *= 0.9
        angularVelocity.z *= 0.9
      }
    })

    if (allSettled && isExploded && !hasExplodedRef.current) {
      hasExplodedRef.current = true
      onExplodeComplete?.()
    } else if (!isExploded) {
      hasExplodedRef.current = false
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function LoadingFallback() {
  return null
}

// ============================================================================
// Main BreakGLB Component
// ============================================================================

export function BreakGLB({
  modelUrl,
  backgroundColor = "#000000",
  ambientLightIntensity = 0.3,
  directionalLightIntensity = 1.2,
  shadowsEnabled = true,
  cameraFov = 50,
  cameraPosition = [5, 5, 5],
  explosionDistance = 1.5,
  explosionSpeed = 800,
  animationEasing = "easeInOut",
  showUploadUI = true,
  showControls = true,
  autoExplode = false,
  enablePartSelection = true,
  enableLightControl = true,
  enableRotate = true,
  enableZoom = true,
  enablePan = true,
  minDistance = 2,
  maxDistance = 20,
  onLoad,
  onLoadError,
  onExplode,
  onAssemble,
  onPartSelect,
  className,
  containerStyle,
}: BreakGLBProps) {
  const [internalModelUrl, setInternalModelUrl] = useState<string | null>(modelUrl || null)
  const [isExploded, setIsExploded] = useState(autoExplode)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lightPosition, setLightPosition] = useState(new THREE.Vector3(10, 10, 5))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isThreeFingerRef = useRef(false)
  const isRightDraggingRef = useRef(false)
  const rightDragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Update internal URL when prop changes
  useEffect(() => {
    if (modelUrl) {
      setInternalModelUrl(modelUrl)
    }
  }, [modelUrl])

  // Light control handlers
  useEffect(() => {
    if (!enableLightControl) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        isThreeFingerRef.current = true
        const touch = e.touches[0]
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 3 && isThreeFingerRef.current && touchStartRef.current) {
        const touch = e.touches[0]
        const deltaX = (touch.clientX - touchStartRef.current.x) * 0.05
        const deltaY = (touch.clientY - touchStartRef.current.y) * 0.05

        setLightPosition((prev) => {
          const newPos = prev.clone()
          newPos.x += deltaX
          newPos.y -= deltaY
          return newPos
        })

        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 3) {
        isThreeFingerRef.current = false
        touchStartRef.current = null
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightDraggingRef.current = true
        rightDragStartRef.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isRightDraggingRef.current && rightDragStartRef.current) {
        const deltaX = (e.clientX - rightDragStartRef.current.x) * 0.05
        const deltaY = (e.clientY - rightDragStartRef.current.y) * 0.05

        setLightPosition((prev) => {
          const newPos = prev.clone()
          newPos.x += deltaX
          newPos.y -= deltaY
          return newPos
        })

        rightDragStartRef.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && isRightDraggingRef.current) {
        isRightDraggingRef.current = false
        rightDragStartRef.current = null
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: false })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("mousedown", handleMouseDown, true)
    window.addEventListener("mousemove", handleMouseMove, true)
    window.addEventListener("mouseup", handleMouseUp, true)
    window.addEventListener("contextmenu", handleContextMenu)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("mousedown", handleMouseDown, true)
      window.removeEventListener("mousemove", handleMouseMove, true)
      window.removeEventListener("mouseup", handleMouseUp, true)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [enableLightControl])

  const handleFileUpload = useCallback(
    (file: File) => {
      if (file && file.name.toLowerCase().endsWith(".glb")) {
        if (internalModelUrl) {
          URL.revokeObjectURL(internalModelUrl)
        }
        const url = URL.createObjectURL(file)
        setInternalModelUrl(url)
        setIsExploded(autoExplode)
        setSelectedPart(null)
      }
    },
    [internalModelUrl, autoExplode],
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload],
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
      const glbFile = files.find((file) => file.name.toLowerCase().endsWith(".glb"))

      if (glbFile) {
        handleFileUpload(glbFile)
      }
    },
    [handleFileUpload],
  )

  const handleExplodeToggle = useCallback(() => {
    const newState = !isExploded
    setIsExploded(newState)
    if (newState) {
      onExplode?.()
    } else {
      onAssemble?.()
    }
  }, [isExploded, onExplode, onAssemble])

  const handlePartSelectInternal = useCallback(
    (partName: string | null) => {
      setSelectedPart(partName)
      onPartSelect?.(partName)
    },
    [onPartSelect],
  )

  return (
    <div
      className={className || "h-screen w-screen"}
      style={{ ...containerStyle, backgroundColor, position: "relative", overflow: "hidden" }}
      onDragOver={showUploadUI ? handleDragOver : undefined}
      onDragLeave={showUploadUI ? handleDragLeave : undefined}
      onDrop={showUploadUI ? handleDrop : undefined}
    >
      {showUploadUI && isDragging && (
        <div className="absolute inset-0 bg-white/10 border-2 border-dashed border-white z-50 flex items-center justify-center">
          <div className="text-2xl font-bold text-white">Drop GLB file to load</div>
        </div>
      )}

      {showUploadUI && <input ref={fileInputRef} type="file" accept=".glb" onChange={handleInputChange} className="hidden" />}

      {!internalModelUrl && showUploadUI ? (
        <div className="flex items-center justify-center h-full w-full">
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <svg className="w-20 h-20 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-xl text-white/70 mb-2">Upload a 3D Model</p>
              <p className="text-sm text-white/50">GLB format supported</p>
            </div>
          </div>
        </div>
      ) : internalModelUrl ? (
        <div className="h-full w-full relative">
          <Canvas camera={{ position: cameraPosition, fov: cameraFov }} gl={{ antialias: true, alpha: false }} shadows={shadowsEnabled}>
            <Environment preset="studio" />
            <ambientLight intensity={ambientLightIntensity} />
            <directionalLight
              position={[lightPosition.x, lightPosition.y, lightPosition.z]}
              intensity={directionalLightIntensity}
              castShadow={shadowsEnabled}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-10, -10, -5]} intensity={0.4} />
            <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={1} castShadow={shadowsEnabled} />

            <Suspense fallback={<LoadingFallback />}>
              <Model
                url={internalModelUrl}
                isExploded={isExploded}
                selectedPart={selectedPart}
                onPartSelect={handlePartSelectInternal}
                onExplodeComplete={onExplode}
                lightPosition={lightPosition}
                explosionDistance={explosionDistance}
                enablePartSelection={enablePartSelection}
              />
            </Suspense>

            <OrbitControls
              enablePan={enablePan}
              enableZoom={enableZoom}
              enableRotate={enableRotate}
              minDistance={minDistance}
              maxDistance={maxDistance}
            />
          </Canvas>

          {showControls && (
            <>
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                  {showUploadUI && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
                        title="Upload new model"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </button>
                      <div className="w-px h-6 bg-white/20" />
                    </>
                  )}
                  <button
                    onClick={handleExplodeToggle}
                    className={`p-2 rounded-full text-white transition-colors ${
                      isExploded ? "bg-white/20" : "hover:bg-white/20"
                    }`}
                    title={isExploded ? "Assemble" : "Explode"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default BreakGLB
