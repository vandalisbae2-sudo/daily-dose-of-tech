import { useReducedMotion } from "motion/react"
import { ComingSoonNote } from "@/components/coming-soon-note.tsx"

export function EmptyState({ scene }: { scene: "tips" | "pc" | "insights" }) {
  const reduced = useReducedMotion()
  const still = reduced !== false
  return (
    <div data-empty-state="" data-empty-scene={scene} className="mx-auto grid w-full max-w-3xl gap-6 px-4" role="status">
      {scene === "tips" ? <BlankCardStack still={still} /> : null}
      {scene === "pc" ? <CaseSketch still={still} /> : null}
      {scene === "insights" ? <Orbit still={still} /> : null}
      <ComingSoonNote />
    </div>
  )
}

function BlankCardStack({ still }: { still: boolean }) {
  return (
    <div aria-hidden="true" className={`relative mx-auto h-40 w-56 ${still ? "" : "card-shuffle"}`}>
      <span className="absolute inset-x-6 top-4 h-28 rounded-2xl border border-border bg-card" />
      <span className="absolute inset-x-3 top-8 h-28 rounded-2xl border border-border bg-muted" />
      <span className="absolute inset-x-0 top-12 h-28 rounded-2xl border border-border bg-background" />
    </div>
  )
}

function CaseSketch({ still }: { still: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 200" className={`mx-auto h-56 w-44 text-foreground ${still ? "sketch-still" : "sketch-draw"}`}>
      <rect x="28" y="16" width="104" height="168" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M40 40h80M40 64h80M48 150h24M88 150h24" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="104" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

function Orbit({ still }: { still: boolean }) {
  return (
    <div aria-hidden="true" className="relative mx-auto h-48 w-48">
      <div className={still ? "absolute inset-6" : "orbit-spin absolute inset-6"}>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">Software</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-highlight px-2 py-1 text-xs font-bold text-highlight-foreground">Hardware</span>
      </div>
    </div>
  )
}
