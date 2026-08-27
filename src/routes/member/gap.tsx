import { Link, useParams } from 'react-router-dom'
import { Building2, CheckCircle2, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate, fmtMonthLong } from '@/lib/format'
import { TODAY, establishments } from '@/lib/mock/db'

export default function Gap() {
  const { month = '' } = useParams()
  const { contributions, employerNotified, notifyEmployer } = useData()
  const { t, lang } = useT()
  const est = establishments[0]
  const row = contributions.find((c) => c.month === month)
  const notified = employerNotified.includes(month)

  if (!row) return null

  if (row.status !== 'missing') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-ok-line bg-ok-soft p-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">
            {fmtMonthLong(month)} has been credited
          </h1>
          <p className="mt-2 text-muted-foreground">
            {est.name} filed this month{row.creditedOn ? ` on ${fmtDate(row.creditedOn, lang)}` : ''}.{' '}
            <Money value={row.employeeShare + row.employerEpfShare} /> is now in your balance.
          </p>
        </div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link to="/member/passbook">See it in your passbook</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={fmtMonthLong(month)}
        title="This month has not been credited"
        sub="Here is exactly what happened, who has to act, and what we are doing about it."
      />

      <div className="space-y-4">
        {/* Name the counterparty and the clock. */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Building2 className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{est.name}</p>
              <p className="ident mt-0.5 text-sm text-muted-foreground">{est.code}</p>
              <p className="mt-3 text-sm leading-relaxed">
                They did not file the <Term id="ecr">monthly return</Term> for {fmtMonthLong(month)}.
                Until they do, the money has not left them — it is not lost, it was never sent.
              </p>
              <OwnerClock holder="employer" since={row.holderSince ?? TODAY} className="mt-3" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="eyebrow mb-3">What is not in your account</p>
          <dl className="space-y-2 text-sm">
            {[
              ['Your share', row.employeeShare],
              ['Employer share', row.employerEpfShare],
              ['Pension share', row.epsShare],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label as string}</dt>
                <dd>
                  <Money value={value as number} size="sm" />
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t pt-2 font-medium">
              <dt>Total</dt>
              <dd>
                <Money value={row.employeeShare + row.employerEpfShare + row.epsShare} />
              </dd>
            </div>
          </dl>
        </div>

        {/* The nudge travels along the relation. The member is not the messenger. */}
        {notified ? (
          <div className="flex items-start gap-3 rounded-xl border border-ok-line bg-ok-soft p-5">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
            <div>
              <p className="font-medium">{t('gap.notified')}</p>
              <p className="mt-1 text-sm leading-relaxed">{t('gap.notifiedSub')}</p>
              <StatusPill tone="ok" className="mt-3">
                Escalates to the regional office on {fmtDate('2026-09-12', lang)}
              </StatusPill>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-5">
            <p className="font-medium">You do not have to chase them</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              EPFO writes to the employer directly and escalates on a fixed schedule. Ask us to start
              that now — you will not have to make a phone call.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                notifyEmployer(month)
                toast.success('EPFO has written to Northline Logistics about this month.')
              }}
            >
              <Mail className="size-4" aria-hidden />
              {t('gap.notify')}
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-dashed p-5">
          <p className="text-sm font-medium">If you would rather speak to them yourself</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4" aria-hidden />
            {est.hrName} · <span className="ident">{est.hrPhoneMasked}</span>
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
            <Link to="/grievance/new">Or raise a formal grievance</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
