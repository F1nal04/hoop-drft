"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

const CODE = ["R", "7", "K", "P", "3", "Q"] as const
const ORANGE_INDICES = new Set([1, 4])

export default function LobbyPage() {
  const [copied, setCopied] = useState(false)
  const shareLink = useMemo(
    () => (typeof window === "undefined" ? "" : `${window.location.origin}/lobby?code=${CODE.join("")}`),
    [],
  )

  function copy() {
    if (!shareLink) return
    navigator.clipboard?.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center gap-3 font-serif text-[20px] font-medium">
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

      <main className="grid flex-1 place-items-center px-12 pb-12">
        <div className="w-full max-w-[520px] text-center">
          <h1 className="m-0 mb-3 font-serif text-[56px] font-medium leading-none tracking-[-0.025em]">
            Share the code.
          </h1>
          <p className="mb-9 text-[15px] text-ink-mute">
            Send it to a friend. They join, you start drafting.
          </p>

          <div className="mb-9 flex justify-center gap-2">
            {CODE.map((ch, i) => (
              <span
                key={i}
                className={
                  ORANGE_INDICES.has(i)
                    ? "grid h-[70px] w-[56px] place-items-center rounded-[10px] border border-orange-hd bg-orange-hd font-mono text-[32px] font-semibold text-white"
                    : "grid h-[70px] w-[56px] place-items-center rounded-[10px] border border-line bg-paper font-mono text-[32px] font-semibold"
                }
              >
                {ch}
              </span>
            ))}
          </div>

          <div className="mb-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ok">
            <span className="hd-pulse-dot" />
            Waiting for player 2
          </div>

          <div className="flex justify-center gap-2.5">
            <button
              type="button"
              onClick={copy}
              className="cursor-pointer rounded-lg border border-line bg-paper px-[18px] py-3 font-sans text-[14px] font-medium text-ink"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <Link
              href="/options"
              className="rounded-lg border border-ink bg-ink px-[18px] py-3 font-sans text-[14px] font-medium text-paper no-underline"
            >
              Continue →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
