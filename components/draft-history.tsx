"use client"

import { cn } from "@/lib/utils"
import type { DraftPick } from "@/hooks/use-draft"
import { POSITION_COLORS } from "@/lib/players"
import { XCircle } from "lucide-react"

interface DraftHistoryProps {
  history: DraftPick[]
  teamNames: [string, string]
}

export function DraftHistory({ history, teamNames }: DraftHistoryProps) {
  if (history.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Draft Log
      </h2>
      <div className="flex max-h-48 flex-col-reverse gap-1 overflow-y-auto pr-1">
        {[...history].reverse().map((pick) => (
          <div
            key={pick.overallPick}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs",
              pick.player
                ? pick.teamIndex === 0
                  ? "bg-team-1/10"
                  : "bg-team-2/10"
                : "border-2 border-dashed border-destructive/40 bg-destructive/5",
            )}
          >
            <span className="font-bold text-muted-foreground">
              #{pick.overallPick}
            </span>
            {pick.player ? (
              <>
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px] font-bold uppercase",
                    POSITION_COLORS[pick.player.position],
                  )}
                >
                  {pick.player.position}
                </span>
                <span className="font-medium text-foreground">{pick.player.name}</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span className="font-medium text-destructive">Missed pick</span>
              </>
            )}
            <span className="ml-auto font-medium text-muted-foreground">
              {teamNames[pick.teamIndex]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
