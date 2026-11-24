import { useRef, useState } from "react"
import { useAnimationFrame, useReducedMotion, useScroll, useSpring, useVelocity } from "motion/react"
import { PauseControl } from "@/components/pause-control.tsx"

const line = "Daily Tech Tips · PC Building · Tech Insights · Your Tech Learning Hub · "

export function Marquee({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLParagraphElement>(null)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const speed = useSpring(velocity, { stiffness: 80, damping: 18, mass: 0.4 })
  const still = reduced !== false || paused

  useAnimationFrame(() => {
    if (still) return
    const animation = trackRef.current?.getAnimations()[0]
    if (!animation) return
    const current = speed.get()
    const boost = Math.min(4, Math.abs(current) / 400)
    const direction = current < -20 ? -1 : 1
    animation.playbackRate = direction * (1 + boost)
  })

  return (
    <section data-marquee="" data-paused={still ? "true" : "false"} className="relative overflow-hidden border-y border-border bg-background py-3">
      <div className="flex min-w-0 items-center gap-3 px-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p ref={trackRef} className={`marquee-track font-bold tracking-wide text-foreground uppercase ${compact ? "text-lg" : "text-3xl md:text-5xl"}`} aria-hidden="true">
            <span>{line.repeat(4)}</span>
          </p>
        </div>
        <p className="sr-only">{line}</p>
        <PauseControl name="marquee" paused={paused} onToggle={() => setPaused((value) => !value)} />
      </div>
    </section>
  )
}
