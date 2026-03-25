"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { POSITION_COLORS } from "@/lib/types"
import { Check } from "lucide-react"

interface PlayerCardProps {
  player: Player
  isDrafted: boolean
  onDraft: (player: Player) => void
  disabled: boolean
  cannotAfford?: boolean
  showPrice?: boolean
}

export function PlayerCard({
  player,
  isDrafted,
  onDraft,
  disabled,
  cannotAfford = false,
  showPrice = false,
}: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onDraft(player)}
      disabled={isDrafted || disabled}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg border border-border bg-transparent px-3 py-2.5 text-left transition-all",
        isDrafted
          ? "cursor-not-allowed border-border/50 opacity-40"
          : disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/50 hover:bg-secondary/80 active:scale-[0.98]",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
        {player.rank}
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          POSITION_COLORS[player.position],
        )}
      >
        {player.position}
      </span>
      {showPrice && (
        <span className="inline-flex shrink-0 items-center rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
          ${player.price}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">
          {player.name}
          {player.era === "historical" && (
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">Legend</span>
          )}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {player.ppg} PPG &middot; {player.rpg} RPG &middot; {player.apg} APG &middot; {player.bpg} BPG
        </span>
      </div>
      {isDrafted ? (
        <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : !disabled ? (
        <span className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Draft
        </span>
      ) : cannotAfford ? (
        <span className="shrink-0 rounded-md bg-destructive/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
          Too Expensive
        </span>
      ) : null}
    </button>
  )
}
