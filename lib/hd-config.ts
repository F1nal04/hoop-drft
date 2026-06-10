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

export function readConfig(): HDConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function writeConfig(config: HDConfig): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}
