"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_CONFIG, type HDConfig, readConfig } from "@/lib/hd-config"
import { type HDPlayer, type Position, POSITIONS, loadHDPools } from "@/lib/hd-data"
import { type DraftedPlayer, type TeamResult, writeResult } from "@/lib/hd-results"

type SortKey = "ppg" | "rpg" | "apg" | "cost"
type PosFilter = "ALL" | Position

interface TeamState extends TeamResult {}

const POOL_LIMIT = 80
const STAT_COLS_MONEY = "grid-cols-[30px_38px_1fr_50px_50px_50px_60px_80px]"
const STAT_COLS_SNAKE = "grid-cols-[30px_38px_1fr_50px_50px_50px_80px]"

function pickOrder(idx: number, mode: HDConfig["mode"], firstTeam: 0 | 1): 0 | 1 {
  if (mode === "snake") {
    const round = Math.floor(idx / 2)
    const inRound = idx % 2
    const a = firstTeam
    const b = (1 - firstTeam) as 0 | 1
    return round % 2 === 0 ? (inRound === 0 ? a : b) : inRound === 0 ? b : a
  }
  return (idx % 2 === 0 ? firstTeam : ((1 - firstTeam) as 0 | 1))
}

function roundOf(idx: number) {
  return Math.floor(idx / 2) + 1
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function DraftPage() {
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posFilter, setPosFilter] = useState<PosFilter>("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("ppg")
  const [query, setQuery] = useState("")
  const completedRef = useRef(false)

  useEffect(() => {
    const cfg = readConfig()
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
        setPool(pools[cfg.dataset] ?? pools.current)
        setPoolLoading(false)
      })
      .catch((err) => {
        setPoolError(err instanceof Error ? err.message : "Failed to load players")
        setPoolLoading(false)
      })
  }, [])

  const rosterMax = config.mode === "snake" ? 10 : 5
  const posReq: Record<Position, number> =
    config.mode === "snake"
      ? { PG: 2, SG: 2, SF: 2, PF: 2, C: 2 }
      : { PG: 1, SG: 1, SF: 1, PF: 1, C: 1 }
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
      setSelectedId(null)
      setPickIdx(nextIdx)
      if (nextIdx < totalPicks) {
        setOnClock(pickOrder(nextIdx, config.mode, firstTeam))
        setSecondsLeft(config.clock)
      }
    },
    [pickIdx, onClock, config.mode, config.clock, totalPicks, firstTeam],
  )

  const onClockRef = useRef(onClock)
  const pickIdxRef = useRef(pickIdx)
  onClockRef.current = onClock
  pickIdxRef.current = pickIdx

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
        return p.cost <= remaining && remaining - p.cost >= slotsAfter * 2
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

  function selectPlayer(id: string) {
    if (draftedIds.has(id)) return
    setSelectedId(id)
  }

  function makePick() {
    if (!selectedId || isComplete) return
    const player = pool.find((p) => p.id === selectedId)
    if (!player || draftedIds.has(player.id)) return
    if (teams[onClock].picks.length >= rosterMax) return
    if (config.mode === "money") {
      const remaining = config.budget - teams[onClock].spent
      const slotsAfter = rosterMax - teams[onClock].picks.length - 1
      if (player.cost > remaining) return
      if (remaining - player.cost < slotsAfter * 2) return
    }
    advance(player)
  }

  function renameTeam(t: 0 | 1, name: string) {
    setTeams((prev) => {
      const next = [...prev] as [TeamState, TeamState]
      next[t] = { ...next[t], name }
      return next
    })
  }

  function cancelDraft() {
    if (confirm("Cancel this draft? Picks will be discarded.")) {
      router.push("/")
    }
  }

  const filteredPool = useMemo(() => {
    let p = pool.filter((x) => !draftedIds.has(x.id))
    if (posFilter !== "ALL") p = p.filter((x) => x.pos === posFilter)
    if (query) {
      const q = query.toLowerCase()
      p = p.filter((x) => x.name.toLowerCase().includes(q) || x.tag.toLowerCase().includes(q))
    }
    return p
      .slice()
      .sort((a, b) => b[sortKey] - a[sortKey])
      .slice(0, POOL_LIMIT)
  }, [pool, draftedIds, posFilter, query, sortKey])

  const timerWarn = secondsLeft <= 10
  const onClockTeam = teams[onClock]
  const showMoney = config.mode === "money"
  const statCols = showMoney ? STAT_COLS_MONEY : STAT_COLS_SNAKE
  const progress = secondsLeft / Math.max(1, config.clock)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* TOP BAR */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-line bg-paper px-7 py-4">
        <div className="flex items-center gap-2.5 font-serif text-[18px] font-medium">
          <span className="hd-mark size-[18px]" />
          <span>Hoop Draft</span>
        </div>

        <div className="grid grid-cols-[auto_auto_auto] items-center gap-[22px]">
          <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            <span>On the clock</span>
            <b className="mt-0.5 block font-serif text-[20px] font-medium tracking-[-0.01em] text-ink">
              {onClockTeam.name}
            </b>
          </div>

          <div
            className={`relative min-w-[110px] rounded-lg bg-ink px-[22px] py-2.5 text-center font-mono text-[32px] font-semibold tracking-[0.04em] text-orange-hd-2 ${
              timerWarn ? "hd-timer-warn" : ""
            }`}
          >
            {formatTime(secondsLeft)}
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-orange-hd-2 transition-transform duration-1000 ease-linear"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            <span>Pick</span>
            <b className="mt-0.5 block font-serif text-[20px] font-medium text-ink">
              R{roundOf(pickIdx)} · #{pickIdx + 1}
            </b>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelDraft}
            className="h-[38px] cursor-pointer rounded-lg border border-line bg-paper px-3.5 font-sans text-[13px] font-medium text-ink-soft hover:border-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={makePick}
            disabled={!selectedId || poolLoading}
            className="h-[38px] cursor-pointer rounded-lg border-0 bg-orange-hd px-[18px] font-sans text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            Draft
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="grid flex-1 grid-cols-[280px_1fr_280px] overflow-hidden">
        <TeamRail
          team={teams[0]}
          teamIndex={0}
          showMoney={showMoney}
          budget={config.budget}
          posReq={posReq}
          rosterMax={rosterMax}
          mode={config.mode}
          onClock={onClock === 0}
          onRename={(v) => renameTeam(0, v)}
        />

        {/* POOL */}
        <section className="flex flex-col overflow-hidden bg-paper">
          <div className="flex flex-wrap items-center gap-3.5 px-7 pb-3.5 pt-[18px]">
            <div className="inline-flex rounded-full border border-line p-0.5">
              {(["ALL", ...POSITIONS] as PosFilter[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPosFilter(p)}
                  className={`cursor-pointer rounded-full border-0 px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] ${
                    posFilter === p ? "bg-ink text-paper" : "bg-transparent text-ink-soft"
                  }`}
                >
                  {p === "ALL" ? "All" : p}
                </button>
              ))}
            </div>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="cursor-pointer rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] text-ink-soft outline-none focus:border-orange-hd"
            >
              <option value="ppg">Sort · PPG</option>
              <option value="rpg">Sort · RPG</option>
              <option value="apg">Sort · APG</option>
              {showMoney && <option value="cost">Sort · $</option>}
            </select>

            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-full border border-line bg-paper px-3.5 py-2 font-sans text-[13px] text-ink outline-none focus:border-orange-hd"
              />
            </div>
          </div>

          <div
            className={`grid ${statCols} gap-2.5 border-y border-line bg-paper px-7 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute`}
          >
            <span className="text-right">#</span>
            <span />
            <span>Player</span>
            <span className="text-right">PPG</span>
            <span className="text-right">RPG</span>
            <span className="text-right">APG</span>
            {showMoney && <span className="text-right">$M</span>}
            <span className="text-right">POS</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {poolLoading && (
              <div className="px-7 py-12 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-ink-mute">
                Loading players…
              </div>
            )}
            {poolError && (
              <div className="px-7 py-12 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-warn">
                {poolError}
              </div>
            )}
            {!poolLoading &&
              !poolError &&
              filteredPool.map((p, i) => {
                const selected = p.id === selectedId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPlayer(p.id)}
                    className={`grid ${statCols} w-full cursor-pointer items-center gap-2.5 border-b border-dashed border-line px-7 py-2.5 text-left ${
                      selected ? "bg-orange-soft" : "bg-transparent hover:bg-paper-2"
                    }`}
                  >
                    <span className="font-mono text-[11px] text-ink-mute">{i + 1}</span>
                    <span
                      className={`grid size-8 place-items-center rounded-md font-mono text-[12px] font-semibold ${
                        selected ? "bg-orange-hd text-white" : "bg-ink text-paper"
                      }`}
                    >
                      {p.num}
                    </span>
                    <span>
                      <span className="block font-serif text-[16px] font-medium leading-none tracking-[-0.01em]">
                        {p.name}
                      </span>
                      <span className="mt-[3px] block font-mono text-[10px] tracking-[0.04em] text-ink-mute">
                        {p.tag} · #{p.rank}
                      </span>
                    </span>
                    <span
                      className={`text-right font-mono text-[13px] ${
                        sortKey === "ppg" ? "text-ink" : "font-normal text-ink-mute"
                      }`}
                    >
                      {p.ppg}
                    </span>
                    <span
                      className={`text-right font-mono text-[13px] ${
                        sortKey === "rpg" ? "text-ink" : "font-normal text-ink-mute"
                      }`}
                    >
                      {p.rpg}
                    </span>
                    <span
                      className={`text-right font-mono text-[13px] ${
                        sortKey === "apg" ? "text-ink" : "font-normal text-ink-mute"
                      }`}
                    >
                      {p.apg}
                    </span>
                    {showMoney && (
                      <span className="text-right font-mono text-[13px] font-semibold text-ok">
                        ${p.cost}
                      </span>
                    )}
                    <span className="text-right font-mono text-[11px] tracking-[0.06em] text-ink-soft">
                      {p.pos}
                    </span>
                  </button>
                )
              })}
          </div>
        </section>

        <TeamRail
          team={teams[1]}
          teamIndex={1}
          showMoney={showMoney}
          budget={config.budget}
          posReq={posReq}
          rosterMax={rosterMax}
          mode={config.mode}
          onClock={onClock === 1}
          onRename={(v) => renameTeam(1, v)}
        />
      </div>
    </div>
  )
}

