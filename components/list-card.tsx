import Link from 'next/link'
import { photoUrl } from '@/lib/photo'
import type { CuratedList } from '@/lib/lists'

/**
 * A curated list = (creator × city). Renders as a card with a photo
 * collage and "Mark Wiens × Hong Kong · 6 picks" caption.
 */
export function ListCard({ list }: { list: CuratedList }) {
  const photos = list.photoNames.map((n) => photoUrl(n, 400)).filter(Boolean) as string[]
  return (
    <Link
      href={`/c/${list.creatorSlug}?city=${encodeURIComponent(list.city)}`}
      className="group block bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--accent)]/40 transition"
    >
      <div className="grid grid-cols-2 gap-px h-36 bg-[var(--muted-soft)]">
        {Array.from({ length: 4 }).map((_, i) => {
          const src = photos[i]
          return src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div key={i} className="w-full h-full bg-[var(--muted-soft)]" />
          )
        })}
      </div>
      <div className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {list.creatorName}&apos;s
        </div>
        <div className="mt-0.5 font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition">
          {list.city}
        </div>
        <div className="mt-1 text-xs text-[var(--muted)] fm-num">
          {list.count} {list.count === 1 ? 'pick' : 'picks'}
        </div>
      </div>
    </Link>
  )
}
