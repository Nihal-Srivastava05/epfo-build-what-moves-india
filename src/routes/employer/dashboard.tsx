import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, CalendarClock, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { ActionCard } from '@/components/patterns/action-card'
import { Money } from '@/components/patterns/money'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { establishments, TODAY } from '@/lib/mock/db'
import { daysBetween, fmtDate, fmtMonth, fmtMonthLong } from '@/lib/format'

const NEXT_DUE = '2026-09-15'
const NEXT_MONTH = '2026-08'

export default function EmployerDashboard() {
  const { contributions, approvals, challans, roster } = useData()
  const { lang } = useT()
  const motionOk = useMotionOk()
  const est = establishments[0]

  const missing = contributions.filter((c) => c.status === 'missing')
  const active = roster.filter((r) => !r.exited)
  const kycPending = roster.filter((r) => r.kyc !== 'verified').length
  const daysToDue = daysBetween(TODAY, NEXT_DUE)
  const longest = approvals.length
    ? approvals.reduce((a, b) => (daysBetween(a.waitingSince) > daysBetween(b.waitingSince) ? a : b))
    : null

  const metrics = [
    { label: 'Employees on roll', value: String(active.length), tone: 'neutral' as const },
    { label: 'Approvals waiting', value: String(approvals.length), tone: approvals.length ? ('wait' as const) : ('ok' as const) },
    { label: 'KYC incomplete', value: String(kycPending), tone: kycPending ? ('wait' as const) : ('ok' as const) },
    { label: 'Months unfiled', value: String(missing.length), tone: missing.length ? ('stop' as const) : ('ok' as const) },
  ]

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={est.code}
        title={est.name}
        sub={`${est.city} · Covered since ${fmtDate(est.coveredSince, lang)}`}
      />

      {/* The deadline, and what missing it costs — stated together. */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
            <div>
              <p className="font-semibold">
                {fmtMonthLong(NEXT_MONTH)} <Term id="ecr">return</Term> is due in{' '}
                <span className="num">{daysToDue} days</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Due {fmtDate(NEXT_DUE, lang)}. Late filing attracts interest and damages from 16 Sep.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/employer/return">File and pay</Link>
          </Button>
        </div>
      </section>

      {/* The other half of the member's missing month. */}
      {missing.length > 0 ? (
        <motion.div
          initial={motionOk ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.25 : 0 }}
        >
          <ActionCard
            severity="blocker"
            title={`${fmtMonthLong(missing[0].month)} was never filed`}
            detail={
              <>
                {active.length} employees have a gap in their passbook for that month, including{' '}
                <span className="font-medium text-foreground">Priya Sharma</span>. Until it is filed, the
                money has not reached any of them.
              </>
            }
            meta={
              <OwnerClock holder="employer" since={missing[0].holderSince ?? TODAY} />
            }
            fix={{ label: `File ${fmtMonth(missing[0].month, lang)} now`, href: '#/employer/return' }}
          />
        </motion.div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-medium">Every month is filed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No employee has a gap in their passbook.
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="metrics">
        <SectionTitle>
          <span id="metrics">Compliance right now</span>
        </SectionTitle>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={motionOk ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionOk ? 0.22 : 0, delay: motionOk ? i * 0.03 : 0 }}
              className="rounded-xl border bg-card p-4"
            >
              <dt className="text-sm text-muted-foreground">{m.label}</dt>
              <dd className="num mt-1.5 text-2xl font-semibold tracking-tight">{m.value}</dd>
            </motion.div>
          ))}
        </dl>
      </section>

      {/* The delay has a face: the longest wait is a person, named. */}
      <section aria-labelledby="approvals">
        <SectionTitle
          action={
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/employer/approvals">Open queue</Link>
            </Button>
          }
        >
          <span id="approvals">Waiting on you</span>
        </SectionTitle>
        {approvals.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            Nothing is waiting on you. Every employee request is cleared.
          </p>
        ) : (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-wait" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <span className="num">{approvals.length}</span> requests are waiting
                </p>
                {longest ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{longest.personName}</span> has been
                    waiting <span className="num">{daysBetween(longest.waitingSince)} days</span> —{' '}
                    {longest.detail.toLowerCase()}
                    {longest.amount ? (
                      <>
                        {' '}for <Money value={longest.amount} size="sm" />
                      </>
                    ) : null}
                    .
                  </p>
                ) : null}
              </div>
              <StatusPill tone="wait">
                <Users className="size-3.5" aria-hidden />
                {approvals.length}
              </StatusPill>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="filings">
        <SectionTitle
          action={
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/employer/challans">All challans</Link>
            </Button>
          }
        >
          <span id="filings">Recent filings</span>
        </SectionTitle>
        <ul className="divide-y rounded-xl border bg-card">
          {challans.slice(0, 4).map((c) => (
            <li key={c.trrn} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{fmtMonthLong(c.month)}</p>
                <p className="ident text-sm text-muted-foreground">
                  <Term id="trrn">TRRN</Term> {c.trrn}
                </p>
              </div>
              <div className="text-right">
                <Money value={c.total} className="font-medium" />
                <p className="num mt-0.5 text-xs text-muted-foreground">{fmtDate(c.paidOn, lang)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
