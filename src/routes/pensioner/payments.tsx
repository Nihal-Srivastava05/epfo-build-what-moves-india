import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate, fmtMonthLong } from '@/lib/format'

export default function Payments() {
  const { pensionPayments, pensioner } = useData()
  const { lang } = useT()
  const total = pensionPayments.reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <PageHeader
        title="Payments"
        sub={`Every credit to ${pensioner.bankName} ending ${pensioner.bankLast4}.`}
      />

      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="eyebrow mb-2">Last six months</p>
        <Money value={total} size="xl" />
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {pensionPayments.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{fmtMonthLong(p.month)}</p>
              <p className="num mt-0.5 text-sm text-muted-foreground">
                {fmtDate(p.creditedOn, lang)} · {p.mode}
              </p>
              <p className="ident mt-0.5 text-xs text-muted-foreground">{p.reference}</p>
            </div>
            <div className="text-right">
              <Money value={p.amount} className="font-medium" />
              <StatusPill tone="ok" className="mt-1">
                Credited
              </StatusPill>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-muted-foreground">
        A payment shows here on the day your bank credits it. If a month is missing from this list for
        more than three working days, raise a grievance from that row.
      </p>
    </div>
  )
}
