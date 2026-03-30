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
const SAVED_SNAKE_STORAGE_KEY = "hoopdrft-saved-snake-player-ids"

type MoneyPools = Record<PlayerPrice, Player[]>

interface DraftConfig {
  name1: string
  name2: string
  playerSet: PlayerSet
  draftMode: DraftMode
}

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

function getTeamIndexForPick(overallPick: number, firstTeamIndex: 0 | 1) {
  const round = Math.ceil(overallPick / 2)
  const pickInRound = ((overallPick - 1) % 2) + 1
  const roundOrder: [0 | 1, 0 | 1] =
    round % 2 === 1 ? [firstTeamIndex, firstTeamIndex === 0 ? 1 : 0] : [firstTeamIndex === 0 ? 1 : 0, firstTeamIndex]

  return roundOrder[pickInRound - 1]
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
  const [firstTeamIndex, setFirstTeamIndex] = useState<0 | 1>(0)
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<Set<string>>(new Set())
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([])
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION)
  const [players, setPlayers] = useState<Player[]>([])
  const [remainingBudget, setRemainingBudget] = useState<[number, number]>([
    MONEY_DRAFT_BUDGET,
    MONEY_DRAFT_BUDGET,
  ])
  const [moneyPools, setMoneyPools] = useState<MoneyPools>(EMPTY_MONEY_POOLS)
  const [savedSnakePlayerIds, setSavedSnakePlayerIds] = useState<Set<string>>(new Set())
  const [lastDraftConfig, setLastDraftConfig] = useState<DraftConfig | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasSavedCompletedSnakeDraftRef = useRef(false)

  const persistSavedSnakePlayerIds = (playerIds: Set<string>) => {
    setSavedSnakePlayerIds(playerIds)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_SNAKE_STORAGE_KEY, JSON.stringify([...playerIds]))
    }
  }

  const filterPlayersForDraft = (playerData: Player[], selectedDraftMode: DraftMode) => {
    if (selectedDraftMode !== "snakeSaved") {
      return playerData
    }

    return playerData.filter((player) => !savedSnakePlayerIds.has(`${player.era}-${player.id}`))
  }

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
    const filteredPlayers = filterPlayersForDraft(playerData, selectedDraftMode)
    setPlayers(filteredPlayers)
    setDraftMode(selectedDraftMode)
    setTotalRounds(selectedDraftMode === "money" ? MONEY_DRAFT_ROUNDS : NORMAL_DRAFT_ROUNDS)
    setStatus("drafting")
    setCurrentPick(1)
    setCurrentRound(1)
    const randomFirstPicker = Math.floor(Math.random() * 2) as 0 | 1
    setFirstTeamIndex(randomFirstPicker)
    setCurrentTeamIndex(randomFirstPicker)
    setTeamRosters([[], []])
    setDraftedPlayerIds(new Set())
    setDraftHistory([])
    setRemainingBudget([MONEY_DRAFT_BUDGET, MONEY_DRAFT_BUDGET])
    setLastDraftConfig({
      name1: name1 || "Team 1",
      name2: name2 || "Team 2",
      playerSet,
      draftMode: selectedDraftMode,
    })
    hasSavedCompletedSnakeDraftRef.current = false
    if (selectedDraftMode === "money") {
      setMoneyPools(buildMoneyPools(filteredPlayers))
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

    const nextTeamIndex = getTeamIndexForPick(nextPick, firstTeamIndex)
    const nextRound = Math.ceil(nextPick / 2)

    setCurrentPick(nextPick)
    setCurrentTeamIndex(nextTeamIndex)
    if (nextRound !== currentRound) {
      setCurrentRound(nextRound)
    }
    startTimer()
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedPlayerIds = window.localStorage.getItem(SAVED_SNAKE_STORAGE_KEY)
    if (!storedPlayerIds) {
      return
    }

    try {
      const parsedPlayerIds = JSON.parse(storedPlayerIds) as string[]
      setSavedSnakePlayerIds(new Set(parsedPlayerIds))
    } catch (error) {
      console.error("Failed to parse saved snake draft players:", error)
      window.localStorage.removeItem(SAVED_SNAKE_STORAGE_KEY)
    }
  }, [])

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

      const nextTeamIndex = getTeamIndexForPick(nextPick, firstTeamIndex)
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
    firstTeamIndex,
  ])

  useEffect(() => {
    if (status !== "completed" || draftMode !== "snakeSaved" || hasSavedCompletedSnakeDraftRef.current) {
      return
    }

    const completedDraftPlayerIds = draftHistory
      .map((pick) => pick.player)
      .filter((player): player is Player => player !== null)
      .map((player) => `${player.era}-${player.id}`)

    if (completedDraftPlayerIds.length > 0) {
      persistSavedSnakePlayerIds(new Set([...savedSnakePlayerIds, ...completedDraftPlayerIds]))
    }

    hasSavedCompletedSnakeDraftRef.current = true
  }, [draftHistory, draftMode, savedSnakePlayerIds, status])

  const resetDraft = () => {
    clearTimer()
    setStatus("pre-draft")
    setCurrentPick(1)
    setCurrentRound(1)
    setCurrentTeamIndex(0)
    setFirstTeamIndex(0)
    setTeamRosters([[], []])
    setDraftedPlayerIds(new Set())
    setDraftHistory([])
    setTimeRemaining(TIMER_DURATION)
    setPlayers([])
    setDraftMode("normal")
    setTotalRounds(NORMAL_DRAFT_ROUNDS)
    setRemainingBudget([MONEY_DRAFT_BUDGET, MONEY_DRAFT_BUDGET])
    setMoneyPools(EMPTY_MONEY_POOLS)
    hasSavedCompletedSnakeDraftRef.current = false
  }

  const startNextSavedSnakeDraft = async () => {
    if (!lastDraftConfig || lastDraftConfig.draftMode !== "snakeSaved") {
      return
    }

    await startDraft(
      lastDraftConfig.name1,
      lastDraftConfig.name2,
      lastDraftConfig.playerSet,
      lastDraftConfig.draftMode,
    )
  }

  const clearSavedSnakePlayers = () => {
    persistSavedSnakePlayerIds(new Set())
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
    savedSnakePlayerIds,
    startDraft,
    draftPlayer,
    resetDraft,
    startNextSavedSnakeDraft,
    clearSavedSnakePlayers,
  }
}
