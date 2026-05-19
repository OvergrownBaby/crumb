import { cn } from '@/lib/utils'

/**
 * Foodcrawl logo: a bare map-pin teardrop with a circular center hole
 * (the classic location-marker silhouette). Single shape, scales at any
 * size, no letterform geometry to fight with.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] text-white',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(218,63,42,0.35)]',
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="w-[64%] h-[64%]" aria-hidden fill="currentColor">
        <path
          fillRule="evenodd"
          d="M12 2C6.48 2 2 6.48 2 12c0 4 2.5 7 6 8.5L12 23l4-2.5c3.5-1.5 6-4.5 6-8.5 0-5.52-4.48-10-10-10Zm0 6a4 4 0 100 8 4 4 0 000-8Z"
        />
      </svg>
    </span>
  )
}
