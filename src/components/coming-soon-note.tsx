import { site } from "@/content/site.ts"

export function ComingSoonNote() {
  return (
    <p
      className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-base text-foreground"
      role="status"
    >
      {site.comingSoon}
    </p>
  )
}
