import type { SourceKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const LABELS: Record<SourceKind, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  article: 'Article',
  maps_list: 'Maps',
  text_paste: 'Text',
}

const CLASSES: Record<SourceKind, string> = {
  youtube: 'bg-red-50 text-red-700 ring-red-200',
  tiktok: 'bg-zinc-100 text-zinc-900 ring-zinc-300',
  reddit: 'bg-orange-50 text-orange-700 ring-orange-200',
  article: 'bg-stone-100 text-stone-700 ring-stone-300',
  maps_list: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  text_paste: 'bg-amber-50 text-amber-800 ring-amber-200',
}

function Glyph({ kind }: { kind: SourceKind }) {
  const props = {
    viewBox: '0 0 16 16',
    className: 'w-3 h-3',
    'aria-hidden': true,
  } as const
  switch (kind) {
    case 'youtube':
      return (
        <svg {...props}>
          <rect x="1" y="3" width="14" height="10" rx="2.5" fill="currentColor" opacity="0.18" />
          <path d="M6.5 5.7 v4.6 L11 8 z" fill="currentColor" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...props}>
          <path
            d="M9.5 2v7.2a2.2 2.2 0 11-2.2-2.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M9.5 2c.3 1.7 1.5 2.7 3.2 2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      )
    case 'reddit':
      return (
        <svg {...props}>
          <circle cx="8" cy="9" r="5.5" fill="currentColor" opacity="0.18" />
          <circle cx="6" cy="8.5" r="0.9" fill="currentColor" />
          <circle cx="10" cy="8.5" r="0.9" fill="currentColor" />
          <path d="M5.5 11.2 Q 8 12.6 10.5 11.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="4" r="1" fill="currentColor" />
          <path d="M11.5 4.5 L 8.6 7" stroke="currentColor" strokeWidth="1" />
        </svg>
      )
    case 'article':
      return (
        <svg {...props}>
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M4 6h8M4 8.5h8M4 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'maps_list':
      return (
        <svg {...props}>
          <path
            d="M8 2c-2.4 0-4.3 1.9-4.3 4.3 0 3 4.3 7.7 4.3 7.7s4.3-4.7 4.3-7.7C12.3 3.9 10.4 2 8 2z"
            fill="currentColor"
            opacity="0.85"
          />
          <circle cx="8" cy="6.3" r="1.4" fill="white" />
        </svg>
      )
    case 'text_paste':
      return (
        <svg {...props}>
          <path
            d="M3 4.5 L 13 4.5 M 3 7.5 L 11 7.5 M 3 10.5 L 12 10.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

export function SourceBadge({
  kind,
  size = 'md',
  className,
}: {
  kind: SourceKind
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full ring-1 ring-inset font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
        CLASSES[kind],
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5',
        className
      )}
    >
      <Glyph kind={kind} />
      <span className="tracking-wide">{LABELS[kind]}</span>
    </span>
  )
}
