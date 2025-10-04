# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-04

### Added

#### Core Features
- ✨ **BreakGLB Component** - Main React component for 3D model explosion visualization
- 🎮 **Interactive Controls** - Full mouse and touch support for desktop and mobile
- 💥 **Physics-Based Animation** - Realistic part separation with collision detection
- 🎯 **Part Selection** - Click to focus on individual parts with smooth camera animation
- 🎨 **Material Customization** - Configure metalness, roughness, wireframe, and more
- 💡 **Dynamic Lighting** - Adjustable light position with 3-finger touch or right-click drag

#### Animation System
- **Animation Presets** - Pre-configured animation modes: gentle, normal, energetic, dramatic
- **Custom Easing** - Support for linear, easeIn, easeOut, easeInOut, and bounce easing
- **Stagger Effect** - Configurable delay between part explosions
- **Smooth Transitions** - All camera movements interpolated (no instant cuts)
- **Part Dragging** - Physics-enabled individual part manipulation

#### Developer Experience
- **TypeScript Support** - Full type definitions for all props and APIs
- **Utility Hooks** - Export of `useBreakGLB`, `useModelControls`, `useKeyboardShortcuts`, etc.
- **Error Handling** - Built-in error boundaries with friendly error messages
- **Loading States** - Configurable loading progress indicators
- **Lifecycle Callbacks** - Extensive event system (onLoad, onExplode, onAssemble, onPartSelect, etc.)

#### Customization
- **Visual Options** - 30+ configuration props for complete control
- **Environment Presets** - 10 lighting environments (studio, sunset, warehouse, etc.)
- **Camera Controls** - Configurable rotation, zoom, pan with limits
- **Debug Helpers** - Optional grid and axes helpers
- **Material Override** - Per-model material customization
- **Color Theming** - Highlight and selection color customization

#### UI Components
- **Upload Zone** - Drag-and-drop file upload with validation
- **Loading Component** - Animated loading indicator with progress bar
- **Error Display** - User-friendly error messages with retry option
- **Control Panel** - Minimalist control buttons for explode/upload

#### Accessibility
- **Keyboard Support** - Optional keyboard shortcuts for all actions
- **Touch Optimized** - Multi-touch gestures for mobile devices
- **Responsive** - Adaptive controls for different screen sizes
- **Browser Support** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Technical

#### Performance
- Optimized physics loop with requestAnimationFrame
- Efficient collision detection with bounding boxes
- Proper Three.js resource cleanup on unmount
- Tree-shakeable exports for minimal bundle size
- Source maps for debugging

#### Build System
- TypeScript 5+ compilation
- tsup for ESM and CJS builds
- Automatic type generation
- Minified production build
- Peer dependency externals

#### Package Structure
```
break-glb/
├── dist/
│   ├── index.js          # CJS bundle
│   ├── index.mjs         # ESM bundle
│   ├── index.d.ts        # Type definitions
│   ├── hooks.js/mjs      # Utility hooks
│   ├── utils.js/mjs      # Helper functions
│   └── types.js/mjs      # Type exports
```

### Documentation
- Comprehensive README with API reference
- 10+ usage examples with code samples
- Controls documentation for desktop and mobile
- Migration guides and best practices
- TypeScript integration examples

### Dependencies
- React 18+ or 19+ (peer)
- Three.js 0.150+ (peer)
- @react-three/fiber 8+ (peer)
- @react-three/drei 9+ (peer)

---

## Roadmap

### Planned for v1.1.0
- [ ] GLTF (JSON) format support
- [ ] Export exploded view as image/video
- [ ] Animation timeline scrubbing
- [ ] Custom color schemes per part
- [ ] Part labeling system

### Planned for v1.2.0
- [ ] VR/AR support
- [ ] Multi-model comparison view
- [ ] Assembly instructions mode
- [ ] Performance profiler integration
- [ ] Measurement tools

### Future Considerations
- Web Worker support for large models
- Streaming/progressive loading
- Offline caching
- Plugin system for extensions
- Built-in annotation system

---

## Contributors

Thanks to all contributors who helped make this project possible!

## License

MIT © break-glb contributors
