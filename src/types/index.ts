export interface PortProcess {
  pid: number
  port: number
  protocol: "TCP" | "UDP" | "BOTH"
  state: string
  address: string
  processName: string
  command?: string
  user?: string
  cwd?: string
}

export type ViewMode = "list" | "kill" | "help" | "search" | "details"

export type SortField = "port" | "pid" | "name"
export type SortOrder = "asc" | "desc"
