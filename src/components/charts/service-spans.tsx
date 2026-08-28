import { useMemo } from 'react'
import { ChartCard } from '@/components/charts/chart-kit'
import { GRID } from '@/components/charts/chart-scale'
import { serviceSpans, serviceYearTicks } from '@/lib/chart-data'
import { fmtMemberId, fmtMonth, fmtTenure } from '@/lib/format'
import type { Lang } from '@/store/session'

/**
 * Service length per member ID, on one shared calendar axis.
 *
 * Every employer issues its own PF account number, so a working life arrives as
 * a pile of unrelated member IDs. Drawn against a single axis they become one
 * continuous record: the eye reads how long each job lasted, in what order, and
 * whether the record has a hole in it — none of which survives a list of dates.
 *
 * One hue, because identity is already carried by the label on every row.
 * Colouring each span differently would spend the only free channel on
 * information the rows already state, and "current" is a state, not an
 * identity — it is marked by the span reaching Today and by its own pill.
 */
export function ServiceSpans({ personId, lang }: { personId: string; lang: Lang }) {
  const spans = useMemo(() => serviceSpans(personId), [personId])
  const ticks = useMemo(() => serviceYearTicks(spans), [spans])

  if (spans.length === 0) return null

  const pct = (v: number) => `${(v * 100).toFixed(3)}%`

  return (
    <ChartCard
      title="Service length by member ID"
      blurb={
        <>
          One bar per PF account number, all measured against the same axis — first day of service
          on the left, today on the right. The record below lists the same dates in full.
        </>
      }
    >
      <ul className="space-y-4">
        {spans
          .slice()
          .reverse()
          .map((s) => (
            <li key={s.memberId}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-semibold tracking-[-0.01em]">
                  {s.name}
                  {s.current ? (
                    <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 align-middle text-[0.6875rem] font-semibold text-ok">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="num text-[0.9375rem] font-bold">{fmtTenure(s.from, s.to, lang)}</p>
              </div>

              <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="ident text-xs text-muted-foreground">{fmtMemberId(s.memberId)}</p>
                <p className="num text-xs text-muted-foreground">
                  {fmtMonth(s.from.slice(0, 7), lang)} —{' '}
                  {s.current ? 'now' : fmtMonth(s.to.slice(0, 7), lang)}
                </p>
              </div>

              {/* The plot. Gridlines sit at the same offsets on every row, so the
                  years read as columns even though each row carries its own. */}
              <div
                className="relative mt-2 h-2.5 w-full rounded-full bg-muted"
                role="img"
                aria-label={`${s.name}, member ID ${fmtMemberId(s.memberId)}: ${fmtTenure(
                  s.from,
                  s.to,
                  lang,
                )} of service, ${fmtMonth(s.from.slice(0, 7), lang)} to ${
                  s.current ? 'now' : fmtMonth(s.to.slice(0, 7), lang)
                }`}
              >
                {ticks.map((t) => (
                  <span
                    key={t.year}
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: pct(t.offset), background: GRID }}
                  />
                ))}
                <span
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: pct(s.offset),
                    width: pct(s.length),
                    minWidth: 3,
                    background: 'var(--brand)',
                  }}
                />
              </div>
            </li>
          ))}
      </ul>

      {/* The axis, in its own band below the plot so nothing clips it. A year
          that falls too near the end keeps its gridline but loses its label,
          which would otherwise collide with "Today" on a narrow screen. */}
      <div className="relative mt-3 h-4" aria-hidden>
        {ticks
          .filter((t) => t.offset <= 0.86)
          .map((t) => (
            <span
              key={t.year}
              className="num absolute top-0 -translate-x-1/2 text-[0.6875rem] text-muted-foreground"
              style={{ left: pct(t.offset) }}
            >
              {t.year}
            </span>
          ))}
        <span className="absolute top-0 right-0 text-[0.6875rem] font-semibold text-foreground">
          Today
        </span>
      </div>
    </ChartCard>
  )
}
