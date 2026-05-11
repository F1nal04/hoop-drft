"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { type DraftResult, type TeamResult, gradeFor, readResult } from "@/lib/hd-results"

const FALLBACK: DraftResult = {
  mode: "snake",
  budget: 100,
  rosterMax: 5,
  teams: [
    { name: "Alley-Oop Club", picks: [], spent: 0 },
    { name: "Hardwood Court", picks: [], spent: 0 },
  ],
  completedAt: 0,
}

export default function ResultsPage() {
  const [result, setResult] = useState<DraftResult | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setResult(readResult() ?? FALLBACK)
    setHydrated(true)
  }, [])

  function copyExport() {
    if (!result) return
    const lines: string[] = []
    lines.push(`Hoop Draft — ${result.mode === "money" ? "Money" : "Snake"} draft`)
    result.teams.forEach((team) => {
      lines.push("")
      lines.push(`${team.name} (${gradeFor(team)})`)
      team.picks
        .slice()
        .sort((a, b) => a.pickNo - b.pickNo)
        .forEach((p) => {
          const tail = result.mode === "money" ? `$${p.cost}M` : `${p.ovr} OVR`
          lines.push(`  P${String(p.pickNo).padStart(2, "0")} · #${p.num} ${p.name} · ${p.pos} · ${tail}`)
        })
    })
    navigator.clipboard?.writeText(lines.join("\n"))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center gap-3 font-serif text-[20px] font-medium">
          <span className="hd-mark size-[22px]" />
          <span>Hoop Draft</span>
        </div>
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute no-underline hover:text-ink"
        >
          ↺ New draft
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-12 pb-20 pt-8">
        <h1 className="m-0 mb-10 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
          Draft complete.
        </h1>

        {hydrated && result && (
          <section className="grid grid-cols-2 gap-3.5">
            {result.teams.map((team, idx) => (
              <RosterCard key={idx} team={team} side={idx === 0 ? "t1" : "t2"} mode={result.mode} />
            ))}
          </section>
        )}

        <div className="mt-9 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={copyExport}
            className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
          >
            Export
          </button>
          <Link
            href="/options"
            className="rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper no-underline"
          >
            New draft →
          </Link>
        </div>
      </main>
    </div>
  )
}

function RosterCard({
  team,
  side,
  mode,
}: {
  team: TeamResult
  side: "t1" | "t2"
  mode: "snake" | "money"
}) {
  const dotColor = side === "t1" ? "bg-orange-hd" : "bg-ink"
  const jerseyClasses = side === "t1" ? "bg-orange-hd text-white" : "bg-ink text-paper"
  const sorted = team.picks.slice().sort((a, b) => a.pickNo - b.pickNo)

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center gap-2.5 border-b border-line p-[22px]">
        <span className={`size-2 rounded-full ${dotColor}`} />
        <h2 className="m-0 flex-1 font-serif text-[22px] font-medium tracking-[-0.01em]">
          {team.name}
        </h2>
        <span className="font-serif text-[28px] font-medium leading-none text-orange-hd">
          {gradeFor(team)}
        </span>
      </div>
      <div className="py-1">
        {sorted.length === 0 ? (
          <div className="px-[22px] py-8 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">
            No picks yet
          </div>
        ) : (
          sorted.map((row) => (
            <div
              key={row.pickNo}
              className="grid grid-cols-[32px_36px_1fr_60px] items-center gap-3 border-b border-dashed border-line px-[22px] py-3 last:border-b-0"
            >
              <div className="font-mono text-[11px] text-ink-mute">
                P{String(row.pickNo).padStart(2, "0")}
              </div>
              <div
                className={`grid size-8 place-items-center rounded-md font-mono text-[12px] font-semibold ${jerseyClasses}`}
              >
                {row.num}
              </div>
              <div>
                <div className="font-serif text-[15px] font-medium leading-none tracking-[-0.01em]">
                  {row.name}
                </div>
                <div className="mt-[3px] font-mono text-[10px] tracking-[0.04em] text-ink-mute">
                  {row.pos} · {row.tag}
                </div>
              </div>
              <div className="text-right font-mono text-[13px] text-ink">
                {mode === "money" ? `$${row.cost}M` : row.ovr}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
