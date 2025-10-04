# 🔥 break-glb

### Professional 3D Model Exploder for React

[![NPM Version](https://img.shields.io/npm/v/break-glb?style=flat-square)](https://www.npmjs.com/package/break-glb)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/break-glb?style=flat-square)](https://bundlephobia.com/package/break-glb)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/break-glb?style=flat-square)](https://opensource.org/licenses/MIT)

**Transform your 3D models into interactive exploded views with physics-based animations**

A professional-grade React component for rendering GLB/GLTF 3D models with stunning exploded view animations, intelligent part selection, and comprehensive interaction controls. Built on Three.js and optimized for both desktop and mobile.

---

## ✨ Features

- 💥 **Physics-Based Explosions** - Realistic part separation with collision detection
- 🎯 **Smart Part Selection** - Click to focus, drag to reposition
- 🎨 **Fully Customizable** - 40+ props for complete visual control
- 🎬 **Animation Presets** - Gentle, Normal, Energetic, Dramatic modes
- 📱 **Touch Optimized** - Multi-touch gestures for mobile
- 💡 **Dynamic Lighting** - Interactive light positioning
- ⚡ **Performance First** - Optimized rendering loop, tree-shakeable
- 🎭 **Material Control** - Metalness, roughness, wireframe, opacity
- 🌍 **Environment Maps** - 10 preset lighting environments
- 🔌 **Lifecycle Hooks** - Comprehensive event system
- 📦 **Zero Config** - Works perfectly out of the box
- 🎓 **TypeScript** - Full type definitions included

---

## 📦 Installation

```bash
npm install break-glb three @react-three/fiber @react-three/drei
```

```bash
yarn add break-glb three @react-three/fiber @react-three/drei
```

```bash
pnpm add break-glb three @react-three/fiber @react-three/drei
```

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return <BreakGLB />
}
```

That's it! Upload a GLB file and start exploring.

### Pre-loaded Model

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return <BreakGLB modelUrl="/models/engine.glb" />
}
```

### With Animation Preset

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return (
    <BreakGLB
      modelUrl="/models/robot.glb"
      animationPreset="dramatic"
      autoExplode
    />
  )
}
```

---

## 🎮 Controls

### Desktop
- **Left Click + Drag** → Rotate model
- **Right Click + Drag** → Adjust light position
- **Scroll Wheel** → Zoom in/out
- **Click Part** → Focus on part (when exploded)
- **Hold + Drag Part** → Move individual part

### Mobile/Touch
- **1 Finger Drag** → Rotate model
- **2 Finger Pinch** → Zoom
- **3 Finger Drag** → Adjust light position
- **Tap Part** → Focus on part (when exploded)
- **Hold + Drag Part** → Move individual part

---

## 📖 API Reference

### Component Props

#### Model Source
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelUrl` | `string` | `undefined` | URL or path to GLB file |

#### Animation Presets
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animationPreset` | `"gentle"` \| `"normal"` \| `"energetic"` \| `"dramatic"` \| `"custom"` | `"normal"` | Pre-configured animation style |
| `explosionDistance` | `number` | `1.5` | How far parts separate |
| `explosionSpeed` | `number` | `800` | Animation duration (ms) |
| `animationEasing` | `"linear"` \| `"easeIn"` \| `"easeOut"` \| `"easeInOut"` \| `"bounce"` | `"easeInOut"` | Easing function |
| `staggerDelay` | `number` | `15` | Delay between parts (ms) |

#### Visual Customization
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `"#000000"` | Scene background |
| `environmentPreset` | `string` | `"studio"` | Lighting environment |
| `ambientLightIntensity` | `number` | `0.3` | Ambient light |
| `directionalLightIntensity` | `number` | `1.2` | Directional light |
| `shadowsEnabled` | `boolean` | `true` | Enable shadows |
| `cameraFov` | `number` | `50` | Camera field of view |
| `cameraPosition` | `[number, number, number]` | `[5, 5, 5]` | Initial camera position |

#### Material Options
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `materialOptions` | `MaterialOptions` | `{}` | Material overrides |
| `highlightColor` | `string` | `"#ffffff"` | Hover highlight color |
| `selectedPartColor` | `string` | `"#00ff00"` | Selection color |

#### Behavior
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showUploadUI` | `boolean` | `true` | Show upload interface |
| `showControls` | `boolean` | `true` | Show control buttons |
| `showLoadingProgress` | `boolean` | `true` | Show loading bar |
| `autoExplode` | `boolean` | `false` | Auto-explode on load |
| `enablePartSelection` | `boolean` | `true` | Enable clicking parts |
| `enablePartDragging` | `boolean` | `true` | Enable dragging parts |
| `enableLightControl` | `boolean` | `true` | Enable light adjustment |
| `doubleClickToExplode` | `boolean` | `false` | Double-click to explode |
| `hoverHighlight` | `boolean` | `true` | Highlight on hover |