interface TeamRailProps {
  team: TeamState
  teamIndex: 0 | 1
  showMoney: boolean
  budget: number
  posReq: Record<Position, number>
  rosterMax: number
  mode: HDConfig["mode"]
  onClock: boolean
  onRename: (name: string) => void
}

function TeamRail({
  team,
  teamIndex,
  showMoney,
  budget,
  posReq,
  rosterMax,
  mode,
  onClock,
  onRename,
}: TeamRailProps) {
  const right = teamIndex === 1
  const dotColor = right ? "bg-ink" : "bg-orange-hd"
  const moneyRemaining = budget - team.spent
  const moneyPct = Math.min(100, (team.spent / Math.max(1, budget)) * 100)

  return (
    <aside
      className={`overflow-y-auto px-[18px] pb-[60px] pt-[22px] ${
        right ? "border-l border-line" : "border-r border-line"
      }`}
    >
      <div className="mb-[18px] grid grid-cols-[8px_1fr_auto] items-center gap-2.5">
        <span className={`size-2 rounded-full ${dotColor}`} />
        <input
          value={team.name}
          onChange={(e) => onRename(e.target.value)}
          className="w-full border-0 bg-transparent p-0 font-serif text-[20px] font-medium tracking-[-0.01em] text-inherit outline-none"
        />
        <span className="font-mono text-[12px] tracking-[0.06em] text-ink-mute">
          <b className="font-semibold text-ink">{team.picks.length}</b>/{rosterMax}
        </span>
      </div>

      {showMoney && (
        <div className="mb-[18px] rounded-lg bg-ink p-3.5 text-paper">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/55">
              Cap left
            </span>
            <span className="font-mono text-[22px] font-semibold text-orange-hd-2">
              ${moneyRemaining}M
            </span>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-[2px] bg-paper/10">
            <i className="block h-full bg-orange-hd" style={{ width: `${moneyPct}%` }} />
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-5 gap-1">
        {POSITIONS.map((p) => {
          const got = team.picks.filter((x) => x.pos === p).length
          const need = posReq[p]
          const cls =
            got > need
              ? "border-orange-hd bg-orange-hd text-white"
              : got >= need
                ? "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-ink"
          return (
            <div key={p} className={`rounded-md border py-1.5 text-center ${cls}`}>
              <div className="font-mono text-[9px] tracking-[0.1em] opacity-65">{p}</div>
              <div className="mt-0.5 font-serif text-[16px] font-medium leading-none">
                {got}
                <em className="text-[11px] not-italic opacity-50">/{need}</em>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col">
        {Array.from({ length: rosterMax }).map((_, i) => {
          const pick = team.picks[i]
          const isNext = onClock && i === team.picks.length
          if (pick) {
            return (
              <div
                key={i}
                className="grid grid-cols-[32px_1fr_auto] items-center gap-2.5 border-b border-dashed border-line py-2 last:border-b-0"
              >
                <div
                  className={`grid size-8 place-items-center rounded-md font-mono text-[12px] font-semibold ${
                    right ? "bg-ink text-paper" : "bg-orange-hd text-white"
                  }`}
                >
                  {pick.num}
                </div>
                <div>
                  <div className="font-serif text-[14px] font-medium leading-[1.1] tracking-[-0.01em]">
                    {pick.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-ink-mute">
                    {pick.pos}
                    {mode === "money" ? ` · $${pick.cost}M` : ""}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-ink-mute">
                  P<b className="font-semibold text-ink">{pick.pickNo}</b>
                </div>
              </div>
            )
          }
          return (
            <div
              key={i}
              className={`grid grid-cols-[32px_1fr_auto] items-center gap-2.5 border-b border-dashed border-line py-2 last:border-b-0 ${
                isNext
                  ? right
                    ? "rounded-md bg-orange-soft pr-2 shadow-[inset_-2px_0_0_var(--color-orange-hd)]"
                    : "rounded-md bg-orange-soft pl-2 shadow-[inset_2px_0_0_var(--color-orange-hd)]"
                  : ""
              }`}
            >
              <div className="grid size-8 place-items-center rounded-md border border-dashed border-line bg-transparent font-mono text-[12px] font-semibold text-transparent">
                ··
              </div>
              <div>
                <div className="font-serif text-[14px] font-medium italic leading-[1.1] tracking-[-0.01em] text-ink-mute opacity-50">
                  {isNext ? "On the clock" : "Empty"}
                </div>
              </div>
              <div className="font-mono text-[11px] text-ink-mute">{i + 1}</div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
