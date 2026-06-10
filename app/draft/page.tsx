"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { DraftBoard } from "./draft-board"
import { useLocalDraft } from "./use-local-draft"
import { useRemoteDraft } from "./use-remote-draft"

// /draft        → local hot-seat draft (unchanged behavior)
// /draft?room=X → remote draft, state driven by the room server over /ws
export default function DraftPage() {
  const [room, setRoom] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    // The page is fully client-driven (localStorage / WebSocket), so the query
    // param is read on mount rather than through useSearchParams + Suspense.
    setRoom(new URLSearchParams(window.location.search).get("room"))
  }, [])

  if (room === undefined) return null
  return room ? <RemoteDraft code={room} /> : <LocalDraft />
}

function LocalDraft() {
  const engine = useLocalDraft()
  return <DraftBoard engine={engine} />
}

function RemoteDraft({ code }: { code: string }) {
  const { engine, fatal, loading } = useRemoteDraft(code)

  if (fatal) {
    return (
      <CenterScreen>
        <h1 className="m-0 mb-3 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
          Room closed.
        </h1>
        <p className="mb-9 text-[15px] text-ink-mute">{fatal}</p>
        <Link
          href="/"
          className="rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper no-underline"
        >
          Back home
        </Link>
      </CenterScreen>
    )
  }

  if (!engine) {
    return (
      <CenterScreen>
        <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mute">
          <span className="hd-pulse-dot" />
          {loading}
        </div>
      </CenterScreen>
    )
  }

  return <DraftBoard engine={engine} />
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-12">
      <div className="w-full max-w-[520px] text-center">{children}</div>
    </div>
  )
}
