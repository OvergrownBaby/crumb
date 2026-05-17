import Link from 'next/link'
import type { Creator } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CreatorAvatar({
  creator,
  size = 'md',
  className,
  link = true,
}: {
  creator: Creator
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  link?: boolean
}) {
  const sz =
    size === 'sm'
      ? 'w-6 h-6 text-[10px]'
      : size === 'lg'
        ? 'w-10 h-10 text-base'
        : size === 'xl'
          ? 'w-16 h-16 text-xl'
          : 'w-8 h-8 text-xs'

  const initials = creator.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  const inner = creator.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={creator.avatarUrl}
      alt={creator.name}
      className={cn('rounded-full ring-2 ring-white object-cover', sz, className)}
    />
  ) : (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[var(--accent)] text-white font-bold ring-2 ring-white',
        sz,
        className
      )}
    >
      {initials}
    </span>
  )

  if (!link) return inner
  return (
    <Link href={`/c/${creator.slug}`} title={creator.name}>
      {inner}
    </Link>
  )
}
