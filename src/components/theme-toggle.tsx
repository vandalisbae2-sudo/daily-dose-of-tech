import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { readStorage, writeStorage } from "@/lib/storage.ts"
import { Button } from "@/components/ui/button.tsx"

const storageKey = "theme"

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return readStoredTheme() ?? "light"
  if (document.documentElement.classList.contains("dark")) return "dark"
  return readStoredTheme() ?? "light"
}

function readStoredTheme(): "light" | "dark" | null {
  const stored = readStorage(storageKey)
  if (stored === "light" || stored === "dark") return stored
  return null
}

function storeTheme(theme: "light" | "dark") {
  writeStorage(storageKey, theme)
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
  root.style.backgroundColor = theme === "dark" ? "#07060b" : "#fafafa"
  root.dataset.theme = theme
  storeTheme(theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme)
  const reduced = useReducedMotion()

  function toggle() {
    const next = theme === "dark" ? "light" : "dark"
    if (reduced === false) {
      const wash = document.createElement("div")
      wash.setAttribute("data-theme-wash", "")
      wash.style.cssText = `position:fixed;inset:0;z-index:70;pointer-events:none;background:${next === "dark" ? "#07060b" : "#fafafa"};opacity:0;transition:opacity 180ms linear`
      document.body.appendChild(wash)
      requestAnimationFrame(() => {
        wash.style.opacity = "0.28"
      })
      window.setTimeout(() => {
        wash.style.opacity = "0"
        window.setTimeout(() => wash.remove(), 200)
      }, 160)
    }
    applyTheme(next)
    setTheme(next)
  }

  const toDark = theme === "light"
  const label = toDark ? "Switch to dark theme" : "Switch to light theme"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-theme-toggle
      aria-pressed={theme === "dark"}
      aria-label={label}
      onClick={toggle}
      className="border-border bg-background text-foreground hover:bg-accent"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          aria-hidden="true"
          className="inline-flex"
          initial={reduced === false ? { opacity: 0, rotate: -30, scale: 0.8 } : false}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduced === false ? { opacity: 0, rotate: 30, scale: 0.8 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
