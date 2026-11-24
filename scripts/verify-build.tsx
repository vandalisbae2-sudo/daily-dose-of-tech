import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { App } from "../src/App.tsx"
import { BuildStepList } from "../src/components/build-step-list.tsx"
import { InsightGroups } from "../src/components/insight-groups.tsx"
import { SiteHeader } from "../src/components/site-header.tsx"
import { buildSteps } from "../src/content/pc-build-steps.ts"
import { insights } from "../src/content/insights.ts"
import { heroFeatures, navItems, type PageId } from "../src/content/site.ts"
import { tips } from "../src/content/tips.ts"
import { withBase } from "../src/lib/paths.ts"
import type { BuildStep } from "../src/content/pc-build-steps.ts"
import type { Insight } from "../src/content/insights.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const distDir = path.join(root, "dist")
const base = "/daily-dose-of-tech/"

const pages: { id: PageId; file: string }[] = [
  { id: "home", file: "index.html" },
  { id: "tips", file: "daily-tech-tips/index.html" },
  { id: "pc", file: "pc-building/index.html" },
  { id: "insights", file: "insights/index.html" },
  { id: "about", file: "about/index.html" },
]

const banned: { name: string; pattern: RegExp }[] = [
  { name: "CompTIA", pattern: /comptia/i },
  { name: "A+", pattern: /(?<![\w.])A\+(?![\w+])/ },
  { name: "exam-prep", pattern: /exam[-\s]?prep/i },
  { name: "exam preparation", pattern: /exam preparation/i },
  { name: "Sunshine Bay", pattern: /sunshine bay/i },
  { name: "Bridgewater Joy", pattern: /bridgewater joy/i },
  { name: "Pleasantview Gem Inn", pattern: /pleasantview gem inn/i },
  { name: "residences", pattern: /residences/i },
]

const textExtensions = new Set([
  ".html",
  ".js",
  ".css",
  ".json",
  ".txt",
  ".map",
  ".svg",
  ".ts",
  ".tsx",
  ".md",
  ".yml",
  ".yaml",
])

type Check = { name: string; pass: boolean; detail: string }

const checks: Check[] = []

function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail })
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

function hrefsIn(html: string, tag: string): string[] {
  const region = html.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "i"))?.[0] ?? ""
  return [...region.matchAll(/\shref="([^"]*)"/g)].map((match) => match[1] ?? "")
}

