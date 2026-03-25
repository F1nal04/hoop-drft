"use client"

import { useState, useRef, useEffect } from "react"
import type { DraftMode, Player, PlayerPrice, PlayerSet } from "@/lib/types"
import { getPlayerSet } from "@/lib/types"

export type DraftStatus = "pre-draft" | "drafting" | "completed"

export interface DraftPick {
  round: number
  pick: number
  overallPick: number
  teamIndex: number
  player: Player | null
}

const TIMER_DURATION = 120
const NORMAL_DRAFT_ROUNDS = 10
const MONEY_DRAFT_ROUNDS = 5
const MONEY_DRAFT_BUDGET = 15
const MONEY_TIER_POOL_SIZE = 5

type MoneyPools = Record<PlayerPrice, Player[]>

const EMPTY_MONEY_POOLS: MoneyPools = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
}

function shufflePlayers(players: Player[]): Player[] {
  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[randomIndex]
    shuffled[randomIndex] = temp
  }
  return shuffled
}

function buildMoneyPools(players: Player[]): MoneyPools {
  const pools: MoneyPools = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  }

  ;([1, 2, 3, 4, 5] as const).forEach((price) => {
    const tierPlayers = players.filter((player) => player.price === price)
    pools[price] = shufflePlayers(tierPlayers).slice(0, MONEY_TIER_POOL_SIZE)
  })

  return pools
}

export function useDraft() {
  const [status, setStatus] = useState<DraftStatus>("pre-draft")
  const [draftMode, setDraftMode] = useState<DraftMode>("normal")
  const [totalRounds, setTotalRounds] = useState(NORMAL_DRAFT_ROUNDS)
  const [currentPick, setCurrentPick] = useState(1)
  const [currentRound, setCurrentRound] = useState(1)
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [teamNames, setTeamNames] = useState<[string, string]>(["Team 1", "Team 2"])
  const [teamRosters, setTeamRosters] = useState<[(Player | null)[], (Player | null)[]]>([[], []])
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<Set<string>>(new Set())
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([])
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION)
  const [players, setPlayers] = useState<Player[]>([])
  const [remainingBudget, setRemainingBudget] = useState<[number, number]>([
    MONEY_DRAFT_BUDGET,
    MONEY_DRAFT_BUDGET,
  ])
  const [moneyPools, setMoneyPools] = useState<MoneyPools>(EMPTY_MONEY_POOLS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
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
  }

  const totalPicks = totalRounds * 2
  const isComplete = currentPick > totalPicks

  const startDraft = async (name1: string, name2: string, playerSet: PlayerSet, selectedDraftMode: DraftMode) => {
    setTeamNames([name1 || "Team 1", name2 || "Team 2"])
    const playerData = await getPlayerSet(playerSet)
    setPlayers(playerData)
    setDraftMode(selectedDraftMode)
    setTotalRounds(selectedDraftMode === "money" ? MONEY_DRAFT_ROUNDS : NORMAL_DRAFT_ROUNDS)
    setStatus("drafting")
    setCurrentPick(1)
    setCurrentRound(1)
    const randomFirstPicker = Math.floor(Math.random() * 2) as 0 | 1
    setCurrentTeamIndex(randomFirstPicker)
    setTeamRosters([[], []])
    setDraftedPlayerIds(new Set())
    setDraftHistory([])
    setRemainingBudget([MONEY_DRAFT_BUDGET, MONEY_DRAFT_BUDGET])
    if (selectedDraftMode === "money") {
      setMoneyPools(buildMoneyPools(playerData))
    } else {
      setMoneyPools(EMPTY_MONEY_POOLS)
    }
    startTimer()
  }

  const draftPlayer = (player: Player) => {
    const playerKey = `${player.era}-${player.id}`
    if (status !== "drafting" || draftedPlayerIds.has(playerKey) || isComplete) return
    if (draftMode === "money") {
      const currentTeamPicksMade = teamRosters[currentTeamIndex].length
      const remainingSlotsAfterPick = Math.max(0, totalRounds - (currentTeamPicksMade + 1))
      const budgetAfterPick = remainingBudget[currentTeamIndex] - player.price
      const canAffordNow = player.price <= remainingBudget[currentTeamIndex]
      const canAffordFutureSlots = budgetAfterPick >= remainingSlotsAfterPick
      if (!canAffordNow || !canAffordFutureSlots) return

      const isPlayerInPool = Object.values(moneyPools).some((tierPlayers) =>
        tierPlayers.some((poolPlayer) => `${poolPlayer.era}-${poolPlayer.id}` === playerKey),
      )

      if (!isPlayerInPool) return
    }

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
    setDraftedPlayerIds((prev) => new Set([...prev, playerKey]))
    if (draftMode === "money") {
      setRemainingBudget((prev) => {
        const updated: [number, number] = [...prev] as [number, number]
        updated[currentTeamIndex] = Math.max(0, updated[currentTeamIndex] - player.price)
        return updated
      })
    }

    const nextPick = currentPick + 1
    if (nextPick > totalPicks) {
      setCurrentPick(nextPick)
      setStatus("completed")
      clearTimer()
      return
    }

    const nextTeamIndex = currentTeamIndex === 0 ? 1 : 0
    const nextRound = Math.ceil(nextPick / 2)

    setCurrentPick(nextPick)
    setCurrentTeamIndex(nextTeamIndex)
    if (nextRound !== currentRound) {
      setCurrentRound(nextRound)
    }
    startTimer()
  }

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
      const nextRound = Math.ceil(nextPick / 2)

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
  ])

  const resetDraft = () => {
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
    setDraftMode("normal")
    setTotalRounds(NORMAL_DRAFT_ROUNDS)
    setRemainingBudget([MONEY_DRAFT_BUDGET, MONEY_DRAFT_BUDGET])
    setMoneyPools(EMPTY_MONEY_POOLS)
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  return {
    status,
    draftMode,
    currentPick,
    currentRound,
    currentTeamIndex,
    teamNames,
    teamRosters,
    draftedPlayerIds,
    draftHistory,
    timeRemaining,
    totalPicks,
    totalRounds,
    timerDuration: TIMER_DURATION,
    players,
    remainingBudget,
    moneyPools,
    startDraft,
    draftPlayer,
    resetDraft,
  }
}
