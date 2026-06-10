# Random Generated Team Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Default team names become randomly generated city+mascot names that sound like real NBA franchises but aren't ("Berlin Bears"), rerolling on every `/options` and `/lobby` visit unless the user typed a custom name.

**Architecture:** A new dependency-free `lib/hd-names.ts` holds curated city/mascot lists and the roll/membership helpers. `DEFAULT_CONFIG` switches its static fallback to a fixed combo from those lists. Both pages pass the saved names through `rollTeamNames` in their existing mount effects (client-only, so `Math.random` is SSR-safe); the options page persists the roll so "Start draft" uses what's displayed.

**Tech Stack:** TypeScript, Next.js 16 App Router (existing pages), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-10-random-team-names-design.md`

**Verification note:** This repo has no test suite (see AGENTS.md) — verification is `bunx tsc --noEmit`, `bun run lint`, `bun run build`, and a manual browser check at the end.

---

### Task 1: Name generator module

**Files:**
- Create: `lib/hd-names.ts`

- [ ] **Step 1: Create `lib/hd-names.ts`**

The curation invariant: no `<city> <mascot>` combo across the cross-product may be a real NBA/NFL/MLB/NHL franchise. Cities were chosen with no NBA team; every city that hosts a big-4 team whose nickname appears in `NAME_MASCOTS` is excluded (no Pittsburgh because of Pirates, no Kansas City because of Royals, no Baltimore because of Ravens, no Chicago because of Bears, no Miami because of Dolphins, no San Jose because of Sharks, no Atlanta because of Falcons, no Detroit because of Tigers, no Jacksonville because of Jaguars, no Philadelphia because of Eagles).

```ts
// Fake-NBA team name generator. Names are `<city> <mascot>` where the city
// has no NBA team and the mascot is used by no NBA team — and, curated by
// hand, no combination in the cross-product is a real NBA/NFL/MLB/NHL
// franchise (that's why e.g. Pittsburgh and Kansas City are absent: Pirates
// and Royals are in the mascot list).

export const NAME_CITIES = [
  "San Diego", "Seattle", "St. Louis", "Nashville", "Las Vegas", "Austin",
  "Cincinnati", "Columbus", "Louisville", "Omaha", "Tucson", "Honolulu",
  "Anchorage", "Vancouver", "Montreal", "Berlin", "Madrid", "London",
  "Paris", "Rome", "Lisbon", "Vienna", "Prague", "Amsterdam", "Munich",
  "Dublin", "Stockholm", "Tokyo", "Seoul", "Sydney",
] as const

export const NAME_MASCOTS = [
  "Bears", "Dolphins", "Royals", "Sharks", "Falcons", "Tigers", "Pirates",
  "Ravens", "Jaguars", "Eagles", "Cobras", "Vipers", "Stallions", "Mustangs",
  "Comets", "Cyclones", "Phantoms", "Pumas", "Bison", "Hounds", "Gators",
  "Rhinos", "Scorpions", "Monarchs", "Admirals", "Condors", "Typhoons",
  "Huskies", "Cougars", "Drakes",
] as const

// Static SSR fallback for DEFAULT_CONFIG — must be combos from the lists so
// they reroll on the first client visit like any other generated name.
export const DEFAULT_TEAM_NAMES: [string, string] = [
  "San Diego Dolphins",
  "Berlin Bears",
]

// Pre-change defaults; recognized so configs saved before this feature
// migrate to generated names instead of sticking forever as "custom".
const LEGACY_NAMES = new Set(["Alley-Oop Club", "Hardwood Court"])

const CITY_SET = new Set<string>(NAME_CITIES)
const MASCOT_SET = new Set<string>(NAME_MASCOTS)

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickTwo<T>(arr: readonly T[]): [T, T] {
  const i = Math.floor(Math.random() * arr.length)
  let j = Math.floor(Math.random() * (arr.length - 1))
  if (j >= i) j++
  return [arr[i], arr[j]]
}

export function randomTeamName(): string {
  return `${pick(NAME_CITIES)} ${pick(NAME_MASCOTS)}`
}

