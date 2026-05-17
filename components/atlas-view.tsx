'use client'

import { useMemo, useState } from 'react'
import type { Restaurant, Mention, Creator, SourceKind } from '@/lib/types'
import { AtlasMap } from './atlas-map'
import { CreatorAvatar } from './creator-avatar'
import { SourceBadge } from './source-badge'
import { formatTimestamp, priceDots, cn } from '@/lib/utils'
import { X, MapPin, ExternalLink, Filter } from 'lucide-react'

type Props = {
  restaurants: Restaurant[]
  mentions: Mention[]
  creators: Creator[]
}

const ALL_SOURCE_KINDS: SourceKind[] = [
  'youtube',
  'tiktok',
  'reddit',
  'article',
  'maps_list',
  'text_paste',
]

export function AtlasView({ restaurants, mentions, creators }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCreator, setActiveCreator] = useState<string | null>(null)
  const [activeSources, setActiveSources] = useState<SourceKind[]>(ALL_SOURCE_KINDS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (activeCreator && !r.topCreators.some((c) => c.slug === activeCreator)) {
        return false
      }
      const restaurantMentions = mentions.filter((m) => m.restaurantId === r.id)
      if (restaurantMentions.length === 0) return true
      return restaurantMentions.some((m) => activeSources.includes(m.source.kind))
    })
  }, [restaurants, mentions, activeCreator, activeSources])

  // Clear selection if it falls out of filters — derive instead of effect
  const effectiveSelectedId =
    selectedId && filtered.some((r) => r.id === selectedId) ? selectedId : null
  const selected = effectiveSelectedId
    ? filtered.find((r) => r.id === effectiveSelectedId) ?? null
    : null
  const selectedMentions = selected
    ? mentions.filter((m) => m.restaurantId === selected.id)
    : []

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      {/* Sidebar */}
      <aside className="lg:w-80 xl:w-96 border-r border-[var(--border)] bg-[var(--background)] flex flex-col">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="fm-label">Browse</div>
          <h1 className="fm-display text-2xl mt-1">Atlas</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'restaurant' : 'restaurants'}
            {activeCreator
              ? ` from ${creators.find((c) => c.slug === activeCreator)?.name}`
              : ' from everyone'}
          </p>
        </div>

        {/* Filter rail */}
        <div className="p-5 space-y-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="fm-label">Creator</span>
            {activeCreator && (
              <button
                onClick={() => setActiveCreator(null)}
                className="text-[11px] text-[var(--accent)] hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCreator(null)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition',
                !activeCreator
                  ? 'bg-[var(--foreground)] text-white ring-[var(--foreground)]'
                  : 'bg-white text-[var(--foreground)] ring-[var(--border)] hover:ring-[var(--foreground)]/30'
              )}
            >
              Everyone
            </button>
            {creators
              .filter((c) => c.restaurantCount > 0)
              .map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setActiveCreator(c.slug)}
                  className={cn(
                    'inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition',
                    activeCreator === c.slug
                      ? 'bg-[var(--foreground)] text-white ring-[var(--foreground)]'
                      : 'bg-white text-[var(--foreground)] ring-[var(--border)] hover:ring-[var(--foreground)]/30'
                  )}
                >
                  <CreatorAvatar creator={c} size="sm" link={false} />
                  {c.name}
                </button>
              ))}
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <Filter className="w-3 h-3" />
            {filtersOpen ? 'Hide' : 'More'} filters
          </button>

          {filtersOpen && (
            <div className="pt-2 space-y-2">
              <div className="fm-label">Source</div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SOURCE_KINDS.map((kind) => {
                  const on = activeSources.includes(kind)
                  return (
                    <button
                      key={kind}
                      onClick={() =>
                        setActiveSources(
                          on
                            ? activeSources.filter((k) => k !== kind)
                            : [...activeSources, kind]
                        )
                      }
                      className={cn(
                        'transition',
                        !on && 'opacity-40 hover:opacity-80'
                      )}
                    >
                      <SourceBadge kind={kind} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Restaurant list */}
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition',
                    effectiveSelectedId === r.id
                      ? 'bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/30'
                      : 'hover:bg-[var(--muted-soft)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.name}</div>
                      {r.nameLocal && (
                        <div className="text-xs text-[var(--muted)] truncate">
                          {r.nameLocal}
                        </div>
                      )}
                      <div className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
                        {r.cuisine}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {r.priceLevel && (
                        <span className="text-[10px] text-[var(--muted)] font-medium">
                          {priceDots(r.priceLevel)}
                        </span>
                      )}
                      <div className="flex -space-x-1.5">
                        {r.topCreators.slice(0, 3).map((c) => (
                          <CreatorAvatar key={c.slug} creator={c} size="sm" link={false} />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative min-h-[55vh] lg:min-h-0">
        <AtlasMap
          restaurants={filtered}
          selectedId={effectiveSelectedId}
          onSelect={setSelectedId}
          className="absolute inset-0"
        />

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            restaurant={selected}
            mentions={selectedMentions}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}

function DetailPanel({
  restaurant,
  mentions,
  onClose,
}: {
  restaurant: Restaurant
  mentions: Mention[]
  onClose: () => void
}) {
  const ytMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name} ${restaurant.city}`
  )}`

  return (
    <div className="absolute bottom-0 left-0 right-0 lg:left-auto lg:top-4 lg:right-4 lg:bottom-4 lg:w-[420px] bg-[var(--card)] rounded-t-2xl lg:rounded-3xl shadow-[var(--shadow-pop)] border border-[var(--border-strong)] flex flex-col max-h-[60vh] lg:max-h-[calc(100vh-7rem)]">
      <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="fm-display text-xl leading-tight">{restaurant.name}</h2>
          {restaurant.nameLocal && (
            <p className="text-sm text-[var(--muted)] font-medium">{restaurant.nameLocal}</p>
          )}
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            {restaurant.cuisine}
            {restaurant.priceLevel && (
              <>
                <span className="mx-1.5 opacity-40">/</span>
                <span className="font-mono">{priceDots(restaurant.priceLevel)}</span>
              </>
            )}
            <span className="mx-1.5 opacity-40">/</span>
            <span className="fm-label !text-[var(--muted)] !text-[10px]">{restaurant.city}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 -m-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-[var(--border)]">
          {mentions.map((m) => (
            <li key={m.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <SourceBadge kind={m.source.kind} />
                {m.source.creator && (
                  <CreatorAvatar creator={m.source.creator} size="sm" />
                )}
                <a
                  href={
                    m.timestampSec != null
                      ? `${m.source.url}&t=${Math.floor(m.timestampSec)}s`
                      : m.source.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                >
                  {m.timestampSec != null && (
                    <span className="font-mono">{formatTimestamp(m.timestampSec)}</span>
                  )}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {m.dish && (
                <div className="text-xs text-[var(--muted)] mb-1">
                  <span className="font-semibold text-[var(--foreground)]">Dish:</span>{' '}
                  {m.dish}
                </div>
              )}
              <blockquote className="relative text-sm text-[var(--foreground-soft)] pl-4 leading-relaxed">
                <span
                  aria-hidden
                  className="absolute -left-0.5 top-0 fm-display text-[28px] leading-none text-[var(--accent)]/40"
                >
                  &ldquo;
                </span>
                <span className="italic">{m.quote}</span>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 border-t border-[var(--border)] flex gap-2">
        <a
          href={ytMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--foreground)] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90"
        >
          <MapPin className="w-4 h-4" />
          Open in Maps
        </a>
        <a
          href={`/p/${restaurant.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-[var(--foreground)] border border-[var(--border)] text-sm font-medium py-2 rounded-xl hover:border-[var(--accent)]"
        >
          Details →
        </a>
      </div>
    </div>
  )
}
