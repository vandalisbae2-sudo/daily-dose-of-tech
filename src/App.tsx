import type { PageId } from "@/content/site.ts"
import { SiteLayout } from "@/components/site-layout.tsx"
import { AboutPage } from "@/pages/about-page.tsx"
import { HomePage } from "@/pages/home-page.tsx"
import { InsightsPage } from "@/pages/insights-page.tsx"
import { PcBuildingPage } from "@/pages/pc-building-page.tsx"
import { TipsPage } from "@/pages/tips-page.tsx"

export function App({ page }: { page: PageId }) {
  return (
    <SiteLayout page={page}>
      {page === "home" ? <HomePage /> : null}
      {page === "tips" ? <TipsPage /> : null}
      {page === "pc" ? <PcBuildingPage /> : null}
      {page === "insights" ? <InsightsPage /> : null}
      {page === "about" ? <AboutPage /> : null}
    </SiteLayout>
  )
}
