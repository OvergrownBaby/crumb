import Link from 'next/link'
import { SubmitForm } from '@/components/submit-form'
import { RotatingText } from '@/components/rotating-text'
import { ListCard } from '@/components/list-card'
import { GithubIcon } from '@/components/icons'
import { getCuratedLists } from '@/lib/lists'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const lists = await getCuratedLists(12)

  return (
    <div className="flex-1">
      {/* Hero — composer-first, single voice */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-12 lg:pt-24 lg:pb-16">
        <h1 className="fm-display text-[40px] sm:text-5xl lg:text-6xl leading-[1.0] -tracking-[0.03em]">
          Restaurants from <RotatingText /> you actually trust.
        </h1>
        <p className="mt-5 text-[var(--muted)] max-w-xl leading-relaxed">
          Drop a YouTube link, a TikTok, a Reddit thread, an Eater list. The AI watches
          or reads it, finds every restaurant, drops them on a map with the verbatim quote.
        </p>

        <div className="mt-8">
          <SubmitForm />
        </div>

        <div className="mt-5 flex items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)] flex-wrap">
          <a
            href="https://github.com/OvergrownBaby/thefoodcrawl"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
          >
            <GithubIcon className="w-3 h-3" />
            <span>open source</span>
          </a>
          <span className="opacity-40">·</span>
          <span>agpl-3.0</span>
          <span className="opacity-40">·</span>
          <span>no tracking, no ads, no subscription</span>
        </div>
      </section>

      {/* Lists by people — the browse hook */}
      {lists.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-14 border-t border-[var(--border)]">
          <div className="flex items-end justify-between mb-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold -tracking-[0.01em]">Lists from the people</h2>
              <p className="text-sm text-[var(--muted)] mt-1 max-w-md">
                Each is a city someone you trust has eaten through. Open one to see what
                they said about each place.
              </p>
            </div>
            <Link
              href="/atlas"
              className="text-sm font-medium text-[var(--foreground-soft)] hover:text-[var(--accent)] hidden sm:inline-flex items-center gap-1"
            >
              all on a map →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => (
              <ListCard key={`${l.creatorSlug}-${l.city}`} list={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
