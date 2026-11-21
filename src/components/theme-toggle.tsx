import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"

const storageKey = "theme"

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return readStoredTheme() ?? "light"
  if (document.documentElement.classList.contains("dark")) return "dark"
  return readStoredTheme() ?? "light"
}

function readStoredTheme(): "light" | "dark" | null {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // Storage can be blocked. The document class still drives the theme.
  }
  return null
}

function storeTheme(theme: "light" | "dark") {
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // The toggle still updates the current view when storage is unavailable.
  }
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
  root.style.backgroundColor = theme === "dark" ? "#09090b" : "#fafafa"
  root.dataset.theme = theme
  storeTheme(theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme)

  function toggle() {
    const next = theme === "dark" ? "light" : "dark"
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
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
