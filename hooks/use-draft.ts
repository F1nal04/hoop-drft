"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Player, PlayerSet } from "@/lib/players"
import { getPlayerSet } from "@/lib/players"

export type DraftStatus = "pre-draft" | "drafting" | "completed"

export interface DraftPick {
  round: number
  pick: number
  overallPick: number
  teamIndex: number
  player: Player | null
}

const TIMER_DURATION = 120
const TOTAL_ROUNDS = 10

export function useDraft() {
  const [status, setStatus] = useState<DraftStatus>("pre-draft")
  const [currentPick, setCurrentPick] = useState(1)
  const [currentRound, setCurrentRound] = useState(1)
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [teamNames, setTeamNames] = useState<[string, string]>(["Team 1", "Team 2"])
  const [teamRosters, setTeamRosters] = useState<[(Player | null)[], (Player | null)[]]>([[], []])
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<Set<number>>(new Set())
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([])
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION)
  const [players, setPlayers] = useState<Player[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setTimeRemaining(TIMER_DURATION)
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  const totalPicks = TOTAL_ROUNDS * 2
  const isComplete = currentPick > totalPicks

  const startDraft = useCallback(
    (name1: string, name2: string, playerSet: PlayerSet) => {
      setTeamNames([name1 || "Team 1", name2 || "Team 2"])
      setPlayers(getPlayerSet(playerSet))
      setStatus("drafting")
      setCurrentPick(1)
      setCurrentRound(1)
      setCurrentTeamIndex(0)
      setTeamRosters([[], []])
      setDraftedPlayerIds(new Set())
      setDraftHistory([])
      startTimer()
    },
    [startTimer],
  )

  const draftPlayer = useCallback(
    (player: Player) => {
      if (status !== "drafting" || draftedPlayerIds.has(player.id) || isComplete) return

      const pick: DraftPick = {
        round: currentRound,
        pick: currentTeamIndex + 1,
        overallPick: currentPick,
        teamIndex: currentTeamIndex,
        player,
      }

      setDraftHistory((prev) => [...prev, pick])
      setTeamRosters((prev) => {
        const updated: [(Player | null)[], (Player | null)[]] = [[...prev[0]], [...prev[1]]]
        updated[currentTeamIndex] = [...updated[currentTeamIndex], player]
        return updated
      })
      setDraftedPlayerIds((prev) => new Set([...prev, player.id]))

      const nextPick = currentPick + 1
      if (nextPick > totalPicks) {
        setCurrentPick(nextPick)
        setStatus("completed")
        clearTimer()
        return
      }

      const nextTeamIndex = currentTeamIndex === 0 ? 1 : 0
      const nextRound = nextTeamIndex === 0 ? currentRound + 1 : currentRound

      setCurrentPick(nextPick)
      setCurrentTeamIndex(nextTeamIndex)
      if (nextRound !== currentRound) {
        setCurrentRound(nextRound)
      }
      startTimer()
    },
    [
      status,
      draftedPlayerIds,
      isComplete,
      currentRound,
      currentTeamIndex,
      currentPick,
      totalPicks,
      startTimer,
      clearTimer,
    ],
  )

  useEffect(() => {
    if (timeRemaining === 0 && status === "drafting" && !isComplete) {
      // Add empty pick when timer expires
      const emptyPick: DraftPick = {
        round: currentRound,
        pick: currentTeamIndex + 1,
        overallPick: currentPick,
        teamIndex: currentTeamIndex,
        player: null,
      }

      setDraftHistory((prev) => [...prev, emptyPick])
      setTeamRosters((prev) => {
        const updated: [(Player | null)[], (Player | null)[]] = [[...prev[0]], [...prev[1]]]
        updated[currentTeamIndex] = [...updated[currentTeamIndex], null]
        return updated
      })

      const nextPick = currentPick + 1
      if (nextPick > totalPicks) {
        setCurrentPick(nextPick)
        setStatus("completed")
        clearTimer()
        return
      }

      const nextTeamIndex = currentTeamIndex === 0 ? 1 : 0
      const nextRound = nextTeamIndex === 0 ? currentRound + 1 : currentRound

      setCurrentPick(nextPick)
      setCurrentTeamIndex(nextTeamIndex)
      if (nextRound !== currentRound) {
        setCurrentRound(nextRound)
      }
      startTimer()
    }
  }, [
    timeRemaining,
    status,
    isComplete,
    currentPick,
    totalPicks,
    currentTeamIndex,
    currentRound,
    startTimer,
    clearTimer,
  ])

  const resetDraft = useCallback(() => {
    clearTimer()
    setStatus("pre-draft")
    setCurrentPick(1)
    setCurrentRound(1)
    setCurrentTeamIndex(0)
    setTeamRosters([[], []])
    setDraftedPlayerIds(new Set())
    setDraftHistory([])
    setTimeRemaining(TIMER_DURATION)
    setPlayers([])
  }, [clearTimer])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    status,
    currentPick,
    currentRound,
    currentTeamIndex,
    teamNames,
    teamRosters,
    draftedPlayerIds,
    draftHistory,
    timeRemaining,
    totalPicks,
    totalRounds: TOTAL_ROUNDS,
    timerDuration: TIMER_DURATION,
    players,
    startDraft,
    draftPlayer,
    resetDraft,
  }
}
