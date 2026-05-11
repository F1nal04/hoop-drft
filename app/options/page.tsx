"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { DEFAULT_CONFIG, type HDConfig, readConfig, writeConfig } from "@/lib/hd-config"
import type { DatasetKey, DraftMode } from "@/lib/hd-data"

const DATASET_LABEL: Record<DatasetKey, string> = {
  current: "Current",
  historical: "Historical",
  mixed: "Mixed",
}

const DATASET_OPTIONS: { value: DatasetKey; title: string; sub: string }[] = [
  { value: "current", title: "Current", sub: "Today's rosters" },
  { value: "historical", title: "Historical", sub: "All-time greats" },
  { value: "mixed", title: "Mixed", sub: "Every era" },
]

const MODE_OPTIONS: { value: DraftMode; title: string; sub: string }[] = [
  { value: "snake", title: "Snake", sub: "10 players per team" },
  { value: "money", title: "Money", sub: "5 players · $100M cap" },
]

const optButton = (active: boolean) =>
  `cursor-pointer rounded-[10px] border p-[22px_22px_24px] text-left font-inherit transition-colors duration-150 ${
    active
      ? "border-ink bg-ink text-paper"
      : "border-line bg-paper text-ink hover:border-ink"
  }`

export default function OptionsPage() {
  const [config, setConfig] = useState<HDConfig>(DEFAULT_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(readConfig())
    setHydrated(true)
  }, [])

  function update<K extends keyof HDConfig>(key: K, value: HDConfig[K]) {
    setConfig((prev) => {
      const next = { ...prev, [key]: value }
      writeConfig(next)
      return next
    })
  }

  const rosterRecap = config.mode === "snake" ? "10 picks each" : `5 picks · $${config.budget}M`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center gap-3 font-serif text-[20px] font-medium tracking-[-0.01em]">
          <span className="hd-mark size-[22px]" />
          <span>Hoop Draft</span>
        </div>
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute no-underline hover:text-ink"
        >
          ← Back
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[880px] flex-1 px-12 pb-20 pt-12">
        <h1 className="m-0 mb-14 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
          Setup
        </h1>

        <section className="mb-11">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">
            Player pool
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {DATASET_OPTIONS.map((opt) => {
              const active = hydrated && config.dataset === opt.value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => update("dataset", opt.value)}
                  className={optButton(active)}
                >
                  <div className="font-serif text-[26px] font-medium leading-none tracking-[-0.015em]">
                    {opt.title}
                  </div>
                  <div
                    className={`mt-2 font-mono text-[11px] tracking-[0.06em] ${
                      active ? "text-paper/60" : "text-ink-mute"
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-11">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">
            Mode
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {MODE_OPTIONS.map((opt) => {
              const active = hydrated && config.mode === opt.value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => update("mode", opt.value)}
                  className={optButton(active)}
                >
                  <div className="font-serif text-[26px] font-medium leading-none tracking-[-0.015em]">
                    {opt.title}
                  </div>
                  <div
                    className={`mt-2 font-mono text-[11px] tracking-[0.06em] ${
                      active ? "text-paper/60" : "text-ink-mute"
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-11">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="mb-3.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">
                <span className="block size-2 rounded-full bg-orange-hd" />
                Team 01
              </div>
              <input
                value={config.t1}
                onChange={(e) => update("t1", e.target.value)}
                maxLength={22}
                className="w-full border-0 border-b-[1.5px] border-line bg-transparent px-0 pb-2 pt-1 font-serif text-[32px] font-medium tracking-[-0.02em] text-ink outline-none focus:border-orange-hd"
              />
            </div>
            <div>
              <div className="mb-3.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">
                <span className="block size-2 rounded-full bg-ink" />
                Team 02
              </div>
              <input
                value={config.t2}
                onChange={(e) => update("t2", e.target.value)}
                maxLength={22}
                className="w-full border-0 border-b-[1.5px] border-line bg-transparent px-0 pb-2 pt-1 font-serif text-[32px] font-medium tracking-[-0.02em] text-ink outline-none focus:border-orange-hd"
              />
            </div>
          </div>
        </section>

        <div className="mt-14 flex items-center justify-between border-t border-line pt-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute">
            <b className="mr-1 font-semibold text-ink">{DATASET_LABEL[config.dataset]}</b> ·{" "}
            <b className="mr-1 font-semibold text-ink">
              {config.mode === "snake" ? "Snake" : "Money"}
            </b>{" "}
            · <b className="font-semibold text-ink">{rosterRecap}</b>
          </div>
          <Link
            href="/draft"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-ink px-[22px] py-3.5 font-sans text-[14px] font-semibold text-paper no-underline hover:bg-[#2a1d10]"
          >
            Start draft →
          </Link>
        </div>
      </main>
    </div>
  )
}
