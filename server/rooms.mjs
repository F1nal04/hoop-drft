// Remote-draft room server. Attached to the `ws` WebSocketServer created in
// server.mjs; everything here is plain Node ESM because the custom server does
// not run through the Next.js compiler.
//
// The server is authoritative for the draft: it owns turn order, the pick
// clock, timeout autopicks, and all rule validation. Clients only send
// intents. The draft *board* (player pool) is built by the host client with
// the existing lib/hd-data.ts pipeline and sent with `start` — the server
// validates and snapshots it, so the data logic is never duplicated here.

import { customAlphabet, nanoid } from "nanoid"

// No 0/O/1/I/L — codes get read out loud and retyped.
const makeCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6)

const POSITIONS = new Set(["PG", "SG", "SF", "PF", "C"])
const MAX_ROOMS = 100
const MAX_POOL = 3000
const NAME_MAX = 22
const COMPLETE_TTL_MS = 5 * 60 * 1000 // room lingers so a dropped client can fetch the result
const EMPTY_TTL_MS = 10 * 60 * 1000 // both players gone (refresh, crash) — keep the seat warm
const LOBBY_GRACE_MS = 60 * 1000 // host socket dropped in the lobby (refresh) — allow rejoin

/** @type {Map<string, Room>} */
const rooms = new Map()

function cleanName(value, fallback) {
  if (typeof value !== "string") return fallback
  const name = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, NAME_MAX)
  return name || fallback
}

function send(ws, msg) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
}

function broadcast(room, msg) {
  for (const seat of room.seats) if (seat) send(seat.ws, msg)
}

function playerNames(room) {
  return room.seats.map((s) => (s ? s.name : null))
}

function onClockSeat(room) {
  // Identical to pickOrder() in app/draft: strict alternation from firstTeam.
  return room.pickIdx % 2 === 0 ? room.firstTeam : 1 - room.firstTeam
}

function snapshot(room) {
  return {
    status: room.status,
    pickIdx: room.pickIdx,
    onClock: onClockSeat(room),
    remainingMs: room.deadline ? Math.max(0, room.deadline - Date.now()) : 0,
    teams: room.teams,
    totalPicks: room.totalPicks,
    rosterMax: room.rosterMax,
  }
}

function canDraft(room, seat, player) {
  if (room.status !== "drafting") return false
  if (onClockSeat(room) !== seat) return false
  if (room.drafted.has(player.id)) return false
  const team = room.teams[seat]
  if (team.picks.length >= room.rosterMax) return false
  if (room.config.mode === "money") {
    // Lockout rule, mirrored from the local engine: never spend so much that
    // the remaining slots can't be filled at the board's minimum price.
    const remaining = room.config.budget - team.spent
    const slotsAfter = room.rosterMax - team.picks.length - 1
    if (player.cost > remaining) return false
    if (remaining - player.cost < slotsAfter * room.minCost) return false
  }
  return true
}

function schedulePick(room) {
  clearTimeout(room.timer)
  room.deadline = Date.now() + room.config.clock * 1000
  room.timer = setTimeout(() => autopick(room), room.config.clock * 1000)
}

function autopick(room) {
  if (room.status !== "drafting") return
  const seat = onClockSeat(room)
  const best = room.pool
    .filter((p) => !room.drafted.has(p.id) && canDraft(room, seat, p))
    .sort((a, b) => a.rank - b.rank)[0]
  applyPick(room, best ?? null)
}

function applyPick(room, player) {
  clearTimeout(room.timer)
  room.timer = null
  const seat = onClockSeat(room)
  if (player) {
    const team = room.teams[seat]
    team.picks.push({ ...player, pickNo: room.pickIdx + 1 })
    if (room.config.mode === "money") team.spent += player.cost
    room.drafted.add(player.id)
  }
  room.pickIdx += 1
  if (room.pickIdx >= room.totalPicks) {
    completeDraft(room)
  } else {
    schedulePick(room)
    broadcast(room, { type: "state", state: snapshot(room) })
  }
}

function completeDraft(room) {
  room.status = "complete"
  room.deadline = null
  room.result = {
    mode: room.config.mode,
    budget: room.config.budget,
    rosterMax: room.rosterMax,
    teams: room.teams,
    completedAt: Date.now(),
    remote: true,
  }
  broadcast(room, { type: "complete", result: room.result })
  room.completeTimer = setTimeout(() => destroyRoom(room, null), COMPLETE_TTL_MS)
}

function destroyRoom(room, closed) {
  clearTimeout(room.timer)
  clearTimeout(room.completeTimer)
  clearTimeout(room.emptyTimer)
  rooms.delete(room.code)
  for (const seat of room.seats) {
    if (!seat) continue
    if (closed) send(seat.ws, { type: "room_closed", reason: closed.reason, message: closed.message })
    if (seat.ws) seat.ws.room = null
  }
}

