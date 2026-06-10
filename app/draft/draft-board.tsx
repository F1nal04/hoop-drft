"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import type { HDConfig } from "@/lib/hd-config"
import { type Position, POSITIONS } from "@/lib/hd-data"
import { type DraftEngine, type TeamState, formatTime, roundOf } from "./engine"

type SortKey = "rank" | "ppg" | "rpg" | "apg" | "cost"
type PosFilter = "ALL" | Position

const POOL_LIMIT = 80
const STAT_COLS_MONEY = "grid-cols-[30px_38px_1fr_50px_50px_50px_60px_72px]"
const STAT_COLS_SNAKE = "grid-cols-[30px_38px_1fr_50px_50px_50px_72px]"

// Pure rendering of a draft in progress; all rules and state transitions come
// through the engine (local hot-seat or remote). Filters, sort, search and the
// current selection are view concerns and live here.
export function DraftBoard({ engine }: { engine: DraftEngine }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posFilter, setPosFilter] = useState<PosFilter>("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [query, setQuery] = useState("")

  const showMoney = engine.mode === "money"

  // Money boards open grouped by price tier (mirrors the original page).
  useEffect(() => {
    if (showMoney) setSortKey("cost")
  }, [showMoney])

  // Drop the selection once that player is gone (drafted by either side).
  useEffect(() => {
    if (selectedId && engine.draftedIds.has(selectedId)) setSelectedId(null)
  }, [selectedId, engine.draftedIds])

  function selectPlayer(id: string) {
    if (engine.draftedIds.has(id)) return
    // Money mode: a player the on-clock team can't legally afford (would lock the
    // roster out of being completable) is not selectable — mirrors the disabled Draft button.
    if (showMoney && engine.myTurn) {
      const player = engine.pool.find((p) => p.id === id)
      if (player && !engine.canDraft(player)) return
    }
    setSelectedId(id)
  }

  const selectedPlayer = selectedId ? engine.pool.find((p) => p.id === selectedId) : undefined

  function makePick() {
    if (!selectedPlayer) return
    engine.draftPlayer(selectedPlayer)
  }

  const filteredPool = useMemo(() => {
    let p = engine.pool.filter((x) => !engine.draftedIds.has(x.id))
    if (posFilter !== "ALL") p = p.filter((x) => x.pos === posFilter)
    if (query) {
      const q = query.toLowerCase()
      p = p.filter((x) => x.name.toLowerCase().includes(q) || x.tag.toLowerCase().includes(q))
    }
    return p
      .slice()
      .sort((a, b) => (sortKey === "rank" ? a.rank - b.rank : b[sortKey] - a[sortKey]))
      .slice(0, POOL_LIMIT)
  }, [engine.pool, engine.draftedIds, posFilter, query, sortKey])

  const timerWarn = engine.secondsLeft <= 10
  const onClockTeam = engine.teams[engine.onClock]
  const statCols = showMoney ? STAT_COLS_MONEY : STAT_COLS_SNAKE
  const progress = engine.secondsLeft / Math.max(1, engine.clock)
  const remote = engine.mySeat !== null

  // Money mode is shown grouped by price tier; count how many of each remain for the
  // category dividers. Tier grouping only makes sense while the board is sorted by cost.
  const showTiers = showMoney && sortKey === "cost"
  const tierCounts = new Map<number, number>()
  if (showTiers) for (const x of filteredPool) tierCounts.set(x.cost, (tierCounts.get(x.cost) ?? 0) + 1)

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
            <span className={remote && engine.myTurn ? "text-orange-hd-2" : ""}>
              {remote && engine.myTurn ? "You're on the clock" : "On the clock"}
            </span>
            <b className="mt-0.5 block font-serif text-[20px] font-medium tracking-[-0.01em] text-ink">
              {onClockTeam.name}
            </b>
          </div>

          <div
            className={`relative min-w-[110px] overflow-hidden rounded-lg border border-line bg-panel px-[22px] py-2.5 text-center font-mono text-[32px] font-semibold tracking-[0.04em] text-orange-hd-2 ${
              timerWarn ? "hd-timer-warn" : ""
            }`}
          >
            {formatTime(engine.secondsLeft)}
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-orange-hd-2 transition-transform duration-1000 ease-linear"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            <span>Pick</span>
            <b className="mt-0.5 block font-serif text-[20px] font-medium text-ink">
              R{roundOf(engine.pickIdx)} · #{engine.pickIdx + 1}
            </b>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={engine.cancel}
            className="h-[38px] cursor-pointer rounded-lg border border-line bg-paper px-3.5 font-sans text-[13px] font-medium text-ink-soft hover:border-ink"
          >
            {remote ? "Leave" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={makePick}
            disabled={!engine.ready || !selectedPlayer || !engine.canDraft(selectedPlayer)}
            className="h-[38px] cursor-pointer rounded-lg border-0 bg-orange-hd px-[18px] font-sans text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            {remote && !engine.myTurn ? "Their pick" : "Draft"}
          </button>
        </div>
      </header>

      {engine.banner && (
        <div className="flex items-center gap-2 border-b border-line bg-panel px-7 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-warn">
          <span className="hd-pulse-dot" />
          {engine.banner}
        </div>
      )}

      {/* BODY */}
      <div className="grid flex-1 grid-cols-[280px_1fr_280px] overflow-hidden">
        <TeamRail
          team={engine.teams[0]}
          teamIndex={0}
          showMoney={showMoney}
          budget={engine.budget}
          posReq={engine.posReq}
          rosterMax={engine.rosterMax}
          mode={engine.mode}
          onClock={engine.onClock === 0}
          isYou={engine.mySeat === 0}
          onRename={engine.rename ? (v) => engine.rename?.(0, v) : null}
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
              <option value="rank">Sort · Rank</option>
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
            <span />
          </div>

          <div className="flex-1 overflow-y-auto">
            {!engine.ready && !engine.loadError && (
              <div className="px-7 py-12 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-ink-mute">
                Loading players…
              </div>
            )}
            {engine.loadError && (
              <div className="px-7 py-12 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-warn">
                {engine.loadError}
              </div>
            )}
            {engine.ready &&
              !engine.loadError &&
              filteredPool.map((p, i) => {
                const selected = p.id === selectedId
                const draftable = engine.canDraft(p)
                // In money mode an undraftable row means the on-clock team can't afford it
                // without locking itself out of completing the roster. Only meaningful while
                // this device is allowed to act — on the opponent's turn rows stay neutral.
                const locked = showMoney && engine.myTurn && !draftable
                const newTier = showTiers && (i === 0 || filteredPool[i - 1].cost !== p.cost)
                return (
                  <Fragment key={p.id}>
                    {newTier && (
                      <div className="flex items-center gap-2 border-y border-line bg-paper-2 px-7 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                        <span className="font-semibold text-ok">${p.cost}M</span>
                        <span>tier</span>
                        <span className="ml-auto">{tierCounts.get(p.cost) ?? 0} left</span>
                      </div>
                    )}
                    <div
                      role="button"
                      tabIndex={locked ? -1 : 0}
                      aria-disabled={locked}
                      onClick={() => selectPlayer(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          selectPlayer(p.id)
                        }
                      }}
                      className={`group grid ${statCols} w-full items-center gap-2.5 border-b border-dashed border-line px-7 py-2.5 text-left ${
                        locked
                          ? "cursor-not-allowed opacity-40"
                          : selected
                            ? "cursor-pointer bg-orange-soft"
                            : "cursor-pointer bg-transparent hover:bg-paper-2"
                      }`}
                    >
                    <span className="font-mono text-[11px] text-ink-mute">{i + 1}</span>
                    <span
                      className={`grid size-8 place-items-center rounded-md font-mono text-[12px] font-semibold ${
                        selected ? "bg-orange-hd text-white" : "bg-ink text-paper"
                      }`}
                    >
                      {p.pos}
                    </span>
                    <span>
                      <span className="block font-serif text-[16px] font-medium leading-none tracking-[-0.01em]">
                        {p.name}
                      </span>
                      <span className="mt-[3px] block font-mono text-[10px] tracking-[0.04em] text-ink-mute">
                        {p.tag}
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
                    <button
                      type="button"
                      disabled={!draftable}
                      onClick={(e) => {
                        e.stopPropagation()
                        engine.draftPlayer(p)
                      }}
                      className="invisible cursor-pointer justify-self-end rounded-full bg-orange-hd px-3 py-1.5 font-sans text-[11px] font-semibold tracking-[0.04em] text-white shadow-sm group-hover:visible group-focus-within:visible disabled:cursor-not-allowed disabled:bg-ink-mute"
                    >
                      Draft
                    </button>
                    </div>
                  </Fragment>
                )
              })}
          </div>
        </section>

        <TeamRail
          team={engine.teams[1]}
          teamIndex={1}
          showMoney={showMoney}
          budget={engine.budget}
          posReq={engine.posReq}
          rosterMax={engine.rosterMax}
          mode={engine.mode}
          onClock={engine.onClock === 1}
          isYou={engine.mySeat === 1}
          onRename={engine.rename ? (v) => engine.rename?.(1, v) : null}
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
  isYou: boolean
  onRename: ((name: string) => void) | null
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
  isYou,
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
        <span className="flex items-center gap-2">
          <input
            value={team.name}
            readOnly={!onRename}
            onChange={(e) => onRename?.(e.target.value)}
            className="w-full border-0 bg-transparent p-0 font-serif text-[20px] font-medium tracking-[-0.01em] text-inherit outline-none"
          />
          {isYou && (
            <span className="rounded-full border border-orange-hd px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-orange-hd-2">
              You
            </span>
          )}
        </span>
        <span className="font-mono text-[12px] tracking-[0.06em] text-ink-mute">
          <b className="font-semibold text-ink">{team.picks.length}</b>/{rosterMax}
        </span>
      </div>

      {showMoney && (
        <div className="mb-[18px] rounded-lg border border-line bg-panel p-3.5 text-ink">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Cap left
            </span>
            <span className="font-mono text-[22px] font-semibold text-orange-hd-2">
              ${moneyRemaining}M
            </span>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-[2px] bg-ink/15">
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
                  {pick.pos}
                </div>
                <div>
                  <div className="font-serif text-[14px] font-medium leading-[1.1] tracking-[-0.01em]">
                    {pick.name}
                  </div>
                  {mode === "money" && (
                    <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-ink-mute">
                      ${pick.cost}M
                    </div>
                  )}
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
                  ? "relative isolate before:absolute before:inset-y-0 before:-left-[18px] before:-right-[18px] before:-z-10 before:bg-orange-soft before:content-['']"
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
