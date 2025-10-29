"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { EffectComposer, DepthOfField, Bloom, SSAO } from "@react-three/postprocessing"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  isExploded: boolean
  chairIndex: number
  theme: "light" | "dark"
  performanceMode?: boolean
  onToggleExplode?: () => void // Added callback for explode toggle
}

interface ModelProps {
  url: string
  isExploded: boolean
  lightPosition: THREE.Vector3
  opacity?: number
  chairIndex: number // Added chairIndex prop
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
  mass: number
  momentOfInertia: number
  lastDragPosition: THREE.Vector3
  dragVelocityHistory: THREE.Vector3[]
}

function Model({ url, isExploded, lightPosition, opacity = 1, chairIndex }: ModelProps) {
  const { scene } = useGLTF(url)
  const [isLoaded, setIsLoaded] = useState(false)
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
    if (groupRef.current) {
      const rotationDegrees = chairIndex * 1.4
      const rotationRadians = (rotationDegrees * Math.PI) / 180
      groupRef.current.rotation.y = rotationRadians
    }
  }, [chairIndex])

  useEffect(() => {
    if (!scene) return

    setIsLoaded(true)

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const minY = box.min.y
    const size = box.getSize(new THREE.Vector3())
    scene.position.y = -minY

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

          const volume = size.x * size.y * size.z
          const mass = Math.max(0.5, volume * 10)
          const momentOfInertia = mass * (collisionRadius * collisionRadius)

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
            mass,
            momentOfInertia,
            lastDragPosition: new THREE.Vector3(),
            dragVelocityHistory: [],
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

        const volume = size.x * size.y * size.z
        const mass = Math.max(0.5, volume * 10)
        const momentOfInertia = mass * (collisionRadius * collisionRadius)

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
          mass,
          momentOfInertia,
          lastDragPosition: new THREE.Vector3(),
          dragVelocityHistory: [],
        })
      }

      obj.children.forEach((child) => findParts(child, depth + 1))
    }

    findParts(scene)
    setParts(explodableParts)

    hasExplodedRef.current = false
    isAnimatingRef.current = false
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
        const currentVelocity = targetPosition.clone().sub(part.object.position)
        part.dragVelocityHistory.push(currentVelocity.clone())

        if (part.dragVelocityHistory.length > 5) {
          part.dragVelocityHistory.shift()
        }

        part.object.position.copy(targetPosition)
        part.currentPosition.copy(targetPosition)

        const movementDelta = intersectionPoint.clone().sub(previousDragPositionRef.current)

        if (movementDelta.length() > 0.001) {
          const leverArm = part.grabOffset.clone()
          const force = movementDelta.clone().multiplyScalar(part.mass * 50)
          const torque = new THREE.Vector3().crossVectors(leverArm, force)
          const angularAcceleration = torque.divideScalar(part.momentOfInertia)

          part.angularVelocity.x += angularAcceleration.x * 0.1
          part.angularVelocity.y += angularAcceleration.y * 0.1
          part.angularVelocity.z += angularAcceleration.z * 0.1
        }

        part.lastDragPosition.copy(intersectionPoint)
        previousDragPositionRef.current.copy(intersectionPoint)
      }
    }

    const handlePointerUp = () => {
      if (draggedPartRef.current) {
        const part = draggedPartRef.current

        if (part.dragVelocityHistory.length > 0) {
          const avgVelocity = new THREE.Vector3()
          part.dragVelocityHistory.forEach((v) => avgVelocity.add(v))
          avgVelocity.divideScalar(part.dragVelocityHistory.length)
          part.velocity.copy(avgVelocity.multiplyScalar(25 / part.mass))
        }

        part.dragVelocityHistory = []
        part.isDragging = false
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

        const airResistance = 0.98 - velocity.length() * 0.01
        velocity.multiplyScalar(Math.max(0.85, airResistance))

        object.rotation.x += angularVelocity.x * delta
        object.rotation.y += angularVelocity.y * delta
        object.rotation.z += angularVelocity.z * delta

        const angularDrag = 0.96
        angularVelocity.x *= angularDrag
        angularVelocity.y *= angularDrag
        angularVelocity.z *= angularDrag

        const targetPosition = isExploded ? explodedPosition : originalPosition
        const returnForce = targetPosition.clone().sub(currentPosition).multiplyScalar(0.05)
        velocity.add(returnForce)

        if (isExploded) {
          partsRef.current.forEach((otherPart) => {
            if (otherPart === part || otherPart.isDragging) return

            const distance = currentPosition.distanceTo(otherPart.currentPosition)
            const minDistance = part.collisionRadius + otherPart.collisionRadius

            if (distance < minDistance && distance > 0) {
              const pushDirection = currentPosition.clone().sub(otherPart.currentPosition).normalize()
              const overlap = minDistance - distance
              const pushForce = pushDirection.multiplyScalar(overlap * 0.5)

              velocity.add(pushForce)
            }
          })
        }

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

  if (!isLoaded) return null

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function LoadingFallback() {
  return null
}

type LightingPreset = "gallery" | "golden-hour" | "nordic" | "spotlight"

type MaterialPreset = "default" | "matte" | "glossy" | "metallic" | "wood" | "fabric"

const MATERIAL_PRESETS = {
  default: {
    name: "Default",
    roughness: null, // Keep original
    metalness: null, // Keep original
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
  matte: {
    name: "Matte",
    roughness: 0.9,
    metalness: 0.0,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
  glossy: {
    name: "Glossy",
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  },
  metallic: {
    name: "Metallic",
    roughness: 0.3,
    metalness: 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  },
  wood: {
    name: "Wood",
    roughness: 0.7,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  },
  fabric: {
    name: "Fabric",
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
}

const BACKGROUNDS = [
  {
    name: "Default",
    gradient: null, // Will use theme-based color
    sceneColor: null, // Will use theme-based color
  },
  {
    name: "Warm Studio",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    sceneColor: "#fdd4b8",
  },
  {
    name: "Cool Twilight",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    sceneColor: "#cbe2e9",
  },
  {
    name: "Professional Gray",
    gradient: "linear-gradient(135deg, #e0e0e0 0%, #c9c9c9 100%)",
    sceneColor: "#d4d4d4",
  },
  {
    name: "Soft Beige",
    gradient: "linear-gradient(135deg, #f5f5dc 0%, #e8dcc4 100%)",
    sceneColor: "#eee9d0",
  },
  {
    name: "Sage Green",
    gradient: "linear-gradient(135deg, #d4e7d7 0%, #b8d4bb 100%)",
    sceneColor: "#c6ddc9",
  },
]

const LIGHTING_PRESETS = {
  gallery: {
    name: "Gallery",
    ambientIntensity: 0.2,
    mainLight: { basePosition: [12, 15, 8], intensity: 2.8, color: "#ffffff" },
    fillLight: { basePosition: [-8, 8, -6], intensity: 0.6, color: "#f0f0ff" },
    spotLight: { basePosition: [0, 18, 0], intensity: 2.5, color: "#ffffff", angle: 0.4 },
    rimLight: { basePosition: [-15, 5, -10], intensity: 1.8, color: "#e8f4ff" },
  },
  "golden-hour": {
    name: "Golden Hour",
    ambientIntensity: 0.15,
    mainLight: { basePosition: [20, 8, 15], intensity: 3.5, color: "#ffb366" },
    fillLight: { basePosition: [-10, 3, -8], intensity: 0.4, color: "#6b8cff" },
    spotLight: { basePosition: [15, 12, 10], intensity: 1.8, color: "#ffd699", angle: 0.5 },
    rimLight: { basePosition: [-18, 6, -12], intensity: 2.2, color: "#ff9944" },
  },
  nordic: {
    name: "Nordic",
    ambientIntensity: 0.35,
    mainLight: { basePosition: [8, 20, 12], intensity: 2.2, color: "#e8f4ff" },
    fillLight: { basePosition: [-12, 10, -10], intensity: 0.8, color: "#ffffff" },
    spotLight: { basePosition: [0, 25, 0], intensity: 1.2, color: "#f0f8ff", angle: 0.6 },
    rimLight: { basePosition: [-10, 8, -15], intensity: 1.0, color: "#d4e8ff" },
  },
  spotlight: {
    name: "Spotlight",
    ambientIntensity: 0.05,
    mainLight: { basePosition: [2, 25, 3], intensity: 4.5, color: "#ffffff" },
    fillLight: { basePosition: [-15, 2, -12], intensity: 0.15, color: "#4466ff" },
    spotLight: { basePosition: [0, 30, 0], intensity: 5.0, color: "#ffffee", angle: 0.3 },
    rimLight: { basePosition: [-20, 8, -18], intensity: 2.5, color: "#ff6644" },
  },
}

function randomizeLightPosition(basePosition: number[]): [number, number, number] {
  const [x, y, z] = basePosition
  const randomOffset = () => (Math.random() - 0.5) * 6
  return [x + randomOffset(), y + randomOffset(), z + randomOffset()]
}

export function ModelViewer({
  modelUrl,
  isExploded,
  chairIndex,
  theme,
  performanceMode = false,
  onToggleExplode, // Added onToggleExplode prop
}: ModelViewerProps & { theme: "light" | "dark" }) {
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>("gallery")
  const [hasManualLightControl, setHasManualLightControl] = useState(false)
  const [showGround, setShowGround] = useState(true)
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const [wireframeMode, setWireframeMode] = useState(false)
  const [cameraFov, setCameraFov] = useState(50)
  const [bloomEnabled, setBloomEnabled] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [materialPreset, setMaterialPreset] = useState<MaterialPreset>("default")
  const [isOrthographic, setIsOrthographic] = useState(false)

  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.0)

  const [mainLightPos, setMainLightPos] = useState<[number, number, number]>([12, 15, 8])
  const [fillLightPos, setFillLightPos] = useState<[number, number, number]>([-8, 8, -6])
  const [spotLightPos, setSpotLightPos] = useState<[number, number, number]>([0, 18, 0])
  const [rimLightPos, setRimLightPos] = useState<[number, number, number]>([-15, 5, -10])

  const lightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)
  const spotLightRef = useRef<THREE.SpotLight>(null)
  const rimLightRef = useRef<THREE.DirectionalLight>(null)

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null)
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const defaultCameraPosition = useRef(new THREE.Vector3(2.75, 3, 2.75))
  const defaultCameraTarget = useRef(new THREE.Vector3(0, 0, 2))

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isThreeFingerRef = useRef(false)
  const isThreeFingerDraggingRef = useRef(false)

  const threeFingerTapCountRef = useRef(0)
  const threeFingerTapTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastThreeFingerTapTimeRef = useRef(0)

  const middleMouseDownRef = useRef(false)
  const middleMouseDraggingRef = useRef(false)
  const middleMouseStartRef = useRef<{ x: number; y: number } | null>(null)
  const middleMouseClickCountRef = useRef(0)
  const middleMouseClickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastMiddleMouseClickTimeRef = useRef(0)

  const shiftRightMouseDownRef = useRef(false)
  const shiftRightMouseStartRef = useRef<{ x: number; y: number; fov: number } | null>(null)

  const spaceKeyDownRef = useRef(false)
  const spaceRightMouseDownRef = useRef(false)
  const spaceRightMouseStartRef = useRef<{ x: number; y: number } | null>(null)

  const [displayedModelUrl, setDisplayedModelUrl] = useState(modelUrl)
  const [previousModelUrl, setPreviousModelUrl] = useState<string | null>(null)
  const [transitionProgress, setTransitionProgress] = useState(1)

  useEffect(() => {
    if (modelUrl !== displayedModelUrl) {
      setPreviousModelUrl(displayedModelUrl)
      setTransitionProgress(0)

      useGLTF.preload(modelUrl)

      const startTime = Date.now()
      const duration = 400

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        setTransitionProgress(progress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayedModelUrl(modelUrl)
          setPreviousModelUrl(null)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [modelUrl, displayedModelUrl])

  useEffect(() => {
    const handleThreeFingerTap = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        const now = Date.now()
        const timeSinceLastTap = now - lastThreeFingerTapTimeRef.current

        if (timeSinceLastTap < 300) {
          threeFingerTapCountRef.current++

          if (threeFingerTapCountRef.current === 2) {
            const presets: LightingPreset[] = ["gallery", "golden-hour", "nordic", "spotlight"]
            const currentIndex = presets.indexOf(lightingPreset)
            const nextIndex = (currentIndex + 1) % presets.length
            const nextPreset = presets[nextIndex]
            setLightingPreset(nextPreset)

            const preset = LIGHTING_PRESETS[nextPreset]
            setMainLightPos(randomizeLightPosition(preset.mainLight.basePosition))
            setFillLightPos(randomizeLightPosition(preset.fillLight.basePosition))
            setSpotLightPos(randomizeLightPosition(preset.spotLight.basePosition))
            setRimLightPos(randomizeLightPosition(preset.rimLight.basePosition))

            threeFingerTapCountRef.current = 0
          }

          if (threeFingerTapTimerRef.current) {
            clearTimeout(threeFingerTapTimerRef.current)
          }

          threeFingerTapTimerRef.current = setTimeout(() => {
            threeFingerTapCountRef.current = 0
          }, 300)
        } else {
          threeFingerTapCountRef.current = 1
        }

        lastThreeFingerTapTimeRef.current = now
        e.preventDefault()
      }
    }

    window.addEventListener("touchstart", handleThreeFingerTap, { passive: false })

    return () => {
      window.removeEventListener("touchstart", handleThreeFingerTap)
      if (threeFingerTapTimerRef.current) {
        clearTimeout(threeFingerTapTimerRef.current)
      }
    }
  }, [lightingPreset])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        isThreeFingerRef.current = true
        isThreeFingerDraggingRef.current = false
        const touch = e.touches[0]
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 3 && isThreeFingerRef.current && touchStartRef.current) {
        isThreeFingerDraggingRef.current = true

        const touch = e.touches[0]
        const deltaX = (touch.clientX - touchStartRef.current.x) * 0.05
        const deltaY = (touch.clientY - touchStartRef.current.y) * 0.05

        setMainLightPos((prev) => {
          const newPos: [number, number, number] = [prev[0] + deltaX, prev[1] - deltaY, prev[2]]
          return newPos
        })

        setHasManualLightControl(true)

        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 3) {
        isThreeFingerRef.current = false
        isThreeFingerDraggingRef.current = false
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

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 && spaceKeyDownRef.current) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        spaceRightMouseDownRef.current = true
        spaceRightMouseStartRef.current = { x: e.clientX, y: e.clientY }

        // Disable OrbitControls entirely
        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
        return // Exit early to prevent other handlers
      }
      // Shift + right-click for FOV control
      else if (e.button === 2 && e.shiftKey) {
        e.preventDefault()
        shiftRightMouseDownRef.current = true
        shiftRightMouseStartRef.current = { x: e.clientX, y: e.clientY, fov: cameraFov }
      }
      // Middle mouse button is button 1
      else if (e.button === 1) {
        e.preventDefault()
        middleMouseDownRef.current = true
        middleMouseDraggingRef.current = false
        middleMouseStartRef.current = { x: e.clientX, y: e.clientY }

        // Handle double-click for preset change
        const now = Date.now()
        const timeSinceLastClick = now - lastMiddleMouseClickTimeRef.current

        if (timeSinceLastClick < 300) {
          middleMouseClickCountRef.current++

          if (middleMouseClickCountRef.current === 2) {
            // Change lighting preset
            const presets: LightingPreset[] = ["gallery", "golden-hour", "nordic", "spotlight"]
            const currentIndex = presets.indexOf(lightingPreset)
            const nextIndex = (currentIndex + 1) % presets.length
            const nextPreset = presets[nextIndex]
            setLightingPreset(nextPreset)

            const preset = LIGHTING_PRESETS[nextPreset]
            setMainLightPos(randomizeLightPosition(preset.mainLight.basePosition))
            setFillLightPos(randomizeLightPosition(preset.fillLight.basePosition))
            setSpotLightPos(randomizeLightPosition(preset.spotLight.basePosition))
            setRimLightPos(randomizeLightPosition(preset.rimLight.basePosition))

            middleMouseClickCountRef.current = 0
          }

          if (middleMouseClickTimerRef.current) {
            clearTimeout(middleMouseClickTimerRef.current)
          }

          middleMouseClickTimerRef.current = setTimeout(() => {
            middleMouseClickCountRef.current = 0
          }, 300)
        } else {
          middleMouseClickCountRef.current = 1
        }

        lastMiddleMouseClickTimeRef.current = now
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (spaceRightMouseDownRef.current && spaceRightMouseStartRef.current) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        const deltaX = (e.clientX - spaceRightMouseStartRef.current.x) * 0.05
        const deltaY = (e.clientY - spaceRightMouseStartRef.current.y) * 0.05

        setMainLightPos((prev) => {
          const newPos: [number, number, number] = [prev[0] + deltaX, prev[1] - deltaY, prev[2]]
          return newPos
        })

        setHasManualLightControl(true)

        spaceRightMouseStartRef.current = { x: e.clientX, y: e.clientY }
        return // Exit early to prevent other handlers
      }
      // Handle shift + right-click drag for FOV
      else if (shiftRightMouseDownRef.current && shiftRightMouseStartRef.current) {
        e.preventDefault()
        const deltaY = (e.clientY - shiftRightMouseStartRef.current.y) * 0.1
        const newFov = Math.max(30, Math.min(90, shiftRightMouseStartRef.current.fov + deltaY))
        setCameraFov(newFov)
      }
      // Handle middle mouse drag for light control
      else if (middleMouseDownRef.current && middleMouseStartRef.current) {
        e.preventDefault()
        middleMouseDraggingRef.current = true

        const deltaX = (e.clientX - middleMouseStartRef.current.x) * 0.05
        const deltaY = (e.clientY - middleMouseStartRef.current.y) * 0.05

        setMainLightPos((prev) => {
          const newPos: [number, number, number] = [prev[0] + deltaX, prev[1] - deltaY, prev[2]]
          return newPos
        })

        setHasManualLightControl(true)

        middleMouseStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        if (spaceRightMouseDownRef.current) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          spaceRightMouseDownRef.current = false
          spaceRightMouseStartRef.current = null

          // Re-enable OrbitControls
          if (controlsRef.current) {
            controlsRef.current.enabled = true
          }
        }

        shiftRightMouseDownRef.current = false
        shiftRightMouseStartRef.current = null
      }
      if (e.button === 1) {
        middleMouseDownRef.current = false
        middleMouseDraggingRef.current = false
        middleMouseStartRef.current = null
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (spaceRightMouseDownRef.current || (spaceKeyDownRef.current && e.button === 2)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
      // Prevent context menu when shift + right-click is used
      if (shiftRightMouseDownRef.current || e.shiftKey) {
        e.preventDefault()
      }
      // Prevent context menu when middle mouse is used
      if (middleMouseDownRef.current || middleMouseDraggingRef.current) {
        e.preventDefault()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        spaceKeyDownRef.current = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceKeyDownRef.current = false

        if (spaceRightMouseDownRef.current) {
          spaceRightMouseDownRef.current = false
          spaceRightMouseStartRef.current = null

          if (controlsRef.current) {
            controlsRef.current.enabled = true
          }
        }
      }
    }

    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("mousemove", handleMouseMove, { capture: true })
    window.addEventListener("mouseup", handleMouseUp, { capture: true })
    window.addEventListener("contextmenu", handleContextMenu, { capture: true })
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true })
      window.removeEventListener("mousemove", handleMouseMove, { capture: true })
      window.removeEventListener("mouseup", handleMouseUp, { capture: true })
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true })
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (middleMouseClickTimerRef.current) {
        clearTimeout(middleMouseClickTimerRef.current)
      }
    }
  }, [lightingPreset, cameraFov])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault()
        const speed = Number.parseInt(e.key) * 0.2 // 1=0.2, 5=1.0, 9=1.8
        setAutoRotateSpeed(speed)
        // Enable auto-rotate if not already enabled
        if (!autoRotate) {
          setAutoRotate(true)
        }
      }
      // G key - Toggle ground visibility
      else if (e.key === "g" || e.key === "G") {
        e.preventDefault()
        setShowGround((prev) => !prev)
      }
      // E key - Cycle through lighting presets
      else if (e.key === "e" || e.key === "E") {
        e.preventDefault()
        const presets: LightingPreset[] = ["gallery", "golden-hour", "nordic", "spotlight"]
        const currentIndex = presets.indexOf(lightingPreset)
        const nextIndex = (currentIndex + 1) % presets.length
        const nextPreset = presets[nextIndex]
        setLightingPreset(nextPreset)

        const preset = LIGHTING_PRESETS[nextPreset]
        setMainLightPos(randomizeLightPosition(preset.mainLight.basePosition))
        setFillLightPos(randomizeLightPosition(preset.fillLight.basePosition))
        setSpotLightPos(randomizeLightPosition(preset.spotLight.basePosition))
        setRimLightPos(randomizeLightPosition(preset.rimLight.basePosition))
      }
      // B key - Cycle through backgrounds
      else if (e.key === "b" || e.key === "B") {
        e.preventDefault()
        setBackgroundIndex((prev) => (prev + 1) % BACKGROUNDS.length)
      }
      // N key - Randomize all light directions
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        const preset = LIGHTING_PRESETS[lightingPreset]
        setMainLightPos(randomizeLightPosition(preset.mainLight.basePosition))
        setFillLightPos(randomizeLightPosition(preset.fillLight.basePosition))
        setSpotLightPos(randomizeLightPosition(preset.spotLight.basePosition))
        setRimLightPos(randomizeLightPosition(preset.rimLight.basePosition))
        setHasManualLightControl(true)
      }
      // R key - Reset camera to default position
      else if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.copy(defaultCameraPosition.current)
          controlsRef.current.target.copy(defaultCameraTarget.current)
          controlsRef.current.update()
          setCameraFov(50)
        }
      }
      // F key - Focus/frame the model (auto-fit to view)
      else if (e.key === "f" || e.key === "F") {
        e.preventDefault()
        if (cameraRef.current && controlsRef.current) {
          const event = new CustomEvent("autoframe")
          window.dispatchEvent(event)
        }
      }
      // X key - Toggle wireframe mode
      else if (e.key === "x" || e.key === "X") {
        e.preventDefault()
        setWireframeMode((prev) => !prev)
      }
      // L key - Toggle bloom
      else if (e.key === "l" || e.key === "L") {
        e.preventDefault()
        setBloomEnabled((prev) => !prev)
      }
      // S key - Screenshot
      else if (e.key === "s" || e.key === "S") {
        e.preventDefault()
        if (glRef.current && cameraRef.current) {
          try {
            const gl = glRef.current
            const scene = gl.scene

            // Store original background
            const originalBackground = scene.background

            // Set transparent background
            scene.background = null

            // Render one frame with transparent background
            gl.render(scene, cameraRef.current)

            // Capture the canvas
            const canvas = gl.domElement
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `chair-${chairIndex}-${Date.now()}.png`
                link.click()
                URL.revokeObjectURL(url)
              }

              // Restore original background
              scene.background = originalBackground
              gl.render(scene, cameraRef.current!)
            }, "image/png")
          } catch (error) {
            console.error("[v0] Screenshot failed:", error)
          }
        }
      }
      // T key - Toggle auto-rotate
      else if (e.key === "t" || e.key === "T") {
        e.preventDefault()
        setAutoRotate((prev) => !prev)
      }
      // M key - Cycle material presets
      else if (e.key === "m" || e.key === "M") {
        e.preventDefault()
        const presets: MaterialPreset[] = ["default", "matte", "glossy", "metallic", "wood", "fabric"]
        const currentIndex = presets.indexOf(materialPreset)
        const nextIndex = (currentIndex + 1) % presets.length
        setMaterialPreset(presets[nextIndex])
      }
      // O key - Toggle orthographic camera
      else if (e.key === "o" || e.key === "O") {
        e.preventDefault()
        setIsOrthographic((prev) => !prev)
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        if (onToggleExplode) {
          onToggleExplode()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightingPreset, chairIndex, materialPreset, onToggleExplode, autoRotate, autoRotateSpeed])

  const currentPreset = LIGHTING_PRESETS[lightingPreset]
  const currentBackground = BACKGROUNDS[backgroundIndex]

  const isHighPerformanceDevice =
    typeof window !== "undefined" && (/iPad|Macintosh/.test(navigator.userAgent) || window.innerWidth >= 1024)

  const useEnhancedRendering = performanceMode && isHighPerformanceDevice

  const shadowMapSize = useEnhancedRendering ? 16384 : 1024
  const shadowBias = useEnhancedRendering ? -0.00002 : -0.001
  const shadowRadius = useEnhancedRendering ? 6 : 1

  const bgColor = theme === "light" ? "#ffffff" : "#000000"
  const sceneColor = theme === "light" ? "#ffffff" : "#000000"

  const backgroundStyle = currentBackground.gradient ? currentBackground.gradient : bgColor
  const sceneBackgroundColor = currentBackground.sceneColor ? currentBackground.sceneColor : sceneColor

  return (
    <div className="w-full h-full relative" style={{ background: backgroundStyle, transition: "background 0.5s ease" }}>
      <Canvas
        camera={
          isOrthographic
            ? {
                position: [2.75, 5, 2.75],
                zoom: 100,
                left: -10,
                right: 10,
                top: 10,
                bottom: -10,
                near: 0.1,
                far: 1000,
              }
            : { position: [2.75, 5, 2.75], fov: cameraFov }
        }
        orthographic={isOrthographic}
        gl={{
          antialias: true,
          alpha: true, // Changed from false to true to enable transparency support
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: useEnhancedRendering ? 1.8 : 1.2,
          powerPreference: useEnhancedRendering ? "high-performance" : "default",
          preserveDrawingBuffer: true, // Required for screenshots
        }}
        shadows={useEnhancedRendering ? "soft" : true}
        onCreated={({ camera, controls, gl, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera
          controlsRef.current = controls
          glRef.current = gl
          sceneRef.current = scene
        }}
      >
        <CameraController
          fov={cameraFov}
          wireframeMode={wireframeMode}
          modelUrl={displayedModelUrl}
          isOrthographic={isOrthographic}
        />

        <color attach="background" args={[sceneBackgroundColor]} />

        <ambientLight
          intensity={useEnhancedRendering ? currentPreset.ambientIntensity * 1.3 : currentPreset.ambientIntensity}
        />

        <directionalLight
          ref={lightRef}
          position={mainLightPos}
          intensity={useEnhancedRendering ? currentPreset.mainLight.intensity * 1.5 : currentPreset.mainLight.intensity}
          color={currentPreset.mainLight.color}
          castShadow
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
          shadow-camera-far={60}
          shadow-camera-near={0.1}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={shadowBias}
          shadow-normalBias={useEnhancedRendering ? 0.015 : 0.05}
          shadow-radius={shadowRadius}
        />

        <directionalLight
          ref={fillLightRef}
          position={fillLightPos}
          intensity={useEnhancedRendering ? currentPreset.fillLight.intensity * 1.4 : currentPreset.fillLight.intensity}
          color={currentPreset.fillLight.color}
          castShadow={useEnhancedRendering}
          shadow-mapSize-width={useEnhancedRendering ? 8192 : 1024}
          shadow-mapSize-height={useEnhancedRendering ? 8192 : 1024}
          shadow-bias={shadowBias}
          shadow-radius={shadowRadius}
        />

        <spotLight
          ref={spotLightRef}
          position={spotLightPos}
          intensity={useEnhancedRendering ? currentPreset.spotLight.intensity * 1.8 : currentPreset.spotLight.intensity}
          color={currentPreset.spotLight.color}
          angle={currentPreset.spotLight.angle}
          penumbra={0.8}
          castShadow={useEnhancedRendering}
          shadow-mapSize-width={useEnhancedRendering ? 8192 : 1024}
          shadow-mapSize-height={useEnhancedRendering ? 8192 : 1024}
          shadow-bias={shadowBias}
          shadow-radius={shadowRadius}
        />

        <directionalLight
          ref={rimLightRef}
          position={rimLightPos}
          intensity={useEnhancedRendering ? currentPreset.rimLight.intensity * 1.6 : currentPreset.rimLight.intensity}
          color={currentPreset.rimLight.color}
          castShadow={false}
        />

        {showGround && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial
              opacity={useEnhancedRendering ? (theme === "light" ? 0.5 : 0.7) : theme === "light" ? 0.3 : 0.5}
              transparent
            />
          </mesh>
        )}

        <Suspense fallback={null}>
          {previousModelUrl && (
            <ModelWithWireframe
              key={previousModelUrl}
              url={previousModelUrl}
              isExploded={isExploded}
              lightPosition={new THREE.Vector3(...mainLightPos)}
              opacity={1 - transitionProgress}
              wireframeMode={wireframeMode}
              materialPreset={materialPreset}
              chairIndex={chairIndex} // Pass chairIndex to ModelWithWireframe
            />
          )}
          <ModelWithWireframe
            key={displayedModelUrl}
            url={displayedModelUrl}
            isExploded={isExploded}
            lightPosition={new THREE.Vector3(...mainLightPos)}
            opacity={transitionProgress}
            wireframeMode={wireframeMode}
            materialPreset={materialPreset}
            chairIndex={chairIndex} // Pass chairIndex to ModelWithWireframe
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={15}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: undefined, // Disable right-click panning
          }}
        />

        {useEnhancedRendering && (
          <EffectComposer>
            <DepthOfField focusDistance={0.015} focalLength={0.08} bokehScale={4} height={720} />
            <SSAO samples={64} radius={0.08} intensity={50} luminanceInfluence={0.5} color="black" />
            {bloomEnabled && <Bloom intensity={0.5} luminanceThreshold={0.85} luminanceSmoothing={0.95} />}
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}

function CameraController({
  fov,
  wireframeMode,
  modelUrl,
  isOrthographic,
}: {
  fov: number
  wireframeMode: boolean
  modelUrl: string
  isOrthographic: boolean
}) {
  const { camera, scene, controls, size } = useThree()

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera && !isOrthographic) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  }, [fov, camera, isOrthographic])

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera && isOrthographic) {
      const aspect = size.width / size.height
      const zoom = camera.zoom
      const height = 10 / zoom
      const width = height * aspect

      camera.left = -width
      camera.right = width
      camera.top = height
      camera.bottom = -height
      camera.updateProjectionMatrix()
    }
  }, [camera, size, isOrthographic])

  useEffect(() => {
    const handleAutoFrame = () => {
      const box = new THREE.Box3()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          box.expandByObject(obj)
        }
      })

      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)

        if (camera instanceof THREE.PerspectiveCamera) {
          const fovRad = camera.fov * (Math.PI / 180)
          const cameraDistance = Math.abs(maxDim / Math.sin(fovRad / 2)) * 1.5

          const direction = camera.position.clone().sub(center).normalize()
          camera.position.copy(center).add(direction.multiplyScalar(cameraDistance))
        } else if (camera instanceof THREE.OrthographicCamera) {
          // For orthographic, adjust zoom instead of distance
          camera.zoom = 10 / maxDim
          camera.updateProjectionMatrix()
        }

        if (controls) {
          ;(controls as any).target.copy(center)
          ;(controls as any).update()
        }
      }
    }

    window.addEventListener("autoframe", handleAutoFrame)
    return () => window.removeEventListener("autoframe", handleAutoFrame)
  }, [camera, scene, controls])

  return null
}

