import type { PageId } from "@/content/site.ts"

export function baseUrl(): string {
  const value = import.meta.env.BASE_URL || "/daily-dose-of-tech/"
  return value.endsWith("/") ? value : `${value}/`
}

export function withBase(path: string): string {
  const base = baseUrl()
  if (path === "/" || path === "") return base
  const trimmed = path.startsWith("/") ? path.slice(1) : path
  return `${base}${trimmed}`
}

export function pageFromPath(pathname: string): PageId {
  const base = baseUrl().replace(/\/$/, "")
  let path = pathname
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/index\.html$/, "")
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  switch (path) {
    case "/daily-tech-tips":
      return "tips"
    case "/pc-building":
      return "pc"
    case "/insights":
      return "insights"
    case "/about":
      return "about"
    default:
      return "home"
  }
}
