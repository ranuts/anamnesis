import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("pages/Dashboard.tsx"),
  route("upload", "pages/Upload.tsx"),
  route("account", "pages/Account.tsx"),
] satisfies RouteConfig
