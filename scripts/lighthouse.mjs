import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const port = 43229
const url = `http://127.0.0.1:${port}/daily-dose-of-tech/`
const outDir = path.join(root, "lighthouse")
mkdirSync(outDir, { recursive: true })

const preview = spawn(process.execPath, [
  path.join(root, "node_modules/vite/bin/vite.js"),
  "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort",
], { cwd: root, stdio: "ignore" })

async function waitFor() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Preview is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error("preview did not start")
}

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["--yes", "lighthouse", ...args], { cwd: root, stdio: "inherit" })
    child.on("exit", (code) => (code === 0 ? resolve(undefined) : reject(new Error(`lighthouse exited ${code}`))))
  })
}

try {
  await waitFor()
  const shared = [
    url,
    "--quiet",
    "--only-categories=performance,accessibility",
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
    "--output=json",
  ]
  await run([...shared, "--form-factor=mobile", "--screenEmulation.mobile=true", `--output-path=${path.join(outDir, "home-mobile.json")}`])
  await run([...shared, "--preset=desktop", `--output-path=${path.join(outDir, "home-desktop.json")}`])
  const mobile = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(path.join(outDir, "home-mobile.json"), "utf8")))
  const desktop = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(path.join(outDir, "home-desktop.json"), "utf8")))
  const summary = {
    mobile: {
      performance: Math.round((mobile.categories.performance.score ?? 0) * 100),
      accessibility: Math.round((mobile.categories.accessibility.score ?? 0) * 100),
      cls: mobile.audits["cumulative-layout-shift"].numericValue,
      lcpMs: mobile.audits["largest-contentful-paint"].numericValue,
    },
    desktop: {
      performance: Math.round((desktop.categories.performance.score ?? 0) * 100),
      accessibility: Math.round((desktop.categories.accessibility.score ?? 0) * 100),
      cls: desktop.audits["cumulative-layout-shift"].numericValue,
      lcpMs: desktop.audits["largest-contentful-paint"].numericValue,
    },
  }
  summary.pass =
    summary.mobile.performance >= 85 &&
    summary.desktop.performance >= 90 &&
    summary.mobile.accessibility >= 95 &&
    summary.desktop.accessibility >= 95 &&
    summary.mobile.cls <= 0.1 &&
    summary.desktop.cls <= 0.1 &&
    summary.mobile.lcpMs <= 2500
  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`)
  console.log(JSON.stringify(summary, null, 2))
  process.exitCode = summary.pass ? 0 : 1
} finally {
  preview.kill("SIGTERM")
}
