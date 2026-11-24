import { useEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"

function useWide() {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const update = () => setWide(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return wide
}

function SplitTitle({ title, play }: { title: string; play: boolean }) {
  let offset = 0
  return (
    <>
      {title.split(" ").map((word, wordIndex) => {
        const start = offset
        offset += word.length + 1
        return (
          <span key={`${word}-${wordIndex}`}>
            <span data-word="" className="inline-block whitespace-nowrap">
              {play
                ? word.split("").map((char, index) => (
                    <span key={`${char}-${index}`} className="letter" style={{ animationDelay: `${(start + index) * 0.025}s` }}>
                      {char}
                    </span>
                  ))
                : word}
            </span>
            {wordIndex < title.split(" ").length - 1 ? " " : null}
          </span>
        )
      })}
    </>
  )
}

export function PageHeader({
  title,
  children,
}: {
  title: string
  eyebrow?: string
  children?: ReactNode
}) {
  const reduced = useReducedMotion()
  const wide = useWide()
  const play = reduced === false && wide
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!play) return
    const onScroll = () => {
      layer.current?.style.setProperty("--py", `${window.scrollY * 0.18}px`)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [play])

  return (
    <header data-immersive-header="" className="relative mb-10 flex min-h-[60vh] items-end overflow-hidden px-4 pt-28 pb-16 text-primary-foreground dark:text-foreground">
      <div aria-hidden="true" className="absolute inset-0 bg-primary dark:hidden" />
      <div aria-hidden="true" className="page-header-glow absolute inset-0 hidden dark:block" />
      <div ref={layer} aria-hidden="true" className={`page-grid absolute inset-0 ${play ? "page-parallax" : ""}`} />
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <h1 className="max-w-5xl text-5xl leading-none font-bold sm:text-7xl">
          <SplitTitle title={title} play={play} />
        </h1>
        {children ? <div className="mt-6 grid max-w-3xl gap-3 text-lg">{children}</div> : null}
      </div>
    </header>
  )
}
