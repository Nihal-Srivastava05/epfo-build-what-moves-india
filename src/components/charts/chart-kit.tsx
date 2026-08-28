import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The frame around a plot: card, title, one line of plain English, legend. */

export function ChartCard({
  title,
  blurb,
  action,
  children,
  className,
}: {
  title: string
  blurb: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('panel p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="eyebrow">{title}</h3>
          <p className="mt-1.5 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
            {blurb}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * Always present once two series share a plot: identity never rests on colour
 * alone, and a legend is the channel that survives a colourblind reader, a
 * greyscale print and a screenshot.
 */
export function ChartLegend({
  items,
  className,
}: {
  items: { color: string; label: string; icon?: ReactNode }[]
  className?: string
}) {
  return (
    <ul className={cn('mt-4 flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
          {it.icon ?? (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-xs"
              style={{ background: it.color }}
            />
          )}
          {it.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * A tooltip enhances; it never gates. Every figure it shows is also in the
 * table view, which is one click away at the top of the page.
 */
export function ChartTooltip({
  x,
  y,
  width,
  title,
  rows,
  foot,
}: {
  x: number
  y: number
  /** Plot width, so the card can be flipped rather than run off the edge. */
  width: number
  title: string
  rows: { color?: string; label: string; value: string }[]
  foot?: { label: string; value: string }
}) {
  const CARD = 210
  const left = Math.min(Math.max(8, x - CARD / 2), Math.max(8, width - CARD - 8))

  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-sm border bg-popover p-3 text-popover-foreground shadow-pop"
      style={{ left, top: y, width: CARD }}
    >
      <p className="text-[0.8125rem] font-semibold">{title}</p>
      <dl className="mt-2 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-[0.8125rem]">
            {r.color ? (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-xs"
                style={{ background: r.color }}
              />
            ) : null}
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="num ml-auto font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      {foot ? (
        <div className="mt-2 flex items-center gap-2 border-t pt-2 text-[0.8125rem]">
          <span className="text-muted-foreground">{foot.label}</span>
          <span className="num ml-auto font-bold">{foot.value}</span>
        </div>
      ) : null}
    </div>
  )
}

/** Held while a container has not been measured, so nothing jumps on mount. */
export function ChartSkeleton({ height }: { height: number }) {
  return <div style={{ height }} aria-hidden />
}
