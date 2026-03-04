# HoopDrft

Simple basketball draft app for me and my brother.

This project is purely coded by AI and built just for fun to help us run quick drafts when we play games like NBA2K against each other.

## What It Does

- 2-team draft setup with custom team names
- choose player pool: `current`, `historical`, or `all`
- timer per pick
- draft history and team rosters
- position needs tracking

## Draft Modes

### Normal Draft

- full player board
- 10 rounds per team

### Money Draft

- each team starts with `$15`
- 5 rounds per team
- players are priced `$1` to `$5`
- fixed random pool: 5 players per price tier at draft start
- lockout prevention: you cannot spend in a way that makes your remaining picks impossible

## Quick Start

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Set `DATABASE_URL` in `.env` before running DB commands.

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
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  hoopdrft:latest
```

Or with Compose:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname" docker compose up -d --build
```