// Two names sharing neither city nor mascot.
export function randomTeamNames(): [string, string] {
  const [c1, c2] = pickTwo(NAME_CITIES)
  const [m1, m2] = pickTwo(NAME_MASCOTS)
  return [`${c1} ${m1}`, `${c2} ${m2}`]
}

// Exact membership in the generated set (or a legacy default). Custom names
// can never collide: mascots are single words, so we split on the last space.
export function isGeneratedName(name: string): boolean {
  if (LEGACY_NAMES.has(name)) return true
  const i = name.lastIndexOf(" ")
  if (i === -1) return false
  return CITY_SET.has(name.slice(0, i)) && MASCOT_SET.has(name.slice(i + 1))
}

// Reroll policy: generated names reroll, custom names pass through untouched.
// Both rolled → a pair sharing neither city nor mascot; one rolled → it never
// equals the custom one; two identical custom names are left alone (we never
// modify custom input).
export function rollTeamNames(t1: string, t2: string): [string, string] {
  const rollA = isGeneratedName(t1)
  const rollB = isGeneratedName(t2)
  if (rollA && rollB) return randomTeamNames()
  if (!rollA && !rollB) return [t1, t2]
  const fixed = rollA ? t2 : t1
  let rolled = randomTeamName()
  while (rolled === fixed) rolled = randomTeamName()
  return rollA ? [rolled, fixed] : [fixed, rolled]
}
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no output (exit 0)

- [ ] **Step 3: Commit**

```bash
git add lib/hd-names.ts
git commit -m "Add fake-NBA team name generator"
```

### Task 2: Replace static defaults in config

**Files:**
- Modify: `lib/hd-config.ts:12-19`

- [ ] **Step 1: Swap the default team names**

In `lib/hd-config.ts`, add the import and change `DEFAULT_CONFIG`:

```ts
import type { DatasetKey, DraftMode } from "./hd-data"
import { DEFAULT_TEAM_NAMES } from "./hd-names"
```

```ts
export const DEFAULT_CONFIG: HDConfig = {
  dataset: "current",
  mode: "snake",
  t1: DEFAULT_TEAM_NAMES[0],
  t2: DEFAULT_TEAM_NAMES[1],
  clock: 60,
  budget: 15,
}
```

The strings "Alley-Oop Club" and "Hardwood Court" now exist only in `LEGACY_NAMES` inside `lib/hd-names.ts`.

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no output (exit 0)

- [ ] **Step 3: Commit**

```bash
git add lib/hd-config.ts
git commit -m "Use generated combo as default team names"
```

### Task 3: Roll names on the options page

**Files:**
- Modify: `app/options/page.tsx:5,44-47`

- [ ] **Step 1: Roll + persist in the mount effect**

Add the import:

```ts
import { rollTeamNames } from "@/lib/hd-names"
```

Replace the mount effect (currently `setConfig(readConfig()); setHydrated(true)`):

```ts
useEffect(() => {
  const cfg = readConfig()
  // Fresh fake-NBA names each visit; names the user typed pass through.
  // Persist immediately — "Start draft" launches /draft, which reads the
  // config from localStorage itself, so what's shown must be what's saved.
  const [t1, t2] = rollTeamNames(cfg.t1, cfg.t2)
  const next = { ...cfg, t1, t2 }
  if (t1 !== cfg.t1 || t2 !== cfg.t2) writeConfig(next)
  setConfig(next)
  setHydrated(true)
}, [])
```

`writeConfig` is already imported on line 5. No other changes — typing in the inputs still writes through `update()`, and a typed name won't match the generated set, so it sticks on later visits.

- [ ] **Step 2: Type-check and lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: tsc silent; eslint exits 0 with no warnings

- [ ] **Step 3: Commit**

```bash
git add app/options/page.tsx
git commit -m "Roll random team names on options page"
```

### Task 4: Roll names on the lobby page

**Files:**
- Modify: `app/lobby/page.tsx:6,26-38`

