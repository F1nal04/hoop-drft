"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface DraftTimerProps {
  timeRemaining: number
  timerDuration: number
}

export function DraftTimer({ timeRemaining, timerDuration }: DraftTimerProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const percentage = (timeRemaining / timerDuration) * 100
  const isWarning = timeRemaining <= 30 && timeRemaining > 10
  const isDanger = timeRemaining <= 10

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={
              isDanger
                ? "hsl(var(--timer-danger))"
                : isWarning
                  ? "hsl(var(--timer-warning))"
                  : "hsl(var(--primary))"
            }
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Clock
            className={cn(
              "mb-1 h-4 w-4",
              isDanger
                ? "text-[hsl(var(--timer-danger))]"
                : isWarning
                  ? "text-[hsl(var(--timer-warning))]"
                  : "text-primary",
            )}
          />
          <span
            className={cn(
              "font-display text-3xl font-bold tabular-nums tracking-tight",
              isDanger
                ? "text-[hsl(var(--timer-danger))] animate-pulse"
                : isWarning
                  ? "text-[hsl(var(--timer-warning))]"
                  : "text-foreground",
            )}
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Time Remaining
      </span>
    </div>
  )
}
