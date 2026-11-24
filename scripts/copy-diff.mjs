import { execSync } from "node:child_process"
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const v2 = "b1defee"
const allow = new Set([
  "Pause animation",
  "Play animation",
  "Pause tagline",
  "Play tagline",
  "Pause background",
  "Play background",
  "Pause marquee",
  "Play marquee",
  "Menu",
  "⌘K",
  "Skip to content",
  "Search",
  "Filter",
  "Show summary",
  "Hide summary",
  "Mark step done",
  "Build progress",
  "No results",
  "All",
  "Software",
  "Hardware",
  "Pages",
  "Close",
])

function files(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...files(full))
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full)
  }
  return out
}

function strings(text) {
  const found = new Set()
  for (const match of text.matchAll(/>([^<>{}]+)</g)) {
    const raw = match[1] ?? ""
    if (/[=;(){}]/.test(raw)) continue
    const value = raw.replace(/\s+/g, " ").trim()
    if (value && /[A-Za-z⌘]/.test(value)) found.add(value)
  }
  for (const match of text.matchAll(/"([^"\\]+)"/g)) {
    const value = match[1] ?? ""
    if (allow.has(value)) found.add(value)
  }
  return found
}

const current = new Set()
for (const file of files(path.join(root, "src"))) {
  for (const value of strings(readFileSync(file, "utf8"))) current.add(value)
}
const previousText = execSync(`git ls-tree -r --name-only ${v2} src`, { cwd: root, encoding: "utf8" })
const previous = new Set()
for (const file of previousText.split("\n").filter(Boolean)) {
  const text = execSync(`git show ${v2}:${file}`, { cwd: root, encoding: "utf8" })
  for (const value of strings(text)) previous.add(value)
}
const added = [...current].filter((value) => !previous.has(value)).sort()
const unexpected = added.filter((value) => !allow.has(value) && !value.startsWith("http") && !value.includes("var(") && !value.includes("{"))
const report = { added, unexpected, pass: unexpected.length === 0 }
mkdirSync(path.join(root, "build-logs"), { recursive: true })
writeFileSync(path.join(root, "build-logs", "copy-diff.json"), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exit(report.pass ? 0 : 1)
