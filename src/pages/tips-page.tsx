import { tips } from "@/content/tips.ts"
import { site } from "@/content/site.ts"
import { ComingSoonNote } from "@/components/coming-soon-note.tsx"
import { PageHeader } from "@/components/page-header.tsx"
import { TipList } from "@/components/tip-list.tsx"

export function TipsPage() {
  return (
    <article className="grid gap-8">
      <PageHeader title={site.tipsTitle}>
        <p>{site.tipsIntro}</p>
        <p>{site.tipsSupport}</p>
      </PageHeader>
      <div className="max-w-3xl">
        {tips.length === 0 ? <ComingSoonNote /> : <TipList tips={tips} />}
      </div>
    </article>
  )
}
