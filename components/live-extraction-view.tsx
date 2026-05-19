'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import type { StreamState, RestaurantArrival } from '@/lib/use-stream-extract'
import { AtlasMap } from './atlas-map'
import { SourceBadge } from './source-badge'
import { photoUrl } from '@/lib/photo'
import { formatTimestamp, cn } from '@/lib/utils'
import type { Restaurant, SourceKind } from '@/lib/types'
import { Loader2, X, ArrowRight, ExternalLink, MapPin } from 'lucide-react'

export function LiveExtractionView({
  state,
  onReset,
  onForceRefresh,
}: {
  state: StreamState
  onReset: () => void
  onForceRefresh: () => void
}) {
  const elapsed = useElapsed(state.startedAt, state.finishedAt)
  const geocoded = state.restaurants.filter((r) => r.lat != null && r.lng != null)

  const mapRestaurants: Restaurant[] = useMemo(
    () =>
      geocoded.map((r) => ({
        id: r.id!,
        name: r.name,
        nameLocal: r.nameLocal,
        city: r.city,
        country: r.country,
        lat: r.lat!,
        lng: r.lng!,
        cuisine: r.cuisine,
        priceLevel: r.priceLevel,
        photoName: r.photoName,
        mentionCount: 1,
        topCreators: [],
      })),
    [geocoded]
  )

  const phaseLabel = phaseLabelFor(state)

  return (
    <div className="mt-6 bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-2 text-sm">
          {state.status !== 'complete' && state.status !== 'failed' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
          )}
          <span className="font-semibold">{phaseLabel}</span>
          <span className="font-mono text-xs text-[var(--muted)]">{elapsed}</span>
        </div>
        <button
          onClick={onReset}
          className="text-[var(--muted)] hover:text-[var(--foreground)] -m-1 p-1"
          aria-label="Cancel and start over"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Video thumbnail w/ scan-line (visible during watching phase, optional during others) */}
      {state.video?.thumbnailUrl && (
        <ScannedThumbnail
          src={state.video.thumbnailUrl}
          title={state.video.title}
          channel={state.video.channelName}
          sourceKind={state.video.sourceKind as SourceKind}
          isWatching={state.status === 'watching'}
        />
      )}

      {/* Message during watching */}
      {state.status === 'watching' && state.message && (
        <p className="px-5 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--muted-soft)]/40">
          {state.message}
        </p>
      )}

      {/* Restaurants column + mini-map */}
      {state.restaurants.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-0">
          <ol className="divide-y divide-[var(--border)]">
            <AnimatePresence initial={false}>
              {state.restaurants.map((r, idx) => (
                <motion.li
                  key={r.clientId}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                  className={cn('p-4', r.skipped && 'opacity-50')}
                >
                  <ArrivalCard arrival={r} index={idx} videoUrl={state.video?.url ?? ''} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          <div className="lg:border-l border-t lg:border-t-0 border-[var(--border)] bg-[var(--muted-soft)]/40 h-[280px] lg:h-[480px] lg:self-start relative">
            {mapRestaurants.length > 0 ? (
              <AtlasMap restaurants={mapRestaurants} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)] italic">
                Pins land here as places are geocoded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state during watching with no restaurants yet */}
      {state.status === 'watching' && state.restaurants.length === 0 && (
        <div className="px-5 py-6 text-center text-sm text-[var(--muted)]">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-[var(--accent)]" />
          Waiting on Gemini. No restaurants yet.
        </div>
      )}

      {/* Failed state */}
      {state.status === 'failed' && (
        <div className="p-5 text-sm text-red-700 border-t border-[var(--border)]">
          <div className="font-medium mb-1">Something went wrong</div>
          <div className="text-xs">{state.error}</div>
        </div>
      )}

      {/* Complete CTA */}
      {state.status === 'complete' && state.result && (
        <div className="p-5 border-t border-[var(--border)] space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/atlas"
              className="fm-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--foreground)] text-[var(--background)] font-semibold py-3 rounded-xl hover:bg-[var(--accent)]"
            >
              View on atlas
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={onReset}
              className="fm-btn px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--foreground)] text-sm font-semibold"
            >
              Add another
            </button>
          </div>
          <button
            onClick={onForceRefresh}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] underline underline-offset-2"
          >
            Re-extract from scratch (skip cache)
          </button>
        </div>
      )}
    </div>
  )
}

