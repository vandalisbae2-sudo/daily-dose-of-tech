import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { heroFeatures, site } from "@/content/site.ts"
import { withBase } from "@/lib/paths.ts"
import { HeroBackdrop } from "@/components/hero-backdrop.tsx"
import { Marquee } from "@/components/marquee.tsx"
import { RotatingTagline } from "@/components/rotating-tagline.tsx"
import { ScrollWords } from "@/components/scroll-words.tsx"
import { Button } from "@/components/ui/button.tsx"

const tones = ["bg-secondary text-secondary-foreground", "bg-highlight text-highlight-foreground", "bg-primary text-primary-foreground"]

function useCoarse() {
  const [coarse, setCoarse] = useState(true)
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse), (max-width: 767px)")
    const update = () => setCoarse(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return coarse
}

function Letters({ text }: { text: string }) {
  const reduced = useReducedMotion()
  const [play, setPlay] = useState(false)
  useEffect(() => {
    if (reduced === false) setPlay(true)
  }, [reduced])
  const words = text.split(" ")
  let offset = 0
  return (
    <>
      {words.map((word, wordIndex) => {
        const start = offset
        offset += word.length + 1
        return (
          <span key={`${word}-${wordIndex}`}>
            <span data-word="" className="inline-block whitespace-nowrap">
              {play
                ? word.split("").map((char, index) => (
                    <span key={`${char}-${index}`} className="letter" style={{ animationDelay: `${(start + index) * 0.03}s` }}>
                      {char}
                    </span>
                  ))
                : word}
            </span>
            {wordIndex < words.length - 1 ? " " : null}
          </span>
        )
      })}
    </>
  )
}

function Magnetic({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const coarse = useCoarse()
  const ref = useRef<HTMLDivElement>(null)
  function move(event: PointerEvent<HTMLDivElement>) {
    const node = ref.current
    if (!node || reduced !== false || coarse) return
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - (rect.left + rect.width / 2)) * 0.25
    const y = (event.clientY - (rect.top + rect.height / 2)) * 0.25
    node.style.transform = `translate(${x}px, ${y}px)`
  }
  function leave() {
    if (ref.current) ref.current.style.transform = ""
  }
  return (
    <div data-magnetic="" ref={ref} onPointerMove={move} onPointerLeave={leave} className="inline-flex max-w-full">
      {children}
    </div>
  )
}

function Spotlight({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const coarse = useCoarse()
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced !== false || coarse) return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--sx", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--sy", `${event.clientY - rect.top}px`)
  }
  return (
    <div data-spotlight="" onPointerMove={move} className="spotlight relative">
      {children}
    </div>
  )
}

function PinnedStory() {
  const reduced = useReducedMotion()
  const coarse = useCoarse()
  const stack = reduced !== false || coarse
  const [chapter, setChapter] = useState(0)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (stack) return
    const node = ref.current
    if (!node) return
    const onScroll = () => {
      const rect = node.getBoundingClientRect()
      const total = node.offsetHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, -rect.top / total))
      setChapter(Math.min(2, Math.floor(progress * 3)))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [stack])

  const body = (
    <div className={stack ? "grid" : "sticky top-0 h-dvh"}>
      <ol data-chapter-rail="" className={stack ? "flex gap-2 px-4 pt-6" : "absolute top-1/2 left-4 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex"}>
        {heroFeatures.map((feature, index) => (
          <li key={feature.page}>
            <a
              href={withBase(feature.path)}
              aria-current={chapter === index ? "true" : undefined}
              className="inline-flex size-9 items-center justify-center rounded-full bg-background font-bold text-foreground no-underline aria-[current=true]:bg-highlight aria-[current=true]:text-highlight-foreground"
            >
              0{index + 1}
            </a>
          </li>
        ))}
      </ol>
      {heroFeatures.map((feature, index) => {
        const hidden = !stack && chapter !== index
        return (
        <article
          key={feature.page}
          data-chapter=""
          data-tone={index}
          data-fullscreen={stack ? "false" : "true"}
          data-active={hidden ? "false" : "true"}
          data-tilt-card=""
          inert={hidden ? true : undefined}
          aria-hidden={hidden ? true : undefined}
          className={`${tones[index]} flex flex-col justify-center px-6 py-16 md:px-24 ${stack ? "min-h-[70vh]" : "absolute inset-0"}`}
          style={stack ? undefined : { opacity: hidden ? 0 : 1, visibility: hidden ? "hidden" : "visible" }}
        >
          <p data-chapter-number="" className={stack ? "text-8xl font-bold leading-none" : "text-[clamp(6rem,18vw,16rem)] font-bold leading-none"}>
            0{index + 1}
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl font-bold md:text-6xl">{feature.title}</h2>
          <p className="mt-4 max-w-2xl text-lg">{feature.summary}</p>
          <Magnetic>
            <Button asChild className="mt-6 h-auto max-w-full shrink whitespace-normal">
              <a href={withBase(feature.path)} data-feature-card={feature.page}>
                {feature.title}
              </a>
            </Button>
          </Magnetic>
        </article>
        )
      })}
    </div>
  )

  if (stack) {
    return (
      <section data-pinned-story="" data-stacked="true">
        {body}
      </section>
    )
  }
  return (
    <section ref={ref} data-pinned-story="" data-stacked="false" className="relative h-[300vh]">
      {body}
    </section>
  )
}

