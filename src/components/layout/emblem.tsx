import { cn } from '@/lib/utils'

/**
 * A neutral product mark, deliberately not the State Emblem. Using the real
 * emblem would imply government approval this prototype does not have.
 */
export function Emblem({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--brand)] text-[0.6875rem] font-bold tracking-tight text-white',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-full p-1.5" fill="none">
        <path d="M16 3 5 8v8.5C5 23 9.7 28.2 16 29.5 22.3 28.2 27 23 27 16.5V8L16 3Z" fill="var(--gold)" />
        <path
          d="M11 15.5h10M11 19h10M13.5 12h5"
          stroke="var(--brand)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
