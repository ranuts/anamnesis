import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import "./index.css"
import "@rainbow-me/rainbowkit/styles.css"
import { AppLayout } from "@/components/layout/AppLayout"
import { Providers } from "./providers"
import "./i18n/config"

if (typeof window !== "undefined") {
  // 仅在浏览器环境下确保全局 Buffer 可用
  import("buffer").then(({ Buffer }) => {
    window.Buffer = window.Buffer || Buffer
  })
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/anamnesis/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
