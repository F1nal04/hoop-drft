"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { readConfig } from "@/lib/hd-config"
import { MONEY_BUDGET, POSITIONS, buildMoneyPool, loadHDPools } from "@/lib/hd-data"
import { addExclusions } from "@/lib/hd-exclusions"
import { DEFAULT_TEAM_NAMES } from "@/lib/hd-names"
import {
  type RemoteState,
  clearError,
  continueDraft,
  resumeFromSession,
  useRemoteRoom,
} from "@/lib/hd-remote"
import { type DraftResult, type TeamResult, readResult } from "@/lib/hd-results"

const FALLBACK: DraftResult = {
  mode: "snake",
  budget: 100,
  rosterMax: 5,
  teams: [
    { name: DEFAULT_TEAM_NAMES[0], picks: [], spent: 0 },
    { name: DEFAULT_TEAM_NAMES[1], picks: [], spent: 0 },
  ],
  completedAt: 0,
}

export default function ResultsPage() {
  const router = useRouter()
  const remote = useRemoteRoom()
  const [result, setResult] = useState<DraftResult | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [continueError, setContinueError] = useState<string | null>(null)

  useEffect(() => {
    const stored = readResult() ?? FALLBACK
    setResult(stored)
    setHydrated(true)
    if (stored.remote) {
      // Reattach to the (still lingering) room so the host can continue the
      // draft and the guest follows along when they do.
      clearError()
      resumeFromSession()
    }
  }, [])

  // The host continued the draft — the room is live again, get back on the board.
  const remoteResult = result?.remote ?? false
  const code = remote.code
  useEffect(() => {
    if (remoteResult && remote.phase === "drafting" && code) {
      router.push(`/draft?room=${code}`)
    }
  }, [remoteResult, remote.phase, code, router])

  // A rejected continue (room expired, pool empty) re-enables the button.
  useEffect(() => {
    if (remote.error) setContinuing(false)
  }, [remote.error])

  function continueDrafting() {
    if (!result) return
    // Carry the drafted players over as exclusions so the next draft (same
    // hd-config settings) runs on the remaining pool.
    addExclusions(result.teams.flatMap((t) => t.picks.map((p) => p.id)))
    router.push("/draft")
  }

  // Remote variant of "Continue drafting": the host rebuilds the board from
  // the remaining pool (same pipeline as the lobby start) and asks the server
  // to restart the room. Exclusions live in the room, not in hd-exclusions.
  async function continueRemote() {
    if (!result || continuing) return
    setContinuing(true)
    setContinueError(null)
    clearError()
    try {
      const cfg = readConfig()
      const pools = await loadHDPools()
      const base = pools[cfg.dataset] ?? pools.current
      const excluded = new Set([
        ...remote.excluded,
        ...result.teams.flatMap((t) => t.picks.map((p) => p.id)),
      ])
      const rest = base.filter((p) => !excluded.has(p.id))
      const pool = cfg.mode === "money" ? buildMoneyPool(rest) : rest
      continueDraft(
        { mode: cfg.mode, clock: cfg.clock, budget: cfg.mode === "money" ? MONEY_BUDGET : 0 },
        pool,
      )
    } catch (err) {
      setContinueError(err instanceof Error ? err.message : "Failed to load players")
      setContinuing(false)
    }
  }

  function exportTables() {
    if (!result) return
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // One table per team; one column per position; players sorted by rank within a column.
    const tableFor = (team: TeamResult) => {
      const columns = POSITIONS.map((pos) =>
        team.picks
          .filter((p) => p.pos === pos)
          .slice()
          .sort((a, b) => a.rank - b.rank),
      )
      const rowCount = Math.max(0, ...columns.map((c) => c.length))
      const head = POSITIONS.map((pos) => `<th>${pos}</th>`).join("")
      let bodyRows = ""
      for (let r = 0; r < rowCount; r++) {
        const cells = columns
          .map((col) => {
            const p = col[r]
            return `<td>${p ? esc(p.name) : ""}</td>`
          })
          .join("")
        bodyRows += `        <tr>${cells}</tr>\n`
      }
      return (
        `    <h2>${esc(team.name)}</h2>\n` +
        `    <table>\n` +
        `      <thead><tr>${head}</tr></thead>\n` +
        `      <tbody>\n${bodyRows}      </tbody>\n` +
        `    </table>`
      )
    }

    const html =
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n` +
      `<meta charset="UTF-8" />\n<title>Hoop Draft Results</title>\n` +
      `<style>\n` +
      `  body { font-family: sans-serif; padding: 24px; }\n` +
      `  h2 { margin: 28px 0 8px; }\n` +
      `  table { border-collapse: collapse; }\n` +
      `  th, td { border: 1px solid #999; padding: 6px 12px; text-align: left; min-width: 130px; }\n` +
      `  th { background: #eee; }\n` +
      `</style>\n</head>\n<body>\n` +
      `  <h1>Hoop Draft — ${result.mode === "money" ? "Money" : "Snake"} draft</h1>\n` +
      `${result.teams.map(tableFor).join("\n")}\n` +
      `</body>\n</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "hoop-draft.html"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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

        <div className="mt-9 flex justify-center gap-2.5">
          <button
            type="button"
            onClick={exportTables}
            className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
          >
            Export
          </button>
          <Link
            href="/options"
            className="rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink no-underline"
          >
            New draft
          </Link>
          {!result?.remote ? (
            <button
              type="button"
              onClick={continueDrafting}
              disabled={!hydrated || !result}
              className="cursor-pointer rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-35"
            >
              Continue drafting →
            </button>
          ) : remote.phase === "complete" && remote.seat === 0 ? (
            <button
              type="button"
              onClick={continueRemote}
              disabled={!remote.peerConnected || continuing}
              className="cursor-pointer rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-35"
            >
              {continuing ? "Starting…" : "Continue drafting →"}
            </button>
          ) : null}
        </div>

        {hydrated && result?.remote && <RemoteNote remote={remote} continueError={continueError} />}
      </main>
    </div>
  )
}

// One status line under the buttons for the remote continue flow: errors, the
// guest's "the host runs it back" hint, or the host waiting on the guest.
function RemoteNote({ remote, continueError }: { remote: RemoteState; continueError: string | null }) {
  const error = continueError ?? remote.error
  let text: string | null = null
  let warn = false
  if (error) {
    text = error
    warn = true
  } else if (remote.phase === "complete") {
    if (remote.seat === 1) {
      text = `${remote.players[0] ?? "The host"} can continue the draft with the remaining players — stick around.`
    } else if (!remote.peerConnected) {
      text = `${remote.players[1] ?? "Player 2"} disconnected — they need to be back before you can continue.`
    }
  }
  if (!text) return null
  return (
    <p
      className={`mt-5 text-center font-mono text-[11px] uppercase tracking-[0.12em] ${
        warn ? "text-warn" : "text-ink-mute"
      }`}
    >
      {text}
    </p>
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
  const posClasses = side === "t1" ? "bg-orange-hd text-white" : "bg-ink text-paper"
  const sorted = team.picks.slice().sort((a, b) => a.pickNo - b.pickNo)

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center gap-2.5 border-b border-line p-[22px]">
        <span className={`size-2 rounded-full ${dotColor}`} />
        <h2 className="m-0 flex-1 font-serif text-[22px] font-medium tracking-[-0.01em]">
          {team.name}
        </h2>
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
                className={`grid size-8 place-items-center rounded-md font-mono text-[12px] font-semibold ${posClasses}`}
              >
                {row.pos}
              </div>
              <div>
                <div className="font-serif text-[15px] font-medium leading-none tracking-[-0.01em]">
                  {row.name}
                </div>
                <div className="mt-[3px] font-mono text-[10px] tracking-[0.04em] text-ink-mute">
                  #{row.rank} · {row.tag}
                </div>
              </div>
              <div className="text-right font-mono text-[13px] text-ink">
                {mode === "money" ? `$${row.cost}M` : `${row.ppg} PPG`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
