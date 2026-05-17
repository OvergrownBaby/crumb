import { cn } from '@/lib/utils'

/**
 * Pin + bowl-of-noodles glyph. Solid form with a tiny spoon / chopstick
 * line through it. Sits inside a rounded square chip.
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
      <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" aria-hidden>
        {/* pin outline */}
        <path
          d="M12 3c-3.6 0-6.5 2.9-6.5 6.5 0 4.6 6 11 6.3 11.3.1.1.3.2.2.2s.1-.1.2-.2c.3-.3 6.3-6.7 6.3-11.3C18.5 5.9 15.6 3 12 3Z"
          fill="currentColor"
        />
        {/* bowl inside */}
        <path
          d="M8.5 9.3c0 .9 1.6 1.6 3.5 1.6s3.5-.7 3.5-1.6"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
        {/* steam squiggle */}
        <path
          d="M10.5 6.1c.3.4-.2.8 0 1.2M12 5.5c.3.4-.2.9 0 1.4M13.5 6.1c.3.4-.2.8 0 1.2"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}
