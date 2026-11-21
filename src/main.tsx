import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { pageFromPath } from "./lib/paths.ts"
import "./index.css"

const root = document.getElementById("root")
if (!root) {
  throw new Error("Root element missing")
}

createRoot(root).render(
  <StrictMode>
    <App page={pageFromPath(window.location.pathname)} />
  </StrictMode>,
)
