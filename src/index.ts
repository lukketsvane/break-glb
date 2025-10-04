// Main component export
export { BreakGLB } from "./main"
export { default } from "./main"

// Type exports
export type {
  BreakGLBProps,
  BreakGLBRef,
  ModelPart,
  AnimationPreset,
  AnimationConfig,
  MaterialOptions,
  VisualOptions,
} from "./types"

// Hook exports
export {
  useBreakGLB,
  useModelControls,
  useKeyboardShortcuts,
  useFileUpload,
  useAnimationFrame,
  useLocalStorage,
} from "./hooks"

// Utility exports
export {
  easingFunctions,
  generateUniqueId,
  clamp,
  lerp,
  validateProps,
  hexToRgb,
  rgbToHex,
  validateGLBFile,
  PerformanceMonitor,
  storage,
} from "./utils"

// Component exports (for advanced usage)
export { LoadingFallback, ErrorDisplay, UploadZone, ControlPanel } from "./components"

// Constants
export { ANIMATION_PRESETS } from "./types"
