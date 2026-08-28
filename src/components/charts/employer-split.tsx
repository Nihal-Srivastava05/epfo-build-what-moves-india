import { useMemo } from 'react'
import {
  ChartCard,
  ChartLegend,
} from '@/components/charts/chart-kit'
import {
  GAP,
  SERIES,
} from '@/components/charts/chart-scale'
import { employerTotals } from '@/lib/chart-data'
import { rupees } from '@/lib/format'
import type { LedgerRow } from '@/lib/types'

/**
 * Which job built which part of the balance. Bars share one scale rather than
 * each filling its own row, so the lengths are comparable — the whole reason to
 * draw this instead of listing three numbers.
 */
export function EmployerSplit({ rows }: { rows: LedgerRow[] }) {
  const totals = useMemo(() => employerTotals(rows), [rows])
  if (totals.length === 0) return null

  const max = Math.max(...totals.map((t) => t.total)) || 1
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <ChartCard
      title="Where the balance came from"
      blurb={
        <>
          Contributions only. Interest is earned by the balance rather than by any one job, so it is
          left out here — it is the third band in the chart above.
        </>
      }
    >
      <ul className="space-y-5">
        {totals.map((t) => (
          <li key={t.code}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="font-semibold tracking-[-0.01em]">{t.name}</p>
              <p className="num text-[0.9375rem] font-bold">{rupees(t.total)}</p>
            </div>

            <div
              className="mt-2 flex h-5 w-full"
              style={{ gap: GAP }}
              role="img"
              aria-label={`${t.name}: your share ${rupees(t.employee)}, employer share ${rupees(t.employer)}`}
            >
              <span
                className="rounded-l-xs"
                style={{ width: pct(t.employee), background: SERIES.you.color }}
              />
              <span
                className="rounded-r-xs"
                style={{ width: pct(t.employer), background: SERIES.employer.color }}
              />
            </div>

            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              <span className="num">{rupees(t.employee)}</span> from you ·{' '}
              <span className="num">{rupees(t.employer)}</span> from them ·{' '}
              <span className="num">{t.months}</span> months
            </p>
          </li>
        ))}
      </ul>

      <ChartLegend
        items={[
          { color: SERIES.you.color, label: SERIES.you.label },
          { color: SERIES.employer.color, label: SERIES.employer.label },
        ]}
      />
    </ChartCard>
  )
}
