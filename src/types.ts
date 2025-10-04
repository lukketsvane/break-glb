import * as THREE from "three"

// ============================================================================
// Animation Presets
// ============================================================================

export type AnimationPreset = "gentle" | "normal" | "energetic" | "dramatic" | "custom"

export interface AnimationConfig {
  distance: number
  speed: number
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce"
  staggerDelay?: number
}

export const ANIMATION_PRESETS: Record<AnimationPreset, Partial<AnimationConfig>> = {
  gentle: {
    distance: 1.0,
    speed: 1200,
    easing: "easeOut",
    staggerDelay: 20,
  },
  normal: {
    distance: 1.5,
    speed: 800,
    easing: "easeInOut",
    staggerDelay: 15,
  },
  energetic: {
    distance: 2.5,
    speed: 600,
    easing: "easeOut",
    staggerDelay: 10,
  },
  dramatic: {
    distance: 3.5,
    speed: 1500,
    easing: "bounce",
    staggerDelay: 30,
  },
  custom: {},
}

// ============================================================================
// Material & Visual Options
// ============================================================================

export interface MaterialOptions {
  metalness?: number
  roughness?: number
  wireframe?: boolean
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}

export interface VisualOptions {
  backgroundColor?: string
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby"
  gridHelper?: boolean
  axesHelper?: boolean
  stats?: boolean
}

// ============================================================================
// Component Props
// ============================================================================

export interface BreakGLBProps {
  // Model Source
  modelUrl?: string

  // Visual Customization
  backgroundColor?: string
  environmentPreset?: VisualOptions["environmentPreset"]
  ambientLightIntensity?: number
  directionalLightIntensity?: number
  shadowsEnabled?: boolean
  cameraFov?: number
  cameraPosition?: [number, number, number]

  // Material Customization
  materialOptions?: MaterialOptions
  highlightColor?: string
  selectedPartColor?: string

  // Debug Helpers
  gridHelper?: boolean
  axesHelper?: boolean

  // Animation
  animationPreset?: AnimationPreset
  explosionDistance?: number
  explosionSpeed?: number
  animationEasing?: AnimationConfig["easing"]
  staggerDelay?: number

  // Behavior Toggles
  showUploadUI?: boolean
  showControls?: boolean
  showLoadingProgress?: boolean
  autoExplode?: boolean
  enablePartSelection?: boolean
  enableLightControl?: boolean
  enablePartDragging?: boolean

  // Camera Controls
  enableRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  minDistance?: number
  maxDistance?: number
  autoRotate?: boolean
  autoRotateSpeed?: number

  // Interaction
  doubleClickToExplode?: boolean
  hoverHighlight?: boolean

  // Lifecycle Callbacks
  onLoad?: (model: THREE.Group, parts: ModelPart[]) => void
  onLoadError?: (error: Error) => void
  onLoadProgress?: (progress: number) => void
  onExplode?: () => void
  onAssemble?: () => void
  onPartSelect?: (part: ModelPart | null) => void
  onPartHover?: (part: ModelPart | null) => void

  // Style Overrides
  className?: string
  containerStyle?: React.CSSProperties

  // Advanced
  maxPixelRatio?: number
  antialias?: boolean
}

// ============================================================================
// Model Part Interface
// ============================================================================

export interface ModelPart {
  id: string
  name: string
  object: THREE.Object3D
  originalPosition: THREE.Vector3
  originalRotation: THREE.Euler
  boundingBox: THREE.Box3
  center: THREE.Vector3
  metadata?: Record<string, any>
}

// ============================================================================
// Control API
// ============================================================================

export interface BreakGLBRef {
  explode: () => void
  assemble: () => void
  toggleExplode: () => void
  selectPart: (partId: string | null) => void
  resetCamera: () => void
  focusPart: (partId: string) => void
  getModel: () => THREE.Group | null
  getParts: () => ModelPart[]
  isExploded: () => boolean
  exportSnapshot: () => Promise<string>
}

// ============================================================================
// Internal Types
// ============================================================================

export interface Part {
  object: THREE.Object3D
  originalPosition: THREE.Vector3
  explodedPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity: THREE.Vector3
  angularVelocity: THREE.Euler
  originalRotation: THREE.Euler
  name: string
  id: string
  center: THREE.Vector3
  floatOffset: number
  rotationSpeed: number
  bobSpeed: number
  boundingBox: THREE.Box3
  collisionRadius: number
  isDragging: boolean
  collisionMesh: THREE.Mesh | null
  grabOffset: THREE.Vector3
  staggerDelay: number
}

export interface ModelProps {
  url: string
  isExploded: boolean
  selectedPart: string | null
  onPartSelect: (partName: string | null) => void
  onPartHover?: (partName: string | null) => void
  onExplodeComplete?: () => void
  onModelLoad?: (model: THREE.Group, parts: ModelPart[]) => void
  lightPosition: THREE.Vector3
  explosionDistance: number
  staggerDelay: number
  enablePartSelection: boolean
  enablePartDragging: boolean
  hoverHighlight: boolean
  materialOptions?: MaterialOptions
  highlightColor: string
  selectedPartColor: string
}
