import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync, readdirSync } from "node:fs"
import path from "node:path"
import puppeteer from "puppeteer-core"

const root = process.cwd()
const motionDir = path.join(root, "motion")
const frameDir = path.join(motionDir, "frames")
mkdirSync(frameDir, { recursive: true })
const port = 43321
const url = `http://127.0.0.1:${port}/daily-dose-of-tech/`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const preview = spawn(process.execPath, [
  path.join(root, "node_modules/vite/bin/vite.js"),
  "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort",
], { cwd: root, stdio: "ignore" })

for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    const response = await fetch(url)
    if (response.ok) break
  } catch {
    // Preview is still booting.
  }
  await sleep(200)
}

const browser = await puppeteer.launch({
  executablePath: "/opt/google/chrome/chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

const shots = []
async function shot(page, name) {
  const file = path.join(frameDir, `${name}.png`)
  await page.screenshot({ path: file })
  shots.push(file)
}

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }])
  await page.goto(url, { waitUntil: "domcontentloaded" })
  const started = Date.now()
  await shot(page, "t0")
  await sleep(Math.max(0, 500 - (Date.now() - started)))
  await shot(page, "t0-5")
  await sleep(Math.max(0, 1000 - (Date.now() - started)))
  await shot(page, "t1")
  await sleep(Math.max(0, 2000 - (Date.now() - started)))
  await shot(page, "t2")
  for (let index = 0; index < 8; index += 1) {
    await page.evaluate((step) => window.scrollTo(0, step * window.innerHeight * 0.7), index)
    await sleep(250)
    await shot(page, `scroll-${String(index).padStart(2, "0")}`)
  }
  await page.evaluate(() => window.scrollTo(0, 640))
  await sleep(900)
  await page.evaluate(() => window.scrollBy(0, 90))
  await sleep(80)
  await shot(page, "marquee-fast")
  const fastRate = await page.evaluate(() => document.querySelector(".marquee-track")?.getAnimations()[0]?.playbackRate ?? null)
  await page.evaluate(() => window.scrollBy(0, -90))
  await sleep(80)
  await shot(page, "marquee-reverse")
  const reverseRate = await page.evaluate(() => document.querySelector(".marquee-track")?.getAnimations()[0]?.playbackRate ?? null)
  writeFileSync(path.join(motionDir, "marquee-rates.json"), `${JSON.stringify({ fastRate, reverseRate }, null, 2)}\n`)
  await page.evaluate(async () => {
    const start = window.scrollY
    for (let y = start; y >= 0; y -= 180) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForFunction(() => document.querySelector("header")?.getAttribute("data-hidden") !== "true")
  await sleep(200)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('header a[href="/daily-dose-of-tech/about/"]'),
  ])
  await shot(page, "transition")
  await page.goto(`${url}pc-building/`, { waitUntil: "domcontentloaded" })
  await shot(page, "header-0")
  await sleep(700)
  await shot(page, "header-1")
  await page.close()
} finally {
  await browser.close()
  preview.kill("SIGTERM")
}

const list = path.join(motionDir, "frames.txt")
writeFileSync(list, shots.map((file) => `file '${path.relative(motionDir, file)}'\nduration 0.35`).join("\n") + "\n")
await new Promise((resolve, reject) => {
  const child = spawn("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", list,
    "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "-pix_fmt", "yuv420p",
    path.join(motionDir, "home.mp4"),
  ], { stdio: "inherit" })
  child.on("exit", (code) => (code === 0 ? resolve(undefined) : reject(new Error(`ffmpeg exited ${code}`))))
})

const report = []
for (const file of readdirSync(frameDir).filter((name) => name.endsWith(".png")).sort()) {
  const raw = await new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-v", "error", "-i", path.join(frameDir, file), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { stdio: ["ignore", "pipe", "inherit"] })
    const chunks = []
    child.stdout.on("data", (chunk) => chunks.push(chunk))
    child.on("exit", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(file))))
  })
  let sum = 0
  let sumSq = 0
  let count = 0
  for (let index = 0; index < raw.length; index += 3 * 40) {
    const luma = 0.2126 * raw[index] + 0.7152 * raw[index + 1] + 0.0722 * raw[index + 2]
    sum += luma
    sumSq += luma * luma
    count += 1
  }
  const mean = sum / count
  const stddev = Math.sqrt(Math.max(0, sumSq / count - mean * mean))
  const blank = stddev < 8 || mean < 8
  report.push({ file, mean: Number(mean.toFixed(2)), stddev: Number(stddev.toFixed(2)), blank })
}
const summary = { pass: report.every((item) => !item.blank), frames: report }
writeFileSync(path.join(motionDir, "frames.json"), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
process.exit(summary.pass ? 0 : 1)
