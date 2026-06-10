const KEY = "hd-exclusions"

export function readExclusions(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function addExclusions(ids: string[]): void {
  if (typeof window === "undefined") return
  try {
    const merged = [...new Set([...readExclusions(), ...ids])]
    window.localStorage.setItem(KEY, JSON.stringify(merged))
  } catch {
    /* ignore */
  }
}

export function clearExclusions(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
