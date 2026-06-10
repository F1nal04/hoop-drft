# Remote Drafting — Design

**Date:** 2026-06-10
**Goal:** Two people draft against each other over the internet. One person creates a room and gets a short code (nanoid). The other joins with that code. The draft then runs exactly like the local draft, except each person can only draft for their own team. Real-time sync over WebSockets.

## Approaches considered

1. **Custom Node server hosting Next + `ws` on one port** *(chosen)* — a `server.mjs` creates one `http` server, hands normal requests to Next's request handler and routes `Upgrade` requests: `/ws` goes to our `ws` WebSocketServer, everything else to Next's own upgrade handler (`app.getUpgradeHandler()`, needed for dev HMR). Single origin means the share link, the page, and the socket all ride one port — trivial to reverse-proxy with WSS. Cost: Next's docs state custom servers **cannot be combined with `output: "standalone"`**, so the Docker image switches to a full `node_modules` runtime (bigger image, same behavior).
2. **Separate WebSocket process on a second port** — keeps standalone output, but doubles the deploy surface (second exposed port, second TLS/proxy rule, CORS-ish ws URL config). Worse operationally for a VPS app meant to be shared over the internet.
3. **Hosted realtime service (Pusher/Ably/PartyKit)** — no server code, but adds a third-party dependency, API keys, and a network hop to a free-tier service for a self-hosted hobby app. Rejected.

## Architecture

```
Browser A (host)  ──ws──┐
                        ├── server.mjs ── http ── Next app (pages unchanged in spirit)
Browser B (guest) ──ws──┘        │
                          server/rooms.mjs  (authoritative draft state per room)
```

- **Server-authoritative draft.** The room on the server owns the state machine: whose turn, what's drafted, budgets, the pick clock, and timeout autopicks. Clients render snapshots and send pick intents. This makes the two views converge by construction and survives either client refreshing.
- **Host builds the board, server runs the draft.** All player-data logic (dataset selection, money-tier pricing, `buildMoneyPool` randomization) already lives in `lib/hd-data.ts` on the client. The host sends the finished board with `start`; the server treats it as the authoritative pool (validates picks against it, autopicks from it). No duplication of the data pipeline in server code. Trust is fine: this is a two-friend app.
- **Seats.** Host = seat 0 (team 1), guest = seat 1 (team 2). `firstTeam` is randomized server-side at start, alternation logic identical to local (`pickOrder`).
- **Clock.** Server stores a deadline per pick and an `setTimeout` autopick (best available legal player by rank — same rule as local). Snapshots carry `remainingMs`; clients tick down locally from `Date.now() + remainingMs`, so clock skew can't desync anything that matters.

## Protocol (JSON over `/ws`)

Client → server: `create {name}` · `join {code, name}` · `rejoin {code, token}` · `start {config, pool}` (host, both seats present) · `pick {playerId}` (only valid from the on-clock seat) · `leave`

Server → client: `created {code, seat, token}` · `joined {code, seat, token, players, config?}` · `lobby {players}` (presence updates) · `started {pool, state}` · `state {snapshot}` (after every pick) · `complete {result}` · `peer {connected}` (opponent presence during draft) · `error {message}`

Snapshot = `{pickIdx, onClock, remainingMs, teams: [{name, picks, spent}], status}`. The pool is sent once in `started`/`rejoin` replies; `draftedIds` is derived from `teams[].picks`.

**Room codes** are nanoid `customAlphabet` over an unambiguous uppercase set (no 0/O/1/I/L), length 6 — matching the existing lobby mock. **Rejoin tokens** are plain nanoids handed out per seat and kept in `sessionStorage`; a rejoin with a valid token reclaims the seat (kicking a stale socket) and gets a full `started`-equivalent resync. Rooms die when empty for 10 minutes, after completion, or if the host leaves during the lobby phase.

## Client pieces

- **`lib/hd-remote.ts`** — protocol types + a module-singleton connection store (same pattern as `loadHDPools` memoization). Because navigation is client-side, the socket survives `/lobby → /draft`. A tiny external-store hook (`useSyncExternalStore`) exposes connection + room state to pages. On unexpected close during an active draft it auto-reconnects with the stored token.
- **`/lobby` rewrite** — two panels: *Create room* (host: shows code + copy-link, presence, recap of current `hd-config` settings, Start button once the guest arrives) and *Join room* (code input, prefilled from `?code=` in the share link, plus your team name). Team names come from each player's own side (host's `t1` from config; guest types theirs). When `started` arrives, both clients navigate to `/draft?room=CODE`.
- **`/draft` refactor** — split the 650-line page into a presentational `DraftBoard` (header, pool list, team rails, filters/sort/search/selection — all unchanged visually) and two engines feeding it one view-model:
  - `useLocalDraft()` — the existing logic, behavior unchanged.
  - `useRemoteDraft(code)` — state from server snapshots; `canDraft`/`draftPlayer` additionally require `onClock === mySeat`; team renames disabled (names fixed in the lobby); Cancel = leave room; banner line for "opponent disconnected / reconnecting".
  Mode is chosen by the `room` query param (read from `window.location` in the mount effect — the page is already fully client-hydrated, and this avoids the `useSearchParams` Suspense dance).
- **`/results`** — unchanged rendering; remote completions write the same `hd-results` blob with a `remote: true` flag, which hides "Continue drafting" (exclusion carry-over is a local-pool concept; not in scope for v1).

## Deployment changes

- `next.config.mjs`: drop `output: "standalone"` (incompatible with custom servers per Next docs).
- `package.json`: `dev` → `node server.mjs` (Turbopack stays on — it's the default in the programmatic API), `start` → `NODE_ENV=production node server.mjs`; new deps `ws`, `nanoid`.
- `Dockerfile`: runner stage now ships `node_modules` (production install), `.next`, `public`, `next.config.mjs`, `server.mjs`, `server/`. Same single exposed port 3000; WebSocket shares it.

## Error handling

- Server validates every message against room status, seat, and draft rules; invalid intents get `error` and are otherwise ignored (no state change).
- Dead room / bad code / bad token → `error` with a human message; lobby shows it inline, draft page shows a "room is gone" screen with a way home.
- A disconnected player's clock keeps running; the timeout autopick keeps the draft moving. They can rejoin any time before the room expires and get a full resync.
- Malformed frames and oversized payloads (cap ~1 MB, the board is ≪ that) close the offending socket.

## Testing

No test suite exists in this repo. Verification is: `tsc --noEmit`, `eslint .`, `next build`, then a scripted two-browser-context Playwright run through the full happy path (create → join → start → alternating picks with self-only gating → timer autopick → completion → both results pages), plus a refresh-mid-draft rejoin check.
