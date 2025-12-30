#!/usr/bin/env node
import React from "react"
import { render } from "ink"
import { App } from "./App.js"

export function run(initialPort?: number) {
  const { unmount, waitUntilExit } = render(
    <App
      onExit={() => {
        unmount()
        process.exit(0)
      }}
      initialPort={initialPort}
    />
  )

  waitUntilExit().catch(() => {})
}
