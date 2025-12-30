import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { Box, Text, useInput, useStdout } from "ink"
import Fuse from "fuse.js"
import { Header } from "./components/Header.js"
import { ProcessList } from "./components/ProcessList.js"
import { KillConfirm } from "./components/KillConfirm.js"
import { SearchInput } from "./components/SearchInput.js"
import { HelpModal } from "./components/HelpModal.js"
import { ProcessDetails } from "./components/ProcessDetails.js"
import { StatusBar } from "./components/StatusBar.js"
import { getListeningPorts, getProcessDetails, killProcess } from "./utils/process.js"
import type { PortProcess, ViewMode, SortField, SortOrder } from "./types/index.js"

interface Props {
  onExit: () => void
  initialPort?: number
}

interface UiState {
  selectedIndex: number
  scrollOffset: number
  viewMode: ViewMode
  searchQuery: string
  sortField: SortField
  sortOrder: SortOrder
}

type UiAction =
  | { type: "navigate"; direction: "up" | "down"; listLength: number; maxVisible: number }
  | { type: "jumpTop" }
  | { type: "jumpBottom"; listLength: number; maxVisible: number }
  | { type: "setViewMode"; mode: ViewMode }
  | { type: "setSearch"; query: string }
  | { type: "appendSearch"; char: string }
  | { type: "backspaceSearch" }
  | { type: "clearSearch" }
  | { type: "toggleSort" }
  | { type: "toggleSortOrder" }
  | { type: "reset" }

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "navigate": {
      const { direction, listLength, maxVisible } = action
      if (listLength === 0) return state

      const nextIndex =
        direction === "down"
          ? Math.min(state.selectedIndex + 1, listLength - 1)
          : Math.max(state.selectedIndex - 1, 0)

      // Keep selected item visible with some padding
      let nextScroll = state.scrollOffset
      if (nextIndex < nextScroll) {
        nextScroll = nextIndex
      } else if (nextIndex >= nextScroll + maxVisible) {
        nextScroll = nextIndex - maxVisible + 1
      }
      nextScroll = Math.max(0, Math.min(nextScroll, listLength - maxVisible))

      return { ...state, selectedIndex: nextIndex, scrollOffset: nextScroll }
    }
    case "jumpTop":
      return { ...state, selectedIndex: 0, scrollOffset: 0 }
    case "jumpBottom": {
      const { listLength, maxVisible } = action
      const lastIndex = Math.max(0, listLength - 1)
      return {
        ...state,
        selectedIndex: lastIndex,
        scrollOffset: Math.max(0, listLength - maxVisible)
      }
    }
    case "setViewMode":
      return { ...state, viewMode: action.mode }
    case "setSearch":
      return { ...state, searchQuery: action.query, selectedIndex: 0, scrollOffset: 0 }
    case "appendSearch":
      return {
        ...state,
        searchQuery: state.searchQuery + action.char,
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "backspaceSearch":
      return {
        ...state,
        searchQuery: state.searchQuery.slice(0, -1),
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "clearSearch":
      return { ...state, searchQuery: "", viewMode: "list", selectedIndex: 0, scrollOffset: 0 }
    case "toggleSort": {
      const fields: SortField[] = ["port", "pid", "name"]
      const currentIdx = fields.indexOf(state.sortField)
      const nextField = fields[(currentIdx + 1) % fields.length]
      return { ...state, sortField: nextField, selectedIndex: 0, scrollOffset: 0 }
    }
    case "toggleSortOrder":
      return {
        ...state,
        sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "reset":
      return { ...state, selectedIndex: 0, scrollOffset: 0, viewMode: "list" }
    default:
      return state
  }
}

export function App({ onExit, initialPort }: Props) {
  const { stdout } = useStdout()
  const width = stdout?.columns || 100
  const height = stdout?.rows || 24

  const [processes, setProcesses] = useState<PortProcess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{
    text: string
    type: "info" | "success" | "error"
  } | null>(null)

  const [ui, dispatch] = useReducer(uiReducer, {
    selectedIndex: 0,
    scrollOffset: 0,
    viewMode: "list",
    searchQuery: initialPort ? String(initialPort) : "",
    sortField: "port",
    sortOrder: "asc"
  })

  const headerHeight = ui.searchQuery || ui.viewMode === "search" ? 4 : 3
  const footerHeight = 2
  const listHeaderHeight = 2
  const modalHeight = ui.viewMode !== "list" && ui.viewMode !== "search" ? 12 : 0

  const refresh = useCallback(() => {
    setIsLoading(true)
    const ports = getListeningPorts()
    setProcesses(ports)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const showMessage = useCallback(
    (text: string, type: "info" | "success" | "error" = "info") => {
      setMessage({ text, type })
      setTimeout(() => setMessage(null), 3000)
    },
    []
  )

  const fuse = useMemo(
    () =>
      new Fuse(processes, {
        keys: ["port", "processName", "command", "user", "cwd"],
        threshold: 0.4,
        ignoreLocation: true,
        findAllMatches: true
      }),
    [processes]
  )

  const filteredProcesses = useMemo(() => {
    let result = processes

    if (ui.searchQuery) {
      // Check if it's a port number search
      const portNum = parseInt(ui.searchQuery, 10)
      if (!isNaN(portNum)) {
        result = processes.filter((p) => String(p.port).includes(ui.searchQuery))
      } else {
        result = fuse.search(ui.searchQuery).map((r) => r.item)
      }
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (ui.sortField) {
        case "port":
          cmp = a.port - b.port
          break
        case "pid":
          cmp = a.pid - b.pid
          break
        case "name":
          cmp = a.processName.localeCompare(b.processName)
          break
      }
      return ui.sortOrder === "asc" ? cmp : -cmp
    })

    return result
  }, [processes, ui.searchQuery, ui.sortField, ui.sortOrder, fuse])

  const baseMaxVisible = Math.max(
    1,
    height - headerHeight - footerHeight - listHeaderHeight - modalHeight
  )
  const showScrollIndicators = filteredProcesses.length > baseMaxVisible
  const maxVisible = Math.max(1, baseMaxVisible - (showScrollIndicators ? 2 : 0))

  const selectedProcess = filteredProcesses[ui.selectedIndex]
  const selectedDetails = useMemo(() => {
    if (ui.viewMode !== "details" || !selectedProcess) return ""
    return getProcessDetails(selectedProcess.pid)
  }, [ui.viewMode, selectedProcess?.pid])

  const handleKill = useCallback(
    (force: boolean) => {
      if (!selectedProcess) return
      dispatch({ type: "setViewMode", mode: "list" })

      const result = killProcess(selectedProcess.pid, force)
      if (result.success) {
        showMessage(`Killed process ${selectedProcess.pid} (port ${selectedProcess.port})`, "success")
        setTimeout(refresh, 500)
      } else {
        showMessage(result.error || "Failed to kill process", "error")
      }
    },
    [selectedProcess, refresh, showMessage]
  )

  useInput((input, key) => {
    // Search mode input handling
    if (ui.viewMode === "search") {
      if (key.escape) {
        if (ui.searchQuery) {
          dispatch({ type: "clearSearch" })
        } else {
          dispatch({ type: "setViewMode", mode: "list" })
        }
      } else if (key.return) {
        dispatch({ type: "setViewMode", mode: "list" })
      } else if (key.backspace || key.delete) {
        dispatch({ type: "backspaceSearch" })
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch({ type: "appendSearch", char: input })
      }
      return
    }

    // Modal open - ignore other inputs
    if (ui.viewMode === "kill" || ui.viewMode === "help" || ui.viewMode === "details") return

    // Normal mode
    if (input === "q" || (input === "c" && key.ctrl)) {
      onExit()
      return
    }

    if (key.escape) {
      if (ui.searchQuery) {
        dispatch({ type: "clearSearch" })
      }
      return
    }

    if (input === "/" || input === "f") {
      dispatch({ type: "setViewMode", mode: "search" })
      return
    }

    if (input === "j" || key.downArrow) {
      dispatch({
        type: "navigate",
        direction: "down",
        listLength: filteredProcesses.length,
        maxVisible
      })
    } else if (input === "k" || key.upArrow) {
      dispatch({
        type: "navigate",
        direction: "up",
        listLength: filteredProcesses.length,
        maxVisible
      })
    } else if (input === "g") {
      dispatch({ type: "jumpTop" })
    } else if (input === "G") {
      dispatch({ type: "jumpBottom", listLength: filteredProcesses.length, maxVisible })
    } else if (key.return) {
      if (selectedProcess) {
        dispatch({ type: "setViewMode", mode: "kill" })
      }
    } else if (input === "K") {
      // Quick force kill
      if (selectedProcess) {
        const result = killProcess(selectedProcess.pid, true)
        if (result.success) {
          showMessage(
            `Force killed ${selectedProcess.pid} (port ${selectedProcess.port})`,
            "success"
          )
          setTimeout(refresh, 500)
        } else {
          showMessage(result.error || "Failed to kill", "error")
        }
      }
    } else if (input === "r") {
      refresh()
      showMessage("Refreshed", "success")
    } else if (input === "s") {
      dispatch({ type: "toggleSort" })
    } else if (input === "o") {
      dispatch({ type: "toggleSortOrder" })
    } else if (input === "?") {
      dispatch({ type: "setViewMode", mode: "help" })
    } else if (input === "i") {
      if (selectedProcess) {
        dispatch({ type: "setViewMode", mode: "details" })
      }
    }
  })

  if (isLoading && processes.length === 0) {
    return (
      <Box padding={2}>
        <Text color="#60a5fa">Scanning ports...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Header totalPorts={filteredProcesses.length} filterQuery={ui.searchQuery} />

      {ui.viewMode === "search" && <SearchInput value={ui.searchQuery} />}

      <Box flexGrow={1} flexDirection="column" marginTop={1}>
        {(ui.viewMode === "list" || ui.viewMode === "search") && (
          <ProcessList
            processes={filteredProcesses}
            selectedIndex={ui.selectedIndex}
            scrollOffset={ui.scrollOffset}
            maxVisible={maxVisible}
            showScrollIndicators={showScrollIndicators}
          />
        )}

        {ui.viewMode === "kill" && selectedProcess && (
          <Box paddingX={1}>
            <KillConfirm
              process={selectedProcess}
              onConfirm={handleKill}
              onCancel={() => dispatch({ type: "setViewMode", mode: "list" })}
            />
          </Box>
        )}

        {ui.viewMode === "help" && (
          <Box paddingX={1}>
            <HelpModal onClose={() => dispatch({ type: "setViewMode", mode: "list" })} />
          </Box>
        )}

        {ui.viewMode === "details" && selectedProcess && (
          <Box paddingX={1}>
            <ProcessDetails
              process={selectedProcess}
              details={selectedDetails}
              onClose={() => dispatch({ type: "setViewMode", mode: "list" })}
            />
          </Box>
        )}
      </Box>

      <StatusBar
        message={message?.text}
        messageType={message?.type}
        sortField={ui.sortField}
        sortOrder={ui.sortOrder}
      />
    </Box>
  )
}
