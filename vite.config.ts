import path from "path"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ isSsrBuild }) => ({
  base: "/anamnesis/",
  plugins: [
    reactRouter(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    // 仅在客户端构建时注入 Polyfills，避免干扰 SSR/SSG 预渲染环境
    !isSsrBuild &&
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        // 增加 PWA 允许缓存的最大文件大小到 20MB (应对某些无法进一步拆分的 Web3 库)
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
      manifest: {
        name: "Anamnesis - Web3 Vault",
        short_name: "Anamnesis",
        description: "A pure Web3 permanent storage vault",
        theme_color: "#4f46e5",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
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
  build: {
    rollupOptions: {
      output: {
        // 核心拆包策略
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 将大型 Web3 SDK 分离
            if (id.includes("@solana")) return "vendor-solana"
            if (id.includes("@mysten") || id.includes("sui"))
              return "vendor-sui"
            if (id.includes("@irys") || id.includes("arweave"))
              return "vendor-arweave"
            if (id.includes("bitcoinjs-lib") || id.includes("tiny-secp256k1"))
              return "vendor-bitcoin"
            if (
              id.includes("ethers") ||
              id.includes("viem") ||
              id.includes("wagmi")
            )
              return "vendor-evm"
            if (id.includes("@metamask")) return "vendor-metamask"
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            )
              return "vendor-framework"

            // 其他第三方库
            return "vendor"
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 提高警告阈值到 1000kB
  },
}))
