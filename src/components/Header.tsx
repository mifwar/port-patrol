import React from "react"
import { Box, Text } from "ink"

interface Props {
  totalPorts: number
  filterQuery: string
}

export function Header({ totalPorts, filterQuery }: Props) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="#3b3b3b"
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text>
          <Text color="#f87171" bold>
            Port Patrol
          </Text>
          <Text color="#6b7280"> - Who's using my ports?</Text>
        </Text>
        <Text color="#6b7280">
          {totalPorts} listening {totalPorts === 1 ? "port" : "ports"}
        </Text>
      </Box>
      {filterQuery && (
        <Box>
          <Text color="#6b7280">Filter: </Text>
          <Text color="#fbbf24">"{filterQuery}"</Text>
        </Box>
      )}
    </Box>
  )
}
