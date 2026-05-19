import Link from 'next/link'
import type { LatestVideo } from '@/lib/videos'
import { photoUrl } from '@/lib/photo'
import { SourceBadge } from './source-badge'
import { Play, MapPin } from 'lucide-react'

export function VideoCard({ video }: { video: LatestVideo }) {
  const ago = relativeTime(video.createdAt)

  return (
    <Link
      href={`/v/${video.pathSlug}`}
      className="group block bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--accent)]/40 hover:shadow-md transition flex flex-col"
    >
      {/* Hero — video thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title ?? ''}
            className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute top-3 left-3">
          <SourceBadge kind={video.sourceKind} />
        </span>
        <span className="absolute bottom-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 group-hover:bg-white text-[var(--accent)] shadow-lg transition group-hover:scale-105">
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[11px] font-semibold text-[var(--foreground)] shadow-sm">
          <MapPin className="w-3 h-3 text-[var(--accent)]" />
          {video.restaurantCount}
          <span className="text-[var(--muted)] font-medium">
            {video.restaurantCount === 1 ? 'place' : 'places'}
          </span>
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <h3 className="fm-display text-lg leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition">
          {video.title ?? 'Untitled'}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          {video.creator?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.creator.avatarUrl}
              alt={video.creator.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : video.creator ? (
            <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold inline-flex items-center justify-center">
              {video.creator.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
          ) : null}
          {video.creator && (
            <span className="font-medium text-[var(--foreground-soft)] truncate">
              {video.creator.name}
            </span>
          )}
          <span className="opacity-60">·</span>
          <span>{ago}</span>
        </div>

        {/* Restaurant preview strip */}
        {video.previewRestaurants.length > 0 && (
          <div className="flex items-center gap-1.5 -mx-0.5">
            {video.previewRestaurants.map((r) => {
              const photo = photoUrl(r.photoName, 200)
              return (
                <div
                  key={r.id}
                  title={r.name}
                  className="relative aspect-square flex-1 min-w-0 max-w-[25%] rounded-lg overflow-hidden bg-[var(--muted-soft)] ring-1 ring-[var(--border)]"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={r.name}
                      className="absolute inset-0 w-full h-full object-cover fm-photo"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-wider text-[var(--muted)] px-1 text-center">
                      {r.name.split(/\s+/).slice(0, 2).join(' ')}
                    </div>
                  )}
                </div>
              )
            })}
            {video.restaurantCount > video.previewRestaurants.length && (
              <span className="px-2 text-xs text-[var(--muted)] font-medium shrink-0">
                +{video.restaurantCount - video.previewRestaurants.length}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
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
