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

// Exact membership in the generated set (or a legacy default). Mascots are
// single words — an invariant of NAME_MASCOTS — so the last space splits city
// from mascot unambiguously. A typed name that happens to be a valid combo
// (e.g. "San Diego Bears") counts as generated and rerolls.
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
  while (rolled === fixed) rolled = randomTeamName() // fixed is custom, so never generated; safety net only
  return rollA ? [rolled, fixed] : [fixed, rolled]
}
