import type { Insight, InsightGroup } from "@/content/insights.ts"

const groups: readonly { id: InsightGroup; label: string }[] = [
  { id: "software", label: "Software" },
  { id: "hardware", label: "Hardware" },
]

export function InsightGroups({
  insights,
  activeGroup,
}: {
  insights: readonly Insight[]
  activeGroup?: InsightGroup
}) {
  return (
    <div className="grid gap-10">
      {groups.map((group) => {
        if (activeGroup && group.id !== activeGroup) return null
        const items = insights.filter((item) => item.group === group.id)
        if (items.length === 0) return null
        return (
          <section key={group.id} aria-labelledby={`${group.id}-insights`}>
            <h2
              id={`${group.id}-insights`}
              className="text-2xl font-bold text-foreground"
            >
              {group.label}
            </h2>
            <ul className="mt-4 grid gap-4">
              {items.map((item, index) => (
                <li
                  key={`${index}-${item.title}`}
                  id={`insight-${insights.indexOf(item)}`}
                  className="insight-card lift-card scroll-mt-28 rounded-xl border border-border bg-card p-4 text-card-foreground"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-base text-muted-foreground">
                    {item.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
