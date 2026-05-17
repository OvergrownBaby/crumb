import { cn } from '@/lib/utils'

/**
 * Crumb logo: a map-pin teardrop with a lowercase "c" cut out of its body.
 * Single closed shape using even-odd fill — works at any size.
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
          d="M12 2C6.48 2 2 6.48 2 12c0 4 2.5 7 6 8.5L12 23l4-2.5c3.5-1.5 6-4.5 6-8.5 0-5.52-4.48-10-10-10Zm0 5c2 0 3.7 1 4.5 2.6L14 10.7c-.5-.7-1.2-1-2-1-1.4 0-2.5 1-2.5 2.5S10.6 14.7 12 14.7c.8 0 1.5-.3 2-1l2.5 1.1c-.8 1.6-2.5 2.6-4.5 2.6-3 0-5.5-2.5-5.5-5.2C6.5 9.5 9 7 12 7Z"
        />
      </svg>
    </span>
  )
}