function detach(ws) {
  const room = ws.room
  ws.room = null
  if (!room || !rooms.has(room.code)) return null
  const seatIdx = room.seats.findIndex((s) => s && s.ws === ws)
  if (seatIdx === -1) return null
  return { room, seatIdx }
}

// A socket vanished (close event) — could be a refresh, a network blip, or a
// real exit. Keep the seat reclaimable by token; only lobby rooms react hard.
function handleDisconnect(ws) {
  const found = detach(ws)
  if (!found) return
  const { room, seatIdx } = found
  const seat = room.seats[seatIdx]
  seat.ws = null
  seat.connected = false

  if (room.status === "lobby") {
    if (seatIdx === 0) {
      // Likely a page refresh — hold the room briefly so the host can rejoin.
      clearTimeout(room.emptyTimer)
      room.emptyTimer = setTimeout(
        () => destroyRoom(room, { reason: "HOST_LEFT", message: "The host left the lobby." }),
        LOBBY_GRACE_MS,
      )
    } else {
      room.seats[1] = null
      broadcast(room, { type: "lobby", players: playerNames(room) })
    }
    return
  }

  broadcast(room, { type: "peer", connected: false })
  if (room.seats.every((s) => !s || !s.connected)) {
    clearTimeout(room.emptyTimer)
    room.emptyTimer = setTimeout(
      () => destroyRoom(room, null),
      room.status === "complete" ? 0 : EMPTY_TTL_MS,
    )
  }
}

// An explicit "leave" is stronger than a disconnect: in the lobby it frees the
// seat, mid-draft it ends the room for both players.
function handleLeave(ws) {
  const found = detach(ws)
  if (!found) return
  const { room, seatIdx } = found
  if (room.status === "lobby") {
    if (seatIdx === 0) {
      destroyRoom(room, { reason: "HOST_LEFT", message: "The host closed the room." })
    } else {
      room.seats[1] = null
      broadcast(room, { type: "lobby", players: playerNames(room) })
    }
    return
  }
  if (room.status === "drafting") {
    const name = room.seats[seatIdx].name
    room.seats[seatIdx] = null
    destroyRoom(room, { reason: "PEER_LEFT", message: `${name} left the draft.` })
    return
  }
  // complete: nothing to do, the room is already winding down
  room.seats[seatIdx].ws = null
  room.seats[seatIdx].connected = false
}

function handleCreate(ws, msg) {
  if (ws.room) handleLeave(ws)
  if (rooms.size >= MAX_ROOMS) {
    send(ws, { type: "error", message: "Server is full — try again later." })
    return
  }
  let code = makeCode()
  while (rooms.has(code)) code = makeCode()
  const room = {
    code,
    status: "lobby",
    seats: [
      { token: nanoid(), name: cleanName(msg.name, "Alley-Oop Club"), ws, connected: true },
      null,
    ],
    config: null,
    pool: [],
    poolById: new Map(),
    drafted: new Set(),
    minCost: 1,
    firstTeam: 0,
    pickIdx: 0,
    totalPicks: 0,
    rosterMax: 0,
    teams: null,
    deadline: null,
    timer: null,
    completeTimer: null,
    emptyTimer: null,
    result: null,
  }
  rooms.set(code, room)
  ws.room = room
  send(ws, { type: "created", code, seat: 0, token: room.seats[0].token, players: playerNames(room) })
}

function handleJoin(ws, msg) {
  if (ws.room) handleLeave(ws)
  const code = typeof msg.code === "string" ? msg.code.trim().toUpperCase() : ""
  const room = rooms.get(code)
  if (!room) {
    send(ws, { type: "error", message: "Room not found — check the code." })
    return
  }
  if (room.status !== "lobby") {
    send(ws, { type: "error", message: "That draft has already started." })
    return
  }
  if (room.seats[1] && room.seats[1].connected) {
    send(ws, { type: "error", message: "Room is full." })
    return
  }
  room.seats[1] = { token: nanoid(), name: cleanName(msg.name, "Hardwood Court"), ws, connected: true }
  ws.room = room
  send(ws, { type: "joined", code, seat: 1, token: room.seats[1].token, players: playerNames(room) })
  send(room.seats[0].ws, { type: "lobby", players: playerNames(room) })
}

function handleRejoin(ws, msg) {
  if (ws.room) handleLeave(ws)
  const code = typeof msg.code === "string" ? msg.code.trim().toUpperCase() : ""
  const room = rooms.get(code)
  const seatIdx = room ? room.seats.findIndex((s) => s && s.token === msg.token) : -1
  if (!room || seatIdx === -1) {
    send(ws, { type: "room_closed", reason: "ROOM_GONE", message: "This draft room no longer exists." })
    return
  }
  const seat = room.seats[seatIdx]
  if (seat.ws && seat.ws !== ws) {
    seat.ws.room = null
    seat.ws.close()
  }
  seat.ws = ws
  seat.connected = true
  ws.room = room
  clearTimeout(room.emptyTimer)
  room.emptyTimer = null
  send(ws, {
    type: "rejoined",
    code,
    seat: seatIdx,
    status: room.status,
    players: playerNames(room),
    config: room.config,
    pool: room.status === "lobby" ? null : room.pool,
    state: room.status === "lobby" ? null : snapshot(room),
    result: room.result,
  })
  const other = room.seats[1 - seatIdx]
  if (other) send(other.ws, { type: room.status === "lobby" ? "lobby" : "peer", players: playerNames(room), connected: true })
}

