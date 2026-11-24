import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "")
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function channel(value: number): number {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function blockVars(css: string, selector: string): Record<string, string> {
  const pattern = new RegExp(`${selector}\\s*\\{([^}]*)\\}`)
  const body = css.match(pattern)?.[1] ?? ""
  const vars: Record<string, string> = {}
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    const name = match[1]
    const value = match[2]
    if (name && value) vars[name] = value.toLowerCase()
  }
  return vars
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const textPairs: [string, string, string][] = [
  ["foreground on background", "--foreground", "--background"],
  ["foreground on card", "--foreground", "--card"],
  ["muted-foreground on background", "--muted-foreground", "--background"],
  ["muted-foreground on card", "--muted-foreground", "--card"],
  ["muted-foreground on muted", "--muted-foreground", "--muted"],
  ["primary-foreground on primary", "--primary-foreground", "--primary"],
  ["primary-foreground on primary-hover", "--primary-foreground", "--primary-hover"],
  ["secondary-foreground on secondary", "--secondary-foreground", "--secondary"],
  ["secondary-foreground on secondary-hover", "--secondary-foreground", "--secondary-hover"],
  ["accent-foreground on accent", "--accent-foreground", "--accent"],
  ["highlight-foreground on highlight", "--highlight-foreground", "--highlight"],
  ["link on background", "--link", "--background"],
  ["link on card", "--link", "--card"],
  ["kicker on background", "--kicker", "--background"],
  ["kicker on card", "--kicker", "--card"],
  ["kicker on muted", "--kicker", "--muted"],
  ["primary on background", "--primary", "--background"],
  ["primary on card", "--primary", "--card"],
  ["hero text on extreme a", "--hero-text", "--hero-extreme-a"],
  ["hero text on extreme b", "--hero-text", "--hero-extreme-b"],
  ["title gradient a on extreme a", "--title-grad-a", "--hero-extreme-a"],
  ["title gradient a on extreme b", "--title-grad-a", "--hero-extreme-b"],
  ["title gradient b on extreme a", "--title-grad-b", "--hero-extreme-a"],
  ["title gradient b on extreme b", "--title-grad-b", "--hero-extreme-b"],
  ["pill edge on extreme a", "--pill-edge", "--hero-extreme-a"],
  ["pill edge on extreme b", "--pill-edge", "--hero-extreme-b"],
  ["foreground on glass", "--foreground", "--glass-solid"],
  ["destructive-foreground on destructive", "--destructive-foreground", "--destructive"],
]

const uiPairs: [string, string, string][] = [
  ["ring on background", "--ring", "--background"],
  ["border on background", "--border", "--background"],
  ["border on card", "--border", "--card"],
]

export async function run(): Promise<number> {
  const css = await readFile(path.join(root, "src/index.css"), "utf8")
  const light = blockVars(css, ":root")
  const dark = { ...light, ...blockVars(css, "\\.dark") }
  const themes = { light, dark }
  const pairs: {
    theme: string
    name: string
    foreground: string
    background: string
    ratio: number
    minimum: number
    pass: boolean
  }[] = []

  for (const [theme, vars] of Object.entries(themes)) {
    for (const [name, fg, bg] of textPairs) {
      const foreground = vars[fg]
      const background = vars[bg]
      if (!foreground || !background) {
        pairs.push({
          theme,
          name,
          foreground: foreground ?? "",
          background: background ?? "",
          ratio: 0,
          minimum: 4.5,
          pass: false,
        })
        continue
      }
      const ratio = Number(contrast(foreground, background).toFixed(2))
      pairs.push({
        theme,
        name,
        foreground,
        background,
        ratio,
        minimum: 4.5,
        pass: ratio >= 4.5,
      })
    }
    for (const [name, fg, bg] of uiPairs) {
      const foreground = vars[fg]
      const background = vars[bg]
      if (!foreground || !background) {
        pairs.push({
          theme,
          name,
          foreground: foreground ?? "",
          background: background ?? "",
          ratio: 0,
          minimum: 3,
          pass: false,
        })
        continue
      }
      const ratio = Number(contrast(foreground, background).toFixed(2))
      pairs.push({
        theme,
        name,
        foreground,
        background,
        ratio,
        minimum: 3,
        pass: ratio >= 3,
      })
    }
    const badge = vars["--logo-badge"]
    if (badge) {
      const ratio = Number(contrast("#000000", badge).toFixed(2))
      pairs.push({
        theme,
        name: "black logo artwork on logo badge",
        foreground: "#000000",
        background: badge,
        ratio,
        minimum: 4.5,
        pass: ratio >= 4.5,
      })
    }
  }

  const pass = pairs.every((pair) => pair.pass)
  const report = {
    pass,
    standard: "WCAG 2.1 AA",
    normalTextMinimum: 4.5,
    uiComponentMinimum: 3,
    pairs,
  }
  const outDir = path.join(root, "build-checks")
  await mkdir(outDir, { recursive: true })
  const body = `${JSON.stringify(report, null, 2)}\n`
  await writeFile(path.join(outDir, "contrast.json"), body)
  await writeFile(path.join(root, "contrast.json"), body)
  console.log(pass ? "contrast: pass" : "contrast: fail")
  for (const pair of pairs.filter((item) => !item.pass)) {
    console.log(`FAIL ${pair.theme} ${pair.name} ${pair.ratio}`)
  }
  return pass ? 0 : 1
}
