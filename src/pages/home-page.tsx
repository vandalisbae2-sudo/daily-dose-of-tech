import { heroFeatures, site } from "@/content/site.ts"
import { withBase } from "@/lib/paths.ts"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

const headerTones = [
  "bg-secondary text-secondary-foreground",
  "bg-highlight text-highlight-foreground",
  "bg-primary text-primary-foreground",
]

export function HomePage() {
  return (
    <div className="grid gap-10">
      <section className="hero-rise rounded-3xl bg-primary px-5 py-8 text-primary-foreground sm:px-8 sm:py-12">
        <p className="w-fit rounded-full bg-highlight px-3 py-1 text-sm font-bold tracking-wide text-highlight-foreground uppercase">
          {site.tagline}
        </p>
        <p className="mt-5 text-lg font-bold sm:text-2xl">{site.heroKicker}</p>
        <h1 className="mt-2 max-w-3xl text-4xl leading-tight font-bold sm:text-6xl">
          {site.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg">{site.homeLead}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {heroFeatures.map((feature, index) => (
          <Card
            key={feature.page}
            className="h-full gap-0 overflow-hidden border-border py-0 motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
          >
            <CardHeader className={`rounded-none px-6 py-5 ${headerTones[index] ?? headerTones[0]}`}>
              <CardTitle className="text-xl text-inherit">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 py-5">
              <p className="text-base text-foreground">{feature.summary}</p>
              <Button asChild className="h-auto max-w-full shrink whitespace-normal px-4 py-2 text-center">
                <a href={withBase(feature.path)} data-feature-card={feature.page}>
                  {feature.title}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <section className="rounded-3xl bg-secondary px-5 py-8 text-secondary-foreground sm:px-8">
        <h2 className="text-3xl font-bold">{site.learnMoreTitle}</h2>
        <p className="mt-3 max-w-3xl text-lg">{site.learnMoreBody}</p>
      </section>
    </div>
  )
}
