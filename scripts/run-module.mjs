import { createServer } from "vite"

const entry = process.argv[2]
if (!entry) {
  console.error("Usage: node scripts/run-module.mjs <entry>")
  process.exit(1)
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
})

try {
  const loaded = await server.ssrLoadModule(`/${entry.replace(/^\//, "")}`)
  const run = loaded.run ?? loaded.default
  if (typeof run !== "function") {
    throw new Error(`${entry} does not export run()`)
  }
  const code = await run()
  process.exitCode = typeof code === "number" ? code : 0
} finally {
  await server.close()
}
