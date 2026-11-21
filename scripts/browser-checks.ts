import { spawn } from "node:child_process"
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer, { type Browser, type Page } from "puppeteer-core"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const port = 43219
const origin = `http://127.0.0.1:${port}`
const homeUrl = `${origin}/daily-dose-of-tech/`

const routes = [
  { id: "home", path: "/daily-dose-of-tech/" },
  { id: "tips", path: "/daily-dose-of-tech/daily-tech-tips/" },
  { id: "pc", path: "/daily-dose-of-tech/pc-building/" },
  { id: "insights", path: "/daily-dose-of-tech/insights/" },
  { id: "about", path: "/daily-dose-of-tech/about/" },
] as const

const widths = [390, 768, 1440] as const

type Check = { name: string; pass: boolean; detail: unknown }
const checks: Check[] = []

function record(name: string, pass: boolean, detail: unknown) {
  checks.push({ name, pass, detail })
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(homeUrl)
      if (response.ok) return
    } catch {
      // Preview is still booting.
    }
    await sleep(200)
  }
  throw new Error(`Preview did not respond at ${homeUrl}`)
}

async function readTheme(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement
    const body = getComputedStyle(document.body)
    const html = getComputedStyle(root)
    return {
      darkClass: root.classList.contains("dark"),
      dataTheme: root.dataset.theme ?? "",
      stored: localStorage.getItem("theme"),
      htmlBackground: html.backgroundColor,
      bodyBackground: body.backgroundColor,
      colorScheme: root.style.colorScheme,
    }
  })
}

function rgb(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function near(value: string, expected: [number, number, number]) {
  const parsed = rgb(value)
  if (!parsed) return false
  return parsed.every((channel, index) => Math.abs(channel - (expected[index] ?? 0)) <= 2)
}

async function installFlashProbe(page: Page) {
  await page.evaluateOnNewDocument(() => {
    const samples: {
      phase: string
      t: number
      dark: boolean
      theme: string
      bg: string
    }[] = []
    ;(window as unknown as { __themeSamples: typeof samples }).__themeSamples = samples
    const recordSample = (phase: string) => {
      const root = document.documentElement
      if (!root) return
      samples.push({
        phase,
        t: performance.now(),
        dark: root.classList.contains("dark"),
        theme: root.dataset.theme ?? "",
        bg: root.style.backgroundColor,
      })
    }
    const boot = () => {
      if (!document.documentElement) {
        requestAnimationFrame(boot)
        return
      }
      recordSample("start")
      new MutationObserver(() => recordSample("mutation")).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      })
      requestAnimationFrame(() => recordSample("raf"))
    }
    boot()
  })
}

async function flashReport(page: Page, expected: "light" | "dark") {
  return page.evaluate((theme) => {
    const root = document.documentElement
    const paints = performance.getEntriesByType("paint")
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null
    const samples =
      (window as unknown as { __themeSamples?: { phase: string; t: number; dark: boolean; theme: string; bg: string }[] })
        .__themeSamples ?? []
    const expectDark = theme === "dark"
    const painted = samples.filter((sample) => (fcp === null ? sample.phase === "raf" : sample.t >= fcp - 5))
    const judged = painted.length > 0 ? painted : samples.filter((sample) => sample.theme !== "")
    const wrongAfterPaint = judged.some((sample) => sample.theme !== "" && (sample.dark !== expectDark || sample.theme !== theme))
    return {
      fcp,
      samples,
      judgedCount: judged.length,
      wrongAfterPaint,
      finalDark: root.classList.contains("dark"),
      finalTheme: root.dataset.theme ?? "",
    }
  }, expected)
}

async function openPage(browser: Browser, theme: "light" | "dark", url: string) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
  await installFlashProbe(page)
  await page.goto(url, { waitUntil: "networkidle0" })
  return { context, page }
}

async function overflow(page: Page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
}

