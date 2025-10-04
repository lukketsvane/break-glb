# BreakGLB Examples

## Example 1: Minimal Setup

The simplest way to use BreakGLB - just add the component and upload a model:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return <BreakGLB />
}
```

## Example 2: Pre-loaded Model

Load a specific model on mount:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/robot.glb"
      autoExplode={true}
    />
  )
}
```

## Example 3: Custom Styling

Customize the appearance and lighting:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/engine.glb"
      backgroundColor="#1a1a2e"
      ambientLightIntensity={0.6}
      directionalLightIntensity={1.8}
      shadowsEnabled={true}
      cameraFov={70}
    />
  )
}
```

## Example 4: Event Handling

React to user interactions:

```tsx
import { BreakGLB } from 'break-glb'
import { useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('Ready')

  return (
    <div>
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10 }}>
        Status: {status}
      </div>
      <BreakGLB
        modelUrl="/models/car.glb"
        onLoad={() => setStatus('Model loaded!')}
        onExplode={() => setStatus('Exploded!')}
        onAssemble={() => setStatus('Assembled!')}
        onPartSelect={(part) => setStatus(part ? `Selected: ${part}` : 'Deselected')}
      />
    </div>
  )
}
```

## Example 5: Controlled Camera

Fine-tune camera behavior:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/product.glb"
      cameraPosition={[10, 5, 10]}
      cameraFov={45}
      enableRotate={true}
      enableZoom={true}
      enablePan={false}
      minDistance={5}
      maxDistance={30}
    />
  )
}
```

## Example 6: Headless Mode (No UI)

Use BreakGLB as a pure viewer without controls:

```tsx
import { BreakGLB } from 'break-glb'
import { useState } from 'react'

export default function App() {
  const [exploded, setExploded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExploded(!exploded)}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
      >
        {exploded ? 'Assemble' : 'Explode'}
      </button>

      <BreakGLB
        modelUrl="/models/mechanism.glb"
        showUploadUI={false}
        showControls={false}
      />
    </div>
  )
}
```

## Example 7: Custom Animation

Adjust explosion parameters:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/device.glb"
      explosionDistance={3.0}
      explosionSpeed={1200}
      animationEasing="easeOut"
    />
  )
}
```

## Example 8: Disable Features Selectively

Turn off specific interactions:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/sculpture.glb"
      enablePartSelection={false}
      enableLightControl={false}
      enablePan={false}
    />
  )
}
```

## Example 9: Full-Page Viewer with Custom Container

Use custom styling for the container:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <BreakGLB
      modelUrl="/models/architecture.glb"
      className="custom-viewer"
      containerStyle={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom, #000428, #004e92)'
      }}
    />
  )
}
```

## Example 10: Multiple Instances

Show multiple models side by side:

```tsx
import { BreakGLB } from 'break-glb'

export default function App() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh' }}>
      <BreakGLB
        modelUrl="/models/model1.glb"
        containerStyle={{ height: '100%' }}
      />
      <BreakGLB
        modelUrl="/models/model2.glb"
        containerStyle={{ height: '100%' }}
      />
    </div>
  )
}
```
