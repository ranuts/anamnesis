import type { Config } from "@react-router/dev/config"

export default {
  // 指定应用目录为 src
  appDirectory: "src",
  // 定义需要预渲染的路由
  async prerender() {
    return ["/", "/upload", "/account"]
  },
  ssr: true,
} satisfies Config
