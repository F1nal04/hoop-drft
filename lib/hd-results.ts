import type { HDPlayer, DraftMode } from "./hd-data"

export interface DraftedPlayer extends HDPlayer {
  pickNo: number
}

export interface TeamResult {
  name: string
  picks: DraftedPlayer[]
  spent: number
}

export interface DraftResult {
  mode: DraftMode
  budget: number
  rosterMax: number
  teams: [TeamResult, TeamResult]
  completedAt: number
}

const KEY = "hd-results"

export function writeResult(result: DraftResult): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result))
  } catch {
    /* ignore */
  }
}

export function readResult(): DraftResult | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as DraftResult
  } catch {
    return null
  }
}

export function gradeFor(team: TeamResult): string {
  if (team.picks.length === 0) return "—"
  const avg = team.picks.reduce((sum, p) => sum + p.cost, 0) / team.picks.length
  if (avg >= 70) return "A"
  if (avg >= 62) return "A−"
  if (avg >= 55) return "B+"
  if (avg >= 47) return "B"
  if (avg >= 40) return "B−"
  if (avg >= 32) return "C+"
  return "C"
}
