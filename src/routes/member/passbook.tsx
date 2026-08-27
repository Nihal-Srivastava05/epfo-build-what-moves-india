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
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { MockBadge } from '@/components/patterns/mock-badge'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { buildLedger, totalBalance } from '@/lib/derive'
import { financialYear, fmtDate, fmtMonth } from '@/lib/format'
import { INTEREST_RATE, establishments } from '@/lib/mock/db'

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

  return (
    <div>
      <PageHeader
        title="Passbook"
        sub="Every rupee, per employer, per year — searchable in the browser rather than locked in a PDF."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="size-4" aria-hidden />
              Export PDF
            </Button>
            <MockBadge what="Export is not wired up. A real export would carry a verification code." />
          </div>
        }
      />

      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="eyebrow mb-2">Closing balance</p>
        <Money value={balance} size="xl" />
        <p className="mt-2 text-sm text-muted-foreground">
          Interest is credited once a year at {(INTEREST_RATE * 100).toFixed(2)}%, calculated on your
          monthly running balance.
        </p>
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
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-stop-line bg-stop-soft p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-stop" aria-hidden />
          <span>
            {fmtMonth(missing[0].month, lang)} is not in this ledger because your employer never filed
            it. It is not lost — it was never sent.
          </span>
        </p>
      ) : null}

      {/* Ledger rules and tabular figures: it should read like a passbook. */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Provident fund ledger</caption>
          <thead className="border-b bg-secondary/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Particulars</th>
              <th className="px-4 py-3 text-right font-medium">Your share</th>
              <th className="px-4 py-3 text-right font-medium">Employer</th>
              <th className="px-4 py-3 text-right font-medium">
                <Term id="eps">Pension</Term>
              </th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className={r.kind === 'interest' ? 'bg-gold-soft/60' : undefined}>
                <td className="num px-4 py-2.5 whitespace-nowrap">{fmtDate(r.date, lang)}</td>
                <td className="px-4 py-2.5">
                  {r.particulars}
                  {r.kind === 'interest' ? (
                    <StatusPill tone="neutral" className="ml-2">
                      Interest
                    </StatusPill>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Money value={r.employee} size="sm" />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.employer ? <Money value={r.employer} size="sm" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.eps ? <Money value={r.eps} size="sm" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-medium">
                  <Money value={r.balanceAfter} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Showing <span className="num">{rows.length}</span> of{' '}
        <span className="num">{ledger.length}</span> entries.
      </p>
    </div>
  )
}
