import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"

export function ScrollWords({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const words = text.split(" ")
  const [lit, setLit] = useState(reduced !== false ? words.length : 0)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (reduced !== false) {
      setLit(words.length)
      return
    }
    const node = ref.current
    if (!node) return
    const onScroll = () => {
      const rect = node.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, 1 - rect.bottom / (window.innerHeight + rect.height)))
      setLit(Math.round(progress * words.length))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [reduced, words.length])

  return (
    <p ref={ref} data-scroll-words="" className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className={index < lit ? "rounded-md bg-highlight text-highlight-foreground" : ""}>
          {word}{" "}
        </span>
      ))}
    </p>
  )
}
