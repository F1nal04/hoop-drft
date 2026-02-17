export type Position = "PG" | "SG" | "SF" | "PF" | "C"

export type PlayerSet = "current" | "historical" | "all"

export interface Player {
  id: number
  name: string
  position: Position
  team: string
  ppg: number
  rpg: number
  apg: number
  bpg: number
  rank: number
  era: "current" | "historical"
}

export const POSITION_COLORS: Record<Position, string> = {
  PG: "bg-sky-600 text-sky-50",
  SG: "bg-emerald-600 text-emerald-50",
  SF: "bg-amber-600 text-amber-50",
  PF: "bg-rose-600 text-rose-50",
  C: "bg-indigo-600 text-indigo-50",
}

export async function getPlayerSet(set: PlayerSet): Promise<Player[]> {
  try {
    const response = await fetch(`/api/players?set=${set}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch players")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching players from database:", error)
    throw error
  }
}
