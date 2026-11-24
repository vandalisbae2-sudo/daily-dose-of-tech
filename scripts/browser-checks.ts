import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer, { type Page } from "puppeteer-core"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const previewPort = 43219
const devPort = 43921
const chrome = "/opt/google/chrome/chrome"

const routes = [
  { id: "home", path: "/daily-dose-of-tech/" },
  { id: "tips", path: "/daily-dose-of-tech/daily-tech-tips/" },
  { id: "pc", path: "/daily-dose-of-tech/pc-building/" },
  { id: "insights", path: "/daily-dose-of-tech/insights/" },
  { id: "about", path: "/daily-dose-of-tech/about/" },
] as const

type Check = { name: string; pass: boolean; detail: unknown }
const checks: Check[] = []

function record(name: string, pass: boolean, detail: unknown) {
  checks.push({ name, pass, detail })
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(url: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Server is still booting.
    }
    await sleep(200)
  }
  throw new Error(`Server did not respond at ${url}`)
}

function startServer(args: string[], cwd: string): ChildProcess {
  return spawn(process.execPath, args, { cwd, stdio: "ignore" })
}

async function navPill(page: Page) {
  return page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('header [data-slot="navigation-menu-link"][aria-current="page"]')
    const pill = link?.querySelector<HTMLElement>("[data-nav-indicator]") ?? null
    if (!link || !pill) return { ok: false, reason: "missing", label: link?.textContent?.trim() ?? "" }
    const linkBox = link.getBoundingClientRect()
    const pillBox = pill.getBoundingClientRect()
    const inside =
      pillBox.width > 2 &&
      pillBox.left >= linkBox.left - 1 &&
      pillBox.right <= linkBox.right + 1 &&
      pillBox.top >= linkBox.top - 1 &&
      pillBox.bottom <= linkBox.bottom + 1
    const parse = (color: string) => {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return null
      return [Number(match[1]), Number(match[2]), Number(match[3])]
    }
    const channel = (value: number) => {
      const scaled = value / 255
      return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
    }
    const luminance = (rgb: number[]) => 0.2126 * channel(rgb[0] ?? 0) + 0.7152 * channel(rgb[1] ?? 0) + 0.0722 * channel(rgb[2] ?? 0)
    const foreground = parse(getComputedStyle(link).color)
    const fill = parse(getComputedStyle(pill).backgroundColor)
    let ratio = 0
    if (foreground && fill) {
      const lighter = Math.max(luminance(foreground), luminance(fill))
      const darker = Math.min(luminance(foreground), luminance(fill))
      ratio = (lighter + 0.05) / (darker + 0.05)
    }
    return {
      ok: inside && ratio >= 4.5,
      inside,
      ratio: Number(ratio.toFixed(2)),
      label: (link.textContent ?? "").trim(),
      color: getComputedStyle(link).color,
      fill: getComputedStyle(pill).backgroundColor,
    }
  })
}

async function readTheme(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement
    return {
      darkClass: root.classList.contains("dark"),
      dataTheme: root.dataset.theme ?? "",
      stored: (() => {
        try {
          return localStorage.getItem("theme")
        } catch {
          return "blocked"
        }
      })(),
      htmlBackground: getComputedStyle(root).backgroundColor,
    }
  })
}

type PillSample = {
  left: number
  right: number
  top: number
  bottom: number
  barLeft: number
  barRight: number
  barTop: number
  barBottom: number
  links: Array<{
    text: string
    color: string
    left: number
    right: number
    top: number
    bottom: number
    active: boolean
    hit: string
  }>
}

function coverRatio(sample: PillSample, link: PillSample["links"][number]) {
  const width = Math.max(0, Math.min(sample.right, link.right) - Math.max(sample.left, link.left))
  const height = Math.max(0, Math.min(sample.bottom, link.bottom) - Math.max(sample.top, link.top))
  const area = Math.max(0, link.right - link.left) * Math.max(0, link.bottom - link.top)
  return area > 0 ? (width * height) / area : 0
}

function parseRgb(color: string) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function channel(value: number) {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function luminance(rgb: number[]) {
  return 0.2126 * channel(rgb[0] ?? 0) + 0.7152 * channel(rgb[1] ?? 0) + 0.0722 * channel(rgb[2] ?? 0)
}

function contrastAgainstYellow(color: string) {
  const rgb = parseRgb(color)
  if (!rgb) return 0
  const text = luminance(rgb)
  const yellow = luminance([253, 224, 71])
  const lighter = Math.max(text, yellow)
  const darker = Math.min(text, yellow)
  return (lighter + 0.05) / (darker + 0.05)
}

function isDarkLabel(color: string) {
  const rgb = parseRgb(color)
  return Boolean(rgb && Math.abs((rgb[0] ?? 0) - 24) < 2 && Math.abs((rgb[1] ?? 0) - 24) < 2 && Math.abs((rgb[2] ?? 0) - 27) < 2)
}

function judgePill(samples: PillSample[]) {
  const darkWithoutCover = samples.filter((sample) =>
    sample.links.some((link) => isDarkLabel(link.color) && coverRatio(sample, link) < 0.05),
  )
  const covered = samples.flatMap((sample) =>
    sample.links
      .filter((link) => coverRatio(sample, link) >= 0.5)
      .map((link) => contrastAgainstYellow(link.color)),
  )
  const coveredLabel = samples.filter((sample) =>
    sample.links.some((link) => !link.active && coverRatio(sample, link) > 0 && link.hit === "pill"),
  )
  const distinctX = new Set(samples.map((sample) => Math.round(sample.left))).size
  const worstRatio = covered.length > 0 ? Math.min(...covered) : 0
  return {
    darkWithoutCover: darkWithoutCover.length,
    coveredLabel: coveredLabel.length,
    distinctX,
    coveredSamples: covered.length,
    worstRatio: Number(worstRatio.toFixed(2)),
    lowContrast: covered.filter((ratio) => ratio < 4.5).length,
  }
}

const glyphPython = `
import json, sys
from PIL import Image
normal = Image.open(sys.argv[1]).convert("RGB")
hidden = Image.open(sys.argv[2]).convert("RGB")
payload = json.loads(sys.argv[3])
glyphs = payload["glyphs"]
link = tuple(payload["link"])
dark = (24, 24, 27)

def channel(value):
    scaled = value / 255
    return scaled / 12.92 if scaled <= 0.04045 else ((scaled + 0.055) / 1.055) ** 2.4

def luminance(rgb):
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])

def contrast(a, b):
    left, right = luminance(a), luminance(b)
    return (max(left, right) + 0.05) / (min(left, right) + 0.05)

def distance(a, b):
    return sum((a[i] - b[i]) ** 2 for i in range(3))

worst = {"ratio": 99, "label": "", "ch": ""}
count = 0
fails = 0
bad = []
for glyph in glyphs:
    if not glyph["ch"].strip():
        continue
    box = glyph["box"]
    best = None
    for y in range(max(0, int(box["y"])), min(normal.height, int(box["y"] + box["h"]) + 1)):
        for x in range(max(0, int(box["x"])), min(normal.width, int(box["x"] + box["w"]) + 1)):
            fg = normal.getpixel((x, y))
            bg = hidden.getpixel((x, y))
            delta = max(abs(fg[i] - bg[i]) for i in range(3))
            if best is None or delta > best[0]:
                best = (delta, fg, bg)
    if best is None or best[0] < 24:
        fails += 1
        count += 1
        worst = {"ratio": 0, "label": glyph["label"], "ch": glyph["ch"]}
        continue
    _delta, fg, bg = best
    ratio = contrast(fg, bg)
    pill = bg[2] < 130 and bg[0] > 200 and bg[1] > 160
    ink_l = luminance(fg)
    bg_l = luminance(bg)
    light_on_yellow = pill and ink_l > 0.35
    dark_on_dark = (not pill) and ink_l < 0.08 and bg_l < 0.25
    ok = (not light_on_yellow) and (not dark_on_dark) and (ratio >= 4.5 or box["w"] < 8)
    count += 1
    if ratio < worst["ratio"]:
        worst = {"ratio": round(ratio, 2), "label": glyph["label"], "ch": glyph["ch"], "w": round(box["w"], 2)}
    if not ok:
        fails += 1
        if len(bad) < 6:
            bad.append({"label": glyph["label"], "ch": glyph["ch"], "w": round(box["w"], 2), "ratio": round(ratio, 2), "dark": dark_ink, "pill": pill})
print(json.dumps({"count": count, "fails": fails, "worstRatio": worst["ratio"], "worstLabel": worst["label"], "worstChar": worst["ch"], "bad": bad}))
`

async function glyphContrast(page: Page, normalPath: string, where: string) {
  const glyphs = await page.evaluate(() => {
    const rows: Array<{ ch: string; label: string; box: { x: number; y: number; w: number; h: number } }> = []
    const source = document.querySelector("[data-nav-label]")
    const parsed = source ? getComputedStyle(source).color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) : null
    const link = parsed ? [Number(parsed[1]), Number(parsed[2]), Number(parsed[3])] : [0, 0, 0]
    for (const label of document.querySelectorAll("[data-nav-label]")) {
      const text = label.firstChild
      if (!text || text.nodeType !== Node.TEXT_NODE) continue
      const value = text.textContent ?? ""
      for (let index = 0; index < value.length; index += 1) {
        const range = document.createRange()
        range.setStart(text, index)
        range.setEnd(text, index + 1)
        const box = range.getBoundingClientRect()
        if (box.width < 1 || box.height < 1) continue
        rows.push({
          ch: value[index] ?? "",
          label: (label.textContent ?? "").trim(),
          box: { x: box.x, y: box.y, w: box.width, h: box.height },
        })
      }
    }
    return { glyphs: rows, link }
  })
  const hiddenPath = normalPath.replace(/\.png$/, "-bg.png")
  await page.evaluate(() => {
    const style = document.createElement("style")
    style.id = "glyph-hide"
    style.textContent = "[data-nav-label],[data-nav-ink-item]{color:transparent !important;-webkit-text-fill-color:transparent !important}"
    document.head.append(style)
  })
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))))
  await page.screenshot({
    path: hiddenPath,
    clip: { x: 0, y: 0, width: 1440, height: 120 },
    captureBeyondViewport: false,
  })
  await page.evaluate(() => document.getElementById("glyph-hide")?.remove())
  const run = spawnSync("python3", ["-c", glyphPython, normalPath, hiddenPath, JSON.stringify(glyphs)], { encoding: "utf8" })
  if (run.status !== 0) {
    return { ok: false, count: 0, fails: 1, worstRatio: 0, worstLabel: where, worstChar: "", error: run.stderr }
  }
  return JSON.parse(run.stdout) as { count: number; fails: number; worstRatio: number; worstLabel: string; worstChar: string }
}

