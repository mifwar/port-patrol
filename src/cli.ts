#!/usr/bin/env node
import { run } from "./index.js"

// Parse CLI args for quick port lookup
const args = process.argv.slice(2)
let initialPort: number | undefined

if (args.length > 0) {
  const portArg = parseInt(args[0], 10)
  if (!isNaN(portArg)) {
    initialPort = portArg
  }
}

run(initialPort)