#### Camera Controls
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableRotate` | `boolean` | `true` | Enable rotation |
| `enableZoom` | `boolean` | `true` | Enable zoom |
| `enablePan` | `boolean` | `true` | Enable panning |
| `minDistance` | `number` | `2` | Min zoom distance |
| `maxDistance` | `number` | `20` | Max zoom distance |
| `autoRotate` | `boolean` | `false` | Auto-rotate model |
| `autoRotateSpeed` | `number` | `1` | Rotation speed |

#### Debug
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gridHelper` | `boolean` | `false` | Show grid |
| `axesHelper` | `boolean` | `false` | Show axes |

#### Lifecycle Callbacks
| Prop | Type | Description |
|------|------|-------------|
| `onLoad` | `(model: THREE.Group, parts: ModelPart[]) => void` | Model loaded |
| `onLoadError` | `(error: Error) => void` | Load error |
| `onLoadProgress` | `(progress: number) => void` | Loading progress |
| `onExplode` | `() => void` | Exploded |
| `onAssemble` | `() => void` | Assembled |
| `onPartSelect` | `(part: ModelPart \| null) => void` | Part selected |
| `onPartHover` | `(part: ModelPart \| null) => void` | Part hovered |

#### Styling
| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class |
| `containerStyle` | `React.CSSProperties` | Inline styles |

---

## 🎨 Animation Presets

### Gentle
```tsx
<BreakGLB animationPreset="gentle" />
```
- Distance: 1.0
- Speed: 1200ms
- Easing: easeOut
- Perfect for: Product showcases, detailed views

### Normal (Default)
```tsx
<BreakGLB animationPreset="normal" />
```
- Distance: 1.5
- Speed: 800ms
- Easing: easeInOut
- Perfect for: General use, balanced feel

### Energetic
```tsx
<BreakGLB animationPreset="energetic" />
```
- Distance: 2.5
- Speed: 600ms
- Easing: easeOut
- Perfect for: Dynamic presentations, sports equipment

### Dramatic
```tsx
<BreakGLB animationPreset="dramatic" />
```
- Distance: 3.5
- Speed: 1500ms
- Easing: bounce
- Perfect for: Hero sections, attention-grabbing

---

## 🔌 Utility Hooks

### useBreakGLB

State management hook for BreakGLB:

```tsx
import { useBreakGLB } from 'break-glb/hooks'

function MyComponent() {
  const {
    isExploded,
    selectedPart,
    isLoading,
    error,
    explode,
    assemble,
    toggleExplode,
    selectPart,
  } = useBreakGLB()

  return (
    <div>
      <button onClick={toggleExplode}>
        {isExploded ? 'Assemble' : 'Explode'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

### useKeyboardShortcuts

Add keyboard controls:

```tsx
import { useKeyboardShortcuts } from 'break-glb/hooks'

function MyComponent() {
  useKeyboardShortcuts(
    { toggle: 'e', resetCamera: 'r' },
    {
      onToggle: () => console.log('Toggled!'),
      onResetCamera: () => console.log('Camera reset!'),
    }
  )

  return <BreakGLB />
}
```

### useFileUpload

File upload with validation:

```tsx
import { useFileUpload } from 'break-glb/hooks'

function MyComponent() {
  const { isDragging, handleDrop, handleFileSelect } = useFileUpload(
    (file) => console.log('File:', file),
    { maxSize: 50 * 1024 * 1024 } // 50MB
  )

  return (
    <div onDrop={handleDrop}>
      {isDragging ? 'Drop it!' : 'Drag GLB here'}
    </div>
  )
}
```

---

## 🛠️ Utility Functions

```tsx
import {
  easingFunctions,
  validateGLBFile,
  validateProps,
  hexToRgb,
} from 'break-glb/utils'

// Validate file before upload
const validation = validateGLBFile(file)
if (!validation.valid) {
  console.error(validation.error)
}

// Use easing functions
const eased = easingFunctions.easeInOut(0.5)

// Validate component props
const { valid, warnings } = validateProps({
  explosionDistance: 2.0,
  explosionSpeed: 500,
})
```

---

## 📚 Complete Examples

### Example 1: Product Showcase

```tsx
import { BreakGLB } from 'break-glb'

export default function ProductShowcase() {
  return (
    <BreakGLB
      modelUrl="/products/watch.glb"
      animationPreset="gentle"
      backgroundColor="#f0f0f0"
      environmentPreset="studio"
      showUploadUI={false}
      autoRotate
      autoRotateSpeed={0.5}
      onPartSelect={(part) => {
        if (part) {
          console.log('Viewing:', part.name)
        }
      }}
    />
  )
}
```

### Example 2: Engineering Documentation

```tsx
import { BreakGLB } from 'break-glb'
import { useState } from 'react'

