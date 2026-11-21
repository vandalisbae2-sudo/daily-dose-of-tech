import type { BuildStep } from "@/content/pc-build-steps.ts"

export function BuildStepList({ steps }: { steps: readonly BuildStep[] }) {
  return (
    <ol className="list-decimal space-y-4 ps-6 marker:font-bold marker:text-primary">
      {steps.map((step, index) => (
        <li key={`${index}-${step.title}`} className="ps-2">
          <p className="text-lg font-semibold text-foreground">{step.title}</p>
          <p className="mt-1 text-base text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
