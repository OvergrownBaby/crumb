import Link from 'next/link'
import { SubmitForm } from '@/components/submit-form'
import { RotatingText } from '@/components/rotating-text'
import { VideoCard } from '@/components/video-card'
import { GithubIcon } from '@/components/icons'
import { getLatestVideos } from '@/lib/videos'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const videos = await getLatestVideos(24)

  return (
    <div className="flex-1">
      {/* Composer-first. Tagline lives below as a small line, not a hero block. */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
        <div className="text-center sm:text-left">
          <h1 className="fm-display text-2xl sm:text-3xl leading-tight text-[var(--foreground-soft)]">
            Drop a food video, get a map.
          </h1>
        </div>

        <div className="mt-5">
          <SubmitForm showPresets />
        </div>

        <div className="mt-5 flex items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-[var(--muted)] flex-wrap">
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
          <span>no tracking · no ads · no subscription</span>
        </div>

        {/* Tagline — quiet, below the composer, not the hero */}
        <p className="mt-8 text-center text-sm text-[var(--muted)] italic">
          Restaurants from <RotatingText /> you actually trust.
        </p>
      </section>

      {/* Video feed — recency-sorted */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-14 border-t border-[var(--border)]">
          <div className="flex items-end justify-between mb-5 max-w-4xl">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] font-semibold">
                Feed
              </p>
              <h2 className="mt-1 text-xl font-semibold">Latest videos parsed.</h2>
            </div>
            <Link
              href="/atlas"
              className="text-sm font-medium text-[var(--foreground-soft)] hover:text-[var(--accent)] hidden sm:inline-flex items-center gap-1"
            >
              all on the map →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