function ModelWithWireframe({
  url,
  isExploded,
  lightPosition,
  opacity,
  wireframeMode,
  materialPreset,
  chairIndex, // Added chairIndex prop
}: ModelProps & { wireframeMode: boolean; materialPreset: MaterialPreset }) {
  const { scene } = useGLTF(url)
  const originalMaterialsRef = useRef<Map<THREE.Material, { roughness: number; metalness: number }>>(new Map())

  useEffect(() => {
    if (!scene) return // Ensure scene is loaded before traversing

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]

        materials.forEach((mat) => {
          if (mat && mat instanceof THREE.MeshStandardMaterial) {
            // Store original properties on first encounter
            if (!originalMaterialsRef.current.has(mat)) {
              originalMaterialsRef.current.set(mat, {
                roughness: mat.roughness,
                metalness: mat.metalness,
              })
            }

            mat.wireframe = wireframeMode

            // Apply material preset
            const preset = MATERIAL_PRESETS[materialPreset]
            if (preset.roughness !== null) {
              mat.roughness = preset.roughness
            } else {
              // Restore original
              const original = originalMaterialsRef.current.get(mat)
              if (original) {
                mat.roughness = original.roughness
              }
            }

            if (preset.metalness !== null) {
              mat.metalness = preset.metalness
            } else {
              // Restore original
              const original = originalMaterialsRef.current.get(mat)
              if (original) {
                mat.metalness = original.metalness
              }
            }

            mat.clearcoat = preset.clearcoat
            mat.clearcoatRoughness = preset.clearcoatRoughness
            mat.needsUpdate = true
          }
        })
      }
    })
  }, [scene, wireframeMode, materialPreset]) // Depend on scene, wireframeMode and materialPreset

  // Pass the opacity and chairIndex props to the underlying Model component
  return (
    <Model url={url} isExploded={isExploded} lightPosition={lightPosition} opacity={opacity} chairIndex={chairIndex} />
  )
}
