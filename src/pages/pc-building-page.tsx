import { useEffect, useState } from "react"
import { buildSteps } from "@/content/pc-build-steps.ts"
import { site } from "@/content/site.ts"
import { BuildStepList, readDone, writeDone } from "@/components/build-step-list.tsx"
import { EmptyState } from "@/components/empty-state.tsx"
import { PageHeader } from "@/components/page-header.tsx"
import { Reveal } from "@/components/reveal.tsx"
import { Progress } from "@/components/ui/progress.tsx"

export function PcBuildingPage() {
  const [done, setDone] = useState<number[]>(() => readDone(buildSteps.length))
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    writeDone(done)
  }, [done])

  useEffect(() => {
    if (buildSteps.length === 0) return
    const nodes = buildSteps.map((_, index) => document.getElementById(`step-${index}`))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const index = nodes.findIndex((node) => node === visible?.target)
        if (index >= 0) setCurrent(index)
      },
      { rootMargin: "-30% 0px -50% 0px" },
    )
    for (const node of nodes) {
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [])

  function toggle(index: number, checked: boolean) {
    setDone((currentDone) => {
      const next = new Set(currentDone)
      if (checked) next.add(index)
      else next.delete(index)
      return [...next]
    })
  }

  const percent = buildSteps.length === 0 ? 0 : Math.round((done.length / buildSteps.length) * 100)

  return (
    <article id="content" className="grid gap-8">
      <PageHeader title={site.pcTitle}>
        <p>{site.pcIntro}</p>
      </PageHeader>
      {buildSteps.length === 0 ? (
        <EmptyState scene="pc" />
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[5rem_1fr]">
          <nav aria-label="Steps" data-step-nav="" className="sticky top-24 flex gap-2 md:flex-col">
            {buildSteps.map((step, index) => (
              <a
                key={`${index}-${step.title}`}
                href={`#step-${index}`}
                aria-current={current === index ? "true" : undefined}
                aria-label={step.title}
                className="inline-flex size-9 items-center justify-center rounded-full bg-muted font-bold text-foreground no-underline aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
              >
                {index + 1}
              </a>
            ))}
          </nav>
          <div className="grid gap-4">
            <div data-build-progress="" className="grid gap-2 rounded-2xl bg-secondary px-4 py-4 text-secondary-foreground">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Build progress</p>
                <svg viewBox="0 0 36 36" className="size-10 text-secondary-foreground" aria-hidden="true">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    pathLength={100}
                    strokeDasharray={`${percent} 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <Progress value={percent} aria-label="Build progress" />
            </div>
            <Reveal>
              <BuildStepList steps={buildSteps} interactive done={done} onToggle={toggle} />
            </Reveal>
          </div>
        </div>
      )}
      <div className="grid max-w-3xl gap-4">
        <h2 className="w-fit max-w-full rounded-2xl bg-highlight px-3 py-1 text-2xl font-bold text-highlight-foreground">
          {site.pcDreamTitle}
        </h2>
        <p className="text-lg text-foreground">{site.pcDreamBody}</p>
      </div>
    </article>
  )
}
