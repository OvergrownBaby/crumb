import Link from 'next/link'
import type { Creator } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CreatorChip({
  creator,
  size = 'md',
  className,
}: {
  creator: Creator
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sz =
    size === 'sm' ? 'w-5 h-5 text-[10px]' : size === 'lg' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'
  const initials = creator.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <Link
      href={`/c/${creator.slug}`}
      className={cn(
        'inline-flex items-center gap-1.5 group',
        className
      )}
    >
      {creator.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creator.avatarUrl}
          alt={creator.name}
          className={cn('rounded-full ring-2 ring-white object-cover', sz)}
        />
      ) : (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-[var(--accent)] text-white font-bold',
            sz
          )}
        >
          {initials}
        </span>
      )}
      <span
        className={cn(
          'group-hover:underline underline-offset-2',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {creator.name}
      </span>
    </Link>
  )
}
