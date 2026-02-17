import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Player, PlayerSet } from "@/lib/players"

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
          team: p.team,
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
          team: p.team,
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

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
