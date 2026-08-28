import { cn } from '@/lib/utils'

/**
 * A neutral product mark, deliberately not the State Emblem — using the real
 * emblem would imply government approval this prototype does not have.
 *
 * "पf" is the fund in both scripts at once: भविष्य निधि and provident fund.
 */
export function Emblem({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-sm bg-primary font-extrabold text-primary-foreground select-none',
        'text-[0.72em] leading-none tracking-[-0.02em]',
        className,
      )}
      aria-hidden
    >
      पf
    </span>
  )
}