export async function run(): Promise<number> {
  const distFiles = await walk(distDir)
  const srcFiles = await walk(path.join(root, "src"))

  for (const page of pages) {
    const filePath = path.join(distDir, page.file)
    let exists = false
    try {
      const info = await stat(filePath)
      exists = info.isFile()
    } catch {
      exists = false
    }
    check(`page file ${page.file}`, exists, exists ? filePath : "missing")
  }

  const expectedHrefs = navItems.map((item) => withBase(item.path))
  for (const page of pages) {
    const markup = renderToStaticMarkup(<SiteHeader page={page.id} />)
    const headerHrefs = hrefsIn(markup, "header")
    const missing = expectedHrefs.filter((href) => !headerHrefs.includes(href))
    check(
      `header links on ${page.id}`,
      missing.length === 0,
      missing.length === 0 ? headerHrefs.join(", ") : `missing ${missing.join(", ")}`,
    )
  }

  const home = renderToStaticMarkup(<App page="home" />)
  const featureHrefs = heroFeatures.map((feature) => ({
    page: feature.page,
    href: withBase(feature.path),
  }))
  const featureOk = featureHrefs.every((feature) => {
    const marker = `data-feature-card="${feature.page}"`
    const start = home.indexOf(marker)
    if (start < 0) return false
    const slice = home.slice(Math.max(0, start - 200), start + 200)
    return slice.includes(`href="${feature.href}"`)
  })
  check(
    "home hero has 3 feature cards",
    featureOk && featureHrefs.length === 3,
    featureHrefs.map((feature) => `${feature.page} -> ${feature.href}`).join("; "),
  )

  check("shipped tips empty", tips.length === 0, `length ${tips.length}`)
  check("shipped steps empty", buildSteps.length === 0, `length ${buildSteps.length}`)
  check("shipped insights empty", insights.length === 0, `length ${insights.length}`)

  const emptyPc = renderToStaticMarkup(<App page="pc" />)
  check(
    "empty pc page shows the coming note and no step list",
    emptyPc.includes("Content is coming.") && !emptyPc.includes("<ol"),
    emptyPc.includes("<ol") ? "rendered an ol" : "note only",
  )
  const emptyInsights = renderToStaticMarkup(<App page="insights" />)
  check(
    "empty insights page shows the coming note and no groups",
    emptyInsights.includes("Content is coming.") &&
      !emptyInsights.includes('id="software-insights"') &&
      !emptyInsights.includes('id="hardware-insights"'),
    "grouped headings stay hidden until there are insights",
  )

  const fixtureSteps: BuildStep[] = [
    { title: "Fixture Alpha", body: "First fixture body." },
    { title: "Fixture Beta", body: "Second fixture body." },
    { title: "Fixture Gamma", body: "Third fixture body." },
  ]
  const stepsHtml = renderToStaticMarkup(<BuildStepList steps={fixtureSteps} />)
  const stepPositions = fixtureSteps.map((step) => stepsHtml.indexOf(step.title))
  const ordered =
    stepsHtml.includes("<ol") &&
    !stepsHtml.includes("<ul") &&
    stepsHtml.includes("list-decimal") &&
    stepPositions.every((position, index) => position > (stepPositions[index - 1] ?? -1))
  check(
    "fixture steps render as a numbered ordered list",
    ordered,
    stepsHtml.replace(/\s+/g, " ").slice(0, 500),
  )

  const fixtureInsights: Insight[] = [
    { title: "Soft One", summary: "Software fixture one.", group: "software" },
    { title: "Hard One", summary: "Hardware fixture one.", group: "hardware" },
    { title: "Soft Two", summary: "Software fixture two.", group: "software" },
  ]
  const insightsHtml = renderToStaticMarkup(<InsightGroups insights={fixtureInsights} />)
  const softwareAt = insightsHtml.indexOf('id="software-insights"')
  const hardwareAt = insightsHtml.indexOf('id="hardware-insights"')
  const softOne = insightsHtml.indexOf("Soft One")
  const softTwo = insightsHtml.indexOf("Soft Two")
  const hardOne = insightsHtml.indexOf("Hard One")
  const grouped =
    softwareAt >= 0 &&
    hardwareAt > softwareAt &&
    softOne > softwareAt &&
    softTwo > softOne &&
    softTwo < hardwareAt &&
    hardOne > hardwareAt
  check(
    "fixture insights group software then hardware",
    grouped,
    `software ${softwareAt}, softOne ${softOne}, softTwo ${softTwo}, hardware ${hardwareAt}, hardOne ${hardOne}`,
  )

  const bundleText = (
    await Promise.all(
      distFiles
        .filter((file) => path.extname(file) === ".js")
        .map((file) => readFile(file, "utf8")),
    )
  ).join("\n")
  const routePaths = navItems.map((item) => item.path)
  const bundleMissing = [
    ...(!bundleText.includes(base) ? [base] : []),
    ...routePaths.filter((route) => !bundleText.includes(route)),
  ]
  check(
    "built bundle contains the base path and the five routes",
    bundleMissing.length === 0,
    bundleMissing.length === 0 ? "base and routes present" : bundleMissing.join(", "),
  )

  const assetRefs = new Set<string>()
  const badRefs: string[] = []
  const consider = (file: string, ref: string) => {
    const cleaned = ref.trim().replace(/["']/g, "")
    if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("#") || cleaned.startsWith("mailto:")) {
      return
    }
    if (/^https?:\/\//i.test(cleaned)) return
    if (cleaned.includes("${") || cleaned.includes("+") || cleaned.includes("`")) return
    if (!cleaned.startsWith(base)) {
      badRefs.push(`${path.relative(distDir, file)} -> ${cleaned}`)
      return
    }
    assetRefs.add(cleaned.split("?")[0] ?? cleaned)
  }
  for (const file of distFiles.filter((item) => path.extname(item) === ".html")) {
    const text = await readFile(file, "utf8")
    for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) consider(file, match[1] ?? "")
  }
  for (const file of distFiles.filter((item) => path.extname(item) === ".css")) {
    const text = await readFile(file, "utf8")
    for (const match of text.matchAll(/url\(([^)]+)\)/g)) consider(file, match[1] ?? "")
  }
  for (const file of distFiles.filter((item) => path.extname(item) === ".js")) {
    const text = await readFile(file, "utf8")
    for (const match of text.matchAll(/\/daily-dose-of-tech\/[A-Za-z0-9._~/-]+/g)) {
      consider(file, match[0] ?? "")
    }
  }
  const missingAssets: string[] = []
  for (const ref of assetRefs) {
    const relative = decodeURIComponent((ref.slice(base.length).split("?")[0] ?? "").replace(/^\/+/, ""))
    const assetPath =
      relative === "" || relative.endsWith("/")
        ? path.join(distDir, relative, "index.html")
        : path.join(distDir, relative)
    try {
      const info = await stat(assetPath)
      if (!info.isFile()) missingAssets.push(`${ref} -> ${path.relative(distDir, assetPath)}`)
    } catch {
      missingAssets.push(`${ref} -> ${path.relative(distDir, assetPath)}`)
    }
  }
  check(
    "internal links and assets stay under the base path and resolve",
    badRefs.length === 0 && missingAssets.length === 0,
    [
      badRefs.length ? `outside base: ${badRefs.join(" | ")}` : "no off-base refs",
      missingAssets.length ? `missing: ${missingAssets.join(" | ")}` : `${assetRefs.size} assets resolved`,
    ].join("; "),
  )

  const scanned = [...srcFiles, ...distFiles].filter((file) =>
    textExtensions.has(path.extname(file).toLowerCase()),
  )
  const hits: string[] = []
  for (const file of scanned) {
    const text = await readFile(file, "utf8")
    for (const needle of banned) {
      if (needle.pattern.test(text)) {
        hits.push(`${needle.name} in ${path.relative(root, file)}`)
      }
    }
  }
  const names = [...srcFiles, ...distFiles].map((file) => path.relative(root, file))
  for (const name of names) {
    for (const needle of banned) {
      if (needle.pattern.test(name)) hits.push(`${needle.name} in filename ${name}`)
    }
  }
  check("banned template and certification text is absent", hits.length === 0, hits.join("; ") || "clean")

  const pass = checks.every((item) => item.pass)
  const report = {
    pass,
    base,
    routing: "vite-multi-page",
    checks,
  }
  const outDir = path.join(root, "build-checks")
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, "verify.json"), `${JSON.stringify(report, null, 2)}\n`)
  for (const item of checks) {
    console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`)
    if (!item.pass) console.log(`  ${item.detail}`)
  }
  console.log(pass ? "verify-build: pass" : "verify-build: fail")
  return pass ? 0 : 1
}