- [ ] **Step 1: Roll the default host/guest names in the mount effect**

Add the import:

```ts
import { rollTeamNames } from "@/lib/hd-names"
```

In the mount effect, replace

```ts
setHostName(cfg.t1)
setJoinName(cfg.t2)
```

with

```ts
// Fresh fake-NBA names each visit (typed names stick). Ephemeral — these go
// into the room over the socket, not back into the saved config.
const [t1, t2] = rollTeamNames(cfg.t1, cfg.t2)
setHostName(t1)
setJoinName(t2)
```

- [ ] **Step 2: Type-check and lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: tsc silent; eslint exits 0 with no warnings

- [ ] **Step 3: Commit**

```bash
git add app/lobby/page.tsx
git commit -m "Roll random team names in lobby defaults"
```

### Task 4.5: Purge legacy names from remaining fallbacks

Discovered during Task 2 review: the legacy strings survive in two fallbacks outside the spec's original file list. The user asked for the current names to be removed entirely.

**Files:**
- Modify: `app/results/page.tsx:15-16`
- Modify: `server/rooms.mjs:222,262`

- [ ] **Step 1: Results page placeholder**

Replace the initial pre-hydration team state

```ts
{ name: "Alley-Oop Club", picks: [], spent: 0 },
{ name: "Hardwood Court", picks: [], spent: 0 },
```

with the static generated combos:

```ts
{ name: DEFAULT_TEAM_NAMES[0], picks: [], spent: 0 },
{ name: DEFAULT_TEAM_NAMES[1], picks: [], spent: 0 },
```

adding `import { DEFAULT_TEAM_NAMES } from "@/lib/hd-names"`.

- [ ] **Step 2: Room server join fallbacks**

`server/rooms.mjs` is plain Node ESM (not compiled by Next) and cannot import the TS module. Replace the fallback names in `cleanName(msg.name, "Alley-Oop Club")` / `cleanName(msg.name, "Hardwood Court")` with neutral `"Team 1"` / `"Team 2"` — these only appear when a player submits a blank or control-character-only name.

- [ ] **Step 3: Verify and commit**

Run: `bunx tsc --noEmit && bun run lint`
Expected: both clean

```bash
git add app/results/page.tsx server/rooms.mjs
git commit -m "Drop legacy default names from fallbacks"
```

### Task 5: Build, manual verification, docs

**Files:**
- Modify: `README.md` (feature list), `AGENTS.md` (localStorage section)

- [ ] **Step 1: Production build**

Run: `bun run build`
Expected: build succeeds (remember `typescript.ignoreBuildErrors` is true — the earlier `tsc --noEmit` runs are the real type gate)

- [ ] **Step 2: Manual check in the browser**

Run `bun run dev`, then verify:
1. Open `/options` → both team names are `<city> <mascot>` combos. Reload → both change.
2. Type a custom name into Team 01 ("My Squad"). Reload → Team 01 stays "My Squad", Team 02 rerolls.
3. Open `/lobby` → "Your team" defaults in both cards are generated combos (Team 01's stays "My Squad").
4. In devtools, set `hd-config`'s `t1` to `"Alley-Oop Club"` (the legacy default) and reload `/options` → it rerolls to a generated combo (legacy migration works).

- [ ] **Step 3: Update docs**

`README.md` — in the "What It Does" list, change

```md
- 2-team draft setup with custom team names
```

to

```md
- 2-team draft setup with custom team names (random fake-NBA names by default — "Berlin Bears", "Madrid Royals")
```

`AGENTS.md` — in the localStorage bullet list (Routes & flow section), extend the `lib/hd-config.ts` bullet with:

```md
Default team names are generated by `lib/hd-names.ts` (curated city × mascot lists, no real big-4 franchise combos): `/options` and `/lobby` reroll generated names in their mount effects on every visit — `isGeneratedName` membership decides generated vs custom, so typed names stick. `/options` persists the roll (draft reads the config itself); `/lobby`'s roll is ephemeral.
```

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md
git commit -m "Document random team name generation"
```
