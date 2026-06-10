"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { readConfig } from "@/lib/hd-config"
import { MONEY_BUDGET, buildMoneyPool, loadHDPools } from "@/lib/hd-data"
import { clearError, createRoom, joinRoom, leaveRoom, startDraft, useRemoteRoom } from "@/lib/hd-remote"

const ORANGE_INDICES = new Set([1, 4])

const DATASET_LABEL = { current: "Current", historical: "Historical", mixed: "Mixed" } as const

export default function LobbyPage() {
  const router = useRouter()
  const remote = useRemoteRoom()

  const [hydrated, setHydrated] = useState(false)
  const [hostName, setHostName] = useState("")
  const [joinName, setJoinName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [recap, setRecap] = useState("")
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  useEffect(() => {
    const cfg = readConfig()
    setHostName(cfg.t1)
    setJoinName(cfg.t2)
    setRecap(
      `${DATASET_LABEL[cfg.dataset]} · ${cfg.mode === "snake" ? "Snake · 10 picks each" : `Money · 5 picks · $${MONEY_BUDGET}M cap`}`,
    )
    // Share links land here as /lobby?code=XXXXXX
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) setJoinCode(code.toUpperCase())
    setHydrated(true)
  }, [])

  const code = remote.code
  useEffect(() => {
    if (remote.phase === "drafting" && code) {
      router.push(`/draft?room=${code}`)
    }
  }, [remote.phase, code, router])

  // A failed start (server rejected, players.json missing) re-enables the button.
  useEffect(() => {
    if (remote.error) setStarting(false)
  }, [remote.error])

  async function handleStart() {
    if (starting) return
    setStarting(true)
    setStartError(null)
    clearError()
    try {
      const cfg = readConfig()
      const pools = await loadHDPools()
      const base = pools[cfg.dataset] ?? pools.current
      // Same board the local draft would build — money mode fixes its curated
      // 50-player board here, so both players see the identical pool.
      const pool = cfg.mode === "money" ? buildMoneyPool(base) : base
      startDraft(
        { mode: cfg.mode, clock: cfg.clock, budget: cfg.mode === "money" ? MONEY_BUDGET : 0 },
        pool,
      )
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to load players")
      setStarting(false)
    }
  }

  function handleLeave() {
    leaveRoom()
  }

  // A failed create/join (server unreachable, bad code) drops back to the form.
  const inRoom = remote.phase === "lobby" || (remote.phase === "connecting" && !remote.error)

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
          ← Back
        </Link>
      </header>

      <main className="grid flex-1 place-items-center px-12 pb-12">
        {!hydrated ? null : !inRoom ? (
          <SetupView
            hostName={hostName}
            joinName={joinName}
            joinCode={joinCode}
            error={remote.error ?? remote.closedMessage}
            onHostName={setHostName}
            onJoinName={setJoinName}
            onJoinCode={(v) => setJoinCode(v.toUpperCase())}
            onCreate={() => createRoom(hostName)}
            onJoin={() => joinRoom(joinCode, joinName)}
          />
        ) : remote.phase === "connecting" || !remote.code ? (
          <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mute">
            <span className="hd-pulse-dot" />
            Connecting…
          </div>
        ) : remote.seat === 0 ? (
          <HostRoomView
            code={remote.code}
            guestName={remote.players[1]}
            recap={recap}
            starting={starting}
            error={startError ?? remote.error}
            onStart={handleStart}
            onLeave={handleLeave}
          />
        ) : (
          <GuestRoomView code={remote.code} hostName={remote.players[0]} onLeave={handleLeave} />
        )}
      </main>
    </div>
  )
}

function ErrorLine({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.1em] text-warn">{message}</p>
  )
}

interface SetupViewProps {
  hostName: string
  joinName: string
  joinCode: string
  error: string | null | undefined
  onHostName: (v: string) => void
  onJoinName: (v: string) => void
  onJoinCode: (v: string) => void
  onCreate: () => void
  onJoin: () => void
}

