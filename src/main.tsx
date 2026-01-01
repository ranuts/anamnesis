import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { Providers } from "./providers"
import { Buffer } from "buffer"
import "./i18n/config"

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
