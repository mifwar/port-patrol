import { execSync } from "child_process"
import type { PortProcess } from "../types/index.js"

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim()
  } catch {
    return ""
  }
}

function getProcessCwd(pid: number): string | undefined {
  // macOS: use lsof to get cwd
  const output = run(`lsof -p ${pid} 2>/dev/null | grep cwd`)
  if (output) {
    const parts = output.split(/\s+/)
    // cwd line format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
    const cwdPath = parts.slice(8).join(" ")
    if (cwdPath && cwdPath !== "/") {
      return cwdPath
    }
  }
  return undefined
}

function normalizeProcessName(name: string): string {
  return name.replace(/\\x20/g, " ")
}

export function getListeningPorts(): PortProcess[] {
  const platform = process.platform
  
  if (platform === "darwin" || platform === "linux") {
    return getPortsUnix()
  } else if (platform === "win32") {
    return getPortsWindows()
  }
  
  return []
}

function getPortsUnix(): PortProcess[] {
  const output = run("lsof -i -P -n -sTCP:LISTEN +c 0 2>/dev/null")
  if (!output) return []

  const lines = output.split("\n").slice(1) // Skip header
  const processes: PortProcess[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length < 9) continue

    const [rawProcessName, pidStr, user, , , , , , addressPort] = parts
    const processName = normalizeProcessName(rawProcessName)
    const pid = parseInt(pidStr, 10)
    
    // Parse address:port
    const lastColon = addressPort.lastIndexOf(":")
    if (lastColon === -1) continue
    
    const address = addressPort.slice(0, lastColon)
    const port = parseInt(addressPort.slice(lastColon + 1), 10)
    
    if (isNaN(port)) continue

    const key = `${pid}:${port}`
    if (seen.has(key)) continue
    seen.add(key)

    // Get full command
    const command = run(`ps -p ${pid} -o command= 2>/dev/null`)

    // Get cwd for interpreters (node, python, ruby, etc.) to show project path
    let cwd: string | undefined
    const interpreters = ["node", "python", "ruby", "php", "java", "deno", "bun"]
    if (interpreters.some((i) => processName.toLowerCase().includes(i))) {
      cwd = getProcessCwd(pid)
    }

    processes.push({
      pid,
      port,
      protocol: "TCP",
      state: "LISTEN",
      address: address === "*" ? "0.0.0.0" : address,
      processName,
      command: command || processName,
      user,
      cwd
    })
  }

  // Also get UDP
  const udpOutput = run("lsof -i UDP -P -n +c 0 2>/dev/null")
  if (udpOutput) {
    const udpLines = udpOutput.split("\n").slice(1)
    for (const line of udpLines) {
      const parts = line.split(/\s+/)
      if (parts.length < 9) continue

      const [rawProcessName, pidStr, user, , , , , , addressPort] = parts
      const processName = normalizeProcessName(rawProcessName)
      const pid = parseInt(pidStr, 10)
      
      const lastColon = addressPort.lastIndexOf(":")
      if (lastColon === -1) continue
      
      const address = addressPort.slice(0, lastColon)
      const port = parseInt(addressPort.slice(lastColon + 1), 10)
      
      if (isNaN(port)) continue

      const key = `${pid}:${port}:udp`
      if (seen.has(key)) continue
      seen.add(key)

      const command = run(`ps -p ${pid} -o command= 2>/dev/null`).slice(0, 100)

      processes.push({
        pid,
        port,
        protocol: "UDP",
        state: "OPEN",
        address: address === "*" ? "0.0.0.0" : address,
        processName,
        command: command || processName,
        user
      })
    }
  }

  // Merge TCP and UDP entries for same port+pid
  const merged = new Map<string, PortProcess>()
  for (const proc of processes) {
    const key = `${proc.port}:${proc.pid}`
    const existing = merged.get(key)
    if (existing) {
      if (existing.protocol !== proc.protocol) {
        existing.protocol = "BOTH"
      }
    } else {
      merged.set(key, { ...proc })
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.port - b.port)
}

function getPortsWindows(): PortProcess[] {
  const output = run("netstat -ano -p TCP")
  if (!output) return []

  const lines = output.split("\n").slice(4) // Skip headers
  const processes: PortProcess[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 5) continue

    const [, localAddress, , state, pidStr] = parts
    if (state !== "LISTENING") continue

    const lastColon = localAddress.lastIndexOf(":")
    if (lastColon === -1) continue

    const address = localAddress.slice(0, lastColon)
    const port = parseInt(localAddress.slice(lastColon + 1), 10)
    const pid = parseInt(pidStr, 10)

    if (isNaN(port) || isNaN(pid)) continue

    const key = `${pid}:${port}`
    if (seen.has(key)) continue
    seen.add(key)

    // Get process name
    const tasklistOutput = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`)
    const processName = tasklistOutput.split(",")[0]?.replace(/"/g, "") || "unknown"

    processes.push({
      pid,
      port,
      protocol: "TCP",
      state: "LISTENING",
      address,
      processName,
      command: processName
    })
  }

  return processes.sort((a, b) => a.port - b.port)
}

export function killProcess(pid: number, force: boolean = false): { success: boolean; error?: string } {
  try {
    const platform = process.platform
    let cmd: string

    if (platform === "win32") {
      cmd = force ? `taskkill /PID ${pid} /F` : `taskkill /PID ${pid}`
    } else {
      cmd = force ? `kill -9 ${pid}` : `kill ${pid}`
    }

    execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] })
    return { success: true }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
}

export function findProcessByPort(port: number): PortProcess | undefined {
  const processes = getListeningPorts()
  return processes.find((p) => p.port === port)
}

export function getProcessDetails(pid: number): string {
  const platform = process.platform
  
  if (platform === "darwin" || platform === "linux") {
    const info = run(`ps -p ${pid} -o pid,ppid,user,%cpu,%mem,etime,command 2>/dev/null`)
    return info || "Process not found"
  } else if (platform === "win32") {
    const info = run(`tasklist /FI "PID eq ${pid}" /V /FO LIST`)
    return info || "Process not found"
  }
  
  return "Unsupported platform"
}