export async function run(): Promise<number> {
  const shotDir = path.join(root, "screenshots")
  await mkdir(shotDir, { recursive: true })
  for (const name of await readdir(shotDir)) {
    if (name.endsWith(".png")) await unlink(path.join(shotDir, name))
  }
  await mkdir(path.join(root, "build-checks"), { recursive: true })

  const preview = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: root, stdio: "pipe" },
  )

  const browser = await puppeteer.launch({
    executablePath: "/opt/google/chrome/chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  })

  try {
    await waitForPreview()

    for (const theme of ["light", "dark"] as const) {
      const { context, page } = await openPage(browser, theme, homeUrl)
      const state = await readTheme(page)
      const backgroundOk =
        theme === "dark"
          ? near(state.htmlBackground, [9, 9, 11])
          : near(state.htmlBackground, [250, 250, 250])
      record(`first visit follows ${theme} OS preference`, state.stored === null && state.dataTheme === theme && state.darkClass === (theme === "dark") && backgroundOk, state)
      const flash = await flashReport(page, theme)
      record(
        `no flash of the wrong theme on first ${theme} visit`,
        !flash.wrongAfterPaint && flash.finalTheme === theme && flash.finalDark === (theme === "dark"),
        flash,
      )
      await context.close()
    }

    for (const start of ["light", "dark"] as const) {
      const next = start === "light" ? "dark" : "light"
      const { context, page } = await openPage(browser, start, homeUrl)
      await page.setViewport({ width: 1440, height: 900 })
      await page.click("[data-theme-toggle]")
      await page.waitForFunction(
        (expected) => document.documentElement.dataset.theme === expected && localStorage.getItem("theme") === expected,
        {},
        next,
      )
      const afterToggle = await readTheme(page)
      record(`toggle from ${start} switches to ${next}`, afterToggle.dataTheme === next && afterToggle.stored === next, afterToggle)

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click('header a[href="/daily-dose-of-tech/about/"]'),
      ])
      const afterNav = await readTheme(page)
      record(
        `${next} theme persists across navigation`,
        afterNav.dataTheme === next && afterNav.stored === next && afterNav.darkClass === (next === "dark"),
        afterNav,
      )

      await page.reload({ waitUntil: "networkidle0" })
      const afterReload = await readTheme(page)
      const reloadFlash = await flashReport(page, next)
      record(
        `${next} theme persists across reload`,
        afterReload.dataTheme === next && afterReload.stored === next && afterReload.darkClass === (next === "dark"),
        afterReload,
      )
      record(
        `no flash of the wrong theme after reload into ${next}`,
        !reloadFlash.wrongAfterPaint && reloadFlash.finalTheme === next,
        reloadFlash,
      )
      await context.close()
    }

    for (const theme of ["light", "dark"] as const) {
      const { context, page } = await openPage(browser, theme, homeUrl)
      for (const width of widths) {
        await page.setViewport({ width, height: width === 390 ? 844 : 900 })
        for (const route of routes) {
          await page.goto(`${origin}${route.path}`, { waitUntil: "networkidle0" })
          await page.evaluate(() => {
            document.documentElement.classList.toggle("dark", (localStorage.getItem("theme") ?? document.documentElement.dataset.theme) === "dark")
          })
          const box = await overflow(page)
          const pass = box.scrollWidth <= box.clientWidth + 1 && box.bodyScrollWidth <= box.clientWidth + 1
          record(`no horizontal overflow ${route.id} ${width}px ${theme}`, pass, box)
        }
      }
      await context.close()
    }

    const focusContext = await browser.createBrowserContext()
    const focusPage = await focusContext.newPage()
    await focusPage.setViewport({ width: 1440, height: 900 })
    await focusPage.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }])
    await focusPage.goto(homeUrl, { waitUntil: "networkidle0" })
    const stops: { tag: string; text: string; label: string; feature: boolean; outlineStyle: string; outlineWidth: string; boxShadow: string }[] = []
    for (let index = 0; index < 16; index += 1) {
      await focusPage.keyboard.press("Tab")
      const info = await focusPage.evaluate(() => {
        const el = document.activeElement
        if (!(el instanceof HTMLElement)) {
          return { tag: "", text: "", label: "", feature: false, outlineStyle: "none", outlineWidth: "0px", boxShadow: "none" }
        }
        const style = getComputedStyle(el)
        return {
          tag: el.tagName,
          text: (el.innerText || el.textContent || "").trim().slice(0, 80),
          label: el.getAttribute("aria-label") ?? "",
          feature: el.getAttribute("data-feature-card") !== null,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        }
      })
      stops.push(info)
    }
    const visible = (stop: (typeof stops)[number]) =>
      (stop.outlineStyle !== "none" && stop.outlineWidth !== "0px") || (stop.boxShadow !== "none" && !stop.boxShadow.startsWith("none"))
    const focusedNav = stops.some((stop) => stop.text.includes("Daily Tech Tips") && visible(stop))
    const focusedToggle = stops.some((stop) => stop.label.includes("theme") && visible(stop))
    const focusedCard = stops.some((stop) => stop.feature && visible(stop))
    record("focus-visible styles on nav, toggle, and feature card", focusedNav && focusedToggle && focusedCard, stops)
    await focusContext.close()

    const motionContext = await browser.createBrowserContext()
    const motionPage = await motionContext.newPage()
    await motionPage.setViewport({ width: 1440, height: 900 })
    await motionPage.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ])
    await motionPage.goto(homeUrl, { waitUntil: "networkidle0" })
    const fullMotion = await motionPage.evaluate(() => {
      const hero = document.querySelector(".hero-rise")
      const card = document.querySelector("[data-slot='card']")
      return {
        hero: hero ? getComputedStyle(hero).animationDuration : "",
        card: card ? getComputedStyle(card).transitionDuration : "",
      }
    })
    await motionPage.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ])
    await motionPage.reload({ waitUntil: "networkidle0" })
    const reduced = await motionPage.evaluate(() => {
      const hero = document.querySelector(".hero-rise")
      const card = document.querySelector("[data-slot='card']")
      return {
        hero: hero ? getComputedStyle(hero).animationDuration : "",
        card: card ? getComputedStyle(card).transitionDuration : "",
      }
    })
    const reducedSeconds = [reduced.hero, reduced.card].map((value) => Number.parseFloat(value))
    record(
      "motion is present and then reduced",
      Number.parseFloat(fullMotion.hero) >= 0.4 && reducedSeconds.every((value) => value <= 0.05),
      { fullMotion, reduced },
    )
    await motionContext.close()

    const shots = routes.flatMap((route) =>
      (["light", "dark"] as const).flatMap((theme) =>
        ([1440, 390] as const).map((width) => ({
          file: `${route.id}-${width}-${theme}.png`,
          route: route.path,
          theme,
          width,
        })),
      ),
    )
    for (const shot of shots) {
      const { context, page } = await openPage(browser, shot.theme, `${origin}${shot.route}`)
      await page.setViewport({ width: shot.width, height: shot.width < 700 ? 844 : 900 })
      await page.goto(`${origin}${shot.route}`, { waitUntil: "networkidle0" })
      if (shot.theme === "dark") {
        await page.evaluate(() => {
          document.documentElement.classList.add("dark")
          document.documentElement.dataset.theme = "dark"
          document.documentElement.style.colorScheme = "dark"
        })
      }
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      })
      const file = path.join(root, "screenshots", shot.file)
      await page.screenshot({ path: file, fullPage: true })
      record(`screenshot ${shot.file}`, true, file)
      await context.close()
    }
  } finally {
    await browser.close()
    preview.kill("SIGTERM")
  }

  const pass = checks.every((check) => check.pass)
  await writeFile(
    path.join(root, "build-checks", "browser.json"),
    `${JSON.stringify({ pass, origin: homeUrl, checks }, null, 2)}\n`,
  )
  console.log(pass ? "browser-checks: pass" : "browser-checks: fail")
  return pass ? 0 : 1
}
