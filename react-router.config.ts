import type { Config } from "@react-router/dev/config"

export default {
  // 指定应用目录为 src
  appDirectory: "src",
  // Must start with (and typically equal to) Vite's `base` when using the default Vite dev/preview server.
  basename: "/anamnesis/",
  // 定义需要预渲染的路由
  async prerender() {
    return ["/", "/upload", "/account"]
  },
  ssr: true,
} satisfies Config
