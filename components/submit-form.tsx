'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SourceKind } from '@/lib/types'
import { SourceBadge } from './source-badge'
import { CreatorAvatar } from './creator-avatar'
import { Loader2, Sparkles, Link as LinkIcon, Check, X, ExternalLink, ArrowRight } from 'lucide-react'
import { cn, formatTimestamp } from '@/lib/utils'

type Stage = 'idle' | 'fetching' | 'extracting' | 'geocoding' | 'done' | 'failed'

const STAGES: Array<{ key: Stage; label: string; sub: string }> = [
  { key: 'fetching', label: 'Fetching', sub: 'Loading the video / article…' },
  { key: 'extracting', label: 'Reading', sub: 'AI is watching and listening…' },
  { key: 'geocoding', label: 'Mapping', sub: 'Finding each place on the map…' },
  { key: 'done', label: 'Done', sub: 'Pins added to the atlas' },
]

type ResultRestaurant = {
  id: string
  name: string
  nameLocal?: string
  city: string
  country: string
  cuisine?: string
  priceLevel?: number
}

type ResultMention = {
  id: string
  restaurant_id: string
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
  } | null
}

type ExtractResponse = {
  jobId?: string
  videoId?: string
  restaurantsAdded?: number
  mentionsAdded?: number
  skippedNoGeocode?: number
  mentions?: ResultMention[]
  error?: string
}

