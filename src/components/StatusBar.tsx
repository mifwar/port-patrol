import React from "react"
import { Box, Text } from "ink"
import type { SortField, SortOrder } from "../types/index.js"

interface Props {
  message?: string | null
  messageType?: "info" | "success" | "error"
  sortField: SortField
  sortOrder: SortOrder
}

export function StatusBar({ message, messageType = "info", sortField, sortOrder }: Props) {
  const messageColor =
    messageType === "success" ? "#22c55e" : messageType === "error" ? "#f87171" : "#60a5fa"

  const sortLabel = `${sortField} ${sortOrder === "asc" ? "↑" : "↓"}`

  return (
    <Box
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderColor="#3b3b3b"
      paddingX={1}
      justifyContent="space-between"
    >
      <Text color="#6b7280">
        j/k: nav | /: search | Enter: kill | i: details | r: refresh | s: sort | ?: help | q: quit
      </Text>
      <Box>
        {message ? (
          <Text color={messageColor}>{message}</Text>
        ) : (
          <Text color="#6b7280">sort: {sortLabel}</Text>
        )}
      </Box>
    </Box>
  )
}
