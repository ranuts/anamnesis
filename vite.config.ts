import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@metamask/sdk": path.resolve(__dirname, "node_modules/@metamask/sdk"),
    },
  },
  optimizeDeps: {
    include: ["@metamask/sdk", "@rainbow-me/rainbowkit", "wagmi", "viem"],
  },
})
