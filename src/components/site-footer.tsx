import { navItems, site } from "@/content/site.ts"
import { withBase } from "@/lib/paths.ts"
import { Separator } from "@/components/ui/separator.tsx"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <div>
          <p className="text-lg font-bold text-foreground">{site.name}</p>
          <p className="text-sm text-muted-foreground">{site.tagline}</p>
        </div>
        <Separator />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={withBase(item.path)} className="font-medium">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
