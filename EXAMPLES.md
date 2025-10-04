# Examples

## Basic

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return <BreakGLB />
}
```

## With Model

```tsx
<BreakGLB modelUrl="/robot.glb" autoExplode />
```

## Custom Style

```tsx
<BreakGLB
  modelUrl="/engine.glb"
  backgroundColor="#1a1a2e"
  directionalLightIntensity={1.8}
  cameraFov={70}
/>
```

## Event Handlers

```tsx
<BreakGLB
  modelUrl="/car.glb"
  onLoad={() => console.log('Loaded')}
  onPartSelect={(part) => console.log(part)}
/>
```

## Headless

```tsx
<BreakGLB
  modelUrl="/model.glb"
  showUploadUI={false}
  showControls={false}
/>
```

## Custom Animation

```tsx
<BreakGLB
  modelUrl="/device.glb"
  explosionDistance={3.0}
/>
```
