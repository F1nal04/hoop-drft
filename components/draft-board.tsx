"use client"

import { useState, useMemo } from "react"
import type { DraftMode, Player, PlayerPrice, Position } from "@/lib/types"
import { PlayerCard } from "@/components/player-card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ArrowUpDown } from "lucide-react"

interface DraftBoardProps {
  players: Player[]
  draftedPlayerIds: Set<string>
  onDraft: (player: Player) => void
  disabled: boolean
  draftMode: DraftMode
  moneyPools: Record<PlayerPrice, Player[]>
  activeTeamBudget: number
  activeTeamRosterSize: number
  totalRounds: number
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

const MONEY_TIERS: PlayerPrice[] = [5, 4, 3, 2, 1]

export function DraftBoard({
  players,
  draftedPlayerIds,
  onDraft,
  disabled,
  draftMode,
  moneyPools,
  activeTeamBudget,
  activeTeamRosterSize,
  totalRounds,
}: DraftBoardProps) {
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
  const availableMoneyPoolCount = useMemo(
    () =>
      MONEY_TIERS.reduce(
        (count, tier) =>
          count +
          moneyPools[tier].filter((p) => !draftedPlayerIds.has(`${p.era}-${p.id}`)).length,
        0,
      ),
    [moneyPools, draftedPlayerIds],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
          {draftMode === "money" ? "Money Draft Pool" : "Available Players"}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {draftMode === "money" ? availableMoneyPoolCount : availableCount} remaining
        </span>
      </div>

      {draftMode === "normal" ? (
        <>
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
        </>
      ) : (
        <div className="flex max-h-[520px] flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
          {MONEY_TIERS.map((tier) => {
            const tierPlayers = moneyPools[tier]
            return (
              <div key={tier} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    ${tier} Tier
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    5 random players (fixed this draft)
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {tierPlayers.map((player) => {
                    const isDrafted = draftedPlayerIds.has(`${player.era}-${player.id}`)
                    const remainingSlotsAfterPick = Math.max(
                      0,
                      totalRounds - (activeTeamRosterSize + 1),
                    )
                    const budgetAfterPick = activeTeamBudget - player.price
                    const cannotAfford =
                      player.price > activeTeamBudget || budgetAfterPick < remainingSlotsAfterPick
                    return (
                      <PlayerCard
                        key={`${player.era}-${player.id}`}
                        player={player}
                        isDrafted={isDrafted}
                        onDraft={handleDraft}
                        disabled={disabled || cannotAfford}
                        cannotAfford={cannotAfford && !isDrafted}
                      />
                    )
                  })}
                  {tierPlayers.length === 0 && (
                    <div className="rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      No players available in this tier.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {availableMoneyPoolCount === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No players remain in the fixed money draft pools.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
