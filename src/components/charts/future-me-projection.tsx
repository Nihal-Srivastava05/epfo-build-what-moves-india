import { useState, type MouseEvent, type ReactNode } from 'react'
import { ChartCard, ChartLegend, ChartSkeleton, ChartTooltip } from '@/components/charts/chart-kit'
import { AXIS_INK, GRID, niceTicks, useMeasure } from '@/components/charts/chart-scale'
import { compactInr, rupees } from '@/lib/format'

export interface ProjectionSeries {
  key: string
  label: string
  color: string
  /** Solid for the one line that is always shown; dashed for a what-if laid over it. */
  dashed?: boolean
  points: { year: number; balance: number }[]
}

const PLOT_H = 220
const PAD = { top: 18, right: 18, bottom: 30, left: 62 }
const HEIGHT = PLOT_H + PAD.top + PAD.bottom

/**
 * One line always on: the balance if nothing changes. A what-if lays a second,
 * dashed line over it rather than replacing it, so the comparison is the shape
 * of the gap between two lines, not a number you have to remember from before
 * you clicked.
 */
export function FutureMeProjection({
  series,
  startAge,
  action,
}: {
  series: ProjectionSeries[]
  startAge?: number
  action?: ReactNode
}) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const [hoverYear, setHoverYear] = useState<number | null>(null)

  const baseline = series[0]
  const maxYear = baseline?.points[baseline.points.length - 1]?.year ?? 0
  const maxBalance = Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.balance)))
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const ticks = niceTicks(maxBalance)
  const domain = ticks[ticks.length - 1] || 1
  const base = PAD.top + PLOT_H

  const xOf = (year: number) => PAD.left + (maxYear > 0 ? year / maxYear : 0) * plotW
  const yOf = (v: number) => PAD.top + PLOT_H - (v / domain) * PLOT_H
  const linePath = (points: ProjectionSeries['points']) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${xOf(p.year)},${yOf(p.balance)}`).join('')

  const yearStep = Math.max(1, Math.ceil(maxYear / Math.max(2, Math.floor(plotW / 70))))
  const yearTicks = Array.from({ length: Math.floor(maxYear / yearStep) + 1 }, (_, i) => i * yearStep)
  if (yearTicks[yearTicks.length - 1] !== maxYear) yearTicks.push(maxYear)

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    if (!maxYear || !plotW) return
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    setHoverYear(Math.max(0, Math.min(maxYear, Math.round((x / plotW) * maxYear))))
  }

  const balanceAt = (s: ProjectionSeries, year: number) =>
    s.points.find((p) => p.year === year)?.balance ?? s.points[s.points.length - 1].balance

  return (
    <ChartCard
      title="Your balance, projected to retirement"
      blurb="Interest held at 8.25%, credited once a year — the same arithmetic the rest of this site uses. A projection, not a promise."
      action={action}
    >
      <div ref={ref} className="relative">
        {width === 0 || maxYear === 0 || !baseline ? (
          <ChartSkeleton height={HEIGHT} />
        ) : (
          <>
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={`Projected EPF balance over ${maxYear} years, from ${rupees(baseline.points[0].balance)} to ${rupees(baseline.points[baseline.points.length - 1].balance)} if nothing changes. Every figure is repeated in the panels around this chart.`}
            >
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={PAD.left} x2={PAD.left + plotW} y1={yOf(v)} y2={yOf(v)} stroke={GRID} strokeWidth={1} />
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

              {series.map((s) => (
                <path
                  key={s.key}
                  d={linePath(s.points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.dashed ? 2 : 2.5}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {yearTicks.map((y) => (
                <text
                  key={y}
                  x={xOf(y)}
                  y={base + 20}
                  textAnchor={y === 0 ? 'start' : y === maxYear ? 'end' : 'middle'}
                  fontSize={12}
                  fill={AXIS_INK}
                  className="num"
                >
                  {startAge ? `Age ${startAge + y}` : y === 0 ? 'Today' : `Yr ${y}`}
                </text>
              ))}

              {series.map((s) => {
                const last = s.points[s.points.length - 1]
                return (
                  <circle
                    key={s.key}
                    cx={xOf(last.year)}
                    cy={yOf(last.balance)}
                    r={4}
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                )
              })}

              {hoverYear !== null ? (
                <line x1={xOf(hoverYear)} x2={xOf(hoverYear)} y1={PAD.top} y2={base} stroke={AXIS_INK} strokeWidth={1} />
              ) : null}

              <rect
                x={PAD.left}
                y={PAD.top}
                width={plotW}
                height={PLOT_H}
                fill="transparent"
                onMouseMove={onMove}
                onMouseLeave={() => setHoverYear(null)}
              />
            </svg>

            {hoverYear !== null ? (
              <ChartTooltip
                x={xOf(hoverYear)}
                y={4}
                width={width}
                title={startAge ? `Age ${startAge + hoverYear}` : hoverYear === 0 ? 'Today' : `Year ${hoverYear}`}
                rows={series.map((s) => ({ color: s.color, label: s.label, value: rupees(balanceAt(s, hoverYear)) }))}
              />
            ) : null}
          </>
        )}
      </div>
      <ChartLegend items={series.map((s) => ({ color: s.color, label: s.label }))} />
    </ChartCard>
  )
}
