import React from "react"
import { Box, Text } from "ink"
import type { PortProcess } from "../types/index.js"

interface Props {
  processes: PortProcess[]
  selectedIndex: number
  scrollOffset: number
  maxVisible: number
  showScrollIndicators: boolean
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len - 1) + "…"
}

function formatCwd(cwd: string): string {
  const home = process.env.HOME || ""
  if (cwd.startsWith(home)) {
    return "~" + cwd.slice(home.length)
  }
  return cwd
}

function getDisplayCommand(proc: PortProcess): string {
  // For node/interpreters, show cwd (project path) if available
  if (proc.cwd) {
    return formatCwd(proc.cwd)
  }
  // Otherwise show the command
  return proc.command || proc.processName
}

function ProcessRow({ proc, isSelected }: { proc: PortProcess; isSelected: boolean }) {
  const portColor = proc.port < 1024 ? "#f87171" : proc.port < 10000 ? "#fbbf24" : "#22c55e"
  const displayCmd = getDisplayCommand(proc)
  const colGap = 1

  return (
    <Box paddingX={1}>
      <Box width={2} marginRight={colGap}>
        <Text color={isSelected ? "#fbbf24" : "#6b7280"}>{isSelected ? "▸" : " "}</Text>
      </Box>

      <Box width={7} marginRight={colGap}>
        <Text color={portColor} bold={isSelected}>
          {proc.port}
        </Text>
      </Box>

      <Box width={5} marginRight={colGap}>
        <Text color="#6b7280">{proc.protocol}</Text>
      </Box>

      <Box width={8} marginRight={colGap}>
        <Text color={isSelected ? "#9ca3af" : "#6b7280"}>{proc.pid}</Text>
      </Box>

      <Box width={20} marginRight={colGap}>
        <Text color="#60a5fa" bold={isSelected}>
          {truncate(proc.processName, 19)}
        </Text>
      </Box>

      <Box width={9} marginRight={colGap}>
        <Text color="#6b7280">{truncate(proc.user || "-", 8)}</Text>
      </Box>

      <Box flexGrow={1}>
        <Text color={isSelected ? "#22c55e" : "#6b7280"} dimColor={!isSelected}>
          {proc.cwd ? truncate(displayCmd, 60) : truncate(displayCmd, 50)}
        </Text>
      </Box>
    </Box>
  )
}

export function ProcessList({
  processes,
  selectedIndex,
  scrollOffset,
  maxVisible,
  showScrollIndicators
}: Props) {
  const colGap = 1
  const visible = processes.slice(scrollOffset, scrollOffset + maxVisible)
  const showScrollUp = scrollOffset > 0
  const showScrollDown = scrollOffset + maxVisible < processes.length

  return (
    <Box flexDirection="column">
      {/* Header row */}
      <Box paddingX={1} marginBottom={1}>
        <Box width={2} marginRight={colGap}>
          <Text> </Text>
        </Box>
        <Box width={7} marginRight={colGap}>
          <Text color="#6b7280" bold>
            PORT
          </Text>
        </Box>
        <Box width={5} marginRight={colGap}>
          <Text color="#6b7280" bold>
            PROTO
          </Text>
        </Box>
        <Box width={8} marginRight={colGap}>
          <Text color="#6b7280" bold>
            PID
          </Text>
        </Box>
        <Box width={20} marginRight={colGap}>
          <Text color="#6b7280" bold>
            NAME
          </Text>
        </Box>
        <Box width={9} marginRight={colGap}>
          <Text color="#6b7280" bold>
            USER
          </Text>
        </Box>
        <Box flexGrow={1}>
          <Text color="#6b7280" bold>
            COMMAND
          </Text>
        </Box>
      </Box>

      {showScrollIndicators && (
        <Box paddingX={1}>
          <Text color="#6b7280">{showScrollUp ? `↑ ${scrollOffset} more above` : " "}</Text>
        </Box>
      )}

      {visible.map((proc, i) => (
        <ProcessRow
          key={`${proc.pid}:${proc.port}:${proc.protocol}`}
          proc={proc}
          isSelected={scrollOffset + i === selectedIndex}
        />
      ))}

      {showScrollIndicators && (
        <Box paddingX={1}>
          <Text color="#6b7280">
            {showScrollDown
              ? `↓ ${processes.length - scrollOffset - maxVisible} more below`
              : " "}
          </Text>
        </Box>
      )}

      {processes.length === 0 && (
        <Box paddingX={1}>
          <Text color="#6b7280">No listening ports found</Text>
        </Box>
      )}
    </Box>
  )
}
