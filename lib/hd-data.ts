export type Position = "PG" | "SG" | "SF" | "PF" | "C"
export type DraftMode = "snake" | "money"
export type DatasetKey = "current" | "historical" | "mixed"
export type Era = "current" | "historical"

export interface HDPlayer {
  id: string
  num: number
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

const JERSEYS = [3, 6, 7, 8, 11, 12, 13, 14, 21, 23, 24, 25, 30, 32, 33, 34, 42, 44, 50, 91]

function jerseyFor(seed: number): number {
  return JERSEYS[Math.abs(seed) % JERSEYS.length]
}

function rankToCost(rank: number, ranks: { min: number; max: number }): number {
  const t = (rank - ranks.min) / Math.max(1, ranks.max - ranks.min)
  return Math.max(2, Math.round((1 - t) * 85))
}

function tagFor(era: Era): string {
  return era === "current" ? "NOW" : "ERA"
}

function mapPlayers(raw: RawPlayer[], era: Era, ranks: { min: number; max: number }): HDPlayer[] {
  return raw
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((p, i) => ({
      id: `${era}-${p.rank}-${i}`,
      num: jerseyFor(p.rank + i * 13),
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
  cache = fetch("/data/players.json", { cache: "force-cache" })
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
