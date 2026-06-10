"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { HDPlayer } from "@/lib/hd-data"
import { leaveRoom, resumeRoom, sendPick, useRemoteRoom } from "@/lib/hd-remote"
import { writeResult } from "@/lib/hd-results"
import { type DraftEngine, posReqFor } from "./engine"

export interface RemoteDraftView {
  engine: DraftEngine | null
  fatal: string | null // the room is gone — show the closed screen
  loading: string // label while connecting / waiting for the first snapshot
}

// Server-driven engine: renders the room snapshots and only ever acts for the
// local seat. The pick clock and timeout autopicks run on the server; the
// countdown here is purely cosmetic, re-anchored on every snapshot.
export function useRemoteDraft(code: string): RemoteDraftView {
  const router = useRouter()
  const remote = useRemoteRoom()
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [resumeFailed, setResumeFailed] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!resumeRoom(code)) setResumeFailed(true)
  }, [code])

  // A stale /draft?room= URL while the room is still in its lobby phase —
  // go back to the lobby UI rather than render an empty board.
  const inLobby = remote.phase === "lobby"
  useEffect(() => {
    if (inLobby) router.replace("/lobby")
  }, [inLobby, router])

  const { snapshot, snapshotAt } = remote
  useEffect(() => {
    if (!snapshot || snapshot.status !== "drafting") return
    const deadline = snapshotAt + snapshot.remainingMs
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [snapshot, snapshotAt])

  useEffect(() => {
    if (remote.phase !== "complete" || !remote.result || completedRef.current) return
    completedRef.current = true
    writeResult(remote.result)
    router.push("/results")
  }, [remote.phase, remote.result, router])

  if (remote.phase === "closed" || resumeFailed) {
    return {
      engine: null,
      fatal: remote.closedMessage ?? "This draft room no longer exists.",
      loading: "",
    }
  }

  const config = remote.config
  const drafting = remote.phase === "drafting" || remote.phase === "complete"
  if (!drafting || !snapshot || !config || remote.pool.length === 0) {
    return {
      engine: null,
      fatal: null,
      loading: remote.reconnecting ? "Reconnecting…" : "Joining draft…",
    }
  }

  const mySeat = remote.seat as 0 | 1
  const myTurn = remote.phase === "drafting" && snapshot.onClock === mySeat
  const draftedIds = new Set(snapshot.teams.flatMap((t) => t.picks.map((p) => p.id)))
  // Same lockout reserve the server uses: the cheapest price on this board.
  const minCost = config.mode === "money" ? Math.min(...remote.pool.map((p) => p.cost)) : 0

  function canDraft(player: HDPlayer): boolean {
    if (!myTurn || !snapshot || !config) return false
    if (draftedIds.has(player.id)) return false
    const team = snapshot.teams[mySeat]
    if (team.picks.length >= snapshot.rosterMax) return false
    if (config.mode === "money") {
      const remaining = config.budget - team.spent
      const slotsAfter = snapshot.rosterMax - team.picks.length - 1
      if (player.cost > remaining) return false
      if (remaining - player.cost < slotsAfter * minCost) return false
    }
    return true
  }

  const opponent = snapshot.teams[(1 - mySeat) as 0 | 1].name
  const banner = remote.reconnecting
    ? "Connection lost — reconnecting…"
    : !remote.peerConnected
      ? `${opponent} disconnected — their picks run on the clock until they return.`
      : null

  return {
    engine: {
      ready: true,
      loadError: null,
      mode: config.mode,
      budget: config.budget,
      clock: config.clock,
      teams: snapshot.teams,
      onClock: snapshot.onClock,
      pickIdx: snapshot.pickIdx,
      rosterMax: snapshot.rosterMax,
      posReq: posReqFor(config.mode),
      secondsLeft,
      pool: remote.pool,
      draftedIds,
      mySeat,
      myTurn,
      banner,
      canDraft,
      draftPlayer: (player) => {
        if (canDraft(player)) sendPick(player.id)
      },
      rename: null, // names are fixed in the lobby for remote drafts
      cancel: () => {
        if (confirm("Leave this draft? The room closes for both players.")) {
          leaveRoom()
          router.push("/")
        }
      },
    },
    fatal: null,
    loading: "",
  }
}
