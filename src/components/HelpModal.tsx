import React from "react"
import { Box, Text, useInput } from "ink"

interface Props {
  onClose: () => void
}

const KEYBINDINGS = [
  { key: "j / ↓", action: "Move down" },
  { key: "k / ↑", action: "Move up" },
  { key: "g", action: "Jump to top" },
  { key: "G", action: "Jump to bottom" },
  { key: "/ or f", action: "Search/filter" },
  { key: "Enter", action: "Kill selected process" },
  { key: "i", action: "Show process details" },
  { key: "K", action: "Force kill (SIGKILL)" },
  { key: "r", action: "Refresh list" },
  { key: "s", action: "Toggle sort (port/pid/name)" },
  { key: "o", action: "Toggle sort order" },
  { key: "Esc", action: "Clear search / Close modal" },
  { key: "?", action: "Show this help" },
  { key: "q", action: "Quit" }
]

export function HelpModal({ onClose }: Props) {
  useInput((input, key) => {
    if (key.escape || input === "?" || input === "q") {
      onClose()
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#60a5fa" paddingX={2} paddingY={1}>
      <Text color="#60a5fa" bold>
        Keyboard Shortcuts
      </Text>

      <Box marginTop={1} flexDirection="column">
        {KEYBINDINGS.map(({ key, action }) => (
          <Box key={key}>
            <Box width={14}>
              <Text color="#fbbf24">{key}</Text>
            </Box>
            <Text color="#9ca3af">{action}</Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="#6b7280" dimColor>
          Port colors: <Text color="#f87171">system (&lt;1024)</Text>{" "}
          <Text color="#fbbf24">registered (&lt;10000)</Text>{" "}
          <Text color="#22c55e">dynamic (10000+)</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="#6b7280" dimColor>
          Press ? or Esc to close
        </Text>
      </Box>
    </Box>
  )
}
