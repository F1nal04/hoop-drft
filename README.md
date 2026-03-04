# HoopDrft

HoopDrft is a real-time fantasy basketball draft application with snake draft format, timer, and comprehensive player statistics.

## Features

- **Snake Draft System**: Alternating picks between two teams over 10 rounds
- **120-Second Timer**: Each pick has a 2-minute countdown
- **Position Tracking**: Visual position needs tracker (2 players per position: PG, SG, SF, PF, C)
- **Comprehensive Stats**: Points, rebounds, assists, and blocks per game
- **Player Filtering**: Filter by position and sort by any stat
- **Draft Cancellation**: Cancel mid-draft with confirmation
- **Missed Picks**: Visual indicator when timer expires without selection
- **Player Pools**: Choose from current NBA stars, all-time legends, or combined (80 players)
- **Money Draft Mode**: Optional `$15` salary-cap draft with fixed `$1-$5` tier pools (5 random players per tier)

## Tech Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Package Manager**: Bun
- **State Management**: React Hooks

## Database

The app uses PostgreSQL with two tables:
- `current_players` - 40 current NBA players (ranked 2-73 all-time)
- `historical_players` - 40 legendary players (ranked 1-80 all-time)

Players are fetched via API route (`/api/players`) with unified all-time rankings.

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL database (hosted or local)

### Installation

```bash
# Install dependencies
bun install

# Set up database URL in .env
DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
bun run db:migrate

# Seed database with players
bun run db:seed

# Generate Prisma Client
bunx prisma generate

# Start development server
bun run dev
```

### Scripts

- `bun run dev` - Start Next.js dev server
- `bun run build` - Build for production
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with player data
- `bunx prisma studio` - Open database GUI

## Project Structure

```
├── app/
│   ├── api/players/         # API route for fetching players
│   └── page.tsx             # Main draft interface
├── components/
│   ├── draft-board.tsx      # Player selection board with filters
│   ├── team-roster.tsx      # Team roster with position needs
│   ├── position-needs.tsx   # Position tracker component
│   ├── player-card.tsx      # Individual player display
│   ├── draft-timer.tsx      # Countdown timer
│   ├── draft-history.tsx    # Pick log
│   └── ui/                  # shadcn/ui components
├── hooks/
│   └── use-draft.ts         # Draft state management
├── lib/
│   ├── types.ts             # Player types and utility functions
│   └── prisma.ts            # Prisma client instance
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Database seeding script
```

## Draft Flow

1. **Pre-Draft**: Select draft type, player pool, and team names
2. **Drafting**: Snake draft with timer (Team 1 → Team 2 → Team 2 → Team 1)
3. **Complete**: View final rosters with position analysis

### Money Draft Rules

- Both teams start with a `$15` budget
- Draft length is `5` rounds per team
- Position needs target is `1` per position (`PG`, `SG`, `SF`, `PF`, `C`)
- Players are assigned prices from `$1` to `$5` using equal rank buckets
- At draft start, each price tier gets a fixed random pool of 5 players
- Tier pools do not refresh during the draft
- Teams can only draft players they can afford

## Player Rankings

All-time rankings (1-80) combine historical legends with current superstars:
- **Top 10**: MJ, LeBron, Kareem, Magic, Bird, Wilt, Russell, Duncan, Kobe, Shaq
- **Current Stars**: LeBron (#2), KD (#11), Curry (#12), Jokic (#13), Giannis (#14)
- **Rising Stars**: Luka (#25), Embiid (#30), SGA (#41), Tatum (#42)

Players are ranked based on career accomplishments, peak performance, and impact on the game.
