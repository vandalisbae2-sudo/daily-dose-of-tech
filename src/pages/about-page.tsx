import { site } from "@/content/site.ts"
import { PageHeader } from "@/components/page-header.tsx"
import { Separator } from "@/components/ui/separator.tsx"

export function AboutPage() {
  return (
    <article className="grid gap-8">
      <p className="text-sm font-bold tracking-wide text-kicker uppercase">
        {site.aboutKicker}
      </p>
      <PageHeader title={site.aboutTitle}>
        <p className="text-2xl font-bold">{site.name}</p>
        <p>{site.aboutLead}</p>
      </PageHeader>
      <div className="grid max-w-3xl gap-6">
        <Separator />
        <section className="grid gap-2">
          <h2 className="w-fit max-w-full rounded-2xl bg-secondary px-3 py-1 text-2xl font-bold text-secondary-foreground">
            {site.aboutTipsTitle}
          </h2>
          <p className="text-lg text-foreground">{site.aboutTipsBody}</p>
        </section>
        <section className="grid gap-2">
          <h2 className="w-fit max-w-full rounded-2xl bg-highlight px-3 py-1 text-2xl font-bold text-highlight-foreground">
            {site.guidesTitle}
          </h2>
          <p className="text-lg font-semibold text-kicker">{site.guidesLine}</p>
        </section>
        <section className="grid gap-2">
          <h2 className="w-fit max-w-full rounded-2xl bg-primary px-3 py-1 text-2xl font-bold text-primary-foreground">
            {site.pcDreamTitle}
          </h2>
          <p className="text-lg text-foreground">{site.pcDreamBody}</p>
        </section>
      </div>
    </article>
  )
}