export default function EngineeringDocs() {
  const [selectedPart, setSelectedPart] = useState(null)

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <BreakGLB
          modelUrl="/models/engine.glb"
          animationPreset="normal"
          gridHelper
          onPartSelect={(part) => setSelectedPart(part)}
          materialOptions={{ wireframe: false, metalness: 0.8 }}
        />
      </div>
      <div style={{ width: 300, padding: 20, background: '#fff' }}>
        <h3>Part Info</h3>
        {selectedPart ? (
          <div>
            <p><strong>Name:</strong> {selectedPart.name}</p>
            <p><strong>ID:</strong> {selectedPart.id}</p>
          </div>
        ) : (
          <p>Click a part to see details</p>
        )}
      </div>
    </div>
  )
}
```

### Example 3: Interactive Tutorial

```tsx
import { BreakGLB, useKeyboardShortcuts } from 'break-glb'
import { useState } from 'react'

export default function InteractiveTutorial() {
  const [step, setStep] = useState(0)
  const [isExploded, setIsExploded] = useState(false)

  useKeyboardShortcuts(
    { toggle: 'space', explode: 'e', assemble: 'a' },
    {
      onToggle: () => setIsExploded(!isExploded),
      onExplode: () => setIsExploded(true),
      onAssemble: () => setIsExploded(false),
    }
  )

  const steps = [
    'Welcome! Press SPACE to explode the model',
    'Great! Click on any part to focus',
    'Hold and drag parts to move them',
    'Press A to assemble everything back',
  ]

  return (
    <div>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 20,
        borderRadius: 8,
        maxWidth: 300,
        zIndex: 10,
      }}>
        <h4>Step {step + 1} of {steps.length}</h4>
        <p>{steps[step]}</p>
        <button onClick={() => setStep((s) => (s + 1) % steps.length)}>
          Next
        </button>
      </div>

      <BreakGLB
        modelUrl="/models/device.glb"
        showControls={false}
        onExplode={() => setStep(1)}
        onPartSelect={() => setStep(2)}
        onAssemble={() => setStep(3)}
      />
    </div>
  )
}
```

---

## 🎯 TypeScript Support

Full TypeScript definitions included:

```tsx
import { BreakGLB, BreakGLBProps, ModelPart, AnimationPreset } from 'break-glb'
import type { MaterialOptions } from 'break-glb/types'

const props: BreakGLBProps = {
  modelUrl: '/model.glb',
  animationPreset: 'dramatic',
  onLoad: (model, parts: ModelPart[]) => {
    console.log(`Loaded ${parts.length} parts`)
  },
}

function MyComponent() {
  return <BreakGLB {...props} />
}
```

---

## ⚡ Performance Tips

### Optimize Large Models

```tsx
<BreakGLB
  modelUrl="/large-model.glb"
  maxPixelRatio={1.5}
  shadowsEnabled={false}
  antialias={false}
/>
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const BreakGLB = lazy(() => import('break-glb'))

function App() {
  return (
    <Suspense fallback={<div>Loading 3D viewer...</div>}>
      <BreakGLB modelUrl="/model.glb" />
    </Suspense>
  )
}
```

---

## 🌍 Environment Presets

Available presets: `sunset`, `dawn`, `night`, `warehouse`, `forest`, `apartment`, `studio`, `city`, `park`, `lobby`

```tsx
<BreakGLB
  environmentPreset="sunset"
  // Creates warm, golden lighting
/>
```

---

## 🐛 Troubleshooting

### Model Won't Load

```tsx
<BreakGLB
  modelUrl="/model.glb"
  onLoadError={(error) => console.error('Load failed:', error)}
/>
```

### Performance Issues

- Reduce `explosionDistance` for simpler animations
- Disable `shadowsEnabled`
- Set `maxPixelRatio={1}`
- Use smaller models (< 10MB)

### TypeScript Errors

Make sure you have the required peer dependencies:
```bash
npm install --save-dev @types/three
```

---

## 📦 Bundle Size

- **Minified**: ~25KB
- **Gzipped**: ~8KB
- **Tree-shakeable**: Import only what you need

```tsx
// Import only the component
import { BreakGLB } from 'break-glb'

// Or import specific utilities
import { validateGLBFile } from 'break-glb/utils'
import { useBreakGLB } from 'break-glb/hooks'
```

---

## 🧪 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | 14+ |
| Chrome Android | 90+ |

---

## 📄 License

MIT © break-glb contributors

---

## 🤝 Contributing

Contributions welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

---

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/break-glb)
- [GitHub Repository](https://github.com/ltastefinger/break-glb)
- [Issue Tracker](https://github.com/ltastefinger/break-glb/issues)
- [Changelog](CHANGELOG.md)
- [Examples](EXAMPLES.md)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

<p align="center">
  <strong>Made with ❤️ for the React & Three.js community</strong>
</p>
