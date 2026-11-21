import { insights } from "@/content/insights.ts"
import { site } from "@/content/site.ts"
import { ComingSoonNote } from "@/components/coming-soon-note.tsx"
import { InsightGroups } from "@/components/insight-groups.tsx"
import { PageHeader } from "@/components/page-header.tsx"

export function InsightsPage() {
  return (
    <article className="grid gap-8">
      <PageHeader title={site.insightsTitle}>
        <p>{site.insightsIntro}</p>
        <p>{site.insightsSupport}</p>
      </PageHeader>
      <div className="grid max-w-3xl gap-4">
        <h2 className="w-fit max-w-full rounded-2xl bg-highlight px-3 py-1 text-2xl font-bold text-highlight-foreground">
          {site.guidesTitle}
        </h2>
        <p className="text-lg font-semibold text-kicker">{site.guidesLine}</p>
        {insights.length === 0 ? (
          <ComingSoonNote />
        ) : (
          <InsightGroups insights={insights} />
        )}
      </div>
    </article>
  )
}
