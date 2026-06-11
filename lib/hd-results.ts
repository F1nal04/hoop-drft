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
  // Set by the room server for remote drafts: /results swaps the local
  // "Continue drafting" (hd-exclusions replay) for the room's continue flow.
  remote?: boolean
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

