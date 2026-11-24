import { useState } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { insights, type InsightGroup } from "@/content/insights.ts"
import { site } from "@/content/site.ts"
import { EmptyState } from "@/components/empty-state.tsx"
import { InsightGroups } from "@/components/insight-groups.tsx"
import { PageHeader } from "@/components/page-header.tsx"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx"

function firstGroup(): InsightGroup {
  if (typeof window !== "undefined") {
    const match = window.location.hash.match(/^#insight-(\d+)$/)
    const fromHash = match ? insights[Number(match[1])] : undefined
    if (fromHash) return fromHash.group
  }
  if (insights.some((item) => item.group === "software")) return "software"
  return "hardware"
}

export function InsightsPage() {
  const [group, setGroup] = useState<InsightGroup>(firstGroup)
  const reduced = useReducedMotion()
  return (
    <article id="content" className="grid gap-8">
      <PageHeader title={site.insightsTitle}>
        <p>{site.insightsIntro}</p>
        <p>{site.insightsSupport}</p>
      </PageHeader>
      {insights.length === 0 ? (
        <EmptyState scene="insights" />
      ) : (
        <div className="grid max-w-3xl gap-4">
          <ToggleGroup
            type="single"
            value={group}
            onValueChange={(value) => {
              if (value === "software" || value === "hardware") setGroup(value)
            }}
            variant="outline"
            aria-label="Filter"
            data-insight-switch=""
          >
            <ToggleGroupItem value="software">Software</ToggleGroupItem>
            <ToggleGroupItem value="hardware">Hardware</ToggleGroupItem>
          </ToggleGroup>
          <LayoutGroup>
            <motion.div
              key={group}
              layout={reduced === false}
              initial={reduced === false ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <InsightGroups insights={insights} activeGroup={group} />
            </motion.div>
          </LayoutGroup>
        </div>
      )}
      <div className="grid max-w-3xl gap-4">
        <h2 className="w-fit max-w-full rounded-2xl bg-highlight px-3 py-1 text-2xl font-bold text-highlight-foreground">
          {site.guidesTitle}
        </h2>
        <p className="text-lg font-semibold text-kicker">{site.guidesLine}</p>
      </div>
    </article>
  )
}