export function SubmitForm() {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    sourceUrl: string
    sourceKind: SourceKind
    creatorName?: string
    restaurants: ResultRestaurant[]
    mentions: Array<{
      id: string
      restaurantId: string
      dish?: string
      quote: string
      timestampSec?: number
    }>
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setError(null)
    setResult(null)

    // Optimistic progress UX while the (potentially long) API call runs.
    setStage('fetching')

    try {
      // Bump through stages on a timer so the user sees movement even though
      // the backend completes them all in one call. The real one finishes
      // at the API response.
      const stageTimer = stepStages(setStage)

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      stageTimer.cancel()

      const body = (await res.json()) as ExtractResponse

      if (!res.ok || body.error) {
        setStage('failed')
        setError(body.error ?? `Request failed (${res.status})`)
        return
      }

      const mentions = (body.mentions ?? []).filter((m): m is ResultMention & {
        restaurants: NonNullable<ResultMention['restaurants']>
      } => m.restaurants !== null)

      const restaurants: ResultRestaurant[] = mentions.map((m) => ({
        id: m.restaurants.id,
        name: m.restaurants.name,
        nameLocal: m.restaurants.name_local ?? undefined,
        city: m.restaurants.city,
        country: m.restaurants.country,
        cuisine: m.restaurants.cuisine ?? undefined,
        priceLevel: m.restaurants.price_level ?? undefined,
      }))

      const ms = mentions.map((m) => ({
        id: m.id,
        restaurantId: m.restaurant_id,
        dish: m.dish ?? undefined,
        quote: m.quote,
        timestampSec: m.timestamp_sec ?? undefined,
      }))

      // Best-effort source kind inference from URL
      const sourceKind: SourceKind = /youtube\.com|youtu\.be/.test(url)
        ? 'youtube'
        : /reddit\.com/.test(url)
          ? 'reddit'
          : 'article'

      setResult({
        sourceUrl: url,
        sourceKind,
        restaurants,
        mentions: ms,
      })
      setStage('done')
    } catch (err) {
      setStage('failed')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function reset() {
    setStage('idle')
    setResult(null)
    setError(null)
    setUrl('')
  }

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'failed'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-[var(--muted)] mb-2"
        >
          Paste a link
        </label>
        <div className="flex items-center gap-2 bg-white border border-[var(--border)] rounded-2xl pl-4 pr-2 py-2 focus-within:ring-2 focus-within:ring-[var(--accent)]/30 focus-within:border-[var(--accent)] transition">
          <LinkIcon className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <input
            id="url"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…  or  reddit / eater / blog"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
          />
          <button
            type="submit"
            disabled={!url.trim() || busy}
            className={cn(
              'fm-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm',
              !url.trim() || busy
                ? 'bg-[var(--muted-soft)] text-[var(--muted)] cursor-not-allowed'
                : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
            )}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract
              </>
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-[var(--muted)]">
          Works on YouTube, Reddit, and most articles. Long-form videos can take 1–3 minutes.
        </p>
      </form>

      {(busy || stage === 'done' || stage === 'failed') && (
        <div className="mt-8 bg-white rounded-2xl border border-[var(--border)] p-5">
          <ol className="grid grid-cols-4 gap-3">
            {STAGES.map((s, i) => {
              const reached = stageIndex(stage) >= i
              const current = stage === s.key
              return (
                <li
                  key={s.key}
                  className={cn(
                    'rounded-xl p-3 border transition',
                    current
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : reached
                        ? 'border-[var(--border)] bg-[var(--muted-soft)]'
                        : 'border-[var(--border)] bg-white opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    <span>Step {i + 1}</span>
                    {reached && !current && <Check className="w-3 h-3 text-green-600" />}
                    {current && <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-[var(--muted)]">{s.sub}</div>
                </li>
              )
            })}
          </ol>

          {stage === 'failed' && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-700">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Failed</div>
                <div className="text-xs">{error ?? 'Something went wrong'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === 'done' && result && (
        <div className="mt-8 bg-white rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">
                Added {result.restaurants.length}{' '}
                {result.restaurants.length === 1 ? 'restaurant' : 'restaurants'}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                These are now live on the atlas.
              </p>
            </div>
            <button
              onClick={reset}
              className="fm-btn text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Add another
            </button>
          </div>

          {result.restaurants.length === 0 ? (
            <p className="text-sm text-[var(--muted)] italic">
              Nothing extracted — either no restaurants were mentioned, or the AI couldn&apos;t
              find verbatim quotes to back them up.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.restaurants.map((r) => {
                const m = result.mentions.find((m) => m.restaurantId === r.id)
                const ts = m?.timestampSec
                const videoUrlWithTime =
                  ts != null && result.sourceKind === 'youtube'
                    ? `${result.sourceUrl}&t=${Math.floor(ts)}s`
                    : result.sourceUrl
                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/40 transition"
                  >
                    <Link
                      href={`/p/${r.id}`}
                      className="mt-0.5 w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 font-bold text-sm hover:bg-[var(--accent)] hover:text-white transition"
                      aria-label={`Open ${r.name}`}
                    >
                      📍
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/p/${r.id}`}
                          className="font-semibold hover:text-[var(--accent)] transition"
                        >
                          {r.name}
                        </Link>
                        {r.nameLocal && (
                          <span className="text-xs text-[var(--muted)]">{r.nameLocal}</span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        {r.cuisine}
                        {r.cuisine && ' · '}
                        {r.city}
                      </div>
                      {m && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <SourceBadge kind={result.sourceKind} size="sm" />
                          <a
                            href={videoUrlWithTime}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            {ts != null && (
                              <span className="font-mono">{formatTimestamp(ts)}</span>
                            )}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-xs text-[var(--muted)] italic truncate flex-1 min-w-0">
                            &ldquo;{m.quote.slice(0, 80)}
                            {m.quote.length > 80 ? '…' : ''}&rdquo;
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-5 flex gap-2">
            <Link
              href="/atlas"
              className="fm-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--foreground)] text-[var(--background)] font-semibold py-3 rounded-xl hover:bg-[var(--accent)]"
            >
              View on atlas
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={reset}
              className="fm-btn px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--foreground)] text-sm font-semibold"
            >
              Add another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function stageIndex(s: Stage): number {
  const order: Stage[] = ['idle', 'fetching', 'extracting', 'geocoding', 'done']
  return order.indexOf(s)
}

// Step the visible stage forward on a timer, so the user sees movement
// even though the API call is doing everything in one shot.
function stepStages(setStage: (s: Stage) => void) {
  const t1 = setTimeout(() => setStage('extracting'), 2_500)
  const t2 = setTimeout(() => setStage('geocoding'), 30_000)
  return {
    cancel: () => {
      clearTimeout(t1)
      clearTimeout(t2)
    },
  }
}
