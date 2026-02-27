"use client"

import { useState, useMemo } from "react"
import type { Position, Player } from "@/lib/types"
import { PlayerCard } from "@/components/player-card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ArrowUpDown } from "lucide-react"

interface DraftBoardProps {
  players: Player[]
  draftedPlayerIds: Set<string>
  onDraft: (player: Player) => void
  disabled: boolean
}

const POSITIONS: (Position | "ALL")[] = ["ALL", "PG", "SG", "SF", "PF", "C"]

type SortOption = "rank" | "ppg" | "rpg" | "apg" | "bpg"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rank", label: "Rank" },
  { value: "ppg", label: "PPG" },
  { value: "rpg", label: "RPG" },
  { value: "apg", label: "APG" },
  { value: "bpg", label: "BPG" },
]

export function DraftBoard({ players, draftedPlayerIds, onDraft, disabled }: DraftBoardProps) {
  const [search, setSearch] = useState("")
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL")
  const [sortBy, setSortBy] = useState<SortOption>("rank")

  const handleDraft = (player: Player) => {
    onDraft(player)
    setSearch("")
    setPosFilter("ALL")
    setSortBy("rank")
  }

  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch =
          search === "" ||
          p.name.toLowerCase().includes(search.toLowerCase())
        const matchesPos = posFilter === "ALL" || p.position === posFilter
        return matchesSearch && matchesPos
      })
      .sort((a, b) => {
        // For rank, sort ascending (lower is better)
        if (sortBy === "rank") {
          return a.rank - b.rank
        }
        // For stats, sort descending (higher is better)
        return b[sortBy] - a[sortBy]
      })
  }, [players, search, posFilter, sortBy])

  const availableCount = players.filter((p) => !draftedPlayerIds.has(`${p.era}-${p.id}`)).length

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

      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex shrink-0 gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosFilter(pos)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                posFilter === pos
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="h-6 w-px shrink-0 bg-border" />

        <div className="flex shrink-0 items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Sort:</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-all",
                  sortBy === option.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
        {filtered.map((player) => (
          <PlayerCard
            key={`${player.era}-${player.id}`}
            player={player}
            isDrafted={draftedPlayerIds.has(`${player.era}-${player.id}`)}
            onDraft={handleDraft}
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
