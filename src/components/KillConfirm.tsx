import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import type { PortProcess } from "../types/index.js"

interface Props {
  process: PortProcess
  onConfirm: (force: boolean) => void
  onCancel: () => void
}

export function KillConfirm({ process, onConfirm, onCancel }: Props) {
  const [forceMode, setForceMode] = useState(false)

  useInput((input, key) => {
    if (key.escape || input === "n") {
      onCancel()
      return
    }

    if (input === "y" || key.return) {
      onConfirm(forceMode)
    }

    if (input === "f") {
      setForceMode((v) => !v)
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#f87171" paddingX={2} paddingY={1}>
      <Text color="#f87171" bold>
        Kill Process
      </Text>

      <Box marginTop={1} flexDirection="column" paddingLeft={1}>
        <Text>
          <Text color="#6b7280">Port: </Text>
          <Text color="#fbbf24">{process.port}</Text>
        </Text>
        <Text>
          <Text color="#6b7280">PID: </Text>
          <Text color="#60a5fa">{process.pid}</Text>
        </Text>
        <Text>
          <Text color="#6b7280">Process: </Text>
          <Text>{process.processName}</Text>
        </Text>
        {process.command && (
          <Text>
            <Text color="#6b7280">Command: </Text>
            <Text dimColor>{process.command.slice(0, 60)}</Text>
          </Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text>
          <Text color="#6b7280">Force kill (SIGKILL): </Text>
          <Text color={forceMode ? "#f87171" : "#22c55e"}>{forceMode ? "YES" : "no"}</Text>
          <Text color="#6b7280"> (press f to toggle)</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="#6b7280" dimColor>
          y/Enter confirm | n/Esc cancel | f toggle force
        </Text>
      </Box>
    </Box>
  )
}
