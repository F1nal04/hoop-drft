import type { DraftMode, HDPlayer, Position } from "@/lib/hd-data"
import type { TeamResult } from "@/lib/hd-results"

export type TeamState = TeamResult

// One view-model feeding DraftBoard, produced either by useLocalDraft
// (hot-seat, both teams controlled here) or useRemoteDraft (server snapshots,
// you only act for your own seat).
export interface DraftEngine {
  ready: boolean
  loadError: string | null
  mode: DraftMode
  budget: number
  clock: number
  teams: [TeamState, TeamState]
  onClock: 0 | 1
  pickIdx: number
  rosterMax: number
  posReq: Record<Position, number>
  secondsLeft: number
  pool: HDPlayer[]
  draftedIds: Set<string>
  mySeat: 0 | 1 | null // null = local hot-seat (the device acts for both teams)
  myTurn: boolean
  banner: string | null
  canDraft: (player: HDPlayer) => boolean
  draftPlayer: (player: HDPlayer) => void
  rename: ((team: 0 | 1, name: string) => void) | null
  cancel: () => void
}

export function pickOrder(idx: number, firstTeam: 0 | 1): 0 | 1 {
  // Both modes alternate strictly between the two teams.
  return idx % 2 === 0 ? firstTeam : ((1 - firstTeam) as 0 | 1)
}

export function roundOf(idx: number) {
  return Math.floor(idx / 2) + 1
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function posReqFor(mode: DraftMode): Record<Position, number> {
  return mode === "snake"
    ? { PG: 2, SG: 2, SF: 2, PF: 2, C: 2 }
    : { PG: 1, SG: 1, SF: 1, PF: 1, C: 1 }
}

export function rosterMaxFor(mode: DraftMode) {
  return mode === "snake" ? 10 : 5
}
