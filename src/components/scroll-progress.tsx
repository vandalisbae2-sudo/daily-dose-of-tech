import { useEffect, useRef } from "react"

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = bar.current
    if (!node) return
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      node.style.transform = `scaleX(${progress})`
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div data-scroll-progress="" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1" aria-hidden="true">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-highlight" />
    </div>
  )
}
