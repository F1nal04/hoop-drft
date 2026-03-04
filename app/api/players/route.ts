import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Player, PlayerPrice, PlayerSet } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerSet = (searchParams.get("set") || "all") as PlayerSet

    let players: Player[] = []

    if (playerSet === "current" || playerSet === "all") {
      const currentPlayers = await prisma.currentPlayer.findMany({
        orderBy: { rank: "asc" },
      })
      players = [
        ...players,
        ...currentPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position as Player["position"],
          ppg: p.ppg,
          rpg: p.rpg,
          apg: p.apg,
          bpg: p.bpg,
          rank: p.rank,
          era: "current" as const,
        })),
      ]
    }

    if (playerSet === "historical" || playerSet === "all") {
      const historicalPlayers = await prisma.historicalPlayer.findMany({
        orderBy: { rank: "asc" },
      })
      players = [
        ...players,
        ...historicalPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position as Player["position"],
          ppg: p.ppg,
          rpg: p.rpg,
          apg: p.apg,
          bpg: p.bpg,
          rank: p.rank,
          era: "historical" as const,
        })),
      ]
    }

    // Sort by rank for the final result
    players.sort((a, b) => a.rank - b.rank)

    const totalPlayers = players.length
    if (totalPlayers === 0) {
      return NextResponse.json([])
    }
    const pricedPlayers = players.map((player, index) => {
      // Split players into 5 equal buckets by sorted rank order.
      // Top bucket gets $5, bottom bucket gets $1.
      const bucket = Math.floor((index * 5) / totalPlayers)
      const price = (5 - bucket) as PlayerPrice
      return { ...player, price }
    })

    return NextResponse.json(pricedPlayers)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
