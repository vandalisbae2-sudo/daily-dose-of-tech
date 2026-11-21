import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project site: https://<owner>.github.io/daily-dose-of-tech/
export default defineConfig({
  base: "/daily-dose-of-tech/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        tips: path.resolve(rootDir, "daily-tech-tips/index.html"),
        pc: path.resolve(rootDir, "pc-building/index.html"),
        insights: path.resolve(rootDir, "insights/index.html"),
        about: path.resolve(rootDir, "about/index.html"),
      },
    },
  },
})
