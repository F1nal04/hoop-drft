"use client"

import type { Player } from "@/lib/types"
import { POSITION_COLORS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Trophy, RotateCcw, XCircle } from "lucide-react"
import { PositionNeeds } from "@/components/position-needs"

interface DraftCompleteScreenProps {
  teamNames: [string, string]
  teamRosters: [(Player | null)[], (Player | null)[]]
  onReset: () => void
}

export function DraftCompleteScreen({
  teamNames,
  teamRosters,
  onReset,
}: DraftCompleteScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-10 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <Trophy className="h-8 w-8 text-accent-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
          Draft Complete
        </h1>
        <p className="text-base text-muted-foreground">
          Both squads are locked in. Time to see who built the better team!
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {([0, 1] as const).map((teamIdx) => (
          <div
            key={teamIdx}
            className={cn(
              "rounded-xl border p-5",
              teamIdx === 0 ? "border-team-1/40" : "border-team-2/40",
            )}
          >
            <h2
              className={cn(
                "mb-4 font-display text-xl font-bold uppercase tracking-wider",
                teamIdx === 0 ? "text-team-1" : "text-team-2",
              )}
            >
              {teamNames[teamIdx]}
            </h2>
            <div className="mb-4">
              <PositionNeeds roster={teamRosters[teamIdx]} teamIndex={teamIdx} />
            </div>
            <div className="flex flex-col gap-1.5">
              {teamRosters[teamIdx].map((player, i) => (
                <div
                  key={player ? `${player.era}-${player.id}` : `empty-${i}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2",
                    player
                      ? "bg-secondary/50"
                      : "border-2 border-dashed border-destructive/40 bg-destructive/5",
                  )}
                >
                  <span className="w-5 text-xs font-bold text-muted-foreground">
                    {i + 1}.
                  </span>
                  {player ? (
                    <div className="flex flex-1 items-center gap-2">
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
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {player.ppg} PPG · {player.rpg} RPG · {player.apg} APG · {player.bpg} BPG
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Missed pick</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onReset}
        className="bg-primary font-display text-base font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        New Draft
      </Button>
    </div>
  )
}
