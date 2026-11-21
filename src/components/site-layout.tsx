import type { ReactNode } from "react"
import type { PageId } from "@/content/site.ts"
import { SiteFooter } from "@/components/site-footer.tsx"
import { SiteHeader } from "@/components/site-header.tsx"

export function SiteLayout({
  page,
  children,
}: {
  page: PageId
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-highlight focus:px-3 focus:py-2 focus:text-highlight-foreground"
      >
        Skip to content
      </a>
      <SiteHeader page={page} />
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
