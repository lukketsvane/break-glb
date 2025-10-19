"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  isExploded: boolean
}

interface ModelProps {
  url: string
  isExploded: boolean
  lightPosition: THREE.Vector3
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

function Model({ url, isExploded, lightPosition }: ModelProps) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const [parts, setParts] = useState<Part[]>([])
  const { camera, controls, gl } = useThree()
  const hasExplodedRef = useRef(false)

  const animationStartTimeRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)
  const previousIsExplodedRef = useRef(isExploded)

  const draggedPartRef = useRef<Part | null>(null)
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane())
  const pointerDownRef = useRef(false)
  const previousDragPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())

  const partsRef = useRef<Part[]>([])
  const isExplodedRef = useRef(isExploded)

  useEffect(() => {
    partsRef.current = parts
  }, [parts])

  useEffect(() => {
    isExplodedRef.current = isExploded
  }, [isExploded])

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
    if (previousIsExplodedRef.current !== isExploded) {
      animationStartTimeRef.current = Date.now()
      isAnimatingRef.current = true
      previousIsExplodedRef.current = isExploded
    }
  }, [isExploded])

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }

  useEffect(() => {
    const canvas = gl.domElement

    const handlePointerDown = (event: PointerEvent) => {
      if (!isExplodedRef.current || partsRef.current.length === 0) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      const allObjects: THREE.Object3D[] = []
      partsRef.current.forEach((part) => {
        part.object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allObjects.push(child)
          }
        })
      })

      const intersects = raycaster.intersectObjects(allObjects, false)

      if (intersects.length > 0) {
        event.stopPropagation()
        event.preventDefault()

        pointerDownRef.current = true

        const intersectedObject = intersects[0].object

        let hitPart: Part | null = null
        for (const part of partsRef.current) {
          let current: THREE.Object3D | null = intersectedObject
          while (current) {
            if (current === part.object) {
              hitPart = part
              break
            }
            current = current.parent
          }
          if (hitPart) break
        }

        if (hitPart) {
          draggedPartRef.current = hitPart
          hitPart.isDragging = true

          const intersectionPoint = intersects[0].point
          hitPart.grabOffset.copy(intersectionPoint).sub(hitPart.object.position)

          const normal = new THREE.Vector3(0, 0, 1)
          normal.applyQuaternion(camera.quaternion)
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, intersectionPoint)

          previousDragPositionRef.current.copy(intersectionPoint)

          if (controls) {
            ;(controls as any).enabled = false
          }
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!draggedPartRef.current || !pointerDownRef.current) return

      event.stopPropagation()
      event.preventDefault()

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      const intersectionPoint = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, intersectionPoint)) {
        const part = draggedPartRef.current

        const targetPosition = intersectionPoint.clone().sub(part.grabOffset)
        const delta = targetPosition.clone().sub(part.object.position)

        part.velocity.copy(delta).multiplyScalar(20)

        part.object.position.copy(targetPosition)
        part.currentPosition.copy(targetPosition)

        const movementDelta = intersectionPoint.clone().sub(previousDragPositionRef.current)
        if (movementDelta.length() > 0.001) {
          part.angularVelocity.x += movementDelta.y * 2
          part.angularVelocity.y += movementDelta.x * 2
          part.angularVelocity.z += (movementDelta.x + movementDelta.y) * 0.5
        }

        previousDragPositionRef.current.copy(intersectionPoint)
      }
    }

    const handlePointerUp = () => {
      if (draggedPartRef.current) {
        draggedPartRef.current.isDragging = false
        draggedPartRef.current = null
      }

      pointerDownRef.current = false

      if (controls) {
        ;(controls as any).enabled = true
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown, { capture: true })
    canvas.addEventListener("pointermove", handlePointerMove, { capture: true })
    canvas.addEventListener("pointerup", handlePointerUp, { capture: true })
    canvas.addEventListener("pointerleave", handlePointerUp, { capture: true })

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown, { capture: true })
      canvas.removeEventListener("pointermove", handlePointerMove, { capture: true })
      canvas.removeEventListener("pointerup", handlePointerUp, { capture: true })
      canvas.removeEventListener("pointerleave", handlePointerUp, { capture: true })
    }
  }, [gl.domElement, camera, controls])

  useFrame((state, delta) => {
    if (!groupRef.current || parts.length === 0) return

    const animationDuration = 900
    let animationProgress = 1

    if (isAnimatingRef.current) {
      const elapsed = Date.now() - animationStartTimeRef.current
      animationProgress = Math.min(elapsed / animationDuration, 1)

      if (animationProgress >= 1) {
        isAnimatingRef.current = false
        if (isExploded && !hasExplodedRef.current) {
          hasExplodedRef.current = true
        } else if (!isExploded) {
          hasExplodedRef.current = false
        }
      }
    }

    const easedProgress = easeOutQuart(animationProgress)

    parts.forEach((part) => {
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
        currentPosition.lerpVectors(isExploded ? originalPosition : explodedPosition, targetPosition, easedProgress)
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
          object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, originalRotation.x, easedProgress)
          object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, originalRotation.y, easedProgress)
          object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, originalRotation.z, easedProgress)
        }

        angularVelocity.x *= 0.7
        angularVelocity.y *= 0.7
        angularVelocity.z *= 0.7
      }
    })
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

export function ModelViewer({ modelUrl, isExploded }: ModelViewerProps) {
  const [lightPosition, setLightPosition] = useState(new THREE.Vector3(10, 10, 5))
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isThreeFingerRef = useRef(false)

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
          <Model url={modelUrl} isExploded={isExploded} lightPosition={lightPosition} />
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
