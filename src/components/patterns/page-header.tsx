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
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {sub ? <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">{sub}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

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
    <div className={cn('mb-3 flex items-center justify-between gap-4', className)}>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>
      {action}
    </div>
  )
}
