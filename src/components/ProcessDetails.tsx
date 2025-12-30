import React from "react"
import { Box, Text, useInput } from "ink"
import type { PortProcess } from "../types/index.js"

interface Props {
  process: PortProcess
  details: string
  onClose: () => void
}

export function ProcessDetails({ process, details, onClose }: Props) {
  useInput((input, key) => {
    if (key.escape || input === "i" || input === "q") {
      onClose()
    }
  })

  const detailLines = details ? details.split("\n") : []

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#22c55e" paddingX={2} paddingY={1}>
      <Text color="#22c55e" bold>
        Process Details
      </Text>

      <Box marginTop={1} flexDirection="column" paddingLeft={1}>
        <Text>
          <Text color="#6b7280">Port: </Text>
          <Text color="#fbbf24">{process.port}</Text>
          <Text color="#6b7280"> ({process.protocol})</Text>
        </Text>
        <Text>
          <Text color="#6b7280">PID: </Text>
          <Text color="#60a5fa">{process.pid}</Text>
        </Text>
        <Text>
          <Text color="#6b7280">Process: </Text>
          <Text>{process.processName}</Text>
        </Text>
        {process.user && (
          <Text>
            <Text color="#6b7280">User: </Text>
            <Text>{process.user}</Text>
          </Text>
        )}
        <Text>
          <Text color="#6b7280">Address: </Text>
          <Text>{process.address}</Text>
        </Text>
        {process.command && (
          <Text>
            <Text color="#6b7280">Command: </Text>
            <Text dimColor>{process.command}</Text>
          </Text>
        )}
        {process.cwd && (
          <Text>
            <Text color="#6b7280">CWD: </Text>
            <Text dimColor>{process.cwd}</Text>
          </Text>
        )}
      </Box>

      {detailLines.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text color="#6b7280">ps output:</Text>
          <Box marginTop={1} flexDirection="column" paddingLeft={1}>
            {detailLines.map((line, idx) => (
              <Text key={`${process.pid}:${idx}`} dimColor>
                {line}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="#6b7280" dimColor>
          Press i or Esc to close
        </Text>
      </Box>
    </Box>
  )
}
