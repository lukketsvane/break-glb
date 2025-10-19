"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  isExploded: boolean
  onExplodeComplete?: () => void
}

interface ModelProps {
  url: string
  isExploded: boolean
  selectedPart: string
  onPartSelect: (partName: string) => void
  onExplodeComplete?: () => void
  lightPosition: THREE.Vector3
}

interface Part {
  object: THREE.Object3D
  originalPosition: THREE.Vector3
  explodedPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity: THREE.Vector3
  angularVelocity: THREE.Euler // For rotation physics
  originalRotation: THREE.Euler // Store original rotation
  name: string
  center: THREE.Vector3
  floatOffset: number
  rotationSpeed: number
  bobSpeed: number
  boundingBox: THREE.Box3
  collisionRadius: number
  isDragging: boolean
  collisionMesh: THREE.Mesh | null
  grabOffset: THREE.Vector3 // Offset from center where user grabbed
}

function Model({ url, isExploded, selectedPart, onPartSelect, onExplodeComplete, lightPosition }: ModelProps) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const [parts, setParts] = useState<Part[]>([])
  const { camera, controls, gl, raycaster, pointer } = useThree()
  const hasExplodedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const animationStartTimeRef = useRef(0)
  const isCameraAnimatingRef = useRef(false)
  const cameraAnimationStartRef = useRef(0)
  const startCameraPositionRef = useRef(new THREE.Vector3())
  const targetCameraPositionRef = useRef(new THREE.Vector3())
  const startControlsTargetRef = useRef(new THREE.Vector3())
  const targetControlsTargetRef = useRef(new THREE.Vector3())

  const draggedPartRef = useRef<Part | null>(null)
  const dragPlaneRef = useRef(new THREE.Plane())
  const dragOffsetRef = useRef(new THREE.Vector3())
  const pointerDownRef = useRef(false)
  const pointerDownTimeRef = useRef(0)
  const previousDragPositionRef = useRef(new THREE.Vector3())
  const grabPointRef = useRef(new THREE.Vector3())
  const selectedPartRef = useRef("")

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

          const distance = 0.6 + Math.random() * 0.3 + collisionRadius * 0.5
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

        const distance = 0.5 + Math.random() * 0.2 + collisionRadius * 0.5
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
  }, [scene])

  useEffect(() => {
    const canvas = gl.domElement

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownRef.current = true
      pointerDownTimeRef.current = Date.now()

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

          draggedPartRef.current = part
          part.isDragging = true
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDownRef.current || !draggedPartRef.current) return

      const holdTime = Date.now() - pointerDownTimeRef.current
      if (holdTime < 150) return

      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersection = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)) {
        const newPosition = intersection.add(dragOffsetRef.current)

        const dragDelta = intersection.clone().sub(previousDragPositionRef.current)
        const torqueArm = draggedPartRef.current.grabOffset
        const torque = new THREE.Vector3().crossVectors(torqueArm, dragDelta)

        // Apply torque to angular velocity
        draggedPartRef.current.angularVelocity.x += torque.x * 2
        draggedPartRef.current.angularVelocity.y += torque.y * 2
        draggedPartRef.current.angularVelocity.z += torque.z * 2

        previousDragPositionRef.current.copy(intersection)

        draggedPartRef.current.object.position.copy(newPosition)
        draggedPartRef.current.currentPosition.copy(newPosition)
      }
    }

    const handlePointerUp = () => {
      const holdTime = Date.now() - pointerDownTimeRef.current

      if (holdTime < 150 && draggedPartRef.current) {
        const part = draggedPartRef.current
        if (selectedPartRef.current !== part.name) {
          const box = new THREE.Box3().setFromObject(part.object)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const distance = maxDim * 2.5

          const direction = camera.position.clone().sub(center).normalize()
          const newPosition = center.clone().add(direction.multiplyScalar(distance))

          startCameraPositionRef.current.copy(camera.position)
          targetCameraPositionRef.current.copy(newPosition)
          cameraAnimationStartRef.current = Date.now()
          isCameraAnimatingRef.current = true
        }
      }

      pointerDownRef.current = false
      if (draggedPartRef.current) {
        draggedPartRef.current.isDragging = false
        draggedPartRef.current = null
      }

      if (controls) {
        ;(controls as any).enabled = true
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointermove", handlePointerMove)
    canvas.addEventListener("pointerup", handlePointerUp)
    canvas.addEventListener("pointercancel", handlePointerUp)

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [parts, camera, scene, gl, raycaster, pointer, controls])

  const previousIsExplodedRef = useRef(isExploded)

  useEffect(() => {
    if (previousIsExplodedRef.current !== isExploded) {
      animationStartTimeRef.current = Date.now()
      isAnimatingRef.current = true
      previousIsExplodedRef.current = isExploded
    }
  }, [isExploded])

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }

  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  useFrame((state, delta) => {
    if (!groupRef.current || parts.length === 0) return

    const animationDuration = 900 // 0.9 seconds for reassembly
    const animationProgress = 1

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

      if (!isDragging && velocity.length() > 0.01) {
        object.position.add(velocity.clone().multiplyScalar(delta))
        currentPosition.copy(object.position)
        velocity.multiplyScalar(0.92)

        object.rotation.x += angularVelocity.x * delta
        object.rotation.y += angularVelocity.y * delta
        object.rotation.z += angularVelocity.z * delta

        angularVelocity.x *= 0.92
        angularVelocity.y *= 0.92
        angularVelocity.z *= 0.92

        const targetPosition = isExploded ? explodedPosition : originalPosition
        const returnForce = targetPosition.clone().sub(currentPosition).multiplyScalar(0.05)
        velocity.add(returnForce)
        return
      }

      const targetPosition = isExploded ? explodedPosition : originalPosition

      if (isAnimatingRef.current) {
        const animationProgress = (Date.now() - animationStartTimeRef.current) / animationDuration
        currentPosition.lerpVectors(
          isExploded ? originalPosition : explodedPosition,
          targetPosition,
          easeOutCubic(animationProgress),
        )
        object.position.copy(currentPosition)
      } else {
        object.position.copy(currentPosition)
      }

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
        if (isAnimatingRef.current) {
          const rotationProgress = Math.min(
            easeOutCubic((Date.now() - animationStartTimeRef.current) / animationDuration) * 1.3,
            1,
          )
          object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, originalRotation.x, rotationProgress)
          object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, originalRotation.y, rotationProgress)
          object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, originalRotation.z, rotationProgress)
        }

        angularVelocity.x *= 0.7
        angularVelocity.y *= 0.7
        angularVelocity.z *= 0.7
      }
    })

    if (isAnimatingRef.current) {
      const elapsed = Date.now() - animationStartTimeRef.current
      const duration = animationDuration
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      if (progress >= 1) {
        isAnimatingRef.current = false
      }
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

export function ModelViewer({ modelUrl, isExploded, onExplodeComplete }: ModelViewerProps) {
  const [lightPosition, setLightPosition] = useState(new THREE.Vector3(10, 10, 5))
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isThreeFingerRef = useRef(false)
  const [selectedPart, setSelectedPart] = useState("")

  useEffect(() => {
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

    window.addEventListener("touchstart", handleTouchStart, { passive: false })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        style={{ background: "#000000" }}
      >
        <Environment preset="studio" />
        <ambientLight intensity={0.3} />
        <directionalLight
          ref={lightRef}
          position={[lightPosition.x, lightPosition.y, lightPosition.z]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={1} castShadow />

        <Suspense fallback={<LoadingFallback />}>
          <Model
            url={modelUrl}
            isExploded={isExploded}
            selectedPart={selectedPart}
            onPartSelect={setSelectedPart}
            onExplodeComplete={onExplodeComplete}
            lightPosition={lightPosition}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
    </div>
  )
}
