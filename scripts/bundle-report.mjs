import { gzipSync } from "node:zlib"
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const dist = path.join(root, "dist")
const pages = [
  ["home", "index.html"],
  ["tips", "daily-tech-tips/index.html"],
  ["pc", "pc-building/index.html"],
  ["insights", "insights/index.html"],
  ["about", "about/index.html"],
]

function jsRefs(html) {
  return [...html.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1])
}

const assets = new Map()
for (const file of readdirSync(path.join(dist, "assets"))) {
  if (!file.endsWith(".js")) continue
  const abs = path.join(dist, "assets", file)
  const gzip = gzipSync(readFileSync(abs)).length
  assets.set(`/daily-dose-of-tech/assets/${file}`, {
    file,
    gzipBytes: gzip,
    gzipKB: Number((gzip / 1000).toFixed(2)),
    gzipKiB: Number((gzip / 1024).toFixed(2)),
  })
}

const entries = pages.map(([id, file]) => {
  const html = readFileSync(path.join(dist, file), "utf8")
  const refs = jsRefs(html)
  const files = refs.map((ref) => assets.get(ref)).filter(Boolean)
  const gzipBytes = files.reduce((sum, item) => sum + item.gzipBytes, 0)
  return {
    id,
    file,
    js: files,
    gzipBytes,
    gzipKB: Number((gzipBytes / 1000).toFixed(2)),
    gzipKiB: Number((gzipBytes / 1024).toFixed(2)),
  }
})

const home = entries.find((entry) => entry.id === "home")
const lazy = [...assets.values()].filter((item) => !home.js.some((file) => file.file === item.file))
const report = {
  entries,
  units: {
    KB: "1000 bytes",
    KiB: "1024 bytes",
    gzip: "Node zlib gzipSync default compression",
  },
  homeInitialGzipBytes: home?.gzipBytes ?? 0,
  homeInitialGzipKB: home?.gzipKB ?? 0,
  homeInitialGzipKiB: home?.gzipKiB ?? 0,
  homeLazyGzipBytes: lazy.reduce((sum, item) => sum + item.gzipBytes, 0),
  homeTotalGzipBytes: (home?.gzipBytes ?? 0) + lazy.reduce((sum, item) => sum + item.gzipBytes, 0),
  budgetGzipBytes: 220000,
  budgetNote: "220 KB where 1 KB = 1000 bytes. The same total is also under 220 KiB (225280 bytes).",
  pass: (home?.gzipBytes ?? 999999999) <= 220000,
}
mkdirSync(path.join(root, "bundle"), { recursive: true })
writeFileSync(path.join(root, "bundle", "report.json"), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exit(report.pass ? 0 : 1)
