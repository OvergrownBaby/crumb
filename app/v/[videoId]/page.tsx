import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-server'
import { AtlasMap } from '@/components/atlas-map'
import { CreatorAvatar } from '@/components/creator-avatar'
import { SourceBadge } from '@/components/source-badge'
import { photoUrl } from '@/lib/photo'
import { formatTimestamp } from '@/lib/utils'
import type { Restaurant, SourceKind, Platform } from '@/lib/types'
import { ArrowLeft, ExternalLink, Play, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

type VideoRow = {
  id: string
  url: string
  source_kind: SourceKind
  title: string | null
  thumbnail_url: string | null
  published_at: string | null
  created_at: string
  duration_sec: number | null
  creator_slug: string | null
  creators: {
    slug: string
    name: string
    platform: Platform
    avatar_url: string | null
    url: string | null
  } | null
}

type MentionRow = {
  id: string
  dish: string | null
  quote: string
  timestamp_sec: number | null
  restaurants: {
    id: string
    name: string
    name_local: string | null
    city: string
    country: string
    cuisine: string | null
    price_level: number | null
    photo_name: string | null
    lat: number
    lng: number
  } | null
  dish_mentions: Array<{
    id: string
    name: string
    quote: string
    timestamp_sec: number | null
  }>
}

async function loadVideo(idParam: string) {
  const sb = supabaseAdmin()
  // Try YouTube prefix first, then fall back to raw id (for article/reddit hashes)
  const candidates = [`yt:${idParam}`, idParam]
  for (const id of candidates) {
    const { data: video } = await sb
      .from('videos')
      .select(
        `id, url, source_kind, title, thumbnail_url, published_at, created_at, duration_sec, creator_slug,
         creators ( slug, name, platform, avatar_url, url )`
      )
      .eq('id', id)
      .maybeSingle<VideoRow>()
    if (video) {
      const { data: mentions } = await sb
        .from('mentions')
        .select(
          `id, dish, quote, timestamp_sec,
           restaurants ( id, name, name_local, city, country, cuisine, price_level, photo_name, lat, lng ),
           dish_mentions ( id, name, quote, timestamp_sec )`
        )
        .eq('video_id', id)
        .order('timestamp_sec', { ascending: true, nullsFirst: false })
        .returns<MentionRow[]>()
      return { video, mentions: mentions ?? [] }
    }
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>
}): Promise<Metadata> {
  const { videoId } = await params
  const data = await loadVideo(videoId)
  if (!data) return { title: 'Not found' }
  const count = data.mentions.length
  return {
    title: data.video.title ?? 'Video',
    description: `${count} restaurants pinned from ${data.video.creators?.name ?? 'this video'}.`,
  }
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  const { videoId } = await params
  const data = await loadVideo(videoId)
  if (!data) notFound()
  const { video, mentions } = data

  const restaurants: Restaurant[] = mentions
    .map((m) => m.restaurants)
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      nameLocal: r.name_local ?? undefined,
      city: r.city,
      country: r.country,
      lat: r.lat,
      lng: r.lng,
      cuisine: r.cuisine ?? undefined,
      priceLevel: (r.price_level ?? undefined) as Restaurant['priceLevel'],
      photoName: r.photo_name ?? undefined,
      mentionCount: 1,
      topCreators: [],
    }))

  const parsedAgo = relativeTime(video.created_at)

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        {/* Hero — video thumbnail + title + meta */}
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="group relative block aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-[var(--border)]"
        >
          {video.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt={video.title ?? ''}
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/95 group-hover:bg-white text-[var(--accent)] shadow-2xl transition group-hover:scale-105">
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-2 text-xs">
              <SourceBadge kind={video.source_kind} />
            </div>
            <h1 className="fm-display text-2xl sm:text-3xl lg:text-4xl leading-tight font-semibold drop-shadow">
              {video.title ?? 'Untitled video'}
            </h1>
          </div>
        </a>

        {/* Meta strip */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {video.creators && (
            <Link
              href={`/c/${video.creators.slug}`}
              className="inline-flex items-center gap-2 group"
            >
              <CreatorAvatar
                creator={{
                  slug: video.creators.slug,
                  name: video.creators.name,
                  platform: video.creators.platform,
                  avatarUrl: video.creators.avatar_url ?? undefined,
                  videoCount: 0,
                  restaurantCount: 0,
                }}
                size="md"
                link={false}
              />
              <span className="font-semibold text-sm group-hover:text-[var(--accent)] transition">
                {video.creators.name}
              </span>
            </Link>
          )}
          <span className="text-xs text-[var(--muted)]">parsed {parsedAgo}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold">
            <MapPin className="w-4 h-4 text-[var(--accent)]" />
            {restaurants.length} {restaurants.length === 1 ? 'place' : 'places'} pinned
          </span>
        </div>

        {/* Map */}
        {restaurants.length > 0 && (
          <div className="mt-6 rounded-2xl overflow-hidden ring-1 ring-[var(--border)] h-[360px] bg-white">
            <AtlasMap restaurants={restaurants} className="w-full h-full" />
          </div>
        )}

        {/* Mentions list */}
        <ol className="mt-8 space-y-3">
          {mentions.map((m, idx) => {
            const r = m.restaurants
            if (!r) return null
            const photo = photoUrl(r.photo_name, 400)
            const ts = m.timestamp_sec
            const tsLink =
              ts != null ? `${video.url}&t=${Math.floor(ts)}s` : video.url
            return (
              <li
                key={m.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 hover:border-[var(--accent)]/40 transition flex gap-4"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={r.name}
                    className="w-20 h-20 rounded-xl object-cover fm-photo shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[var(--muted-soft)] shrink-0 flex items-center justify-center">
                    <span className="fm-display text-2xl text-[var(--muted)]">
                      {idx + 1}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold fm-num">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/p/${r.id}`}
                      className="font-semibold hover:text-[var(--accent)] transition"
                    >
                      {r.name}
                    </Link>
                    {r.name_local && (
                      <span className="text-xs text-[var(--muted)]">
                        {r.name_local}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {r.cuisine && <>{r.cuisine} · </>}
                    {r.city}
                  </div>
                  {m.dish && (
                    <div className="mt-2 text-xs">
                      <span className="font-semibold text-[var(--foreground)]">
                        Dish:
                      </span>{' '}
                      <span className="text-[var(--foreground-soft)]">{m.dish}</span>
                    </div>
                  )}
                  <blockquote className="mt-1.5 text-sm text-[var(--foreground-soft)] italic leading-relaxed">
                    &ldquo;{m.quote}&rdquo;
                  </blockquote>
                  {ts != null && (
                    <a
                      href={tsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      <span className="font-mono">{formatTimestamp(ts)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(iso).toLocaleDateString()
}
