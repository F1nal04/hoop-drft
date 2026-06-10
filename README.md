# HoopDrft

Simple basketball draft app for me and my brother.

This project is purely coded by AI and built just for fun to help us run quick drafts when we play games like NBA2K against each other.

## What It Does

- 2-team draft setup with custom team names (random fake-NBA names by default — "Berlin Bears", "Madrid Royals")
- choose player pool: `current`, `historical`, or `mixed`
- timer per pick — on expiry the best available player is auto-picked
- draft history and team rosters
- position needs tracking
- export finished drafts as an HTML file
- continue drafting from the results page: new draft, same settings, already-drafted players removed from the pool (local drafts)
- **remote drafting**: create a room, share the 6-letter code, draft against each other from different devices

## Remote Draft

Pick "Remote start" on the home page. The host creates a room and gets a short code (and a copyable share link); the other player joins with the code and their own team name. The host's settings from the Options page (pool, mode, and pick clock) apply to the room. Once both are in, the host starts the draft.

The draft itself works exactly like a local one, except each player can only draft for their own team. The pick clock and auto-picks run on the server, so a dropped connection or page refresh doesn't break the draft — you reconnect and pick up where it stands. If one player leaves for good, their picks keep auto-running on the clock.

Rooms live in server memory only — restarting the server (or its container) drops any active rooms.

## Draft Modes

### Snake Draft

- full player board
- 10 rounds per team

### Money Draft

- each team starts with `$15`
- 5 rounds per team, one player per position
- players are priced `$1` to `$5` by rank tier
- fixed random board at draft start: 50 players, 2 per position at every price tier
- lockout prevention: you cannot spend in a way that makes your remaining picks impossible

## Quick Start

```bash
bun install
bun run dev
```

Player data is served from `public/data/players.json`, so there is no database setup. The dev server is a small custom Node server (`server.mjs`) that runs Next plus the remote-draft WebSocket endpoint on the same port.

## Docker (VPS)

Build image:

```bash
docker build -t hoopdrft:latest .
```

Run container:

```bash
docker run -d \
  --name hoopdrft \
  --restart unless-stopped \
  -p 3000:3000 \
  hoopdrft:latest
```

Or with Compose:

```bash
docker compose up -d --build
```
