"use client"

import { BreakGLB } from "@/src/index"

export default function Home() {
  return (
    <BreakGLB
      showUploadUI={true}
      showControls={true}
      enablePartSelection={true}
      enableLightControl={true}
      backgroundColor="#000000"
      explosionDistance={1.5}
      onExplode={() => console.log("Model exploded!")}
      onAssemble={() => console.log("Model assembled!")}
      onPartSelect={(partName) => console.log("Part selected:", partName)}
    />
  )
}
