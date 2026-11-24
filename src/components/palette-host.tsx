import { lazy, Suspense, useEffect, useRef, useState } from "react"

const CommandPalette = lazy(() => import("@/components/command-palette.tsx").then((mod) => ({ default: mod.CommandPalette })))

export function PaletteHost() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  function openPalette() {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setReady(true)
    setOpen(true)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      const target = returnFocus.current
      window.setTimeout(() => target?.focus(), 0)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        openPalette()
      }
    }
    const onAsk = () => openPalette()
    window.addEventListener("keydown", onKey)
    window.addEventListener("ddot-open-palette", onAsk)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("ddot-open-palette", onAsk)
    }
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={onOpenChange} />
    </Suspense>
  )
}

export function openPalette() {
  window.dispatchEvent(new Event("ddot-open-palette"))
}
