import { site } from "@/content/site.ts"
import { PageHeader } from "@/components/page-header.tsx"
import { Reveal } from "@/components/reveal.tsx"
import { ScrollWords } from "@/components/scroll-words.tsx"

export function AboutPage() {
  return (
    <article id="content" className="grid gap-10 pb-16">
      <PageHeader title={site.aboutTitle}>
        <p className="text-sm font-bold tracking-wide uppercase">{site.aboutKicker}</p>
        <p className="text-2xl font-bold">{site.name}</p>
        <p>{site.aboutLead}</p>
      </PageHeader>
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4">
        <Reveal>
          <section>
            <h2 className="text-4xl font-bold text-foreground md:text-6xl">{site.aboutTipsTitle}</h2>
            <ScrollWords text={site.aboutTipsBody} className="mt-4 text-2xl text-foreground" />
          </section>
        </Reveal>
        <Reveal>
          <section>
            <h2 className="text-4xl font-bold text-foreground md:text-6xl">{site.guidesTitle}</h2>
            <ScrollWords text={site.guidesLine} className="mt-4 text-2xl text-foreground" />
            <p aria-hidden="true" className="echo-line mt-6 text-4xl font-bold text-transparent md:text-7xl">
              {site.guidesLine}
            </p>
          </section>
        </Reveal>
        <Reveal>
          <section>
            <h2 className="text-4xl font-bold text-foreground md:text-6xl">{site.pcDreamTitle}</h2>
            <ScrollWords text={site.pcDreamBody} className="mt-4 text-2xl text-foreground" />
          </section>
        </Reveal>
      </div>
    </article>
  )
}
