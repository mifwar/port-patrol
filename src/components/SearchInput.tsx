import React from "react"
import { Box, Text } from "ink"

interface Props {
  value: string
  placeholder?: string
}

export function SearchInput({ value, placeholder = "Search by port or process name..." }: Props) {
  return (
    <Box
      paddingX={1}
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="#3b3b3b"
    >
      <Text color="#60a5fa">/</Text>
      <Text color="#6b7280"> </Text>
      {value ? (
        <Text color="#e5e7eb">{value}</Text>
      ) : (
        <Text color="#6b7280" dimColor>
          {placeholder}
        </Text>
      )}
      <Text color="#60a5fa">▋</Text>
    </Box>
  )
}
