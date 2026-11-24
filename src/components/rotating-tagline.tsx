import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { PauseControl } from "@/components/pause-control.tsx"
import { site } from "@/content/site.ts"

const lines = [site.tagline, site.aboutLead] as const

export function RotatingTagline() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const hold = reduced !== false || paused

  useEffect(() => {
    if (hold) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % lines.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [hold])

  return (
    <div
      data-rotating-tagline=""
      data-paused={hold ? "true" : "false"}
      className="max-w-full"
    >
      <p className="sr-only">{lines.join(" ")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <p
          data-hero-pill=""
          aria-hidden="true"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="w-fit max-w-full rounded-full border-2 border-[var(--pill-edge)] bg-highlight px-3 py-1 text-sm font-bold tracking-wide text-highlight-foreground"
        >
          {lines[index]}
        </p>
        <PauseControl name="tagline" paused={paused} onToggle={() => setPaused((value) => !value)} />
      </div>
    </div>
  )
}
