import { useMemo, useState } from "react"
import { tips } from "@/content/tips.ts"
import { site } from "@/content/site.ts"
import { EmptyState } from "@/components/empty-state.tsx"
import { PageHeader } from "@/components/page-header.tsx"
import { Reveal } from "@/components/reveal.tsx"
import { TipList } from "@/components/tip-list.tsx"

export function TipsPage() {
  const [query, setQuery] = useState("")
  const [tag, setTag] = useState("All")
  const tags = useMemo(
    () => [...new Set(tips.flatMap((tip) => (tip.tag ? [tip.tag] : [])))],
    [],
  )
  const visible = tips
    .map((tip, index) => ({ tip, index }))
    .filter(({ tip }) => {
      const haystack = `${tip.title} ${tip.summary}`.toLowerCase()
      const matchesQuery = haystack.includes(query.trim().toLowerCase())
      const matchesTag = tag === "All" || tip.tag === tag
      return matchesQuery && matchesTag
    })

  return (
    <article id="content" className="grid gap-8">
      <PageHeader title={site.tipsTitle}>
        <p>{site.tipsIntro}</p>
        <p>{site.tipsSupport}</p>
      </PageHeader>
      {tips.length === 0 ? (
        <EmptyState scene="tips" />
      ) : (
        <div className="grid max-w-3xl gap-4">
          <label className="grid gap-1 text-sm font-semibold text-foreground" data-tip-search="">
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-base font-normal text-foreground"
            />
          </label>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2" data-tip-filters="" aria-label="Filter">
              {["All", ...tags].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={tag === item}
                  onClick={() => setTag(item)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${tag === item ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          {visible.length === 0 ? (
            <p role="status" className="text-foreground">No results</p>
          ) : (
            <Reveal>
              <TipList tips={visible} />
            </Reveal>
          )}
        </div>
      )}
    </article>
  )
}
