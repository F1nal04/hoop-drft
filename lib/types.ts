export type Position = "PG" | "SG" | "SF" | "PF" | "C"

export type PlayerSet = "current" | "historical" | "all"
export type DraftMode = "normal" | "snakeSaved" | "money"
export type PlayerPrice = 1 | 2 | 3 | 4 | 5

export interface Player {
  id: number
  name: string
  position: Position
  ppg: number
  rpg: number
  apg: number
  bpg: number
  rank: number
  price: PlayerPrice
  era: "current" | "historical"
}

export const POSITION_COLORS: Record<Position, string> = {
  PG: "text-foreground",
  SG: "text-foreground",
  SF: "text-foreground",
  PF: "text-foreground",
  C: "text-foreground",
}

type RawPlayer = Omit<Player, "era" | "price">
type RawPlayerAsset = Omit<RawPlayer, "id"> & { id?: number }

interface PlayerAsset {
  current_players: RawPlayerAsset[]
  historical_players: RawPlayerAsset[]
}

let playerSetsPromise: Promise<Record<PlayerSet, Player[]>> | null = null

function addEra(players: RawPlayerAsset[], era: Player["era"]): Omit<Player, "price">[] {
  return players.map((player, index) => ({
    ...player,
    id: player.id ?? index + 1,
    era,
  }))
}

function assignPrices(players: Omit<Player, "price">[]): Player[] {
  const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank)
  const totalPlayers = sortedPlayers.length

  if (totalPlayers === 0) {
    return []
  }

  return sortedPlayers.map((player, index) => {
    const bucket = Math.floor((index * 5) / totalPlayers)
    const price = (5 - bucket) as PlayerPrice
    return { ...player, price }
  })
}

async function loadPlayerSets(): Promise<Record<PlayerSet, Player[]>> {
  if (!playerSetsPromise) {
    playerSetsPromise = fetch("/data/players.json", {
      cache: "force-cache",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch player data")
        }

        return (await response.json()) as PlayerAsset
      })
      .then((data) => {
        const currentPlayers = addEra(data.current_players, "current")
        const historicalPlayers = addEra(data.historical_players, "historical")

        return {
          current: assignPrices(currentPlayers),
          historical: assignPrices(historicalPlayers),
          all: assignPrices([...currentPlayers, ...historicalPlayers]),
        }
      })
      .catch((error) => {
        playerSetsPromise = null
        throw error
      })
  }

  return playerSetsPromise
}

export async function getPlayerSet(set: PlayerSet): Promise<Player[]> {
  try {
    const playerSets = await loadPlayerSets()
    return playerSets[set]
  } catch (error) {
    console.error("Error loading players from static asset:", error)
    throw error
  }
}
