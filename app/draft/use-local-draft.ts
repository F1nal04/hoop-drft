"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { DEFAULT_CONFIG, type HDConfig, readConfig } from "@/lib/hd-config"
import { type HDPlayer, MONEY_BUDGET, MONEY_MIN_COST, buildMoneyPool, loadHDPools } from "@/lib/hd-data"
import { readExclusions } from "@/lib/hd-exclusions"
import { type TeamResult, writeResult } from "@/lib/hd-results"
import { type DraftEngine, type TeamState, pickOrder, posReqFor, rosterMaxFor } from "./engine"

// The original hot-seat draft engine, unchanged in behavior: all state lives
// on this device and both teams are controlled from it.
export function useLocalDraft(): DraftEngine {
  const router = useRouter()
  const [config, setConfig] = useState<HDConfig>(DEFAULT_CONFIG)
  const [hydrated, setHydrated] = useState(false)
  const [poolLoading, setPoolLoading] = useState(true)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [pool, setPool] = useState<HDPlayer[]>([])

  const [firstTeam, setFirstTeam] = useState<0 | 1>(0)
  const [onClock, setOnClock] = useState<0 | 1>(0)
  const [pickIdx, setPickIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_CONFIG.clock)
  const [teams, setTeams] = useState<[TeamState, TeamState]>([
    { name: DEFAULT_CONFIG.t1, picks: [], spent: 0 },
    { name: DEFAULT_CONFIG.t2, picks: [], spent: 0 },
  ])
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set())
  const completedRef = useRef(false)

  useEffect(() => {
    const cfg = readConfig()
    if (cfg.mode === "money") {
      cfg.budget = MONEY_BUDGET // the $15 cap is fixed in money mode
    }
    setConfig(cfg)
    setSecondsLeft(cfg.clock)
    const first = Math.floor(Math.random() * 2) as 0 | 1
    setFirstTeam(first)
    setOnClock(first)
    setTeams([
      { name: cfg.t1, picks: [], spent: 0 },
      { name: cfg.t2, picks: [], spent: 0 },
    ])
    setHydrated(true)

    loadHDPools()
      .then((pools) => {
        const base = pools[cfg.dataset] ?? pools.current
        // "Continue drafting" carries over the ids drafted in previous rounds.
        const excluded = new Set(readExclusions())
        const available = excluded.size ? base.filter((p) => !excluded.has(p.id)) : base
        setPool(cfg.mode === "money" ? buildMoneyPool(available) : available)
        setPoolLoading(false)
      })
      .catch((err) => {
        setPoolError(err instanceof Error ? err.message : "Failed to load players")
        setPoolLoading(false)
      })
  }, [])

  const rosterMax = rosterMaxFor(config.mode)
  const totalPicks = rosterMax * 2
  const isComplete = pickIdx >= totalPicks

  const advance = useCallback(
    (chosen: HDPlayer | null) => {
      const nextIdx = pickIdx + 1
      if (chosen) {
        setTeams((prev) => {
          const next = [
            { ...prev[0], picks: [...prev[0].picks] },
            { ...prev[1], picks: [...prev[1].picks] },
          ] as [TeamState, TeamState]
          next[onClock].picks.push({ ...chosen, pickNo: pickIdx + 1 })
          if (config.mode === "money") next[onClock].spent += chosen.cost
          return next
        })
        setDraftedIds((prev) => {
          const next = new Set(prev)
          next.add(chosen.id)
          return next
        })
      }
      setPickIdx(nextIdx)
      if (nextIdx < totalPicks) {
        setOnClock(pickOrder(nextIdx, firstTeam))
        setSecondsLeft(config.clock)
      }
    },
    [pickIdx, onClock, config.mode, config.clock, totalPicks, firstTeam],
  )

  useEffect(() => {
    if (!hydrated || poolLoading || isComplete) return
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [hydrated, poolLoading, isComplete])

  useEffect(() => {
    if (!hydrated || poolLoading || isComplete) return
    if (secondsLeft > 0) return
    // Auto-skip: pick the best available legal player for current team
    const bestForTeam = pool
      .filter((p) => !draftedIds.has(p.id))
      .filter((p) => {
        if (config.mode !== "money") return true
        const remaining = config.budget - teams[onClock].spent
        const slotsLeft = rosterMax - teams[onClock].picks.length
        const slotsAfter = Math.max(0, slotsLeft - 1)
        return p.cost <= remaining && remaining - p.cost >= slotsAfter * MONEY_MIN_COST
      })
      .sort((a, b) => a.rank - b.rank)[0]
    advance(bestForTeam ?? null)
  }, [
    secondsLeft,
    hydrated,
    poolLoading,
    isComplete,
    pool,
    draftedIds,
    config.mode,
    config.budget,
    teams,
    onClock,
    rosterMax,
    advance,
  ])

  useEffect(() => {
    if (!isComplete || completedRef.current) return
    completedRef.current = true
    writeResult({
      mode: config.mode,
      budget: config.budget,
      rosterMax,
      teams: teams.map((t) => ({ name: t.name, picks: t.picks, spent: t.spent })) as [
        TeamResult,
        TeamResult,
      ],
      completedAt: Date.now(),
    })
    router.push("/results")
  }, [isComplete, config.mode, config.budget, rosterMax, teams, router])

  function canDraft(player: HDPlayer): boolean {
    if (isComplete) return false
    if (draftedIds.has(player.id)) return false
    if (teams[onClock].picks.length >= rosterMax) return false
    if (config.mode === "money") {
      const remaining = config.budget - teams[onClock].spent
      const slotsAfter = rosterMax - teams[onClock].picks.length - 1
      if (player.cost > remaining) return false
      if (remaining - player.cost < slotsAfter * MONEY_MIN_COST) return false
    }
    return true
  }

  return {
    ready: hydrated && !poolLoading,
    loadError: poolError,
    mode: config.mode,
    budget: config.budget,
    clock: config.clock,
    teams,
    onClock,
    pickIdx,
    rosterMax,
    posReq: posReqFor(config.mode),
    secondsLeft,
    pool,
    draftedIds,
    mySeat: null,
    myTurn: true,
    banner: null,
    canDraft,
    draftPlayer: (player) => {
      if (canDraft(player)) advance(player)
    },
    rename: (team, name) => {
      setTeams((prev) => {
        const next = [...prev] as [TeamState, TeamState]
        next[team] = { ...next[team], name }
        return next
      })
    },
    cancel: () => {
      if (confirm("Cancel this draft? Picks will be discarded.")) {
        router.push("/")
      }
    },
  }
}
