export type Position = "PG" | "SG" | "SF" | "PF" | "C"
export type DraftMode = "snake" | "money"
export type DatasetKey = "current" | "historical" | "mixed"
export type Era = "current" | "historical"

export interface HDPlayer {
  id: string
  name: string
  tag: string
  pos: Position
  ppg: number
  rpg: number
  apg: number
  bpg: number
  cost: number
  rank: number
  era: Era
}

interface RawPlayer {
  name: string
  position: Position
  ppg: number
  rpg: number
  apg: number
  bpg: number
  rank: number
}

interface RawData {
  current_players: RawPlayer[]
  historical_players: RawPlayer[]
}

export const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"]

// Money mode: salary-cap draft over a curated pool.
export const MONEY_BUDGET = 15 // hard cap, in $M
export const MONEY_MIN_COST = 1 // cheapest tier — used by the lockout reserve
export const MONEY_TIERS = 5 // price categories: $5 (top fifth) … $1 (bottom fifth)
export const MONEY_PER_POSITION = 2 // players surfaced per position, per tier (→ 10/tier, 50 total)

function rankToCost(rank: number, ranks: { min: number; max: number }): number {
  const t = (rank - ranks.min) / Math.max(1, ranks.max - ranks.min)
  return Math.max(2, Math.round((1 - t) * 85))
}

function tagFor(era: Era): string {
  return era === "current" ? "Current" : "Historical"
}

function mapPlayers(raw: RawPlayer[], era: Era, ranks: { min: number; max: number }): HDPlayer[] {
  return raw
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((p, i) => ({
      id: `${era}-${p.rank}-${i}`,
      name: p.name,
      tag: tagFor(era),
      pos: p.position,
      ppg: p.ppg,
      rpg: p.rpg,
      apg: p.apg,
      bpg: p.bpg,
      cost: rankToCost(p.rank, ranks),
      rank: p.rank,
      era,
    }))
}

let cache: Promise<Record<DatasetKey, HDPlayer[]>> | null = null

export function loadHDPools(): Promise<Record<DatasetKey, HDPlayer[]>> {
  if (cache) return cache
  cache = fetch("/data/players.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load players.json")
      return r.json() as Promise<RawData>
    })
    .then((d) => {
      const allRanks = [
        ...d.current_players.map((p) => p.rank),
        ...d.historical_players.map((p) => p.rank),
      ]
      const ranks = {
        min: Math.min(...allRanks),
        max: Math.max(...allRanks),
      }
      const current = mapPlayers(d.current_players, "current", ranks)
      const historical = mapPlayers(d.historical_players, "historical", ranks)
      const mixed = [...current, ...historical].sort((a, b) => a.rank - b.rank)
      return { current, historical, mixed }
    })
    .catch((err) => {
      cache = null
      throw err
    })
  return cache
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Money mode draft pool. The chosen set is sorted by rank and split into MONEY_TIERS
// rank-quintiles: the top fifth is priced $5, the next $4, … the bottom fifth $1
// (`MONEY_TIERS - q`). Within each tier we randomly surface MONEY_PER_POSITION players
// per position, yielding a curated 50-player board (2 of every position at every price).
// Returns fresh objects with `cost` overwritten to the tier price — the cached pool is
// never mutated. Call once per draft (the random selection is fixed for that draft).
export function buildMoneyPool(players: HDPlayer[]): HDPlayer[] {
  const sorted = players.slice().sort((a, b) => a.rank - b.rank)
  const n = sorted.length
  const out: HDPlayer[] = []
  for (let q = 0; q < MONEY_TIERS; q++) {
    const start = Math.round((q * n) / MONEY_TIERS)
    const end = Math.round(((q + 1) * n) / MONEY_TIERS)
    const cost = MONEY_TIERS - q // q=0 → $5 (top fifth) … q=4 → $1 (bottom fifth)
    const segment = sorted.slice(start, end)
    for (const pos of POSITIONS) {
      const chosen = shuffle(segment.filter((p) => p.pos === pos)).slice(0, MONEY_PER_POSITION)
      for (const p of chosen) out.push({ ...p, cost })
    }
  }
  return out
}
