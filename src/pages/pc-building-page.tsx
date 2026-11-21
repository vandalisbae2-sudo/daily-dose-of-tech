import { buildSteps } from "@/content/pc-build-steps.ts"
import { site } from "@/content/site.ts"
import { BuildStepList } from "@/components/build-step-list.tsx"
import { ComingSoonNote } from "@/components/coming-soon-note.tsx"
import { PageHeader } from "@/components/page-header.tsx"

export function PcBuildingPage() {
  return (
    <article className="grid gap-8">
      <PageHeader title={site.pcTitle}>
        <p>{site.pcIntro}</p>
      </PageHeader>
      <div className="grid max-w-3xl gap-4">
        <h2 className="w-fit max-w-full rounded-2xl bg-highlight px-3 py-1 text-2xl font-bold text-highlight-foreground">
          {site.pcDreamTitle}
        </h2>
        <p className="text-lg text-foreground">{site.pcDreamBody}</p>
        {buildSteps.length === 0 ? (
          <ComingSoonNote />
        ) : (
          <BuildStepList steps={buildSteps} />
        )}
      </div>
    </article>
  )
}