function SetupView({
  hostName,
  joinName,
  joinCode,
  error,
  onHostName,
  onJoinName,
  onJoinCode,
  onCreate,
  onJoin,
}: SetupViewProps) {
  const fieldLabel = "mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute"
  const fieldInput =
    "w-full border-0 border-b-[1.5px] border-line bg-transparent px-0 pb-2 pt-1 font-serif text-[22px] font-medium tracking-[-0.01em] text-ink outline-none focus:border-orange-hd"
  return (
    <div className="w-full max-w-[760px] text-center">
      <h1 className="m-0 mb-3 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
        Draft from anywhere.
      </h1>
      <p className="mb-9 text-[15px] text-ink-mute">
        Start a room and send the code, or punch in the one you got.
      </p>
      <ErrorLine message={error} />

      <div className="grid grid-cols-2 gap-3.5 text-left">
        <section className="rounded-xl border border-line bg-paper p-[26px]">
          <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            New room
          </div>
          <label className={fieldLabel}>
            Your team
            <input
              value={hostName}
              onChange={(e) => onHostName(e.target.value)}
              maxLength={22}
              className={fieldInput}
            />
          </label>
          <button
            type="button"
            onClick={onCreate}
            className="mt-7 w-full cursor-pointer rounded-lg border-0 bg-ink px-[18px] py-3.5 font-sans text-[14px] font-semibold text-paper hover:bg-[#e6d3b0]"
          >
            Create room →
          </button>
        </section>

        <section className="rounded-xl border border-line bg-paper p-[26px]">
          <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            Have a code?
          </div>
          <label className={fieldLabel}>
            Room code
            <input
              value={joinCode}
              onChange={(e) => onJoinCode(e.target.value)}
              maxLength={6}
              placeholder="R7KP3Q"
              className={`${fieldInput} font-mono uppercase tracking-[0.3em]`}
            />
          </label>
          <label className={`${fieldLabel} mt-5`}>
            Your team
            <input
              value={joinName}
              onChange={(e) => onJoinName(e.target.value)}
              maxLength={22}
              className={fieldInput}
            />
          </label>
          <button
            type="button"
            onClick={onJoin}
            disabled={joinCode.trim().length < 6}
            className="mt-7 w-full cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3.5 font-sans text-[14px] font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            Join room →
          </button>
        </section>
      </div>
    </div>
  )
}

interface HostRoomViewProps {
  code: string
  guestName: string | null
  recap: string
  starting: boolean
  error: string | null | undefined
  onStart: () => void
  onLeave: () => void
}

function HostRoomView({ code, guestName, recap, starting, error, onStart, onLeave }: HostRoomViewProps) {
  const [copied, setCopied] = useState(false)
  const ready = Boolean(guestName)

  function copy() {
    const link = `${window.location.origin}/lobby?code=${code}`
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className="w-full max-w-[520px] text-center">
      <h1 className="m-0 mb-3 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
        Share the code.
      </h1>
      <p className="mb-9 text-[15px] text-ink-mute">
        Send it to a friend. They join, you start drafting.
      </p>
      <ErrorLine message={error} />

      <div className="mb-9 flex justify-center gap-2">
        {code.split("").map((ch, i) => (
          <span
            key={i}
            className={
              ORANGE_INDICES.has(i)
                ? "grid h-[70px] w-[56px] place-items-center rounded-[10px] border border-orange-hd bg-orange-hd font-mono text-[32px] font-semibold text-white"
                : "grid h-[70px] w-[56px] place-items-center rounded-[10px] border border-line bg-paper font-mono text-[32px] font-semibold"
            }
          >
            {ch}
          </span>
        ))}
      </div>

      <div className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ok">
        <span className="hd-pulse-dot" />
        {ready ? `${guestName} is in` : "Waiting for player 2"}
      </div>

      <p className="mb-7 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute">
        {recap} ·{" "}
        <Link href="/options" className="text-ink-soft underline hover:text-ink">
          change
        </Link>
      </p>

      <div className="flex justify-center gap-2.5">
        <button
          type="button"
          onClick={onLeave}
          className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
        >
          Close room
        </button>
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={!ready || starting}
          className="cursor-pointer rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-35"
        >
          {starting ? "Starting…" : "Start draft →"}
        </button>
      </div>
    </div>
  )
}

function GuestRoomView({
  code,
  hostName,
  onLeave,
}: {
  code: string
  hostName: string | null
  onLeave: () => void
}) {
  return (
    <div className="w-full max-w-[520px] text-center">
      <h1 className="m-0 mb-3 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
        You&apos;re in.
      </h1>
      <p className="mb-9 text-[15px] text-ink-mute">
        Room <b className="font-mono font-semibold text-ink">{code}</b> · hosted by{" "}
        {hostName ?? "player 1"}
      </p>

      <div className="mb-9 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ok">
        <span className="hd-pulse-dot" />
        Waiting for {hostName ?? "the host"} to start
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onLeave}
          className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
        >
          Leave room
        </button>
      </div>
    </div>
  )
}
