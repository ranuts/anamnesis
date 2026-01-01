import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"
import { StrictMode } from "react"
import { Buffer } from "buffer"

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer
}

hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter />
  </StrictMode>,
)
