<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Commands

Package manager is **bun** (`bun.lock` is the lockfile — don't generate `package-lock.json` or `yarn.lock`).

```bash
bun install         # install deps
bun run dev         # next dev --turbo
bun run build       # next build (standalone output, used by Docker)
bun run start       # next start
bun run lint        # next lint
```

There is no test suite. There is no single-test command.

Docker build/run commands live in `README.md`.

## Architecture

Single-page Next.js 16 App Router project. React 19 with the **React Compiler enabled** (`reactCompiler: true` in `next.config.mjs`) — do not add manual `useMemo`/`useCallback` purely for referential stability; the compiler handles it.

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `next build` will succeed even with type errors. Run `tsc --noEmit` (or rely on the editor) to catch them — don't trust the build alone.

### Routes & flow

```
/ (app/page.tsx)
  ├─ /options    → configure dataset, mode, team names, clock, budget
  ├─ /lobby      → share-code stub (no real multiplayer; UI placeholder)
  ├─ /draft      → live draft board (the bulk of the app, ~600 LOC)
  └─ /results    → post-draft summary with letter grade
```

State flows between pages **via `localStorage`**, not Next.js routing or context:

- `lib/hd-config.ts` — `hd-config` key, written by `/options`, read by `/draft`.
- `lib/hd-results.ts` — `hd-results` key, written when `/draft` completes, read by `/results`.

Both modules guard `typeof window === "undefined"` for SSR safety and fall back to `DEFAULT_CONFIG` / `null`. Pages hydrate by setting a `hydrated` flag in `useEffect` to avoid SSR/CSR mismatches.

### Player data pipeline (`lib/hd-data.ts`)

Players are loaded once from `public/data/players.json` (no DB, no API). `loadHDPools()` is a **module-level memoized Promise** — call it from any page; the fetch runs once per session.

Raw JSON has `current_players` and `historical_players` arrays with `rank` fields. `mapPlayers` derives the in-app shape:

- `cost` is computed from rank via `rankToCost` (global min/max across both eras), used by money mode and the post-draft grade.
- `tag` is `"NOW"` or `"ERA"`.
- A `mixed` dataset is produced by merging both lists sorted by rank.

If you change the rank→cost curve, money-mode pricing and snake-mode grade thresholds shift together.

### Draft engine (`app/draft/page.tsx`)

The draft page owns all live state in `useState` (no reducer, no external store). Key invariants:

- `firstTeam` is randomized once on mount; `pickOrder(idx, mode, firstTeam)` computes which team (0 or 1) is on the clock for pick index `idx`. Snake mode reverses order each round; money mode alternates strictly.
- `pickIdx` is the global pick counter (0-indexed); `roundOf(idx)` derives the round number.
- `completedRef` prevents double-writing results on the final pick.
- Money mode enforces a **lockout rule**: a team cannot spend so much that the remaining required picks become impossible at minimum cost. This logic lives inside the draft page — search for `budget` / `spent` when editing.

### Styling

Tailwind **v4** with a custom theme defined in `app/globals.css` under `@theme { ... }`. Colors like `bg-ink`, `text-paper`, `border-line`, `text-orange-hd`, `text-ok`, `text-warn` are project tokens — don't replace them with raw hex or default Tailwind colors. The `hd-mark` and `hd-pulse-dot` classes are also defined there.

Fonts are wired in `app/layout.tsx` via `next/font/google` (Fraunces serif, Inter Tight sans, JetBrains Mono) and exposed as CSS variables consumed by the `@theme` font tokens.

### AGENTS.md

Update this AGENTS.md together with major architectural changes etc.