function Bento() {
  const tiles = [
    { title: heroFeatures[0]?.title ?? "", body: heroFeatures[0]?.summary ?? "", href: heroFeatures[0]?.path ?? "/", page: heroFeatures[0]?.page ?? "tips", className: "md:col-span-2 md:row-span-2" },
    { title: heroFeatures[1]?.title ?? "", body: heroFeatures[1]?.summary ?? "", href: heroFeatures[1]?.path ?? "/", page: heroFeatures[1]?.page ?? "pc", className: "" },
    { title: heroFeatures[2]?.title ?? "", body: heroFeatures[2]?.summary ?? "", href: heroFeatures[2]?.path ?? "/", page: heroFeatures[2]?.page ?? "insights", className: "" },
    { title: site.pcDreamTitle, body: site.pcDreamBody, href: "/pc-building/", page: "pc", className: "md:col-span-2" },
    { title: site.guidesTitle, body: site.guidesLine, href: "/insights/", page: "insights", className: "" },
  ]
  return (
    <div id="content" data-bento="" data-reveal="" className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
      {tiles.map((tile) => (
        <article key={tile.title} className={`bento-tile lift-card glass min-w-0 rounded-3xl p-6 ${tile.className}`}>
          <h2 className="text-2xl font-bold text-foreground">{tile.title}</h2>
          <p className="mt-3 text-foreground">{tile.body}</p>
          <Magnetic>
            <Button asChild className="mt-4 h-auto max-w-full shrink whitespace-normal">
              <a href={withBase(tile.href)}>{tile.title}</a>
            </Button>
          </Magnetic>
        </article>
      ))}
    </div>
  )
}

function Finale() {
  return (
    <section data-learn-finale="" data-learn-more="" className="relative overflow-hidden bg-secondary px-4 py-24 text-secondary-foreground">
      <div aria-hidden="true" className="learn-sheen pointer-events-none absolute inset-y-0 left-0" />
      <div className="relative mx-auto max-w-5xl">
        <h2 className="mb-6 text-4xl font-bold md:text-6xl">{site.learnMoreTitle}</h2>
        <ScrollWords text={site.learnMoreBody} className="text-3xl leading-tight font-bold md:text-5xl" />
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <Spotlight>
      <section data-hero="" className="relative min-h-dvh overflow-hidden">
        <HeroBackdrop />
        <div className="relative z-10 flex min-h-dvh flex-col justify-end px-4 pt-28 pb-16 sm:px-10" style={{ color: "var(--hero-text)" }}>
          <RotatingTagline />
          <p className="hero-copy mt-6 max-w-3xl text-xl font-bold sm:text-3xl">
            <Letters text={site.heroKicker} />
          </p>
          <h1 data-display-title="" data-title-fill="" className="title-fill mt-3 max-w-full text-[clamp(2.75rem,13.5vw,12.5rem)] leading-[0.9] font-bold">
            <Letters text={site.name} />
          </h1>
          <p className="hero-copy mt-6 max-w-2xl text-lg">{site.homeLead}</p>
          <p aria-hidden="true" className="mt-10 text-3xl leading-none">↓</p>
        </div>
      </section>
      <Marquee />
      <PinnedStory />
      <Bento />
      <Finale />
    </Spotlight>
  )
}
