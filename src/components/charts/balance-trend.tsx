import { useMemo, useState, type MouseEvent } from 'react'
import {
  ChartCard,
  ChartSkeleton,
  ChartTooltip,
} from '@/components/charts/chart-kit'
import {
  AXIS_INK,
  GRID,
  SERIES,
  niceTicks,
  useMeasure,
} from '@/components/charts/chart-scale'
import { balanceTrend, monthTick } from '@/lib/chart-data'
import { compactInr, fmtDate, rupees } from '@/lib/format'
import type { LedgerRow } from '@/lib/types'

const PLOT_H = 210
const PAD = { top: 18, right: 18, bottom: 28, left: 62 }
const HEIGHT = PLOT_H + PAD.top + PAD.bottom

/**
 * One series, so no legend box — the title says what is plotted. The balance
 * only ever climbs here, which is the point: the shape of the line is the
 * answer to "is my money growing?", and the axis carries the amounts.
 */
export function BalanceTrend({ rows, lang }: { rows: LedgerRow[]; lang: 'en' | 'hi' }) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const points = useMemo(() => balanceTrend(rows), [rows])

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const ticks = niceTicks(points.length ? points[points.length - 1].balance : 0)
  const domain = ticks[ticks.length - 1] || 1

  const t0 = points.length ? Date.parse(points[0].date) : 0
  const t1 = points.length ? Date.parse(points[points.length - 1].date) : 1
  const span = Math.max(1, t1 - t0)

  const xOf = (date: string) => PAD.left + ((Date.parse(date) - t0) / span) * plotW
  const yOf = (v: number) => PAD.top + PLOT_H - (v / domain) * PLOT_H

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xOf(p.date)},${yOf(p.balance)}`).join('')
  const base = PAD.top + PLOT_H
  const area = points.length
    ? `${line}L${xOf(points[points.length - 1].date)},${base}L${xOf(points[0].date)},${base}Z`
    : ''

  const last = points[points.length - 1]
  const active = hover === null ? null : points[hover]

  /** Roughly one label per 84px, then snapped to whole points. */
  const labelStep = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 84))))

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    if (!points.length) return
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left + PAD.left
    let best = 0
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(xOf(points[i].date) - x) < Math.abs(xOf(points[best].date) - x)) best = i
    }
    setHover(best)
  }

  return (
    <ChartCard
      title="Balance over time"
      blurb={
        <>
          The running balance after every credit shown, straight from the ledger — the last point
          is the figure the table foots to.
        </>
      }
    >
      <div ref={ref} className="relative">
        {width === 0 || points.length === 0 ? (
          <ChartSkeleton height={HEIGHT} />
        ) : (
          <>
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={`Balance from ${fmtDate(points[0].date, lang)} to ${fmtDate(last.date, lang)}, ending at ${rupees(last.balance)}. Every figure is in the table view.`}
            >
              {ticks.map((v) => (
                <g key={v}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + plotW}
                    y1={yOf(v)}
                    y2={yOf(v)}
                    stroke={GRID}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 10}
                    y={yOf(v) + 4}
                    textAnchor="end"
                    fontSize={12}
                    fill={AXIS_INK}
                    className="num"
                  >
                    {compactInr(v)}
                  </text>
                </g>
              ))}

              <path d={area} fill={SERIES.you.color} opacity={0.1} />
              <path
                d={line}
                fill="none"
                stroke={SERIES.you.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) =>
                i % labelStep === 0 || i === points.length - 1 ? (
                  <text
                    key={p.date + i}
                    x={xOf(p.date)}
                    y={base + 19}
                    textAnchor={i === points.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                    fontSize={12}
                    fill={AXIS_INK}
                    className="num"
                  >
                    {monthTick(p.date.slice(0, 7), lang)}
                  </text>
                ) : null,
              )}

              {/* The one direct label the chart needs: where the line ends up. */}
              <circle
                cx={xOf(last.date)}
                cy={yOf(last.balance)}
                r={4.5}
                fill={SERIES.you.color}
                stroke="var(--card)"
                strokeWidth={2}
              />
              <text
                x={xOf(last.date)}
                y={yOf(last.balance) - 14}
                textAnchor="end"
                fontSize={13}
                fontWeight={700}
                fill="var(--foreground)"
                className="num"
              >
                {rupees(last.balance)}
              </text>

              {active ? (
                <g>
                  <line
                    x1={xOf(active.date)}
                    x2={xOf(active.date)}
                    y1={PAD.top}
                    y2={base}
                    stroke={AXIS_INK}
                    strokeWidth={1}
                  />
                  <circle
                    cx={xOf(active.date)}
                    cy={yOf(active.balance)}
                    r={4.5}
                    fill={SERIES.you.color}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                </g>
              ) : null}

              <rect
                x={PAD.left}
                y={PAD.top}
                width={plotW}
                height={PLOT_H}
                fill="transparent"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
              />
            </svg>

            {active ? (
              <ChartTooltip
                x={xOf(active.date)}
                y={4}
                width={width}
                title={fmtDate(active.date, lang)}
                rows={[{ color: SERIES.you.color, label: 'Balance', value: rupees(active.balance) }]}
              />
            ) : null}
          </>
        )}
      </div>
    </ChartCard>
  )
}
