"use client"

import { useSyncExternalStore } from "react"
import type { DraftMode, HDPlayer } from "./hd-data"
import type { DraftResult, TeamResult } from "./hd-results"

// Client side of the remote draft. One module-level WebSocket + store: because
// navigation is client-side, the connection survives /lobby → /draft. A page
// refresh kills it, so each seat gets a rejoin token (sessionStorage) and the
// server resyncs the full room on `rejoin`.

export interface RemoteConfig {
  mode: DraftMode
  clock: number
  budget: number
}

export interface RemoteSnapshot {
  status: "lobby" | "drafting" | "complete"
  pickIdx: number
  onClock: 0 | 1
  remainingMs: number
  teams: [TeamResult, TeamResult]
  totalPicks: number
  rosterMax: number
}

export type RemotePhase = "idle" | "connecting" | "lobby" | "drafting" | "complete" | "closed"

export interface RemoteState {
  phase: RemotePhase
  code: string | null
  seat: 0 | 1 | null
  players: (string | null)[]
  config: RemoteConfig | null
  pool: HDPlayer[]
  snapshot: RemoteSnapshot | null
  snapshotAt: number // Date.now() when the snapshot arrived — anchors the local countdown
  result: DraftResult | null
  peerConnected: boolean
  reconnecting: boolean
  error: string | null // transient (bad code, invalid pick, …)
  closedMessage: string | null // terminal: the room is gone
}

const IDLE: RemoteState = {
  phase: "idle",
  code: null,
  seat: null,
  players: [null, null],
  config: null,
  pool: [],
  snapshot: null,
  snapshotAt: 0,
  result: null,
  peerConnected: true,
  reconnecting: false,
  error: null,
  closedMessage: null,
}

const SESSION_KEY = "hd-remote-session"
const RECONNECT_DELAY_MS = 2000
const MAX_REJOIN_ATTEMPTS = 30

interface StoredSession {
  code: string
  token: string
  seat: 0 | 1
}

let state: RemoteState = IDLE
let socket: WebSocket | null = null
let connectPromise: Promise<WebSocket> | null = null
let deliberateClose = false
let rejoinAttempts = 0
let rejoinTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function setState(patch: Partial<RemoteState>) {
  state = { ...state, ...patch }
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useRemoteRoom(): RemoteState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => IDLE,
  )
}

function readSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (typeof s.code !== "string" || typeof s.token !== "string") return null
    return s as StoredSession
  } catch {
    return null
  }
}

function writeSession(session: StoredSession | null) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function ensureSocket(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) return Promise.resolve(socket)
  if (connectPromise) return connectPromise
  deliberateClose = false
  connectPromise = new Promise((resolve, reject) => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`)
    ws.onopen = () => {
      socket = ws
      connectPromise = null
      resolve(ws)
    }
    ws.onerror = () => {
      if (socket !== ws) {
        connectPromise = null
        reject(new Error("Connection failed"))
      }
    }
    ws.onclose = () => {
      if (socket === ws) socket = null
      connectPromise = null
      handleClose()
    }
    ws.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data))
      } catch {
        /* ignore malformed frames */
      }
    }
  })
  return connectPromise
}

function sendMsg(msg: Record<string, unknown>) {
  void ensureSocket()
    .then((ws) => ws.send(JSON.stringify(msg)))
    .catch(() => setState({ error: "Can't reach the server." }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleMessage(msg: any) {
  switch (msg.type) {
    case "created":
    case "joined":
      writeSession({ code: msg.code, token: msg.token, seat: msg.seat })
      setState({
        phase: "lobby",
        code: msg.code,
        seat: msg.seat,
        players: msg.players,
        error: null,
        closedMessage: null,
        reconnecting: false,
      })
      break
    case "lobby":
      setState({ phase: "lobby", players: msg.players })
      break
    case "started":
      setState({
        phase: "drafting",
        config: msg.config,
        pool: msg.pool,
        snapshot: msg.state,
        snapshotAt: Date.now(),
        peerConnected: true,
        error: null,
      })
      break
    case "state":
      setState({ snapshot: msg.state, snapshotAt: Date.now() })
      break
    case "complete":
      // Keep the last snapshot so the board stays painted until navigation.
      setState({ phase: "complete", result: msg.result })
      break
    case "peer":
      setState({ peerConnected: msg.connected, players: msg.players ?? state.players })
      break
    case "rejoined":
      rejoinAttempts = 0
      setState({
        phase: msg.status === "complete" ? "complete" : msg.status === "drafting" ? "drafting" : "lobby",
        code: msg.code,
        seat: msg.seat,
        players: msg.players,
        config: msg.config,
        pool: msg.pool ?? [],
        snapshot: msg.state,
        snapshotAt: Date.now(),
        result: msg.result,
        peerConnected: true,
        reconnecting: false,
        error: null,
        closedMessage: null,
      })
      break
    case "room_closed":
      writeSession(null)
      stopRejoining()
      setState({ phase: "closed", closedMessage: msg.message, reconnecting: false, snapshot: null })
      break
    case "error":
      setState({ error: msg.message })
      break
  }
}

function stopRejoining() {
  if (rejoinTimer) clearTimeout(rejoinTimer)
  rejoinTimer = null
  rejoinAttempts = 0
}

function handleClose() {
  if (deliberateClose) return
  const active = state.phase === "lobby" || state.phase === "drafting"
  const session = readSession()
  if (!active || !session) return
  setState({ reconnecting: true })
  scheduleRejoin(session)
}

function scheduleRejoin(session: StoredSession) {
  if (rejoinTimer) return
  rejoinTimer = setTimeout(() => {
    rejoinTimer = null
    rejoinAttempts += 1
    if (rejoinAttempts > MAX_REJOIN_ATTEMPTS) {
      setState({
        phase: "closed",
        closedMessage: "Lost the connection to the draft server.",
        reconnecting: false,
      })
      return
    }
    ensureSocket()
      .then((ws) => ws.send(JSON.stringify({ type: "rejoin", code: session.code, token: session.token })))
      .catch(() => scheduleRejoin(session))
  }, RECONNECT_DELAY_MS)
}

export function createRoom(name: string) {
  setState({ ...IDLE, phase: "connecting" })
  sendMsg({ type: "create", name })
}

export function joinRoom(code: string, name: string) {
  setState({ ...IDLE, phase: "connecting" })
  sendMsg({ type: "join", code, name })
}

export function startDraft(config: RemoteConfig, pool: HDPlayer[]) {
  sendMsg({ type: "start", config, pool })
}

export function sendPick(playerId: string) {
  sendMsg({ type: "pick", playerId })
}

export function leaveRoom() {
  deliberateClose = true
  stopRejoining()
  writeSession(null)
  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "leave" }))
    }
    socket.close() // legal even while CONNECTING — don't orphan the socket
  }
  socket = null
  state = IDLE
  for (const fn of listeners) fn()
}

export function clearError() {
  if (state.error) setState({ error: null })
}

export function resetRemote() {
  stopRejoining()
  state = IDLE
  for (const fn of listeners) fn()
}

// Draft page mount / page refresh: make sure we're attached to `code`.
// Returns false when there is no way back into that room.
export function resumeRoom(code: string): boolean {
  if (state.code === code && state.phase !== "idle" && state.phase !== "closed") {
    return true
  }
  const session = readSession()
  if (!session || session.code !== code) return false
  setState({ ...IDLE, phase: "connecting", code, seat: session.seat, reconnecting: true })
  sendMsg({ type: "rejoin", code: session.code, token: session.token })
  return true
}
