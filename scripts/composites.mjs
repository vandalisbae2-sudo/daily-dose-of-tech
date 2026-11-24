import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync, readFileSync } from "node:fs"
import path from "node:path"
import puppeteer from "puppeteer-core"

const root = process.cwd()
const shotDir = path.join(root, "screenshots")
const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
const versions = [
  { id: "v1", dir: "/tmp/ddot-v1", port: 43311 },
  { id: "v2", dir: "/tmp/ddot-v2", port: 43312 },
  { id: "v3", dir: root, port: 43313 },
]
const pages = [
  { id: "home", route: "/daily-dose-of-tech/", label: "Home" },
  { id: "pc", route: "/daily-dose-of-tech/pc-building/", label: "PC Building" },
]
const widths = [1440, 390]
const themes = ["light", "dark"]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Preview is still booting.
    }
    await sleep(200)
  }
  throw new Error(`preview did not start: ${url}`)
}

mkdirSync(path.join(shotDir, "panels"), { recursive: true })
const previews = versions.map((version) =>
  spawn(process.execPath, [
    path.join(version.dir, "node_modules/vite/bin/vite.js"),
    "preview", "--host", "127.0.0.1", "--port", String(version.port), "--strictPort",
  ], { cwd: version.dir, stdio: "ignore" }),
)

const browser = await puppeteer.launch({
  executablePath: "/opt/google/chrome/chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

try {
  for (const version of versions) {
    await waitFor(`http://127.0.0.1:${version.port}/daily-dose-of-tech/`)
  }
  for (const theme of themes) {
    for (const width of widths) {
      for (const pageInfo of pages) {
        for (const version of versions) {
          const page = await browser.newPage()
          await page.setViewport({ width, height: width === 390 ? 844 : 900 })
          await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])
          const origin = `http://127.0.0.1:${version.port}`
          await page.goto(`${origin}${pageInfo.route}`, { waitUntil: "networkidle0" })
          await page.evaluate(() => localStorage.removeItem("theme"))
          await page.reload({ waitUntil: "networkidle0" })
          await page.evaluate(async () => {
            const height = document.documentElement.scrollHeight
            for (let y = 0; y < height; y += 500) {
              window.scrollTo(0, y)
              await new Promise((resolve) => setTimeout(resolve, 40))
            }
            window.scrollTo(0, 0)
          })
          const file = path.join(shotDir, "panels", `${version.id}-${pageInfo.id}-${width}-${theme}.png`)
          await page.screenshot({ path: file, fullPage: pageInfo.id === "home" })
          await page.close()
        }
      }
    }
  }
} finally {
  await browser.close()
  for (const preview of previews) preview.kill("SIGTERM")
}

const results = []
for (const theme of themes) {
  for (const width of widths) {
    for (const pageInfo of pages) {
      const files = versions.map((version) => path.join(shotDir, "panels", `${version.id}-${pageInfo.id}-${width}-${theme}.png`))
      const labels = versions.map((version) => `${version.id} ${pageInfo.label}, ${width}, ${theme}`)
      const out = path.join(shotDir, `composite-${pageInfo.id}-${width}-${theme}.png`)
      const homePanels = pageInfo.id === "home"
      let composeFiles = files
      if (homePanels) {
        const scaled = []
        for (const file of files) {
          const target = file.replace(/\.png$/, ".w640.png")
          await ffmpeg(["-y", "-i", file, "-vf", "scale=640:-1", target])
          scaled.push(target)
        }
        const heights = []
        for (const file of scaled) {
          const probe = JSON.parse(readFileSync(await ffprobe(file), "utf8"))
          heights.push(probe.streams[0].height)
        }
        const maxHeight = Math.max(...heights)
        composeFiles = []
        for (const [index, file] of scaled.entries()) {
          const labelFile = path.join(shotDir, "panels", `label-${index}.txt`)
          writeFileSync(labelFile, labels[index] ?? "")
          const target = file.replace(/\.png$/, ".labeled.png")
          await ffmpeg([
            "-y", "-i", file,
            "-vf", `pad=640:${maxHeight + 52}:0:52:color=0x111827,drawtext=fontfile=${font}:textfile=${labelFile}:fontcolor=white:fontsize=22:x=16:y=14`,
            target,
          ])
          composeFiles.push(target)
        }
      }
      const filters = (homePanels ? composeFiles : files).map((_, index) => {
        if (homePanels) return `[${index}:v]null[p${index}]`
        const labelFile = path.join(shotDir, "panels", `label-${index}.txt`)
        writeFileSync(labelFile, labels[index] ?? "")
        return `[${index}:v]pad=iw:ih+52:0:52:color=0x111827,drawtext=fontfile=${font}:textfile=${labelFile}:fontcolor=white:fontsize=22:x=16:y=14[p${index}]`
      })
      const inputArgs = composeFiles.flatMap((file) => ["-i", file])
      const chain = homePanels
        ? "[0:v][1:v][2:v]hstack=inputs=3"
        : `${filters.join(";")};[p0][p1][p2]hstack=inputs=3`
      await ffmpeg(["-y", ...inputArgs, "-filter_complex", chain, out])
      const probe = JSON.parse(readFileSync(await ffprobe(out), "utf8"))
      const stream = probe.streams[0]
      const raw = await rawFrame(out)
      const panelWidth = Math.floor(stream.width / 3)
      const panels = versions.map((version, index) => {
        const stats = panelStats(raw, stream.width, stream.height, index * panelWidth, panelWidth)
        return { version: version.id, ...stats }
      })
      const flat = panels.some((panel) => panel.stddev < 12 || panel.mean < 8)
      results.push({ file: path.relative(root, out), width: stream.width, height: stream.height, panels, flat })
      if (flat) console.error(`FLAT PANEL ${out}`)
    }
  }
}

const report = { pass: results.every((item) => !item.flat), results }
writeFileSync(path.join(root, "build-logs", "composite-variance.json"), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exit(report.pass ? 0 : 1)

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "inherit" })
    child.on("exit", (code) => (code === 0 ? resolve(undefined) : reject(new Error(`ffmpeg exited ${code}`))))
  })
}

function ffprobe(file) {
  const target = `${file}.probe.json`
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file], { stdio: ["ignore", "pipe", "inherit"] })
    let body = ""
    child.stdout.on("data", (chunk) => { body += chunk })
    child.on("exit", (code) => {
      if (code !== 0) reject(new Error("ffprobe failed"))
      else {
        writeFileSync(target, body)
        resolve(target)
      }
    })
  })
}

function rawFrame(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-v", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { stdio: ["ignore", "pipe", "inherit"] })
    const chunks = []
    child.stdout.on("data", (chunk) => chunks.push(chunk))
    child.on("exit", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error("raw frame failed"))))
  })
}

function panelStats(raw, width, height, start, panelWidth) {
  let count = 0
  let sum = 0
  let sumSq = 0
  for (let y = 52; y < height; y += 2) {
    for (let x = start; x < start + panelWidth; x += 2) {
      const index = (y * width + x) * 3
      const luma = 0.2126 * raw[index] + 0.7152 * raw[index + 1] + 0.0722 * raw[index + 2]
      sum += luma
      sumSq += luma * luma
      count += 1
    }
  }
  const mean = sum / count
  const variance = Math.max(0, sumSq / count - mean * mean)
  return { mean: Number(mean.toFixed(2)), stddev: Number(Math.sqrt(variance).toFixed(2)) }
}
