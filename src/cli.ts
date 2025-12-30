#!/usr/bin/env node
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { run } from "./index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "package.json")
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    return pkg.version
  } catch {
    return "unknown"
  }
}

function showHelp(): void {
  console.log(`
Port Patrol - Inspect listening ports and kill the owning process

Usage: pp [port] [options]

Options:
  -v, --version    Show version number
  -h, --help       Show this help message

Shortcuts:
  / or f           Search/filter
  Enter            Kill selected process
  K                Force kill (SIGKILL)
  r                Refresh list
  s                Toggle sort field
  o                Toggle sort order
  ?                Show help
  q                Quit
`)
}

const args = process.argv.slice(2)

if (args.includes("-v") || args.includes("--version")) {
  console.log(getVersion())
  process.exit(0)
}

if (args.includes("-h") || args.includes("--help")) {
  showHelp()
  process.exit(0)
}

let initialPort: number | undefined
for (const arg of args) {
  const portArg = parseInt(arg, 10)
  if (!isNaN(portArg)) {
    initialPort = portArg
    break
  }
}

run(initialPort)
