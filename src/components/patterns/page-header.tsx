import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Exactly one primary action per screen, by construction — the slot is
 * singular. Everything else belongs in the body as a secondary control.
 */
export function PageHeader({
  eyebrow,
  title,
  sub,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  sub?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="text-[1.5rem] font-bold tracking-[-0.025em] text-balance sm:text-[1.75rem]">
          {title}
        </h2>
        {sub ? (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

/**
 * Sections are titled with an eyebrow, not a heading. It keeps the type ramp
 * flat inside a page so the only large text on screen is the number or the
 * question the page is actually about.
 */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex min-h-8 items-center justify-between gap-4', className)}>
      <h3 className="eyebrow">{children}</h3>
      {action}
    </div>
  )
}

/** A card's own title — the same weight everywhere, so cards read as peers. */
export function PanelTitle({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-7 items-center justify-between gap-4', className)}>
      <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{children}</h3>
      {action}
    </div>
  )
}
