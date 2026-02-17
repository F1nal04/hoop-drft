"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { POSITION_COLORS } from "@/lib/types"
import { Users, XCircle } from "lucide-react"
import { PositionNeeds } from "@/components/position-needs"

interface TeamRosterProps {
  teamName: string
  roster: (Player | null)[]
  teamIndex: number
  isActive: boolean
  totalRounds: number
}

export function TeamRoster({
  teamName,
  roster,
  teamIndex,
  isActive,
  totalRounds,
}: TeamRosterProps) {
  const teamColor = teamIndex === 0 ? "team-1" : "team-2"

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border transition-all",
        isActive
          ? teamIndex === 0
            ? "border-team-1/60 shadow-[0_0_24px_-6px_hsl(var(--team-1)/0.3)]"
            : "border-team-2/60 shadow-[0_0_24px_-6px_hsl(var(--team-2)/0.3)]"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-t-xl px-4 py-3",
          teamIndex === 0 ? "bg-team-1/10" : "bg-team-2/10",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            teamIndex === 0
              ? "bg-team-1 text-team-1-foreground"
              : "bg-team-2 text-team-2-foreground",
          )}
        >
          <Users className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            {teamName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {roster.length}/{totalRounds} picks
          </p>
        </div>
        {isActive && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
              teamIndex === 0
                ? "bg-team-1 text-team-1-foreground"
                : "bg-team-2 text-team-2-foreground",
            )}
          >
            On the clock
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3">
        <PositionNeeds roster={roster} teamIndex={teamIndex} />
        
        {roster.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground">No players drafted yet</p>
          </div>
        ) : (
          roster.map((player, index) => (
            <div
              key={player?.id || `empty-${index}`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2",
                player
                  ? "bg-secondary/50"
                  : "border-2 border-dashed border-destructive/40 bg-destructive/5",
              )}
            >
              <span className="text-xs font-bold text-muted-foreground">
                {index + 1}.
              </span>
              {player ? (
                <>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      POSITION_COLORS[player.position],
                    )}
                  >
                    {player.position}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {player.name}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Missed pick</span>
                </>
              )}
            </div>
          ))
        )}
        {Array.from({ length: totalRounds - roster.length }).map((_, i) => (
          <div
            key={`empty-${teamIndex}-${i}`}
            className="flex items-center gap-2.5 rounded-md border border-dashed border-border/50 px-3 py-2"
          >
            <span className="text-xs font-bold text-muted-foreground">
              {roster.length + i + 1}.
            </span>
            <span className="text-xs text-muted-foreground/50">Empty slot</span>
          </div>
        ))}
      </div>
    </div>
  )
}
