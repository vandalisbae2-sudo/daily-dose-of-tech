import { useEffect, useLayoutEffect, useRef, useState } from "react"
import logo from "@/assets/logo.png"
import { navItems, site, type PageId } from "@/content/site.ts"
import { withBase } from "@/lib/paths.ts"
import { openPalette } from "@/components/palette-host.tsx"
import { ThemeToggle } from "@/components/theme-toggle.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu.tsx"

const pillKey = "ddot-nav-pill"

function savePillOrigin() {
  const list = document.querySelector<HTMLElement>("[data-nav-list]")
  const pill = list?.querySelector<HTMLElement>("[data-nav-indicator]")
  if (!list || !pill) return
  const listBox = list.getBoundingClientRect()
  const pillBox = pill.getBoundingClientRect()
  if (pillBox.width < 2) return
  try {
    sessionStorage.setItem(
      pillKey,
      JSON.stringify({ left: pillBox.left - listBox.left, width: pillBox.width }),
    )
  } catch {
    // Storage can be blocked. The next page then shows a static pill.
  }
}

export function SiteHeader({ page }: { page: PageId }) {
  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pillSettled, setPillSettled] = useState(false)
  const pillRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const pill = pillRef.current
    const list = pill?.closest<HTMLElement>("[data-nav-list]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let saved: { left: number; width: number } | null = null
    try {
      const raw = sessionStorage.getItem(pillKey)
      sessionStorage.removeItem(pillKey)
      saved = raw ? (JSON.parse(raw) as { left: number; width: number }) : null
    } catch {
      saved = null
    }
    if (!pill || !list || reduced || !saved || saved.width < 2) {
      setPillSettled(true)
      return
    }
    const listBox = list.getBoundingClientRect()
    const pillBox = pill.getBoundingClientRect()
    if (pillBox.width < 2) {
      setPillSettled(true)
      return
    }
    const dx = saved.left - (pillBox.left - listBox.left)
    const ratio = saved.width / pillBox.width
    if (Math.abs(dx) < 0.5 && Math.abs(ratio - 1) < 0.02) {
      setPillSettled(true)
      return
    }
    const endLeft = pillBox.left - listBox.left
    list.style.setProperty("--pill-dx", `${dx}px`)
    list.style.setProperty("--pill-s", `${ratio}`)
    list.style.setProperty("--ink-x", `${endLeft}px`)
    list.style.setProperty("--ink-y", `${pillBox.top - listBox.top}px`)
    list.style.setProperty("--ink-w", `${pillBox.width}px`)
    list.style.setProperty("--ink-h", `${pillBox.height}px`)
    list.style.setProperty("--list-w", `${listBox.width}px`)
    list.style.setProperty("--list-h", `${listBox.height}px`)
    list.style.transition = "none"
    list.style.setProperty("--pill-p", "0")
    list.dataset.pillSliding = "true"
    let timer = 0
    const settled = () => {
      const value = getComputedStyle(pill).transform
      if (value === "none") return true
      const match = value.match(/matrix\(([^)]+)\)/)
      if (!match?.[1]) return false
      const parts = match[1].split(",").map((part) => Number(part.trim()))
      return Math.abs((parts[0] ?? 1) - 1) < 0.01 && Math.abs(parts[4] ?? 0) < 0.5 && Math.abs(parts[5] ?? 0) < 0.5
    }
    let finished = false
    const finish = () => {
      if (finished || !settled()) return
      finished = true
      setPillSettled(true)
    }
    const frame = window.requestAnimationFrame(() => {
      ;(window as Window & { __pillSlideStart?: number }).__pillSlideStart = performance.now()
      list.style.transition = "--pill-p 300ms ease"
      list.style.setProperty("--pill-p", "1")
      const watch = () => {
        if (finished) return
        if (settled()) {
          finish()
          return
        }
        timer = window.setTimeout(watch, 40)
      }
      timer = window.setTimeout(watch, 400)
    })
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName === "--pill-p") finish()
    }
    list.addEventListener("transitionend", onEnd)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      list.removeEventListener("transitionend", onEnd)
      delete list.dataset.pillSliding
      list.style.transition = ""
    }
  }, [page])

  useLayoutEffect(() => {
    if (!pillSettled) return
    const list = document.querySelector("[data-nav-list]")
    if (!(list instanceof HTMLElement)) return
    delete list.dataset.pillSliding
    list.style.transition = ""
  }, [pillSettled])

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setCompact(y > 12)
      setHidden(y > last && y > 80)
      last = y
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <header
      data-glass-nav=""
      data-compact={compact ? "true" : "false"}
      data-hidden={hidden ? "true" : "false"}
      onFocusCapture={() => setHidden(false)}
      className="sticky-nav fixed inset-x-0 top-2 z-40 mx-auto w-[min(100%-1rem,72rem)] rounded-2xl border border-white/30 bg-background/80 shadow-lg backdrop-blur-xl xl:top-3 xl:rounded-full"
    >
      <div className="relative flex min-w-0 items-center gap-2 px-2 py-2 xl:gap-3 xl:px-3">
        <a
          href={withBase("/")}
          className="flex min-w-0 items-center gap-2 rounded-md text-foreground no-underline hover:no-underline"
        >
          <span className="logo-mark inline-flex shrink-0 items-center justify-center rounded-2xl bg-logo-badge p-1 shadow-sm ring-1 ring-zinc-300">
            <img
              src={logo}
              alt="Daily Dose of Tech logo"
              width={375}
              height={437}
              className="h-9 w-auto origin-left xl:h-12"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight text-foreground xl:text-base">
              {site.name}
            </span>
            <span className="hidden text-sm text-muted-foreground xl:block">{site.tagline}</span>
          </span>
        </a>
        <NavigationMenu
          viewport={false}
          aria-label="Primary"
          className="hidden min-w-0 flex-1 justify-start xl:flex"
        >
          <NavigationMenuList data-nav-list="" className="flex-nowrap items-center gap-1">
            {navItems.map((item) => {
              const active = item.id === page
              return (
                <NavigationMenuItem key={item.id} className="relative">
                  <NavigationMenuLink
                    href={withBase(item.path)}
                    active={active}
                    aria-current={active ? "page" : undefined}
                    className={`relative whitespace-nowrap bg-transparent no-underline hover:no-underline data-[active=true]:bg-transparent ${active && pillSettled ? "nav-active hover:bg-transparent" : "text-link hover:bg-highlight hover:text-highlight-foreground"}`}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                      savePillOrigin()
                    }}
                  >
                    {active ? (
                      <span
                        ref={pillRef}
                        data-nav-indicator=""
                        aria-hidden="true"
                        className="absolute inset-0 z-0 rounded-md bg-highlight"
                      />
                    ) : null}
                    <span data-nav-label="">{item.label}</span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
            <span data-nav-ink="" aria-hidden="true">
              <span data-nav-ink-track="">
                {navItems.map((item) => (
                  <span data-nav-ink-item="" key={item.id}>{item.label}</span>
                ))}
              </span>
            </span>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            data-palette-trigger=""
            className="px-2.5 xl:px-4"
            onClick={() => openPalette()}
          >
            Search
            <kbd className="ml-2 hidden rounded-md bg-highlight px-1.5 py-0.5 text-xs text-highlight-foreground xl:inline">⌘K</kbd>
          </Button>
          <ThemeToggle />
          <Button
            type="button"
            variant="secondary"
            className="px-2.5 xl:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </Button>
        </div>
      </div>
      {menuOpen ? (
        <nav id="site-menu" aria-label="Primary" className="absolute top-full right-0 left-0 z-40 mt-2 rounded-xl border border-border bg-background p-2 shadow-lg xl:hidden">
          <ul className="grid gap-1">
            {navItems.map((item) => {
              const active = item.id === page
              return (
                <li key={item.id}>
                  <a
                    href={withBase(item.path)}
                    aria-current={active ? "page" : undefined}
                    className="block rounded-md px-3 py-2 text-link no-underline hover:bg-highlight hover:text-highlight-foreground aria-[current=page]:bg-highlight aria-[current=page]:text-highlight-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
