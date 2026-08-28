import { useMemo, useState, type MouseEvent } from 'react'
import { Info } from 'lucide-react'
import {
  ChartCard,
  ChartLegend,
  ChartSkeleton,
  ChartTooltip,
} from '@/components/charts/chart-kit'
import {
  AXIS_INK,
  GAP,
  GRID,
  SERIES,
  barPath,
  niceTicks,
  useMeasure,
} from '@/components/charts/chart-scale'
import { bucketLedger, type Grain } from '@/lib/chart-data'
import { compactInr, rupees } from '@/lib/format'
import type { LedgerRow } from '@/lib/types'
import { cn } from '@/lib/utils'

const PLOT_H = 210
const PAD = { top: 18, right: 18, bottom: 28, left: 62 }
const HEIGHT = PLOT_H + PAD.top + PAD.bottom
/** Below this a band stops being a bar and becomes a texture, so the plot
 *  widens and scrolls instead of squeezing eighty-five months into a phone. */
const MIN_BAND = 13

/**
 * What went in each period, split by who paid it. A stacked bar rather than two
 * bars side by side, because the question underneath is "how much arrived that
 * month" and only a stack answers that and the split at the same time.
 */
export function ContributionBars({
  rows,
  unfiledMonths,
  lang,
  grain,
  onGrainChange,
}: {
  rows: LedgerRow[]
  unfiledMonths: string[]
  lang: 'en' | 'hi'
  grain: Grain
  onGrainChange: (g: Grain) => void
}) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const buckets = useMemo(
    () => bucketLedger(rows, grain, unfiledMonths, lang),
    [rows, grain, unfiledMonths, lang],
  )

  const n = buckets.length
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const bandW = n ? Math.max(MIN_BAND, innerW / n) : 0
  const plotW = bandW * n
  const svgW = PAD.left + plotW + PAD.right

  const peak = Math.max(0, ...buckets.map((b) => b.total))
  const ticks = niceTicks(peak)
  const domain = ticks[ticks.length - 1] || 1

  const base = PAD.top + PLOT_H
  const yOf = (v: number) => base - (v / domain) * PLOT_H
  const barW = Math.min(24, Math.max(3, bandW - 6))
  const xOf = (i: number) => PAD.left + i * bandW + (bandW - barW) / 2

  const labelStep = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 76))))
  const peakIndex = buckets.findIndex((b) => b.total === peak)
  const active = hover === null ? null : buckets[hover]
  const anyUnfiled = buckets.some((b) => b.unfiled)

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    setHover(Math.max(0, Math.min(n - 1, Math.floor(x / bandW))))
  }

  return (
    <ChartCard
      title={grain === 'fy' ? 'Contributions by financial year' : 'Contributions by month'}
      blurb={
        <>
          Your share and your employer’s, stacked as they land. The steps up are pay rises and job
          changes — the split between the two never changes, only the wage does.
        </>
      }
      action={
        <div
          role="group"
          aria-label="Chart period"
          className="flex shrink-0 items-center rounded-sm bg-muted p-[3px]"
        >
          {(['month', 'fy'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGrainChange(g)}
              aria-pressed={grain === g}
              className={cn(
                'rounded-xs px-3 py-1 text-[0.8125rem] font-semibold transition-colors',
                grain === g
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {g === 'month' ? 'By month' : 'By year'}
            </button>
          ))}
        </div>
      }
    >
      <div ref={ref}>
        {width === 0 || n === 0 ? (
          <ChartSkeleton height={HEIGHT} />
        ) : (
          <div className="overflow-x-auto">
            <div className="relative" style={{ width: svgW }}>
              <svg
                width={svgW}
                height={HEIGHT}
                role="img"
                aria-label={`Contributions per ${grain === 'fy' ? 'financial year' : 'month'} from ${buckets[0].label} to ${buckets[n - 1].label}, split into your share, employer share and interest. Every figure is in the table view.`}
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

                {buckets.map((b, i) => {
                  const x = xOf(i)

                  if (b.unfiled && b.total === 0) {
                    // The month the employer never filed. An empty slot would
                    // read as "nothing was due"; this says something is absent.
                    return (
                      <g key={b.key}>
                        <rect
                          x={PAD.left + i * bandW + 1}
                          y={PAD.top}
                          width={Math.max(3, bandW - 2)}
                          height={PLOT_H}
                          fill="var(--stop-soft)"
                        />
                        <path
                          d={barPath(x, base - 6, barW, 6, 2)}
                          fill="var(--stop)"
                        />
                      </g>
                    )
                  }

                  const parts = [
                    { key: 'you', value: b.employee, color: SERIES.you.color },
                    { key: 'employer', value: b.employer, color: SERIES.employer.color },
                    { key: 'interest', value: b.interest, color: SERIES.interest.color },
                  ].filter((p) => p.value > 0)

                  let cum = 0
                  return (
                    <g key={b.key} opacity={hover === null || hover === i ? 1 : 0.55}>
                      {parts.map((p, pi) => {
                        const yTop = yOf(cum + p.value)
                        const yBottom = yOf(cum)
                        cum += p.value
                        // The 2px surface gap is what separates touching fills —
                        // never a stroke, which would add ink that is not data.
                        const h = yBottom - yTop - (pi > 0 ? GAP : 0)
                        if (h <= 0.5) return null
                        const isTop = pi === parts.length - 1
                        return isTop ? (
                          <path key={p.key} d={barPath(x, yTop, barW, h)} fill={p.color} />
                        ) : (
                          <rect key={p.key} x={x} y={yTop} width={barW} height={h} fill={p.color} />
                        )
                      })}
                    </g>
                  )
                })}

                {/* Two direct labels, not eighty-five: the biggest period and the
                    latest one. The axis and the tooltip carry the rest. */}
                {bandW >= 40
                  ? buckets.map((b, i) =>
                      (i === peakIndex || i === n - 1) && b.total > 0 ? (
                        <text
                          key={`lab-${b.key}`}
                          x={xOf(i) + barW / 2}
                          y={yOf(b.total) - 8}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          fill="var(--foreground)"
                          className="num"
                        >
                          {compactInr(b.total)}
                        </text>
                      ) : null,
                    )
                  : null}

                {buckets.map((b, i) =>
                  i % labelStep === 0 ? (
                    <text
                      key={`tick-${b.key}`}
                      x={xOf(i) + barW / 2}
                      y={base + 19}
                      textAnchor="middle"
                      fontSize={12}
                      fill={AXIS_INK}
                      className="num"
                    >
                      {b.tick}
                    </text>
                  ) : null,
                )}

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
                  x={xOf(hover as number) + barW / 2}
                  y={4}
                  width={svgW}
                  title={active.label}
                  rows={
                    active.unfiled && active.total === 0
                      ? [{ label: 'Never filed by your employer', value: '—' }]
                      : [
                          { color: SERIES.you.color, label: SERIES.you.label, value: rupees(active.employee) },
                          {
                            color: SERIES.employer.color,
                            label: SERIES.employer.label,
                            value: rupees(active.employer),
                          },
                          ...(active.interest > 0
                            ? [
                                {
                                  color: SERIES.interest.color,
                                  label: SERIES.interest.label,
                                  value: rupees(active.interest),
                                },
                              ]
                            : []),
                        ]
                  }
                  foot={
                    active.total > 0 ? { label: 'Total', value: rupees(active.total) } : undefined
                  }
                />
              ) : null}
            </div>
          </div>
        )}
      </div>

      <ChartLegend
        items={[
          { color: SERIES.you.color, label: SERIES.you.label },
          { color: SERIES.employer.color, label: SERIES.employer.label },
          { color: SERIES.interest.color, label: SERIES.interest.label },
          ...(anyUnfiled
            ? [
                {
                  color: 'var(--stop)',
                  label: 'Never filed by your employer',
                  icon: <Info className="size-3.5 shrink-0 text-stop" aria-hidden />,
                },
              ]
            : []),
        ]}
      />
    </ChartCard>
  )
}
