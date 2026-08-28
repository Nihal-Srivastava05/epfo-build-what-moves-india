import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanelTitle } from '@/components/patterns/page-header'
import { ActionCard } from '@/components/patterns/action-card'
import { Money } from '@/components/patterns/money'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { establishments, TODAY } from '@/lib/mock/db'
import { daysBetween, fmtDate, fmtMonth, fmtMonthLong } from '@/lib/format'
import { cn } from '@/lib/utils'

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
  const queue = approvals
    .slice()
    .sort((a, b) => daysBetween(b.waitingSince) - daysBetween(a.waitingSince))
    .slice(0, 4)
  const longest = queue[0] ?? null

  /* A metric is coloured only when it is a number somebody has to act on.
     "Employees on roll" is never red, however large it gets. */
  const metrics = [
    { label: 'Employees on roll', value: String(active.length), sub: `${est.city} · ${est.code}`, tone: '' },
    {
      label: 'Approvals waiting',
      value: String(approvals.length),
      sub: longest ? `Longest ${daysBetween(longest.waitingSince)} days` : 'Queue is clear',
      tone: approvals.length ? 'text-wait' : 'text-ok',
    },
    {
      label: 'KYC incomplete',
      value: String(kycPending),
      sub: kycPending ? 'Their claims will fail' : 'Everyone is verified',
      tone: kycPending ? 'text-wait' : 'text-ok',
    },
    {
      label: 'Months unfiled',
      value: String(missing.length),
      sub: missing.length ? fmtMonthLong(missing[0].month) : 'Nothing outstanding',
      tone: missing.length ? 'text-stop' : 'text-ok',
    },
  ]

  return (
    <div className="space-y-4">
      {/* The deadline, and what missing it costs — stated together. */}
      <section className="flex flex-wrap items-center gap-4 rounded-lg border-[1.35px] border-brand bg-brand-tint p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-bold tracking-[-0.01em]">
            {fmtMonthLong(NEXT_MONTH)} <Term id="ecr">return</Term> is due in{' '}
            <span className="num">{daysToDue} days</span>
          </p>
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">
            Due {fmtDate(NEXT_DUE, lang)}. Late filing attracts interest and damages from 16 Sep.
          </p>
        </div>
        <Button asChild>
          <Link to="/employer/return">File and pay</Link>
        </Button>
      </section>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={motionOk ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionOk ? 0.22 : 0, delay: motionOk ? i * 0.03 : 0 }}
            className="rounded-lg border bg-card px-5 py-4"
          >
            <dt className="eyebrow">{m.label}</dt>
            <dd className={cn('figure mt-2 text-[1.625rem]', m.tone)}>{m.value}</dd>
            <p className="mt-1 truncate text-xs text-muted-foreground">{m.sub}</p>
          </motion.div>
        ))}
      </dl>

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
                <span className="font-semibold text-foreground">Priya Sharma</span>. Until it is filed,
                the money has not reached any of them.
              </>
            }
            meta={<OwnerClock holder="employer" since={missing[0].holderSince ?? TODAY} />}
            fix={{ label: `File ${fmtMonth(missing[0].month, lang)} now`, href: '#/employer/return' }}
          />
        </motion.div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-semibold">Every month is filed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No employee has a gap in their passbook.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* The delay has a face: the longest wait is a person, named. */}
        {/* Sorted by how long somebody has been waiting, because that is the
            number the queue exists to bring down. */}
        <section aria-labelledby="approvals" className="rounded-lg border bg-card">
          <PanelTitle
            className="border-b px-5 py-3.5"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/employer/approvals">Open queue</Link>
              </Button>
            }
          >
            <span id="approvals">Waiting on you</span>
          </PanelTitle>
          {approvals.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Nothing is waiting on you. Every employee request is cleared.
            </p>
          ) : (
            <ul className="divide-y">
              {queue.map((a) => {
                const days = daysBetween(a.waitingSince)
                return (
                  <li key={a.id} className="flex items-center gap-3.5 px-5 py-3">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-sm text-[0.6875rem] font-bold',
                        days >= 7 ? 'bg-stop-soft text-stop' : 'bg-wait-soft text-wait',
                      )}
                      aria-hidden
                    >
                      {days}d
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.personName}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    {a.amount ? <Money value={a.amount} className="font-bold" /> : null}
                  </li>
                )
              })}
              {approvals.length > queue.length ? (
                <li className="px-5 py-3 text-xs text-muted-foreground">
                  <span className="num">{approvals.length - queue.length}</span> more in the queue.
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <section aria-labelledby="filings" className="rounded-lg border bg-card">
          <PanelTitle
            className="border-b px-5 py-3.5"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/employer/challans">All challans</Link>
              </Button>
            }
          >
            <span id="filings">Recent filings</span>
          </PanelTitle>
          <ul className="divide-y">
            {challans.slice(0, 4).map((c) => (
              <li key={c.trrn} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{fmtMonthLong(c.month)}</p>
                  <p className="ident text-xs text-muted-foreground">
                    <Term id="trrn">TRRN</Term> {c.trrn}
                  </p>
                </div>
                <div className="text-right">
                  <Money value={c.total} className="font-bold" />
                  <p className="num mt-0.5 text-xs text-muted-foreground">{fmtDate(c.paidOn, lang)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