function sanitizeConfig(config) {
  if (!config || typeof config !== "object") return null
  const mode = config.mode === "money" ? "money" : config.mode === "snake" ? "snake" : null
  const clock = Number(config.clock)
  const budget = Number(config.budget)
  if (!mode || !Number.isFinite(clock) || clock < 5 || clock > 600) return null
  if (mode === "money" && (!Number.isFinite(budget) || budget <= 0)) return null
  return { mode, clock: Math.round(clock), budget: mode === "money" ? budget : 0 }
}

function sanitizePool(pool) {
  if (!Array.isArray(pool) || pool.length === 0 || pool.length > MAX_POOL) return null
  const byId = new Map()
  for (const raw of pool) {
    if (!raw || typeof raw !== "object") return null
    const p = {
      id: typeof raw.id === "string" ? raw.id.slice(0, 64) : null,
      name: typeof raw.name === "string" ? raw.name.slice(0, 80) : null,
      tag: typeof raw.tag === "string" ? raw.tag.slice(0, 24) : "",
      pos: POSITIONS.has(raw.pos) ? raw.pos : null,
      ppg: Number(raw.ppg),
      rpg: Number(raw.rpg),
      apg: Number(raw.apg),
      bpg: Number(raw.bpg),
      cost: Number(raw.cost),
      rank: Number(raw.rank),
      era: raw.era === "historical" ? "historical" : "current",
    }
    if (!p.id || !p.name || !p.pos) return null
    if (![p.ppg, p.rpg, p.apg, p.bpg, p.cost, p.rank].every(Number.isFinite)) return null
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  return byId
}

function handleStart(ws, msg) {
  const room = ws.room
  if (!room || room.status !== "lobby") return
  if (room.seats[0]?.ws !== ws) {
    send(ws, { type: "error", message: "Only the host can start the draft." })
    return
  }
  if (!room.seats[1] || !room.seats[1].connected) {
    send(ws, { type: "error", message: "Waiting for player 2 to join." })
    return
  }
  const config = sanitizeConfig(msg.config)
  const poolById = sanitizePool(msg.pool)
  if (!config || !poolById) {
    send(ws, { type: "error", message: "Invalid draft setup." })
    return
  }
  const pool = [...poolById.values()]
  const rosterMax = config.mode === "snake" ? 10 : 5
  if (config.mode === "money") {
    const minCost = Math.min(...pool.map((p) => p.cost))
    if (config.budget < rosterMax * minCost) {
      send(ws, { type: "error", message: "Invalid draft setup." })
      return
    }
    room.minCost = minCost
  }
  room.config = config
  room.pool = pool
  room.poolById = poolById
  room.drafted = new Set()
  room.rosterMax = rosterMax
  room.totalPicks = rosterMax * 2
  room.pickIdx = 0
  room.firstTeam = Math.random() < 0.5 ? 0 : 1
  room.teams = [
    { name: room.seats[0].name, picks: [], spent: 0 },
    { name: room.seats[1].name, picks: [], spent: 0 },
  ]
  room.status = "drafting"
  schedulePick(room)
  broadcast(room, { type: "started", config, pool, state: snapshot(room) })
}

function handlePick(ws, msg) {
  const room = ws.room
  if (!room || room.status !== "drafting") return
  const seatIdx = room.seats.findIndex((s) => s && s.ws === ws)
  if (seatIdx === -1) return
  const player = typeof msg.playerId === "string" ? room.poolById.get(msg.playerId) : null
  if (!player || !canDraft(room, seatIdx, player)) {
    send(ws, { type: "error", message: "That pick isn't available." })
    return
  }
  applyPick(room, player)
}

const HANDLERS = {
  create: handleCreate,
  join: handleJoin,
  rejoin: handleRejoin,
  start: handleStart,
  pick: handlePick,
  leave: (ws) => handleLeave(ws),
}

export function attachRoomServer(wss) {
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate()
        continue
      }
      ws.isAlive = false
      ws.ping()
    }
  }, 30_000)
  wss.on("close", () => clearInterval(heartbeat))

  wss.on("connection", (ws) => {
    ws.isAlive = true
    ws.room = null
    ws.on("pong", () => {
      ws.isAlive = true
    })
    ws.on("error", () => ws.terminate())
    ws.on("close", () => handleDisconnect(ws))
    ws.on("message", (data) => {
      let msg
      try {
        msg = JSON.parse(data.toString())
      } catch {
        ws.terminate()
        return
      }
      const handler = msg && typeof msg.type === "string" ? HANDLERS[msg.type] : null
      if (handler) handler(ws, msg)
    })
  })
}
