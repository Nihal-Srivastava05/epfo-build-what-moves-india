import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { Term } from '@/components/patterns/term'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate, fmtMonthLong } from '@/lib/format'

export default function Challans() {
  const challans = useData((s) => s.challans)
  const { lang } = useT()

  return (
    <div>
      <PageHeader title="Challans" sub="Every payment, with the receipt number you would quote to a bank." />
      <ul className="space-y-3">
        {challans.map((c) => (
          <li key={c.trrn} className="rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{fmtMonthLong(c.month)}</p>
                <p className="ident mt-1 text-sm text-muted-foreground">
                  <Term id="trrn">TRRN</Term> {c.trrn}
                </p>
                <p className="num mt-1 text-sm text-muted-foreground">
                  Paid {fmtDate(c.paidOn, lang)} · {c.employees} employees
                </p>
              </div>
              <div className="text-right">
                <Money value={c.total} size="lg" />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-4">
              {[
                ['EPF', c.epf],
                ['EPS', c.eps],
                ['EDLI', c.edli],
                ['Admin', c.admin],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{label as string}</dt>
                  <dd>
                    <Money value={value as number} size="sm" />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="size-4" aria-hidden />
                Receipt
              </Button>
              <MockBadge what="Download is not wired up. A real receipt would carry a verification code." />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
