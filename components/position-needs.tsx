"use client"

import { cn } from "@/lib/utils"
import type { Player, Position } from "@/lib/types"
import { POSITION_COLORS } from "@/lib/types"

interface PositionNeedsProps {
  roster: (Player | null)[]
  teamIndex: number
}

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"]
const TARGET_PER_POSITION = 2

export function PositionNeeds({ roster, teamIndex }: PositionNeedsProps) {
  const positionCounts: Record<Position, number> = {
    PG: roster.filter((p) => p && p.position === "PG").length,
    SG: roster.filter((p) => p && p.position === "SG").length,
    SF: roster.filter((p) => p && p.position === "SF").length,
    PF: roster.filter((p) => p && p.position === "PF").length,
    C: roster.filter((p) => p && p.position === "C").length,
  }

  const getStatusColor = (current: number, target: number) => {
    if (current >= target) return "text-emerald-500"
    if (current === target - 1) return "text-amber-500"
    return "text-rose-500"
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        teamIndex === 0 ? "border-team-1/30 bg-team-1/5" : "border-team-2/30 bg-team-2/5",
      )}
    >
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Position Needs
      </div>
      <div className="flex flex-wrap gap-1">
        {POSITIONS.map((pos) => {
          const current = positionCounts[pos]
          const statusColor = getStatusColor(current, TARGET_PER_POSITION)

          return (
            <div
              key={pos}
              className={cn(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5",
                POSITION_COLORS[pos],
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{pos}</span>
              <span className={cn("text-[11px] font-bold", statusColor)}>
                {current}/{TARGET_PER_POSITION}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
