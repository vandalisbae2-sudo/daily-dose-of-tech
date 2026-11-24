import { motion, useReducedMotion } from "motion/react"
import type { BuildStep } from "@/content/pc-build-steps.ts"
import { readStorage, writeStorage } from "@/lib/storage.ts"
import { Checkbox } from "@/components/ui/checkbox.tsx"

const progressKey = "ddot-pc-progress"

export function readDone(total: number): number[] {
  const raw = readStorage(progressKey)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is number => typeof value === "number" && value >= 0 && value < total)
  } catch {
    return []
  }
}

export function writeDone(done: readonly number[]) {
  writeStorage(progressKey, JSON.stringify(done))
}

export function BuildStepList({
  steps,
  interactive = false,
  done = [],
  onToggle,
}: {
  steps: readonly BuildStep[]
  interactive?: boolean
  done?: readonly number[]
  onToggle?: (index: number, checked: boolean) => void
}) {
  const reduced = useReducedMotion()
  return (
    <div className="relative" data-build-steps={interactive ? "interactive" : "plain"}>
      {interactive ? (
        <motion.span
          aria-hidden="true"
          data-timeline=""
          className="absolute top-0 bottom-0 left-3 w-0.5 origin-top bg-primary"
          initial={reduced === false ? { scaleY: 0 } : false}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ) : null}
      <ol className="list-decimal space-y-4 ps-6 marker:font-bold marker:text-primary">
        {steps.map((step, index) => (
          <li key={`${index}-${step.title}`} id={`step-${index}`} className="scroll-mt-28 ps-2">
            <p className="text-lg font-semibold text-foreground">{step.title}</p>
            <p className="mt-1 text-base text-muted-foreground">{step.body}</p>
            {interactive ? (
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground" data-step-check="">
                <Checkbox
                  checked={done.includes(index)}
                  onCheckedChange={(value) => onToggle?.(index, value === true)}
                />
                Mark step done
              </label>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}