function phaseLabelFor(state: StreamState): string {
  if (state.status === 'idle') return 'Ready'
  if (state.status === 'connecting') return 'Connecting…'
  if (state.status === 'watching') return 'Watching the video'
  if (state.status === 'extracting') {
    const geocodedCount = state.restaurants.filter((r) => r.lat != null).length
    const total = state.totalCount ?? state.restaurants.length
    return `Pinning ${geocodedCount}/${total}`
  }
  if (state.status === 'complete')
    return `Done · ${state.result?.mentionsAdded ?? 0} ${
      (state.result?.mentionsAdded ?? 0) === 1 ? 'place' : 'places'
    }`
  if (state.status === 'failed') return 'Failed'
  return ''
}

function ArrivalCard({
  arrival,
  index,
  videoUrl,
}: {
  arrival: RestaurantArrival
  index: number
  videoUrl: string
}) {
  const photo = photoUrl(arrival.photoName, 200)
  const ts = arrival.timestampSec
  const videoUrlWithTime = ts != null ? `${videoUrl}&t=${Math.floor(ts)}s` : videoUrl
  return (
    <div className="flex items-stretch gap-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--muted-soft)] shrink-0 relative">
        {arrival.skipped ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)]">
            <X className="w-5 h-5" />
          </div>
        ) : photo ? (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={photo}
            alt={arrival.name}
            className="w-full h-full object-cover fm-photo"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold fm-num">
            {index + 1}
          </span>
          {arrival.id ? (
            <Link
              href={`/p/${arrival.id}`}
              className="font-semibold hover:text-[var(--accent)] transition"
            >
              {arrival.name}
            </Link>
          ) : (
            <span className="font-semibold">{arrival.name}</span>
          )}
          {arrival.nameLocal && (
            <span className="text-xs text-[var(--muted)]">{arrival.nameLocal}</span>
          )}
        </div>
        <div className="text-xs text-[var(--muted)] mt-0.5">
          {arrival.cuisine}
          {arrival.cuisine && ' · '}
          {arrival.city}
          {arrival.skipped && (
            <span className="ml-2 italic text-red-600">{arrival.skipReason}</span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <SourceBadge kind="youtube" size="sm" />
          {ts != null && videoUrl && (
            <a
              href={videoUrlWithTime}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <span className="font-mono">{formatTimestamp(ts)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <span className="text-xs text-[var(--muted)] italic truncate flex-1 min-w-0">
            &ldquo;{arrival.quote.slice(0, 80)}
            {arrival.quote.length > 80 ? '…' : ''}&rdquo;
          </span>
        </div>
      </div>
    </div>
  )
}

function ScannedThumbnail({
  src,
  title,
  channel,
  sourceKind,
  isWatching,
}: {
  src: string
  title?: string
  channel?: string
  sourceKind: SourceKind
  isWatching: boolean
}) {
  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={title ?? ''} className="absolute inset-0 w-full h-full object-cover" />
      {isWatching && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent)]/0 to-black/30" />
          <div className="absolute left-0 right-0 h-[2px] bg-[var(--accent)]/80 fm-scanline shadow-[0_0_18px_4px_rgba(218,63,42,0.6)]" />
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/85 to-transparent text-white">
        <div className="text-sm font-semibold line-clamp-1">{title}</div>
        <div className="text-xs opacity-70 flex items-center gap-1.5 mt-0.5">
          <MapPin className="w-3 h-3" />
          {channel}
          <span className="opacity-50">·</span>
          {sourceKind}
        </div>
      </div>
    </div>
  )
}

function useElapsed(startedAt: number | null, finishedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!startedAt || finishedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt, finishedAt])
  if (!startedAt) return '0:00'
  const end = finishedAt ?? now
  const total = Math.max(0, Math.floor((end - startedAt) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
