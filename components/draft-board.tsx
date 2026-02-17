"use client"

import { useState, useMemo } from "react"
import type { Position, Player } from "@/lib/players"
import { PlayerCard } from "@/components/player-card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface DraftBoardProps {
  players: Player[]
  draftedPlayerIds: Set<number>
  onDraft: (player: Player) => void
  disabled: boolean
}

const POSITIONS: (Position | "ALL")[] = ["ALL", "PG", "SG", "SF", "PF", "C"]

export function DraftBoard({ players, draftedPlayerIds, onDraft, disabled }: DraftBoardProps) {
  const [search, setSearch] = useState("")
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL")

  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch =
          search === "" ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.team.toLowerCase().includes(search.toLowerCase())
        const matchesPos = posFilter === "ALL" || p.position === posFilter
        return matchesSearch && matchesPos
      })
      .sort((a, b) => a.rank - b.rank)
  }, [players, search, posFilter])

  const availableCount = players.filter((p) => !draftedPlayerIds.has(p.id)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
          Available Players
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {availableCount} remaining
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search players or teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border bg-secondary/50 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => setPosFilter(pos)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              posFilter === pos
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            )}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
        {filtered.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isDrafted={draftedPlayerIds.has(player.id)}
            onDraft={onDraft}
            disabled={disabled}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No players found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
