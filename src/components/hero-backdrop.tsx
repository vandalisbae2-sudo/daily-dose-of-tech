import { useEffect, useRef, useState, type PointerEvent } from "react"
import { useReducedMotion } from "motion/react"
import { PauseControl } from "@/components/pause-control.tsx"

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let onScreen = false
    let visible = document.visibilityState === "visible"
    const sync = () => setPlaying(onScreen && visible && reduced === false)
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      sync()
    })
    observer.observe(node)
    const onVisibility = () => {
      visible = document.visibilityState === "visible"
      sync()
    }
    document.addEventListener("visibilitychange", onVisibility)
    sync()
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [reduced])

  const active = playing && !paused

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!active) return
    if (window.matchMedia("(pointer: coarse), (max-width: 767px)").matches) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    event.currentTarget.style.setProperty("--hx", `${x}%`)
    event.currentTarget.style.setProperty("--hy", `${y}%`)
    const grid = event.currentTarget.querySelector<HTMLElement>("[data-hero-grid]")
    if (grid) {
      grid.style.setProperty("--gx", `${(x - 50) / 8}px`)
      grid.style.setProperty("--gy", `${(y - 50) / 8}px`)
    }
  }

  return (
    <>
      <div
        ref={ref}
        data-hero-backdrop=""
        data-playing={active ? "true" : "false"}
        onPointerMove={onPointerMove}
        className="hero-backdrop absolute inset-0"
        aria-hidden="true"
      >
        <div data-hero-grid="" className="hero-grid absolute inset-0" />
        <div data-hero-noise="" className="hero-noise pointer-events-none absolute inset-0" />
      </div>
      <div className="absolute bottom-4 left-4 z-20">
        <PauseControl name="background" paused={paused} onToggle={() => setPaused((value) => !value)} />
      </div>
    </>
  )
}
