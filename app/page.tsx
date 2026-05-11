import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-12 py-7">
        <div className="flex items-center gap-3 font-serif text-[22px] font-medium tracking-[-0.01em]">
          <span className="hd-mark size-[26px]" />
          <span>Hoop Draft</span>
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-12 pb-12">
        <div className="w-full max-w-[920px] text-center">
          <h1 className="m-0 font-serif text-[clamp(72px,11vw,144px)] font-medium leading-[0.95] tracking-[-0.035em]">
            Run a draft.
            <br />
            Settle the <em className="italic text-orange-hd">argument.</em>
          </h1>

          <div className="mx-auto mt-14 grid max-w-[640px] grid-cols-2 gap-3.5">
            <Link
              href="/options"
              className="block rounded-xl border border-ink bg-ink p-[28px_26px] text-left text-paper no-underline transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#2a1d10] hover:shadow-hd-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-55">
                Same couch
              </div>
              <div className="mt-2.5 font-serif text-[28px] font-medium leading-none tracking-[-0.02em]">
                Local start →
              </div>
            </Link>
            <Link
              href="/lobby"
              className="block rounded-xl border border-line bg-paper p-[28px_26px] text-left no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:shadow-hd-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-55">
                Room code
              </div>
              <div className="mt-2.5 font-serif text-[28px] font-medium leading-none tracking-[-0.02em]">
                Remote start →
              </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-12 py-5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
        Hoop Draft
      </footer>
    </div>
  )
}
