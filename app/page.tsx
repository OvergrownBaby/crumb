import Link from 'next/link'
import { getAtlas, listCreators } from '@/lib/data'
import { AtlasMap } from '@/components/atlas-map'
import { CreatorAvatar } from '@/components/creator-avatar'
import { SourceBadge } from '@/components/source-badge'
import { RestaurantCard } from '@/components/restaurant-card'
import { ArrowRight, Plus } from 'lucide-react'
import { GithubIcon } from '@/components/icons'

export default async function HomePage() {
  const [restaurants, creators] = await Promise.all([getAtlas(), listCreators()])
  const recentRestaurants = restaurants.slice(0, 6)
  const stats = {
    restaurants: restaurants.length,
    videos: creators.reduce((s, c) => s + c.videoCount, 0),
    creators: creators.filter((c) => c.restaurantCount > 0).length,
    cities: new Set(restaurants.map((r) => `${r.city}|${r.country}`)).size,
  }

  return (
    <div className="flex-1">
      {/* Hero — single column, content-first */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-14 lg:pt-20 pb-10">
        <p className="fm-label">A weekend project</p>
        <h1 className="mt-3 fm-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] max-w-3xl">
          A community map of restaurants recommended by food creators.
        </h1>
        <p className="mt-5 text-[var(--muted)] max-w-2xl leading-relaxed">
          Drop a Mark Wiens video, a TikTok, a Reddit thread, an Eater list. Gemini watches /
          reads it, Google Places pins the spots, and every pin links back to the exact
          quote &amp; timestamp.{' '}
          <Link href="/atlas" className="text-[var(--foreground)] underline decoration-[var(--accent)] decoration-2 underline-offset-2 hover:text-[var(--accent)]">
            Browse the atlas
          </Link>
          .
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/submit"
            className="fm-btn fm-focus inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--accent)] font-medium text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add a link
          </Link>
          <a
            href="https://github.com/OvergrownBaby/crumb"
            target="_blank"
            rel="noreferrer"
            className="fm-btn fm-focus inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[var(--border-strong)] hover:bg-[var(--muted-soft)] text-sm font-medium"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            Source
          </a>
        </div>
      </section>

      {/* Stat strip — let the data brag */}
      <section className="border-y border-[var(--border)] bg-[var(--background-elev)]/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6 text-sm">
          <Stat n={stats.restaurants} label="restaurants" />
          <Stat n={stats.videos} label="videos parsed" />
          <Stat n={stats.creators} label="creators" />
          <Stat n={stats.cities} label={stats.cities === 1 ? 'city' : 'cities'} />
        </div>
      </section>

      {/* The map — the product, not a marketing screenshot */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="fm-label">All pins</p>
            <h2 className="font-bold text-xl mt-0.5">
              Everywhere we&apos;ve got data
            </h2>
          </div>
          <Link
            href="/atlas"
            className="text-sm font-medium text-[var(--foreground-soft)] hover:text-[var(--accent)] inline-flex items-center gap-1"
          >
            Open atlas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="relative h-[420px] lg:h-[520px] rounded-lg overflow-hidden border border-[var(--border-strong)] bg-[var(--muted-soft)]">
          <AtlasMap
            restaurants={restaurants}
            interactive={true}
            center={[114.17, 22.32]}
            zoom={10.5}
            className="absolute inset-0"
          />
        </div>
      </section>

      {/* Sources supported — info-dense */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 border-t border-[var(--border)]">
        <p className="fm-label">Inputs</p>
        <h2 className="font-bold text-xl mt-0.5">Sources that work</h2>
        <p className="mt-1 text-sm text-[var(--muted)] max-w-2xl">
          Anything you can paste a URL to. Long-form videos are extracted with Gemini
          multimodal (it watches storefront signs and menu boards, not just transcripts).
          Articles use Readability + Claude. Geocoding via Google Places, cached aggressively.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourceBadge kind="youtube" />
          <SourceBadge kind="tiktok" />
          <SourceBadge kind="reddit" />
          <SourceBadge kind="article" />
          <SourceBadge kind="maps_list" />
          <SourceBadge kind="text_paste" />
        </div>
      </section>

      {/* Creators — small + dense, not marketing cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 border-t border-[var(--border)]">
        <p className="fm-label">Sourced from</p>
        <h2 className="font-bold text-xl mt-0.5">Creators</h2>
        <ul className="mt-4 divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--background-elev)]">
          {creators.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/c/${c.slug}`}
                className="fm-btn flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted-soft)]"
              >
                <CreatorAvatar creator={c} size="md" link={false} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="fm-label !text-[10px]">{c.platform}</div>
                </div>
                <div className="text-right text-xs text-[var(--muted)] fm-num">
                  {c.restaurantCount > 0 ? (
                    <>
                      <span className="font-semibold text-[var(--foreground)]">
                        {c.restaurantCount}
                      </span>{' '}
                      pins · {c.videoCount} videos
                    </>
                  ) : (
                    <span className="italic">no pins yet</span>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent pins — dense grid, not marketing card */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 border-t border-[var(--border)]">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="fm-label">Recently added</p>
            <h2 className="font-bold text-xl mt-0.5">Latest pins</h2>
          </div>
          <Link
            href="/atlas"
            className="text-sm font-medium text-[var(--foreground-soft)] hover:text-[var(--accent)] inline-flex items-center gap-1"
          >
            All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="fm-display fm-num text-2xl leading-none">{n.toLocaleString()}</div>
      <div className="fm-label mt-1.5">{label}</div>
    </div>
  )
}
