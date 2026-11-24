import { useEffect } from "react"
import Lenis from "lenis"
import { useReducedMotion } from "motion/react"

export function SmoothScroll() {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced !== false) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const wide = window.matchMedia("(min-width: 768px)").matches
    if (!fine || !wide) return
    const lenis = new Lenis({ autoRaf: true })
    document.documentElement.dataset.smoothScroll = "on"
    return () => {
      delete document.documentElement.dataset.smoothScroll
      lenis.destroy()
    }
  }, [reduced])
  return null
}
