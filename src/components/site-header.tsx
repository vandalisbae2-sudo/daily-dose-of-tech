import logo from "@/assets/logo.png"
import { navItems, site, type PageId } from "@/content/site.ts"
import { withBase } from "@/lib/paths.ts"
import { ThemeToggle } from "@/components/theme-toggle.tsx"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu.tsx"

export function SiteHeader({ page }: { page: PageId }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:flex md:flex-wrap md:gap-3">
        <a
          href={withBase("/")}
          className="col-start-1 row-start-1 flex min-w-0 items-center gap-3 rounded-md text-foreground no-underline hover:no-underline md:order-1"
        >
          <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-logo-badge p-1.5 shadow-sm ring-1 ring-zinc-300">
            <img
              src={logo}
              alt="Daily Dose of Tech logo"
              width={375}
              height={437}
              className="h-12 w-auto"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-tight text-foreground">
              {site.name}
            </span>
            <span className="block text-sm text-muted-foreground">
              {site.tagline}
            </span>
          </span>
        </a>
        <NavigationMenu
          viewport={false}
          aria-label="Primary"
          className="col-span-2 row-start-2 w-full max-w-none flex-none justify-start md:order-2 md:w-auto md:max-w-full md:flex-1"
        >
          <NavigationMenuList className="w-full flex-col items-stretch justify-start gap-1 md:w-auto md:flex-row md:flex-wrap md:items-center">
            {navItems.map((item) => {
              const active = item.id === page
              return (
                <NavigationMenuItem key={item.id}>
                  <NavigationMenuLink
                    href={withBase(item.path)}
                    active={active}
                    aria-current={active ? "page" : undefined}
                    className="w-full whitespace-normal text-link no-underline hover:bg-highlight hover:text-highlight-foreground hover:no-underline data-[active=true]:bg-highlight data-[active=true]:text-highlight-foreground data-[active=true]:underline md:w-auto md:whitespace-nowrap"
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="col-start-2 row-start-1 md:order-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
