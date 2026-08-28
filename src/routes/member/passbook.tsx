import { useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { MockBadge } from '@/components/patterns/mock-badge'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { buildLedger, totalBalance } from '@/lib/derive'
import { financialYear, fmtDate, fmtMonth } from '@/lib/format'
import { INTEREST_RATE, establishmentByCode, establishments, personById } from '@/lib/mock/db'
import { downloadCsv, exportName } from '@/lib/export'

export default function Passbook() {
  const contributions = useData((s) => s.contributions)
  const { lang } = useT()
  const ledger = useMemo(() => buildLedger(contributions), [contributions])
  const balance = totalBalance(contributions)

  const years = useMemo(() => {
    const set = new Set(ledger.map((r) => financialYear(r.month ?? r.date.slice(0, 7))))
    return ['all', ...Array.from(set).sort().reverse()]
  }, [ledger])
  const [fy, setFy] = useState('all')
  const [est, setEst] = useState('all')

  const rows = ledger.filter(
    (r) =>
      (fy === 'all' || financialYear(r.month ?? r.date.slice(0, 7)) === fy) &&
      (est === 'all' || r.estCode === est || r.kind === 'interest'),
  )

  const missing = contributions.filter((c) => c.status === 'missing')
  const me = personById('p-priya')

  /**
   * Exports exactly what is on screen, filters included — a file that disagrees
   * with the table above it is worse than no file. Amounts go out as plain
   * integers so a spreadsheet can add them up; the rendered ₹ grouping is a
   * display concern and does not belong in a data column.
   */
  const exportCsv = () => {
    const closing = rows.length ? rows[0].balanceAfter : 0
    const scope = fy === 'all' ? 'all years' : `FY ${fy}`
    const employer = est === 'all' ? 'all employers' : establishmentByCode(est).name

    downloadCsv(exportName(['epfo-passbook', me.uan, fy === 'all' ? 'all' : fy], 'csv'), [
      ['EPFO passbook (prototype — every figure below is synthetic)'],
      ['Member', me.name],
      ['UAN', me.uan],
      ['Scope', `${scope}, ${employer}`],
      ['Generated', new Date().toISOString()],
      [],
      ['Date', 'Particulars', 'Establishment', 'Your share', 'Employer share', 'Pension (EPS)', 'Balance'],
      ...rows.map((r) => [
        r.date,
        r.particulars,
        r.estCode,
        r.employee,
        r.employer,
        r.eps,
        r.balanceAfter,
      ]),
      [],
      [
        '',
        fy === 'all' && est === 'all' ? 'Closing balance' : 'Balance after the latest row shown',
        '',
        '',
        '',
        '',
        closing,
      ],
    ])
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-card p-5">
        <div>
          <p className="eyebrow mb-2">Closing balance</p>
          <Money value={balance} size="xl" />
          <p className="mt-2 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
            Every rupee, per employer, per year — searchable here rather than locked in a PDF.
            Interest is credited once a year at {(INTEREST_RATE * 100).toFixed(2)}%, calculated on
            your monthly running balance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <MockBadge what="The download is real and opens in any spreadsheet. The figures inside it are synthetic, like everything else here." />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={fy} onValueChange={setFy}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y === 'all' ? 'All years' : `FY ${y}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={est} onValueChange={setEst}>
          <SelectTrigger className="w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employers</SelectItem>
            {establishments.map((e) => (
              <SelectItem key={e.code} value={e.code}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {missing.length > 0 ? (
        <p className="mb-4 flex items-start gap-2.5 rounded-sm bg-stop-soft p-3.5 text-[0.8125rem] leading-relaxed text-stop">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {fmtMonth(missing[0].month, lang)} is not in this ledger because your employer never filed
            it. It is not lost — it was never sent.
          </span>
        </p>
      ) : null}

      {/* Ledger rules and tabular figures: it should read like a passbook. */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Provident fund ledger</caption>
          <thead className="bg-muted">
            <tr className="eyebrow">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Particulars</th>
              <th className="px-4 py-3 text-right">Your share</th>
              <th className="px-4 py-3 text-right">Employer</th>
              <th className="px-4 py-3 text-right">
                <Term id="eps" className="text-muted-foreground">Pension</Term>
              </th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={r.kind === 'interest' ? 'bg-brand-tint' : 'transition-colors hover:bg-muted'}
              >
                <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.date, lang)}</td>
                <td className="px-4 py-3 font-medium">
                  {r.particulars}
                  {r.kind === 'interest' ? (
                    <StatusPill tone="neutral" className="ml-2">
                      Interest
                    </StatusPill>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <Money value={r.employee} size="sm" />
                </td>
                <td className="px-4 py-3 text-right">
                  {r.employer ? <Money value={r.employer} size="sm" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.eps ? <Money value={r.eps} size="sm" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  <Money value={r.balanceAfter} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
          {/* A passbook ends in its own total. It is the balance after the
              latest row shown, not the account total, so a filtered view never
              claims more than it displays. */}
          {rows.length ? (
            <tfoot className="border-t bg-muted">
              <tr>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-[0.8125rem] font-bold">
                  {fy === 'all' && est === 'all' ? 'Closing balance' : 'Balance after the latest row shown'}
                </td>
                <td className="px-4 py-3" colSpan={3} />
                <td className="px-4 py-3 text-right">
                  <Money value={rows[0].balanceAfter} size="sm" className="font-bold" />
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Showing <span className="num">{rows.length}</span> of{' '}
        <span className="num">{ledger.length}</span> entries.
      </p>
    </div>
  )
}
