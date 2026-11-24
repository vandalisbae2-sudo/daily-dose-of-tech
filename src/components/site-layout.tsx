import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { PageId } from "@/content/site.ts"
import { Marquee } from "@/components/marquee.tsx"
import { PaletteHost } from "@/components/palette-host.tsx"
import { ScrollProgress } from "@/components/scroll-progress.tsx"
import { SiteFooter } from "@/components/site-footer.tsx"
import { SiteHeader } from "@/components/site-header.tsx"
import { SmoothScroll } from "@/components/smooth-scroll.tsx"

export function SiteLayout({
  page,
  children,
}: {
  page: PageId
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-highlight focus:px-3 focus:py-2 focus:text-highlight-foreground"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <ScrollProgress />
      <SiteHeader page={page} />
      <PaletteHost />
      <motion.main
        data-page-transition=""
        className="w-full flex-1"
        initial={reduced === false ? { opacity: 0.92, y: 16 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced === false ? 0.45 : 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <Marquee compact />
      <SiteFooter />
    </div>
  )
}
