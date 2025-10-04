# break-glb: 3D Model Exploder Component

[![NPM Version](https://img.shields.io/npm/v/break-glb)](https://www.npmjs.com/package/break-glb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React component for rendering 3D GLB models with animated exploded view functionality. Built with Three.js and React Three Fiber.

## Features

✨ **Interactive 3D Viewer** - Smooth rotation, zoom, and pan controls
💥 **Exploded View Animation** - Separate model parts with physics-based animations
🎯 **Part Selection** - Click to focus on individual parts
💡 **Dynamic Lighting** - Adjustable light position with touch/mouse controls
🎨 **Fully Customizable** - Extensive prop-based configuration
📦 **Zero Config** - Works out of the box with sensible defaults
🎮 **Touch & Mouse Support** - Optimized for both desktop and mobile

## Installation

```bash
npm install break-glb three @react-three/fiber @react-three/drei
```

```bash
yarn add break-glb three @react-three/fiber @react-three/drei
```

## Quick Start

### Basic Usage (Upload Mode)

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return <BreakGLB />
}
```

### With Pre-loaded Model

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return (
    <BreakGLB
      modelUrl="/path/to/model.glb"
      explosionDistance={2.0}
    />
  )
}
```

### Full Configuration Example

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return (
    <BreakGLB
      // Model Source
      modelUrl="/path/to/model.glb"

      // Visual Customization
      backgroundColor="#1a1a1a"
      ambientLightIntensity={0.5}
      directionalLightIntensity={1.5}
      shadowsEnabled={true}
      cameraFov={60}
      cameraPosition={[8, 8, 8]}

      // Animation
      explosionDistance={2.5}
      explosionSpeed={1000}

      // Features
      showUploadUI={true}
      showControls={true}
      enablePartSelection={true}
      enableLightControl={true}

      // Camera Controls
      enableRotate={true}
      enableZoom={true}
      enablePan={true}
      minDistance={2}
      maxDistance={20}

      // Callbacks
      onLoad={(model) => console.log('Model loaded', model)}
      onExplode={() => console.log('Exploded!')}
      onAssemble={() => console.log('Assembled!')}
      onPartSelect={(partName) => console.log('Selected:', partName)}

      // Styling
      className="w-full h-screen"
    />
  )
}
```

## API Reference

### Props

#### Model Source
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelUrl` | `string` | `undefined` | URL or path to GLB file |

#### Visual Customization
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `"#000000"` | Scene background color |
| `ambientLightIntensity` | `number` | `0.3` | Ambient light intensity |
| `directionalLightIntensity` | `number` | `1.2` | Directional light intensity |
| `shadowsEnabled` | `boolean` | `true` | Enable/disable shadows |
| `cameraFov` | `number` | `50` | Camera field of view |
| `cameraPosition` | `[number, number, number]` | `[5, 5, 5]` | Initial camera position |

#### Animation Parameters
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `explosionDistance` | `number` | `1.5` | How far parts separate |
| `explosionSpeed` | `number` | `800` | Animation duration (ms) |
| `animationEasing` | `"linear" \| "easeInOut" \| "easeOut"` | `"easeInOut"` | Animation easing function |

#### Behavior Toggles
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showUploadUI` | `boolean` | `true` | Show file upload interface |
| `showControls` | `boolean` | `true` | Show explode/upload controls |
| `autoExplode` | `boolean` | `false` | Auto-explode on load |
| `enablePartSelection` | `boolean` | `true` | Enable clicking parts |
| `enableLightControl` | `boolean` | `true` | Enable light adjustment |

#### Camera Controls
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableRotate` | `boolean` | `true` | Enable rotation |
| `enableZoom` | `boolean` | `true` | Enable zoom |
| `enablePan` | `boolean` | `true` | Enable panning |
| `minDistance` | `number` | `2` | Min zoom distance |
| `maxDistance` | `number` | `20` | Max zoom distance |

#### Lifecycle Callbacks
| Prop | Type | Description |
|------|------|-------------|
| `onLoad` | `(model: THREE.Group) => void` | Called when model loads |
| `onLoadError` | `(error: Error) => void` | Called on load error |
| `onExplode` | `() => void` | Called when exploding |
| `onAssemble` | `() => void` | Called when assembling |
| `onPartSelect` | `(partName: string \| null) => void` | Called when part selected |

#### Styling
| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for container |
| `containerStyle` | `React.CSSProperties` | Inline styles for container |

## Controls

### Desktop
- **Left Click + Drag**: Rotate model
- **Right Click + Drag**: Adjust light position
- **Scroll Wheel**: Zoom in/out
- **Click Part**: Focus on part (when exploded)
- **Hold + Drag Part**: Move individual part

### Mobile/Touch
- **1 Finger Drag**: Rotate model
- **2 Finger Pinch**: Zoom
- **3 Finger Drag**: Adjust light position
- **Tap Part**: Focus on part (when exploded)
- **Hold + Drag Part**: Move individual part

## Repository Structure

```
/src              - NPM package source
  └── index.tsx   - Main component
/app              - Next.js demo application
/public/assets    - Sample GLB files
```

## Development

### Running the Demo

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the demo.

### Building the Package

```bash
cd src
npm install
npm run build
```

### Publishing to NPM

```bash
cd src
npm version patch|minor|major
npm publish
```

## Technical Details

### Dependencies
- **React** 18+ (peer dependency)
- **Three.js** 0.150+ (peer dependency)
- **@react-three/fiber** 8+ (peer dependency)
- **@react-three/drei** 9+ (peer dependency)

### File Format Support
Currently supports **GLB (binary GLTF)** files only.

### Performance Notes
- Optimized for models with < 100k polygons
- Automatic pixel ratio limiting on mobile devices
- Efficient animation loop with requestAnimationFrame
- Proper Three.js resource cleanup on unmount

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

See the [demo application](./app/page.tsx) for a complete implementation example.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Roadmap

- [ ] GLTF (JSON) format support
- [ ] Export exploded view as image
- [ ] Animation timeline controls
- [ ] Custom color schemes for parts
- [ ] VR support