function near(value: string, expected: [number, number, number]) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return false
  return [1, 2, 3].every((index) => Math.abs(Number(match[index]) - (expected[index - 1] ?? 0)) <= 2)
}

async function installFlashProbe(page: Page) {
  await page.evaluateOnNewDocument(() => {
    const samples: { phase: string; t: number; dark: boolean; theme: string }[] = []
    ;(window as unknown as { __themeSamples: typeof samples }).__themeSamples = samples
    const recordSample = (phase: string) => {
      const root = document.documentElement
      if (!root) return
      samples.push({
        phase,
        t: performance.now(),
        dark: root.classList.contains("dark"),
        theme: root.dataset.theme ?? "",
      })
    }
    const boot = () => {
      if (!document.documentElement) {
        requestAnimationFrame(boot)
        return
      }
      recordSample("start")
      requestAnimationFrame(() => recordSample("raf"))
    }
    boot()
  })
}

async function overflow(page: Page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
}

const originals = new Map<string, string>()
const contentFiles = {
  tips: path.join(root, "src/content/tips.ts"),
  steps: path.join(root, "src/content/pc-build-steps.ts"),
  insights: path.join(root, "src/content/insights.ts"),
}

async function restoreContent() {
  for (const [file, text] of originals) {
    await writeFile(file, text)
  }
}

