"use client"

import { useDraft } from "@/hooks/use-draft"
import { PreDraftScreen } from "@/components/pre-draft-screen"
import { DraftCompleteScreen } from "@/components/draft-complete-screen"
import { DraftTimer } from "@/components/draft-timer"
import { DraftBoard } from "@/components/draft-board"
import { TeamRoster } from "@/components/team-roster"
import { DraftHistory } from "@/components/draft-history"
import { cn } from "@/lib/utils"
import { Trophy, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function Page() {
  const draft = useDraft()

  if (draft.status === "pre-draft") {
    return (
      <PreDraftScreen
        onStart={draft.startDraft}
        savedSnakePlayerCount={draft.savedSnakePlayerIds.size}
        onClearSavedSnakePlayers={draft.clearSavedSnakePlayers}
      />
    )
  }

  if (draft.status === "completed") {
    return (
      <DraftCompleteScreen
        teamNames={draft.teamNames}
        teamRosters={draft.teamRosters}
        draftMode={draft.draftMode}
        savedSnakePlayerCount={draft.savedSnakePlayerIds.size}
        onReset={draft.resetDraft}
        onStartNextSavedSnakeDraft={draft.startNextSavedSnakeDraft}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              HoopDrft
            </span>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Round
              </span>
              <span className="font-display text-xl font-bold text-foreground">
                {draft.currentRound}
                <span className="text-muted-foreground">/{draft.totalRounds}</span>
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Pick
              </span>
              <span className="font-display text-xl font-bold text-foreground">
                {draft.currentPick}
                <span className="text-muted-foreground">/{draft.totalPicks}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  draft.currentTeamIndex === 0
                    ? "bg-team-1 text-team-1-foreground"
                    : "bg-team-2 text-team-2-foreground",
                )}
              >
                {draft.teamNames[draft.currentTeamIndex]} picks
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancel Draft</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Draft?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this draft? All progress will be lost and you
                    will return to the setup screen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Drafting</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={draft.resetDraft}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Draft
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
        {/* Left: Team 1 */}
        <aside className="w-full lg:w-72 xl:w-80">
          <TeamRoster
            teamName={draft.teamNames[0]}
            roster={draft.teamRosters[0]}
            teamIndex={0}
            isActive={draft.currentTeamIndex === 0}
            totalRounds={draft.totalRounds}
            draftMode={draft.draftMode}
            remainingBudget={draft.remainingBudget[0]}
          />
        </aside>

        {/* Center: Timer + Board */}
        <div className="flex flex-1 flex-col gap-6">
          {/* On the clock banner */}
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:gap-4",
              draft.currentTeamIndex === 0
                ? "border-team-1/40 bg-team-1/5"
                : "border-team-2/40 bg-team-2/5",
            )}
          >
            <DraftTimer
              timeRemaining={draft.timeRemaining}
              timerDuration={draft.timerDuration}
            />
            <div className="flex flex-1 flex-col items-center gap-0.5 sm:items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                On the Clock
              </span>
              <h2
                className={cn(
                  "font-display text-xl font-bold uppercase tracking-tight sm:text-2xl",
                  draft.currentTeamIndex === 0 ? "text-team-1" : "text-team-2",
                )}
              >
                {draft.teamNames[draft.currentTeamIndex]}
              </h2>
              <p className="text-xs text-muted-foreground">
                {draft.draftMode === "money"
                  ? `Round ${draft.currentRound}, Pick ${draft.currentTeamIndex + 1}`
                  : `Round ${draft.currentRound}, Pick ${draft.currentTeamIndex + 1} | Select a player from the board below`}
              </p>
            </div>
            {draft.draftMode === "money" && (
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-accent/15 px-4 py-2 text-accent sm:ml-auto sm:items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">
                  Budget Left
                </span>
                <span className="font-display text-3xl font-black leading-none">${draft.remainingBudget[draft.currentTeamIndex]}</span>
              </div>
            )}
          </div>

          {/* Draft board */}
          <DraftBoard
            players={draft.players}
            draftedPlayerIds={draft.draftedPlayerIds}
            onDraft={draft.draftPlayer}
            disabled={false}
            draftMode={draft.draftMode}
            moneyPools={draft.moneyPools}
            activeTeamBudget={draft.remainingBudget[draft.currentTeamIndex]}
            activeTeamRosterSize={draft.teamRosters[draft.currentTeamIndex].length}
            totalRounds={draft.totalRounds}
          />

          {/* Draft history */}
          <DraftHistory history={draft.draftHistory} teamNames={draft.teamNames} />
        </div>

        {/* Right: Team 2 */}
        <aside className="w-full lg:w-72 xl:w-80">
          <TeamRoster
            teamName={draft.teamNames[1]}
            roster={draft.teamRosters[1]}
            teamIndex={1}
            isActive={draft.currentTeamIndex === 1}
            totalRounds={draft.totalRounds}
            draftMode={draft.draftMode}
            remainingBudget={draft.remainingBudget[1]}
          />
        </aside>
      </main>
    </div>
  )
}
