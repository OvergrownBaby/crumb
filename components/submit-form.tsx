'use client'

import { useState } from 'react'
import { submitUrl } from '@/lib/data'
import type { Restaurant, Mention } from '@/lib/types'
import { MOCK_RESTAURANTS, MOCK_MENTIONS } from '@/lib/mock-data'
import { SourceBadge } from './source-badge'
import { CreatorAvatar } from './creator-avatar'
import { Loader2, Sparkles, Link as LinkIcon, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Stage = 'idle' | 'fetching' | 'extracting' | 'geocoding' | 'done' | 'failed'

const STAGES: Array<{ key: Stage; label: string; sub: string }> = [
  { key: 'fetching', label: 'Fetching', sub: 'Loading the video / article…' },
  { key: 'extracting', label: 'Reading', sub: 'AI is watching and listening…' },
  { key: 'geocoding', label: 'Mapping', sub: 'Finding each place on the map…' },
  { key: 'done', label: 'Done', sub: 'Pins ready to add to your atlas' },
]

export function SubmitForm() {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    restaurants: Restaurant[]
    mentions: Mention[]
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setError(null)
    setResult(null)

    try {
      // For mock UX, simulate the staged progress
      setStage('fetching')
      await sleep(700)
      setStage('extracting')
      await sleep(1500)
      setStage('geocoding')
      await sleep(900)

      const job = await submitUrl(url)
      // mock mode: just use a slice of mock data
      const restaurants = MOCK_RESTAURANTS.slice(0, 6)
      const mentions = MOCK_MENTIONS.slice(0, 6)
      setResult({ restaurants, mentions })
      setStage('done')
      // suppress unused warning
      void job
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
            placeholder="https://www.youtube.com/watch?v=…  or  reddit / eater / tiktok / anything"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
          />
          <button
            type="submit"
            disabled={!url.trim() || busy}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition',
              !url.trim() || busy
                ? 'bg-[var(--muted-soft)] text-[var(--muted)] cursor-not-allowed'
                : 'bg-[var(--accent)] text-white hover:opacity-90'
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
          Works on YouTube, TikTok, Instagram, Reddit, Eater / Infatuation / Time Out / blogs, and
          Google Maps share links. We watch, read, and geocode — usually in under a minute.
        </p>
      </form>

      {/* Progress strip */}
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
            <div className="mt-4 flex items-center gap-2 text-sm text-red-700">
              <X className="w-4 h-4" />
              {error ?? 'Something went wrong'}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {stage === 'done' && result && (
        <div className="mt-8 bg-white rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Found {result.restaurants.length} restaurants</h2>
              <p className="text-sm text-[var(--muted)]">
                Review and confirm to add them to the atlas.
              </p>
            </div>
            <button
              onClick={reset}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Start over
            </button>
          </div>
          <ul className="space-y-2">
            {result.restaurants.map((r) => {
              const m = result.mentions.find((m) => m.restaurantId === r.id)
              return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/40 transition"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 font-bold text-sm">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.name}</span>
                      {r.nameLocal && (
                        <span className="text-xs text-[var(--muted)]">{r.nameLocal}</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {r.cuisine} · {r.city}
                    </div>
                    {m && (
                      <div className="mt-2 flex items-center gap-2">
                        <SourceBadge kind={m.source.kind} size="sm" />
                        {m.source.creator && (
                          <CreatorAvatar creator={m.source.creator} size="sm" />
                        )}
                        <span className="text-xs text-[var(--muted)] italic truncate">
                          &ldquo;{m.quote.slice(0, 80)}…&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-5 flex gap-2">
            <button className="flex-1 bg-[var(--accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 inline-flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              Add to atlas
            </button>
            <button
              onClick={reset}
              className="px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--foreground)] text-sm font-semibold"
            >
              Discard
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
