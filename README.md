# break-glb

React component for interactive 3D model exploded views. Built on Three.js.

[![NPM Version](https://img.shields.io/npm/v/break-glb?style=flat-square)](https://www.npmjs.com/package/break-glb)
[![License](https://img.shields.io/npm/l/break-glb?style=flat-square)](https://opensource.org/licenses/MIT)

## Features

- Physics-based explosion animations
- Part selection & dragging
- Interactive lighting control
- Auto-rotate, shadows, FOV control
- Touch & mobile optimized
- TypeScript support

## Install

```bash
npm install break-glb three @react-three/fiber @react-three/drei
```

## Usage

```tsx
import { BreakGLB } from 'break-glb'

function App() {
  return <BreakGLB modelUrl="/model.glb" />
}
```

## Controls

**Desktop:**
- Left drag → Rotate
- Right drag → Light control
- Scroll → Zoom
- Click part → Select

**Mobile:**
- 1 finger → Rotate
- 2 fingers → Zoom
- 3 fingers → Light control

---

## Props

| Prop | Type | Default |
|------|------|---------|
| `modelUrl` | `string` | - |
| `backgroundColor` | `string` | `"#000000"` |
| `explosionDistance` | `number` | `0.8` |
| `directionalLightIntensity` | `number` | `2.5` |
| `shadowsEnabled` | `boolean` | `true` |
| `cameraFov` | `number` | `50` |
| `autoExplode` | `boolean` | `false` |
| `enablePartSelection` | `boolean` | `true` |
| `enableLightControl` | `boolean` | `true` |
| `enableRotate` | `boolean` | `true` |
| `enableZoom` | `boolean` | `true` |
| `enablePan` | `boolean` | `true` |
| `showUploadUI` | `boolean` | `true` |
| `showControls` | `boolean` | `true` |
| `onLoad` | `(model) => void` | - |
| `onExplode` | `() => void` | - |
| `onAssemble` | `() => void` | - |
| `onPartSelect` | `(part) => void` | - |

## Example

```tsx
<BreakGLB
  modelUrl="/engine.glb"
  explosionDistance={1.2}
  autoExplode
  onPartSelect={(part) => console.log(part.name)}
/>
```

## License

MIT
