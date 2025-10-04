import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "index.ts",
    hooks: "hooks.ts",
    utils: "utils.ts",
    types: "types.ts",
    components: "components.tsx",
  },
  format: ["cjs", "esm"],
  dts: false, // Disable for now due to type conflicts
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
  treeshake: true,
  target: "es2020",
  outDir: "dist",
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
})
