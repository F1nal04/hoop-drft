import type { DatasetKey, DraftMode } from "./hd-data"
import { DEFAULT_TEAM_NAMES } from "./hd-names"

export interface HDConfig {
  dataset: DatasetKey
  mode: DraftMode
  t1: string
  t2: string
  clock: number
  budget: number
}

export const DEFAULT_CONFIG: HDConfig = {
  dataset: "current",
  mode: "snake",
  t1: DEFAULT_TEAM_NAMES[0],
  t2: DEFAULT_TEAM_NAMES[1],
  clock: 60,
  budget: 15,
}

const KEY = "hd-config"
// Team names live in sessionStorage, not localStorage: a manually typed name
// should stick for the tab's lifetime but reroll to a fresh generated pair in
// a new session (new tab), unlike dataset/mode/clock which persist forever.
const NAMES_KEY = "hd-config-names"

function readNames(): [string, string] | null {
  try {
    const raw = window.sessionStorage.getItem(NAMES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return [parsed.t1, parsed.t2]
  } catch {
    return null
  }
}

export function readConfig(): HDConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  let base = DEFAULT_CONFIG
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) base = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    base = DEFAULT_CONFIG
  }
  // Ignore any t1/t2 that slipped into the localStorage blob (e.g. from
  // before this change) — names always come from sessionStorage or the
  // generated default, never from the persisted config.
  const names = readNames()
  const [t1, t2] = names ?? DEFAULT_TEAM_NAMES
  return { ...base, t1, t2 }
}

export function writeConfig(config: HDConfig): void {
  if (typeof window === "undefined") return
  const { t1, t2, ...rest } = config
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rest))
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.setItem(NAMES_KEY, JSON.stringify({ t1, t2 }))
  } catch {
    /* ignore */
  }
}
