"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/players"
import { POSITION_COLORS } from "@/lib/players"
import { Check } from "lucide-react"

interface PlayerCardProps {
  player: Player
  isDrafted: boolean
  onDraft: (player: Player) => void
  disabled: boolean
}

export function PlayerCard({ player, isDrafted, onDraft, disabled }: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onDraft(player)}
      disabled={isDrafted || disabled}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-all",
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
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">
          {player.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {player.team} &middot; {player.ppg} PPG
          {player.era === "historical" && (
            <span className="ml-1 text-accent"> &middot; Legend</span>
          )}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {player.rpg} RPG &middot; {player.apg} APG &middot; {player.bpg} BPG
        </span>
      </div>
      {isDrafted ? (
        <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : !disabled ? (
        <span className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Draft
        </span>
      ) : null}
    </button>
  )
}