export async function run(): Promise<number> {
  const shotDir = path.join(root, "screenshots")
  await mkdir(shotDir, { recursive: true })
  await mkdir(path.join(root, "build-checks"), { recursive: true })
  for (const name of await readdir(shotDir)) {
    if (name.endsWith(".png") && !name.startsWith("v1-")) await unlink(path.join(shotDir, name))
  }

  const preview = startServer(
    [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort"],
    root,
  )
  const previewOrigin = `http://127.0.0.1:${previewPort}`
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  })

  try {
    await waitFor(`${previewOrigin}/daily-dose-of-tech/`)

    for (const route of routes) {
      const page = await browser.newPage()
      await page.goto(`${previewOrigin}${route.path}`, { waitUntil: "networkidle0" })
      const count = await page.$$eval("h1", (nodes) => nodes.length)
      record(`one h1 on ${route.id}`, count === 1, count)
      await page.close()
    }

    for (const id of ["tips", "pc", "insights"] as const) {
      const route = routes.find((item) => item.id === id)
      const page = await browser.newPage()
      await page.goto(`${previewOrigin}${route?.path}`, { waitUntil: "networkidle0" })
      const text = await page.$eval("[data-empty-state]", (node) => node.textContent ?? "")
      const probe = await page.evaluate(() => document.body.innerText.includes("Probe tip") || document.body.innerText.includes("Probe step") || document.body.innerText.includes("Probe insight"))
      record(`empty state on ${id}`, text.includes("Content is coming.") && !probe, text.trim())
      await page.close()
    }

    const home = await browser.newPage()
    await home.setViewport({ width: 1440, height: 900 })
    await home.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    const markers = await home.evaluate(() => ({
      sticky: document.querySelector("header")?.className.includes("sticky") ?? false,
      indicator: Boolean(document.querySelector("[data-nav-indicator]")),
      transition: Boolean(document.querySelector("[data-page-transition]")),
      reveal: Boolean(document.querySelector("[data-reveal]")),
      progress: Boolean(document.querySelector("[data-scroll-progress]")),
      backdrop: Boolean(document.querySelector("[data-hero-backdrop]")),
      tagline: Boolean(document.querySelector("[data-rotating-tagline]")),
      tilt: document.querySelectorAll("[data-tilt-card]").length,
      learn: Boolean(document.querySelector("[data-learn-more]")),
      logo: Boolean(document.querySelector("header .logo-mark img")),
      heroLogo: Boolean(document.querySelector("[data-hero] img")),
      search: document.querySelector("[data-palette-trigger]")?.textContent?.includes("Search") ?? false,
    }))
    record("home features are present", markers.sticky && markers.indicator && markers.transition && markers.reveal && markers.progress && markers.backdrop && markers.tagline && markers.tilt === 3 && markers.learn && markers.logo && !markers.heroLogo && markers.search, markers)
    const hero = await home.evaluate(() => {
      const node = document.querySelector("[data-hero]")
      const title = document.querySelector("h1")
      const box = node?.getBoundingClientRect()
      const style = title ? getComputedStyle(title) : null
      const radius = node ? getComputedStyle(node).borderRadius : ""
      return {
        width: box?.width ?? 0,
        height: box?.height ?? 0,
        radius,
        fontSize: style ? Number.parseFloat(style.fontSize) : 0,
        viewport: window.innerWidth,
      }
    })
    record(
      "hero fills 1440 viewport and headline is at least 180px",
      hero.width >= 1430 && hero.height >= 890 && hero.radius === "0px" && hero.fontSize >= 180,
      hero,
    )
    const upgrades = await home.evaluate(() => ({
      marquee: Boolean(document.querySelector("[data-marquee]")),
      story: Boolean(document.querySelector("[data-pinned-story]")),
      bento: Boolean(document.querySelector("[data-bento]")),
      finale: Boolean(document.querySelector("[data-learn-finale]")),
      glass: Boolean(document.querySelector("[data-glass-nav]")),
      pause: document.querySelectorAll("[data-pause-control]").length,
      webgl: Boolean(document.querySelector("canvas")),
      scrollBuild: Boolean(document.querySelector("[data-pc-scroll-visual]")),
    }))
    record("approved home upgrades present and 15/18 absent", upgrades.marquee && upgrades.story && upgrades.bento && upgrades.finale && upgrades.glass && upgrades.pause >= 2 && !upgrades.webgl && !upgrades.scrollBuild, upgrades)
    const mobile = await browser.newPage()
    await mobile.setViewport({ width: 390, height: 844 })
    await mobile.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    const mobileHero = await mobile.evaluate(() => {
      const box = document.querySelector("[data-hero]")?.getBoundingClientRect()
      return { width: box?.width ?? 0, height: box?.height ?? 0 }
    })
    record("hero fills 390 viewport", mobileHero.width >= 380 && mobileHero.height >= 800, mobileHero)
    const mobileEffects = await mobile.evaluate(() => ({
      stacked: document.querySelector("[data-pinned-story]")?.getAttribute("data-stacked"),
      smooth: document.documentElement.dataset.smoothScroll ?? "",
    }))
    record("narrow viewport stacks chapters and skips smooth scroll", mobileEffects.stacked === "true" && mobileEffects.smooth !== "on", mobileEffects)
    await mobile.close()

    for (const width of [1440, 768, 390] as const) {
      await home.setViewport({ width, height: width === 390 ? 844 : 900 })
      await sleep(80)
      const lines = await home.evaluate(() =>
        [...document.querySelectorAll("[data-word]")].map((word) => {
          const letters = [...word.querySelectorAll(".letter")]
          const tops = letters.length > 0 ? letters.map((node) => (node as HTMLElement).offsetTop) : [...word.getClientRects()].map((rect) => rect.top)
          const spread = tops.length === 0 ? 99 : Math.max(...tops) - Math.min(...tops)
          return { text: word.textContent ?? "", spread, same: spread < 2 }
        }),
      )
      record(`headline words stay intact at ${width}`, lines.length >= 4 && lines.every((line) => line.same), lines)
      if (width >= 768) {
        const chapter = await home.evaluate(() => {
          const node = document.querySelector("[data-fullscreen='true']")
          const box = node?.getBoundingClientRect()
          const number = node?.querySelector("[data-chapter-number]")
          return {
            width: box?.width ?? 0,
            height: box?.height ?? 0,
            size: number ? Number.parseFloat(getComputedStyle(number).fontSize) : 0,
            stacked: document.querySelector("[data-pinned-story]")?.getAttribute("data-stacked"),
          }
        })
        record(
          `chapters fill the viewport at ${width}`,
          chapter.stacked === "false" && chapter.width >= width - 8 && chapter.height >= 860 && chapter.size >= 120,
          chapter,
        )
      }
    }
    await home.setViewport({ width: 1440, height: 900 })
    await home.evaluate(() => window.scrollTo(0, 0))
    await home.focus("body")
    const inactiveHits: string[] = []
    for (let step = 0; step < 30; step += 1) {
      await home.keyboard.press("Tab")
      const hit = await home.evaluate(() => {
        const node = document.activeElement
        const chapter = node?.closest("[data-chapter]")
        if (!chapter || chapter.getAttribute("data-active") !== "false") return ""
        return (node?.textContent ?? "").trim().slice(0, 40)
      })
      if (hit) inactiveHits.push(hit)
    }
    record("tab skips inactive chapters at 1440", inactiveHits.length === 0, inactiveHits)
    await home.evaluate(() => {
      document.querySelector<HTMLElement>("[data-chapter-rail] a")?.focus({ focusVisible: true })
    })
    const ring = await home.evaluate(() => {
      const node = document.activeElement
      if (!node) return { width: "0px", style: "none" }
      const style = getComputedStyle(node)
      return { width: style.outlineWidth, style: style.outlineStyle }
    })
    record("chapter rail focus ring is visible", Number.parseFloat(ring.width) >= 2 && ring.style !== "none", ring)
    await home.focus('a[href="#content"]')
    await home.keyboard.press("Enter")
    const skipped = await home.evaluate(() => location.hash)
    record("skip to content still works", skipped === "#content", skipped)

    const narrowFocus = await browser.newPage()
    await narrowFocus.setViewport({ width: 390, height: 844 })
    await narrowFocus.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    const narrowChapters = await narrowFocus.evaluate(() =>
      [...document.querySelectorAll("[data-chapter]")].map((chapter) => ({
        inert: chapter.hasAttribute("inert"),
        links: chapter.querySelectorAll("a").length,
        active: chapter.getAttribute("data-active"),
      })),
    )
    record(
      "stacked chapters at 390 are focusable",
      narrowChapters.length === 3 && narrowChapters.every((chapter) => !chapter.inert && chapter.links > 0 && chapter.active !== "false"),
      narrowChapters,
    )
    await narrowFocus.close()

    const pauseTargets = [
      { name: "tagline", label: "Pause tagline", button: "[data-rotating-tagline] [data-pause-control]", host: "[data-rotating-tagline]", attr: "data-paused", expect: "true" },
      { name: "marquee", label: "Pause marquee", button: "[data-marquee] [data-pause-control]", host: "[data-marquee]", attr: "data-paused", expect: "true" },
      { name: "backdrop", label: "Pause background", button: "[data-hero] [data-pause-control]", host: "[data-hero-backdrop]", attr: "data-playing", expect: "false" },
    ]
    const pauseReport: { method: string; name: string; label: string | null; value: string | null }[] = []
    for (const method of ["keyboard", "pointer"] as const) {
      for (const target of pauseTargets) {
        const label = await home.$eval(target.button, (node) => node.getAttribute("aria-label"))
        await home.focus(target.button)
        if (method === "keyboard") await home.keyboard.press("Enter")
        else await home.click(target.button)
        await sleep(40)
        const value = await home.$eval(target.host, (node, attr) => node.getAttribute(attr), target.attr)
        pauseReport.push({ method, name: target.name, label, value })
        await home.focus(target.button)
        if (method === "keyboard") await home.keyboard.press("Enter")
        else await home.click(target.button)
        await sleep(40)
      }
    }
    record(
      "pause controls work by keyboard and pointer",
      pauseReport.every((item) => item.label === pauseTargets.find((target) => target.name === item.name)?.label && item.value === pauseTargets.find((target) => target.name === item.name)?.expect),
      pauseReport,
    )
    const reviewer = await home.evaluate(() => {
      const pill = document.querySelector("[data-hero-pill]")
      const pillStyle = pill ? getComputedStyle(pill) : null
      return {
        pillBorder: pillStyle ? Number.parseFloat(pillStyle.borderTopWidth) : 0,
        pillEdge: pillStyle?.borderTopColor ?? "",
        transition: Boolean(document.querySelector("[data-page-transition]")),
        lift: document.querySelectorAll(".lift-card").length,
        skip: document.querySelector('a[href="#content"]')?.textContent?.trim() ?? "",
        contentAfterStory: (() => {
          const story = document.querySelector("[data-pinned-story]")
          const content = document.getElementById("content")
          if (!story || !content) return false
          return (story.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
        })(),
        magnetic: document.querySelectorAll("[data-magnetic]").length,
      }
    })
    record(
      "reviewer fixes are present",
      reviewer.pillBorder >= 2 && reviewer.transition && reviewer.lift >= 3 && reviewer.skip === "Skip to content" && reviewer.contentAfterStory && reviewer.magnetic >= 3,
      reviewer,
    )
    await home.close()

    for (const theme of ["light", "dark"] as const) {
      const context = await browser.createBrowserContext()
      const page = await context.newPage()
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
      await installFlashProbe(page)
      await page.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
      const state = await readTheme(page)
      const backgroundOk = theme === "dark" ? near(state.htmlBackground, [7, 6, 11]) : near(state.htmlBackground, [250, 250, 250])
      record(`first visit follows ${theme}`, state.stored === null && state.dataTheme === theme && state.darkClass === (theme === "dark") && backgroundOk, state)
      const flash = await page.evaluate((expected) => {
        const samples = (window as unknown as { __themeSamples?: { phase: string; theme: string; dark: boolean }[] }).__themeSamples ?? []
        const painted = samples.filter((sample) => sample.phase === "raf")
        const wrong = painted.some((sample) => sample.theme !== "" && (sample.theme !== expected || sample.dark !== (expected === "dark")))
        return { wrong, samples }
      }, theme)
      record(`no flash on first ${theme} visit`, !flash.wrong, flash)
      await context.close()
    }

    const persist = await browser.newPage()
    await persist.setViewport({ width: 1280, height: 800 })
    await persist.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }])
    await persist.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    await persist.click("[data-theme-toggle]")
    await persist.waitForFunction(() => localStorage.getItem("theme") === "dark")
    await Promise.all([
      persist.waitForNavigation({ waitUntil: "networkidle0" }),
      persist.click('header a[href="/daily-dose-of-tech/about/"]'),
    ])
    const afterNav = await readTheme(persist)
    await persist.reload({ waitUntil: "networkidle0" })
    const afterReload = await readTheme(persist)
    record("theme persists across navigation and reload", afterNav.dataTheme === "dark" && afterReload.dataTheme === "dark" && afterReload.stored === "dark", { afterNav, afterReload })
    await persist.close()

    const keys = await browser.newPage()
    await keys.setViewport({ width: 1280, height: 800 })
    await keys.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    await keys.click("[data-palette-trigger]")
    await keys.waitForSelector("[role=dialog]")
    const dialogLabel = await keys.$eval("[role=dialog]", (node) => node.getAttribute("aria-labelledby") ?? node.textContent?.slice(0, 40) ?? "")
    await keys.keyboard.press("Escape")
    await keys.waitForFunction(() => !document.querySelector("[role=dialog]"))
    const focusBack = await keys.evaluate(() => document.activeElement?.getAttribute("data-palette-trigger") !== null || document.activeElement?.textContent?.includes("Search") === true)
    await keys.keyboard.down("Control")
    await keys.keyboard.press("KeyK")
    await keys.keyboard.up("Control")
    const stillOpen = await keys.waitForSelector("[role=dialog]")
    await keys.keyboard.press("Tab")
    const focusedInDialog = await keys.evaluate(() => {
      const dialog = document.querySelector("[role=dialog]")
      return Boolean(dialog && dialog.contains(document.activeElement))
    })
    record("palette keyboard opens, traps, and closes", Boolean(dialogLabel) && focusBack && Boolean(stillOpen) && focusedInDialog, { dialogLabel, focusBack, focusedInDialog })
    await keys.keyboard.press("Escape")
    await keys.close()

    const reduced = await browser.newPage()
    await reduced.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-color-scheme", value: "light" },
    ])
    await reduced.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    const firstLine = await reduced.$eval("[data-rotating-tagline] [aria-hidden]", (node) => node.textContent ?? "")
    await sleep(4500)
    const secondLine = await reduced.$eval("[data-rotating-tagline] [aria-hidden]", (node) => node.textContent ?? "")
    const playing = await reduced.$eval("[data-hero-backdrop]", (node) => node.getAttribute("data-playing"))
    await reduced.click("[data-palette-trigger]")
    const reducedDialog = await reduced.waitForSelector("[role=dialog]")
    const stacked = await reduced.$eval("[data-pinned-story]", (node) => node.getAttribute("data-stacked"))
    const motionState = await reduced.evaluate(() => {
      const marquee = document.querySelector("[data-marquee]")
      const track = marquee?.querySelector(".marquee-track")
      const letters = document.querySelectorAll(".letter").length
      const finaleHidden = [...document.querySelectorAll("[data-learn-finale] span")].some((node) => !node.className.includes("bg-highlight"))
      return {
        smooth: document.documentElement.dataset.smoothScroll ?? "",
        marqueePaused: marquee?.getAttribute("data-paused") ?? "",
        marqueeAnimation: track ? getComputedStyle(track).animationName : "",
        letters,
        finaleHidden,
        chapters: document.querySelectorAll("[data-chapter]").length,
        chapterFocus: [...document.querySelectorAll("[data-chapter]")].map((chapter) => ({
          inert: chapter.hasAttribute("inert"),
          links: chapter.querySelectorAll("a").length,
          active: chapter.getAttribute("data-active"),
        })),
      }
    })
    record(
      "reduced motion stops autoplay and features still work",
      firstLine === secondLine && playing === "false" && Boolean(reducedDialog) && stacked === "true" && motionState.smooth !== "on" && motionState.marqueePaused === "true" && motionState.letters === 0 && !motionState.finaleHidden && motionState.chapters === 3 && motionState.chapterFocus.every((chapter) => !chapter.inert && chapter.links > 0 && chapter.active !== "false"),
      { firstLine, secondLine, playing, stacked, motionState },
    )
    await reduced.keyboard.press("Escape")
    await reduced.close()

    for (const id of ["tips", "pc", "insights", "about"] as const) {
      const route = routes.find((item) => item.id === id)
      const page = await browser.newPage()
      await page.goto(`${previewOrigin}${route?.path}`, { waitUntil: "networkidle0" })
      const scene = await page.evaluate(() => ({
        immersive: Boolean(document.querySelector("[data-immersive-header]")),
        empty: document.querySelector("[data-empty-state]")?.getAttribute("data-empty-scene") ?? "",
        svgText: document.querySelectorAll("[data-empty-state] text").length,
        canvas: document.querySelectorAll("canvas").length,
        echo: Boolean(document.querySelector(".echo-line")),
        logos: document.querySelectorAll("img").length,
        headerLogo: document.querySelectorAll("header img").length,
      }))
      const ok =
        scene.immersive &&
        scene.canvas === 0 &&
        scene.logos === 1 &&
        scene.headerLogo === 1 &&
        (id === "about" ? scene.echo && scene.empty === "" : scene.empty === (id === "tips" ? "tips" : id === "pc" ? "pc" : "insights") && scene.svgText === 0)
      record(`upgrade scene on ${id}`, ok, scene)
      await page.close()
    }

    const fallback = await browser.newPage()
    await fallback.setViewport({ width: 1440, height: 900 })
    await fallback.evaluateOnNewDocument(() => {
      Object.defineProperty(Document.prototype, "startViewTransition", { configurable: true, value: undefined })
      const style = document.createElement("style")
      style.textContent = "@view-transition { navigation: none !important; } h1 { view-transition-name: none !important; }"
      document.documentElement.append(style)
    })
    await fallback.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
    await Promise.all([
      fallback.waitForNavigation({ waitUntil: "networkidle0" }),
      fallback.click('header a[href="/daily-dose-of-tech/about/"]'),
    ])
    const fallbackState = await fallback.evaluate(() => ({
      title: document.querySelector("h1")?.textContent ?? "",
      transition: Boolean(document.querySelector("[data-page-transition]")),
      api: "startViewTransition" in Document.prototype && Document.prototype.startViewTransition !== undefined,
    }))
    record("view transitions fall back without the API", fallbackState.title.includes("About") && fallbackState.transition && fallbackState.api === false, fallbackState)
    await fallback.close()

    for (const theme of ["light", "dark"] as const) {
      const page = await browser.newPage()
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
      await page.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
      await page.evaluate(() => localStorage.removeItem("theme"))
      for (const width of [390, 768, 1440] as const) {
        await page.setViewport({ width, height: width === 390 ? 844 : 900 })
        for (const route of routes) {
          await page.goto(`${previewOrigin}${route.path}`, { waitUntil: "networkidle0" })
          const box = await overflow(page)
          record(`no overflow ${route.id} ${width} ${theme}`, box.scrollWidth <= box.clientWidth + 1 && box.bodyScrollWidth <= box.clientWidth + 1, box)
          const clear = await page.evaluate(() => {
            const header = document.querySelector("[data-glass-nav]")
            if (!header) return { ok: false, reason: "no header" }
            const hb = header.getBoundingClientRect()
            const nodes = [document.querySelector("main h1"), ...document.querySelectorAll("[data-hero-pill], [data-hero] .hero-copy")]
            const hits = nodes.filter((node): node is Element => {
              if (!node) return false
              const rect = node.getBoundingClientRect()
              if (rect.width < 2 || rect.height < 2) return false
              return hb.left < rect.right - 1 && hb.right > rect.left + 1 && hb.top < rect.bottom - 1 && hb.bottom > rect.top + 1
            }).map((node) => `${node.tagName}:${(node.textContent ?? "").trim().slice(0, 48)}`)
            return { ok: hits.length === 0, hits, headerHeight: Math.round(hb.height) }
          })
          record(`header clears text ${route.id} ${width} ${theme}`, clear.ok === true, clear)
        }
      }
      await page.close()
    }

    for (const theme of ["light", "dark"] as const) {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
      for (const route of routes) {
        await page.goto(`${previewOrigin}${route.path}`, { waitUntil: "networkidle0" })
        await page.evaluate(() => localStorage.removeItem("theme"))
        await page.reload({ waitUntil: "networkidle0" })
        const loaded = await navPill(page)
        record(`nav pill ${route.id} ${theme} after load`, loaded.ok === true, loaded)
      }
      for (const route of routes) {
        const href = `${previewOrigin}${route.path}`.replace(previewOrigin, "")
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0" }),
          page.click(`header [data-slot="navigation-menu-link"][href="${href}"]`),
        ])
        await page.waitForFunction(() => {
          const link = document.querySelector("header a.nav-active")
          if (!link) return false
          return getComputedStyle(link).color === "rgb(24, 24, 27)"
        })
        const settled = await navPill(page)
        record(`nav pill ${route.id} ${theme} after transition`, settled.ok === true, settled)
      }
      await page.close()
    }

    await mkdir(path.join(root, "motion", "frames"), { recursive: true })
    for (const theme of ["light", "dark"] as const) {
      for (const width of [1440, 390] as const) {
        const page = await browser.newPage()
        await page.setViewport({ width, height: width === 390 ? 844 : 900 })
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
        await page.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
        await page.evaluate(() => localStorage.removeItem("theme"))
        await page.reload({ waitUntil: "networkidle0" })
        await page.evaluate(() => window.scrollTo(0, 0))
        await sleep(280)
        const topSize = await page.evaluate(() => {
          const header = document.querySelector("[data-glass-nav]")?.getBoundingClientRect()
          const logo = document.querySelector(".logo-mark img")?.getBoundingClientRect()
          return { header: header?.height ?? 0, logo: logo?.height ?? 0 }
        })
        const topScroll = await page.evaluate(() => window.scrollY)
        await page.screenshot({
          path: path.join(shotDir, `header-scroll-top-${width}-${theme}.png`),
          clip: { x: 0, y: topScroll, width, height: 120 },
        })
        const shiftsBefore = await page.evaluate(() =>
          performance.getEntriesByType("layout-shift").reduce((sum, entry) => sum + ((entry as { value?: number }).value ?? 0), 0),
        )
        await page.evaluate(() => window.scrollTo(0, 480))
        await page.waitForFunction(() => document.querySelector("[data-glass-nav]")?.getAttribute("data-hidden") === "true")
        await sleep(280)
        const hidden = await page.evaluate(() => document.querySelector("[data-glass-nav]")?.getBoundingClientRect().bottom ?? 1)
        await page.evaluate(() => window.scrollTo(0, 80))
        await page.waitForFunction(() => {
          const header = document.querySelector("[data-glass-nav]")
          return header?.getAttribute("data-hidden") === "false" && header?.getAttribute("data-compact") === "true"
        })
        await sleep(280)
        const compactSize = await page.evaluate(() => {
          const header = document.querySelector("[data-glass-nav]")?.getBoundingClientRect()
          const logo = document.querySelector(".logo-mark img")?.getBoundingClientRect()
          return { header: header?.height ?? 0, logo: logo?.height ?? 0, top: header?.top ?? 99 }
        })
        const compactScroll = await page.evaluate(() => window.scrollY)
        await page.screenshot({
          path: path.join(shotDir, `header-scroll-compact-${width}-${theme}.png`),
          clip: { x: 0, y: compactScroll, width, height: 120 },
        })
        const shiftsAfter = await page.evaluate(() =>
          performance.getEntriesByType("layout-shift").reduce((sum, entry) => sum + ((entry as { value?: number }).value ?? 0), 0),
        )
        record(
          `header shrinks ${width} ${theme}`,
          compactSize.logo < topSize.logo - 1 && compactSize.header <= topSize.header,
          { topSize, compactSize },
        )
        record(`header hides and returns ${width} ${theme}`, hidden < 0 && compactSize.top > -2 && compactSize.top < 40, { hidden, top: compactSize.top })
        record(`header scroll adds no layout shift ${width} ${theme}`, shiftsAfter - shiftsBefore < 0.01, { shiftsBefore, shiftsAfter })
        await page.close()
      }
      const reduced = await browser.newPage()
      await reduced.setViewport({ width: 1440, height: 900 })
      await reduced.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
        { name: "prefers-color-scheme", value: theme },
      ])
      await reduced.goto(`${previewOrigin}/daily-dose-of-tech/`, { waitUntil: "networkidle0" })
      const motion = await reduced.evaluate(() => {
        const header = document.querySelector("[data-glass-nav]")
        const logo = document.querySelector(".logo-mark img")
        return {
          header: header ? getComputedStyle(header).transitionDuration : "",
          logo: logo ? getComputedStyle(logo).transitionDuration : "",
          settled: Boolean(document.querySelector("header a.nav-active")),
        }
      })
      record(
        `reduced motion header transition is instant ${theme}`,
        motion.header === "0s" && motion.logo === "0s" && motion.settled,
        motion,
      )
      await reduced.close()
    }

    const pillPairs = [
      { from: "home", to: "about" },
      { from: "tips", to: "insights" },
    ] as const
    for (const theme of ["light", "dark"] as const) {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
      await page.evaluateOnNewDocument((holdFrames) => {
        const target = window as Window & { __pillSamples?: unknown[]; __releaseFrames?: () => void }
        target.__pillSamples = []
        if (holdFrames) {
          const native = window.requestAnimationFrame.bind(window)
          let release = false
          target.__releaseFrames = () => {
            release = true
          }
          window.requestAnimationFrame = (callback) => native((time) => {
            if (!release) {
              window.requestAnimationFrame(callback)
              return
            }
            callback(time)
          })
        }
        const tick = () => {
          const header = document.querySelector("[data-glass-nav]")
          const pill = document.querySelector<HTMLElement>("[data-nav-indicator]")
          if (header && pill) {
            const bar = header.getBoundingClientRect()
            const mark = pill.getBoundingClientRect()
            const links = [...document.querySelectorAll<HTMLElement>("header [data-slot='navigation-menu-link']")].map((node) => {
              const label = node.querySelector<HTMLElement>("[data-nav-label]") ?? node
              const box = label.getBoundingClientRect()
              const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
              const hitKind = hit?.closest("[data-nav-indicator]") ? "pill" : hit?.closest("[data-nav-label]") || hit === node ? "label" : "other"
              return {
                text: (label.textContent ?? "").replace(/\s+/g, " ").trim(),
                color: getComputedStyle(node).color,
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                active: node.getAttribute("aria-current") === "page",
                hit: hitKind,
              }
            })
            target.__pillSamples?.push({
              left: mark.left,
              right: mark.right,
              top: mark.top,
              bottom: mark.bottom,
              barTop: bar.top,
              barRight: bar.right,
              barBottom: bar.bottom,
              barLeft: bar.left,
              links,
            })
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }, false)
      for (const pair of pillPairs) {
        const source = routes.find((route) => route.id === pair.from)
        const destination = routes.find((route) => route.id === pair.to)
        await page.goto(`${previewOrigin}${source?.path}`, { waitUntil: "networkidle0" })
        await page.evaluate(() => localStorage.removeItem("theme"))
        await page.reload({ waitUntil: "networkidle0" })
        await page.waitForFunction(() => document.querySelector("header a.nav-active"))
        await page.addStyleTag({ content: "@view-transition { navigation: none; }" })
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded" }),
          page.click(`header [data-slot="navigation-menu-link"][href="${destination?.path}"]`),
        ])
        await page.waitForFunction(() => (window as Window & { __pillSlideStart?: number }).__pillSlideStart)
        const normalClient = await page.createCDPSession()
        await normalClient.send("Animation.setPlaybackRate", { playbackRate: 1 })
        const normalStart = await page.evaluate(() => (window as Window & { __pillSlideStart?: number }).__pillSlideStart ?? 0)
        const normalGlyphs = []
        for (const pct of [25, 50, 75] as const) {
          const now = await page.evaluate(() => performance.now())
          await sleep(Math.max(0, normalStart + 300 * (pct / 100) - now))
          await normalClient.send("Animation.setPlaybackRate", { playbackRate: 0 })
          const shot = path.join(root, "build-checks", `glyph-${pair.from}-${pair.to}-${pct}-${theme}.png`)
          await page.screenshot({
            path: shot,
            clip: { x: 0, y: 0, width: 1440, height: 120 },
            captureBeyondViewport: false,
          })
          normalGlyphs.push({ pct, ...(await glyphContrast(page, shot, `${pair.from} ${theme} ${pct}`)) })
          await normalClient.send("Animation.setPlaybackRate", { playbackRate: 1 })
        }
        await normalClient.detach()
        const normalWorst = normalGlyphs.reduce((worst, item) => item.worstRatio < worst.worstRatio ? item : worst, normalGlyphs[0])
        record(
          `glyph contrast normal ${pair.from} to ${pair.to} ${theme}`,
          normalGlyphs.every((item) => item.fails === 0 && item.count > 0),
          {
            count: normalGlyphs.reduce((sum, item) => sum + item.count, 0),
            fails: normalGlyphs.reduce((sum, item) => sum + item.fails, 0),
            worstRatio: normalWorst?.worstRatio,
            worstLabel: normalWorst?.worstLabel,
            worstChar: normalWorst?.worstChar,
            frames: normalGlyphs.map((item) => ({ pct: item.pct, count: item.count, worstRatio: item.worstRatio, worstLabel: item.worstLabel, worstChar: item.worstChar })),
          },
        )
        await page.waitForFunction(() => {
          const link = document.querySelector("header a.nav-active")
          if (!link) return false
          return getComputedStyle(link).color === "rgb(24, 24, 27)"
        })
        const samples = await page.evaluate(() => (window as Window & { __pillSamples?: PillSample[] }).__pillSamples ?? [])
        const outside = samples.filter((sample) =>
          sample.left < sample.barLeft - 1 ||
          sample.right > sample.barRight + 1 ||
          sample.top < sample.barTop - 1 ||
          sample.bottom > sample.barBottom + 1,
        )
        const misaligned = samples.filter((sample) => {
          const link = sample.links[0]
          if (!link) return true
          return Math.abs((sample.top + sample.bottom) / 2 - (link.top + link.bottom) / 2) > 1
        })
        const judged = judgePill(samples)
        record(
          `pill stays in the bar ${pair.from} to ${pair.to} ${theme}`,
          samples.length > 5 && outside.length === 0 && misaligned.length === 0 && judged.darkWithoutCover === 0 && judged.coveredLabel === 0 && judged.distinctX >= 3,
          { samples: samples.length, outside: outside.length, misaligned: misaligned.length, ...judged },
        )
        const rested = await navPill(page)
        record(`pill rests in the link ${pair.from} to ${pair.to} ${theme}`, rested.ok === true, rested)
      }
      await page.close()
    }

    const pillBoxes: Array<{ pair: string; theme: string; pct: number; pill: { x: number; y: number; width: number; height: number }; bar: { x: number; y: number; width: number; height: number } }> = []
    for (const theme of ["light", "dark"] as const) {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
      const client = await page.createCDPSession()
      await client.send("Animation.setPlaybackRate", { playbackRate: 0.04 })
      await page.evaluateOnNewDocument((holdFrames) => {
        const target = window as Window & { __pillSamples?: unknown[]; __releaseFrames?: () => void }
        target.__pillSamples = []
        if (holdFrames) {
          const native = window.requestAnimationFrame.bind(window)
          let release = false
          target.__releaseFrames = () => {
            release = true
          }
          window.requestAnimationFrame = (callback) => native((time) => {
            if (!release) {
              window.requestAnimationFrame(callback)
              return
            }
            callback(time)
          })
        }
        const tick = () => {
          const header = document.querySelector("[data-glass-nav]")
          const pill = document.querySelector<HTMLElement>("[data-nav-indicator]")
          if (header && pill) {
            const bar = header.getBoundingClientRect()
            const mark = pill.getBoundingClientRect()
            const links = [...document.querySelectorAll<HTMLElement>("header [data-slot='navigation-menu-link']")].map((node) => {
              const label = node.querySelector<HTMLElement>("[data-nav-label]") ?? node
              const box = label.getBoundingClientRect()
              const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
              const hitKind = hit?.closest("[data-nav-indicator]") ? "pill" : hit?.closest("[data-nav-label]") || hit === node ? "label" : "other"
              return {
                text: (label.textContent ?? "").replace(/\s+/g, " ").trim(),
                color: getComputedStyle(node).color,
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                active: node.getAttribute("aria-current") === "page",
                hit: hitKind,
              }
            })
            target.__pillSamples?.push({
              left: mark.left,
              right: mark.right,
              top: mark.top,
              bottom: mark.bottom,
              barTop: bar.top,
              barRight: bar.right,
              barBottom: bar.bottom,
              barLeft: bar.left,
              links,
            })
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }, true)
      for (const pair of pillPairs) {
        const source = routes.find((route) => route.id === pair.from)
        const destination = routes.find((route) => route.id === pair.to)
        await page.goto(`${previewOrigin}${source?.path}`, { waitUntil: "networkidle0" })
        await page.evaluate(() => localStorage.removeItem("theme"))
        await page.reload({ waitUntil: "networkidle0" })
        await page.evaluate(() => (window as Window & { __releaseFrames?: () => void }).__releaseFrames?.())
        await page.waitForFunction(() => document.querySelector("header a.nav-active"))
        await page.addStyleTag({ content: "@view-transition { navigation: none; }" })
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded" }),
          page.click(`header [data-slot="navigation-menu-link"][href="${destination?.path}"]`),
        ])
        await client.send("Animation.setPlaybackRate", { playbackRate: 0.04 })
        await page.waitForFunction(() => {
          const pill = document.querySelector<HTMLElement>("[data-nav-indicator]")
          if (!pill) return false
          const value = getComputedStyle(pill).transform
          return value !== "none" && value !== "matrix(1, 0, 0, 1, 0, 0)"
        })
        await client.send("Animation.setPlaybackRate", { playbackRate: 0.04 })
        await page.evaluate(() => (window as Window & { __releaseFrames?: () => void }).__releaseFrames?.())
        await page.waitForFunction(() => (window as Window & { __pillSlideStart?: number }).__pillSlideStart)
        const started = await page.evaluate(() => (window as Window & { __pillSlideStart?: number }).__pillSlideStart ?? 0)
        const slowGlyphs = []
        for (const pct of [25, 50, 75] as const) {
          const now = await page.evaluate(() => performance.now())
          await sleep(Math.max(0, started + (300 * (pct / 100)) / 0.04 - now))
          await client.send("Animation.setPlaybackRate", { playbackRate: 0 })
          const box = await page.evaluate(() => {
            const pill = document.querySelector("[data-nav-indicator]")?.getBoundingClientRect()
            const bar = document.querySelector("[data-glass-nav]")?.getBoundingClientRect()
            return {
              pill: { x: pill?.x ?? 0, y: pill?.y ?? 0, width: pill?.width ?? 0, height: pill?.height ?? 0 },
              bar: { x: bar?.x ?? 0, y: bar?.y ?? 0, width: bar?.width ?? 0, height: bar?.height ?? 0 },
            }
          })
          pillBoxes.push({ pair: `${pair.from}-${pair.to}`, theme, pct, ...box })
          const shot = path.join(root, "motion", "frames", `pill-${pair.from}-${pair.to}-${pct}-${theme}.png`)
          await page.screenshot({
            path: shot,
            clip: { x: 0, y: 0, width: 1440, height: 120 },
            captureBeyondViewport: false,
          })
          slowGlyphs.push({ pct, ...(await glyphContrast(page, shot, `${pair.from} ${theme} ${pct}`)) })
          await client.send("Animation.setPlaybackRate", { playbackRate: 0.04 })
        }
        const slowWorst = slowGlyphs.reduce((worst, item) => item.worstRatio < worst.worstRatio ? item : worst, slowGlyphs[0])
        record(
          `glyph contrast 0.04 ${pair.from} to ${pair.to} ${theme}`,
          slowGlyphs.every((item) => item.fails === 0 && item.count > 0),
          {
            count: slowGlyphs.reduce((sum, item) => sum + item.count, 0),
            fails: slowGlyphs.reduce((sum, item) => sum + item.fails, 0),
            worstRatio: slowWorst?.worstRatio,
            worstLabel: slowWorst?.worstLabel,
            worstChar: slowWorst?.worstChar,
            frames: slowGlyphs.map((item) => ({ pct: item.pct, count: item.count, worstRatio: item.worstRatio, worstLabel: item.worstLabel, worstChar: item.worstChar })),
          },
        )
        await page.waitForFunction(() => {
          const link = document.querySelector("header a.nav-active")
          if (!link) return false
          return getComputedStyle(link).color === "rgb(24, 24, 27)"
        }, { timeout: 20000 })
        const samples = await page.evaluate(() => (window as Window & { __pillSamples?: PillSample[] }).__pillSamples ?? [])
        const judged = judgePill(samples)
        const xs = [25, 50, 75].map((pct) => Math.round(pillBoxes.find((entry) => entry.pair === `${pair.from}-${pair.to}` && entry.theme === theme && entry.pct === pct)?.pill.x ?? 0))
        record(
          `slow pill stays behind labels ${pair.from} to ${pair.to} ${theme}`,
          samples.length > 5 && judged.darkWithoutCover === 0 && judged.coveredLabel === 0 && judged.distinctX >= 3 && new Set(xs).size === 3,
          { ...judged, xs },
        )
      }
      await client.detach()
      await page.close()
    }
    await writeFile(path.join(root, "motion", "pill-boxes.json"), `${JSON.stringify(pillBoxes, null, 2)}\n`)

    for (const theme of ["light", "dark"] as const) {
      for (const width of [1440, 768, 390] as const) {
        for (const route of routes) {
          const page = await browser.newPage()
          await page.setViewport({ width, height: width === 390 ? 844 : 900 })
          await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
          await page.goto(`${previewOrigin}${route.path}`, { waitUntil: "networkidle0" })
          await page.evaluate(() => localStorage.removeItem("theme"))
          await page.reload({ waitUntil: "networkidle0" })
          if (width === 1440) {
            const labels = ["Home", "Daily Tech Tips", "PC Building", "Tech Insights / Learning Hub", "About"]
            const ax = await page.createCDPSession()
            await ax.send("Accessibility.enable")
            const tree = await ax.send("Accessibility.getFullAXTree") as { nodes: Array<{ nodeId?: string; parentId?: string; ignored?: boolean; role?: { value?: string }; name?: { value?: string } }> }
            await ax.detach()
            const byId = new Map(tree.nodes.map((node) => [node.nodeId ?? "", node]))
            const inPrimary = (node: (typeof tree.nodes)[number]) => {
              const seen = new Set<string>()
              let current: (typeof tree.nodes)[number] | undefined = node
              while (current?.nodeId && !seen.has(current.nodeId)) {
                seen.add(current.nodeId)
                if (current.role?.value === "navigation" && current.name?.value === "Primary") return true
                current = current.parentId ? byId.get(current.parentId) : undefined
              }
              return false
            }
            const counts = Object.fromEntries(labels.map((label) => [label, 0]))
            for (const node of tree.nodes) {
              if (node.ignored || !inPrimary(node)) continue
              const name = node.name?.value ?? ""
              if (node.role?.value === "link" && name in counts) counts[name] += 1
            }
            await page.evaluate(() => {
              const skip = document.querySelector("a[href='#content']")
              if (skip instanceof HTMLElement) skip.focus()
            })
            const tabbed: string[] = []
            for (let step = 0; step < 8; step += 1) {
              await page.keyboard.press("Tab")
              const name = await page.evaluate(() => {
                const current = document.activeElement
                if (!(current instanceof HTMLAnchorElement) || !current.closest("[data-nav-list]")) return ""
                return (current.querySelector("[data-nav-label]")?.textContent ?? "").trim()
              })
              if (name) tabbed.push(name)
            }
            const tabCounts = Object.fromEntries(labels.map((label) => [label, tabbed.filter((name) => name === label).length]))
            record(
              `nav label once ${route.id} ${theme}`,
              labels.every((label) => counts[label] === 1 && tabCounts[label] === 1),
              { counts, tabCounts },
            )
          }
          await page.evaluate(async () => {
            const height = document.documentElement.scrollHeight
            for (let y = 0; y < height; y += 600) {
              window.scrollTo(0, y)
              await new Promise((resolve) => setTimeout(resolve, 30))
            }
            window.scrollTo(0, 0)
          })
          const file = path.join(shotDir, `${route.id}-${width}-${theme}.png`)
          await page.screenshot({ path: file })
          record(`screenshot ${route.id}-${width}-${theme}.png`, true, file)
          if (width === 1440) {
            const headerShot = path.join(shotDir, `header-${route.id}-1440-${theme}.png`)
            await page.screenshot({ path: headerShot, clip: { x: 0, y: 0, width: 1440, height: 120 } })
            record(`screenshot header-${route.id}-1440-${theme}.png`, true, headerShot)
          }
          if (width === 1440 || width === 390) {
            const full = path.join(shotDir, `${route.id}-${width}-${theme}-full.png`)
            await page.screenshot({ path: full, fullPage: true })
            record(`screenshot ${route.id}-${width}-${theme}-full.png`, true, full)
          }
          await page.close()
        }
      }
    }

    for (const file of Object.values(contentFiles)) {
      originals.set(file, await readFile(file, "utf8"))
    }
    await writeFile(
      contentFiles.tips,
      originals.get(contentFiles.tips)?.replace(
        "export const tips: Tip[] = []",
        `export const tips: Tip[] = [{ title: "Probe tip alpha", summary: "Probe summary for the filter.", tag: "Windows" }]`,
      ) ?? "",
    )
    await writeFile(
      contentFiles.steps,
      originals.get(contentFiles.steps)?.replace(
        "export const buildSteps: BuildStep[] = []",
        `export const buildSteps: BuildStep[] = [{ title: "Probe step alpha", body: "Probe step body." }]`,
      ) ?? "",
    )
    await writeFile(
      contentFiles.insights,
      originals.get(contentFiles.insights)?.replace(
        "export const insights: Insight[] = []",
        `export const insights: Insight[] = [{ title: "Probe insight alpha", summary: "Probe insight summary.", group: "software" }]`,
      ) ?? "",
    )

    const dev = startServer(
      [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(devPort), "--strictPort"],
      root,
    )
    const devOrigin = `http://127.0.0.1:${devPort}`
    try {
      await waitFor(`${devOrigin}/daily-dose-of-tech/daily-tech-tips/`)
      const tipsPage = await browser.newPage()
      await tipsPage.goto(`${devOrigin}/daily-dose-of-tech/daily-tech-tips/`, { waitUntil: "networkidle0" })
      await tipsPage.waitForFunction(() => document.body.innerText.includes("Probe tip alpha"))
      const chip = await tipsPage.$("button[aria-pressed]")
      await tipsPage.click("button[aria-pressed='false']")
      const filtered = await tipsPage.evaluate(() => document.body.innerText.includes("Probe tip alpha"))
      await tipsPage.click("button[aria-pressed='false']")
      await tipsPage.type("input", "missing-query")
      const noResults = await tipsPage.waitForFunction(() => document.body.innerText.includes("No results"))
      await tipsPage.click("[data-tip-search] input")
      await tipsPage.keyboard.down("Control")
      await tipsPage.keyboard.press("KeyA")
      await tipsPage.keyboard.up("Control")
      await tipsPage.keyboard.press("Backspace")
      await tipsPage.type("[data-tip-search] input", "Probe tip")
      const found = await tipsPage.waitForFunction(() => document.body.innerText.includes("Probe tip alpha"))
      await tipsPage.focus("button[aria-expanded]")
      await tipsPage.keyboard.press("Enter")
      const expanded = await tipsPage.$eval("button[aria-expanded]", (node) => node.getAttribute("aria-expanded"))
      record("tip entry shows in list, filter, and search", Boolean(chip) && filtered && Boolean(noResults) && Boolean(found) && expanded === "true", { expanded })
      await tipsPage.evaluate(() => window.scrollTo(0, 0))
      await tipsPage.waitForFunction(() => document.querySelector("header")?.getAttribute("data-hidden") !== "true")
      await tipsPage.click("[data-palette-trigger]")
      await tipsPage.waitForSelector("[role=dialog]")
      await tipsPage.type("[role=dialog] input", "Probe tip alpha")
      const inPalette = await tipsPage.waitForFunction(() => document.querySelector("[role=dialog]")?.textContent?.includes("Probe tip alpha"))
      record("tip entry shows in the palette", Boolean(inPalette), true)
      await tipsPage.close()

      const buildPage = await browser.newPage()
      await buildPage.goto(`${devOrigin}/daily-dose-of-tech/pc-building/`, { waitUntil: "networkidle0" })
      await buildPage.waitForFunction(() => document.body.innerText.includes("Probe step alpha"))
      const nav = await buildPage.$("[data-step-nav]")
      await buildPage.click("[data-step-check]")
      await buildPage.waitForFunction(() => document.querySelector("[data-step-check] [role=checkbox]")?.getAttribute("aria-checked") === "true" || document.querySelector("[data-step-check] button")?.getAttribute("aria-checked") === "true" || document.querySelector("[role=checkbox]")?.getAttribute("data-state") === "checked")
      await sleep(200)
      await buildPage.reload({ waitUntil: "networkidle0" })
      const persisted = await buildPage.evaluate(() => {
        const box = document.querySelector("[role=checkbox]")
        return box?.getAttribute("aria-checked") === "true" || box?.getAttribute("data-state") === "checked"
      })
      record("step entry shows in the tracker and persists", Boolean(nav) && persisted, { persisted })
      await buildPage.evaluate(() => window.scrollTo(0, 0))
      await buildPage.waitForFunction(() => document.querySelector("header")?.getAttribute("data-hidden") !== "true")
      await buildPage.click("[data-palette-trigger]")
      await buildPage.waitForSelector("[role=dialog]")
      const stepInPalette = await buildPage.evaluate(() => document.querySelector("[role=dialog]")?.textContent?.includes("Probe step alpha"))
      record("step entry shows in the palette", Boolean(stepInPalette), stepInPalette)
      await buildPage.close()

      const blocked = await browser.newPage()
      await blocked.evaluateOnNewDocument(() => {
        const fail = () => {
          throw new Error("storage blocked")
        }
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          value: { getItem: fail, setItem: fail, removeItem: fail, clear: fail, key: fail, length: 0 },
        })
      })
      await blocked.goto(`${devOrigin}/daily-dose-of-tech/pc-building/`, { waitUntil: "networkidle0" })
      const stepVisible = await blocked.evaluate(() => document.body.innerText.includes("Probe step alpha"))
      await blocked.click("[data-step-check]")
      const toggled = await blocked.evaluate(() => document.querySelector("[role=checkbox]")?.getAttribute("data-state") === "checked")
      record("blocked storage still lets the tracker work", stepVisible && toggled, { stepVisible, toggled })
      await blocked.close()

      const insightPage = await browser.newPage()
      await insightPage.goto(`${devOrigin}/daily-dose-of-tech/insights/`, { waitUntil: "networkidle0" })
      await insightPage.waitForFunction(() => document.body.innerText.includes("Probe insight alpha"))
      const software = await insightPage.$("[data-insight-switch]")
      await insightPage.click("[data-insight-switch] button:nth-of-type(2)")
      const hardwareHidden = await insightPage.evaluate(() => !document.body.innerText.includes("Probe insight alpha"))
      await insightPage.click("[data-insight-switch] button:nth-of-type(1)")
      const softwareShown = await insightPage.evaluate(() => document.body.innerText.includes("Probe insight alpha"))
      await insightPage.evaluate(() => window.scrollTo(0, 0))
      await insightPage.waitForFunction(() => document.querySelector("header")?.getAttribute("data-hidden") !== "true")
      await insightPage.click("[data-palette-trigger]")
      await insightPage.waitForSelector("[role=dialog]")
      const insightInPalette = await insightPage.evaluate(() => document.querySelector("[role=dialog]")?.textContent?.includes("Probe insight alpha"))
      record("insight entry shows in the switch and palette", Boolean(software) && hardwareHidden && softwareShown && Boolean(insightInPalette), { hardwareHidden, softwareShown })
      await insightPage.close()
    } finally {
      dev.kill("SIGTERM")
      await restoreContent()
    }
  } finally {
    await restoreContent()
    await browser.close()
    preview.kill("SIGTERM")
  }

  const pass = checks.every((check) => check.pass)
  await writeFile(path.join(root, "build-checks", "browser.json"), `${JSON.stringify({ pass, checks }, null, 2)}\n`)
  console.log(pass ? "browser-checks: pass" : "browser-checks: fail")
  return pass ? 0 : 1
}
