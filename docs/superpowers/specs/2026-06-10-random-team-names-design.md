# Random generated team names

2026-06-10

## Goal

Default team names should be randomly generated names that sound like real NBA
franchises but aren't — city + mascot, e.g. "Berlin Bears", "Madrid Royals",
"San Diego Dolphins". Fresh names roll on every visit to `/options` and
`/lobby`, but a name the user typed themselves sticks. The current static
defaults ("Alley-Oop Club" / "Hardwood Court") are removed.

## Approach

Curated combinatorial lists (chosen over syllable-based procedural generation,
which produces awkward names, and over a flat list of full names, which gives
fewer combos for more maintenance).

## New module: `lib/hd-names.ts`

- `NAME_CITIES` (~30): cities without an NBA team — non-NBA US cities
  (San Diego, Seattle, Nashville, Pittsburgh, …) plus international ones
  (Berlin, Madrid, London, Tokyo, …).
- `NAME_MASCOTS` (~30): plural mascots used by no NBA team
  (Bears, Dolphins, Royals, Sharks, Comets, Vipers, …).
- **Curation invariant:** no `<city> <mascot>` combination across the full
  cross-product may be a real NBA/NFL/MLB/NHL franchise. Concretely: a city
  may not appear in `NAME_CITIES` if any mascot in `NAME_MASCOTS` is the
  nickname of a real big-4 team in that city (e.g. "Royals" in the list means
  Kansas City stays out; "Bears" means Chicago stays out). International
  cities are trivially safe.
- `randomTeamNames(): [string, string]` — two names sharing neither city nor
  mascot.
- `isGeneratedName(name: string): boolean` — exact membership test against
  the `<city> <mascot>` cross-product, plus the two legacy defaults
  ("Alley-Oop Club", "Hardwood Court") so configs saved before this change
  migrate to generated names instead of sticking forever.
- `rollTeamNames(t1: string, t2: string): [string, string]` — the reroll
  policy: each name is rerolled only if `isGeneratedName(name)` is true;
  custom names pass through untouched. A rerolled name never equals the other
  name (two identical custom names are left alone — we never modify custom
  input).

## Config changes (`lib/hd-config.ts`)

`DEFAULT_CONFIG.t1/t2` become a fixed city-mascot combo from the lists
(static module constant — SSR-safe fallback). Because those values are in the
generated set, they reroll on first client visit like any other generated
name. No other config changes.

## Page wiring

Both pages already read config inside a mount effect (client-only), so
`Math.random` here causes no SSR/CSR mismatch.

- `/options`: after `readConfig()`, pass `t1`/`t2` through `rollTeamNames`
  before setting input state. Saving persists whatever is shown (existing
  flow); persisted generated names reroll next visit, typed names stick.
- `/lobby`: same treatment for the host's default team name (create card) and
  the guest's default name (join card), which derive from `cfg.t1`/`cfg.t2`.

## Unchanged

Draft engines, room server, persistence flows, results page. No new
dependencies.

## Verification

`tsc --noEmit`, `eslint .`, `next build`, plus a manual check: options page
shows two generated names that change on reload; a typed custom name survives
reload; lobby defaults follow the same rules.
