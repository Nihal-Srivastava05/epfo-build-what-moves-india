import { motion } from 'motion/react'
import { ArrowRight, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { Term } from '@/components/patterns/term'
import { ServiceSpans } from '@/components/charts/service-spans'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { fmtDate, fmtMemberId, fmtMonth, fmtTenure } from '@/lib/format'
import { serviceYears } from '@/lib/derive'
import { TODAY, employments, establishmentByCode, personById } from '@/lib/mock/db'
import { cn } from '@/lib/utils'

/** Years of service EPS requires before a monthly pension is payable. */
const PENSION_YEARS = 10

export default function ServiceHistory() {
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const me = personById('p-priya')

  /** Newest first: the job you are explaining yourself out of is usually the last one. */
  const history = employments
    .filter((e) => e.personId === me.id)
    .slice()
    .sort((a, b) => b.joined.localeCompare(a.joined))

  const firstJoined = history.length ? history[history.length - 1].joined : undefined
  const years = serviceYears()
  const toGo = Math.max(0, PENSION_YEARS - years)
  const vested = toGo === 0

  return (
    <div>
      {/* No back button: the shell's breadcrumb trail already points at the
          passbook, in the same spot on every screen. */}
      <PageHeader
        title={t('nav.serviceHistory')}
        sub="Every establishment your UAN has been linked to, newest first. One continuous record, even though each job sat in a different employer’s payroll."
      />

      {history.length === 0 ? (
        <p className="rounded-lg border bg-card p-5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          No employment on your record yet. A stint appears here once your employer files its first
          monthly return against your UAN.
        </p>
      ) : (
        <div className="space-y-4">
          {/* The one number a service record exists to answer, and the threshold
              it is measured against — a total nobody should have to add up from
              the rows below. */}
          <section aria-labelledby="total-service" className="rounded-lg border bg-card p-5">
            <h2 id="total-service" className="eyebrow">
              Total membership
            </h2>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="figure text-2xl">
                {years} {years === 1 ? 'year' : 'years'}
              </span>
              {firstJoined ? (
                <span className="text-[0.8125rem] text-muted-foreground">
                  since {fmtMonth(firstJoined.slice(0, 7), lang)}, across{' '}
                  <span className="num">{history.length}</span> employers
                </span>
              ) : null}
            </p>

            <div
              className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.min(years, PENSION_YEARS)}
              aria-valuemin={0}
              aria-valuemax={PENSION_YEARS}
              aria-label={`Years of service towards a pension, out of ${PENSION_YEARS}`}
            >
              <motion.div
                className={cn('h-full rounded-full', vested ? 'bg-ok' : 'bg-brand')}
                initial={{ width: motionOk ? 0 : `${Math.min(100, (years / PENSION_YEARS) * 100)}%` }}
                animate={{ width: `${Math.min(100, (years / PENSION_YEARS) * 100)}%` }}
                transition={{ duration: motionOk ? 0.6 : 0, ease: 'easeOut' }}
              />
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              {vested ? (
                <>
                  You have passed the {PENSION_YEARS} years of service a monthly{' '}
                  <Term id="eps">pension (EPS)</Term> needs.
                </>
              ) : (
                <>
                  <span className="num">{toGo}</span> more {toGo === 1 ? 'year' : 'years'} of service
                  before a monthly <Term id="eps">pension (EPS)</Term> is payable. Leaving a job does
                  not reset this — service adds up across employers under one UAN.
                </>
              )}
            </p>
          </section>

          <ServiceSpans personId={me.id} lang={lang} />

          {/* The record itself. The dates lead — a service history is read for
              "when, and for how long", so the period is the largest thing on
              every row and the employer answers the follow-up question. */}
          <section aria-label="Service record" className="relative pt-1">
            <div
              className="absolute top-3 bottom-3 left-[calc(2.75rem+0.75rem+11px)] w-px bg-border sm:left-[calc(3.5rem+1rem+11px)]"
              aria-hidden
            />

            <ol>
              {history.map((emp, i) => {
                const est = establishmentByCode(emp.estCode)
                const endYear = emp.current ? 'now' : emp.exited!.slice(0, 4)
                return (
                  <li key={emp.id} className="relative flex gap-3 pb-4 last:pb-0 sm:gap-4">
                    {/* The scanning anchor: years, right-aligned against the spine. */}
                    <div className="w-11 shrink-0 pt-2.5 text-right sm:w-14">
                      <p className="num text-sm leading-tight font-bold sm:text-[0.9375rem]">
                        {emp.joined.slice(0, 4)}
                      </p>
                      <p className="text-xs leading-tight text-faint">–</p>
                      <p className="num text-sm leading-tight font-bold sm:text-[0.9375rem]">
                        {endYear}
                      </p>
                    </div>

                    <motion.span
                      className={cn(
                        'relative z-10 mt-2 grid size-[22px] shrink-0 place-items-center rounded-full border-2 bg-card',
                        emp.current ? 'border-ok bg-ok-soft' : 'border-border',
                      )}
                      initial={motionOk ? { scale: 0.6, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: motionOk ? i * 0.06 : 0, ease: 'easeOut' }}
                    >
                      <Building2
                        className={cn(
                          'size-3',
                          emp.current ? 'text-ok' : 'text-muted-foreground',
                        )}
                        aria-hidden
                      />
                    </motion.span>

                    <div className="min-w-0 flex-1 rounded-lg border bg-card p-4">
                      {/* Dates first, and largest. */}
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="num flex items-center gap-1.5 text-[0.9375rem] font-bold tracking-[-0.01em] sm:text-base">
                          <time dateTime={emp.joined}>{fmtDate(emp.joined, lang)}</time>
                          <ArrowRight className="size-3.5 shrink-0 text-faint" aria-hidden />
                          {emp.current ? (
                            <span>Present</span>
                          ) : (
                            <time dateTime={emp.exited}>{fmtDate(emp.exited!, lang)}</time>
                          )}
                        </p>
                        <p className="num rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                          {fmtTenure(emp.joined, emp.exited ?? TODAY, lang)}
                        </p>
                      </div>

                      <div className="mt-3 border-t pt-3">
                        <p className="font-semibold tracking-[-0.01em]">
                          {est.name}
                          {emp.current ? (
                            <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 align-middle text-[0.6875rem] font-semibold text-ok">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{est.city}</p>

                        {/* Stacked on a phone: "Member ID" plus a 26-character
                            account number is wider than the card. */}
                        <dl className="mt-2.5 space-y-2 text-xs sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-1 sm:space-y-0">
                          <div className="min-w-0 sm:flex sm:items-baseline sm:gap-1.5">
                            <dt className="text-muted-foreground">Member ID</dt>
                            <dd className="ident break-all">{fmtMemberId(emp.memberId)}</dd>
                          </div>
                          <div className="sm:flex sm:items-baseline sm:gap-1.5">
                            <dt className="text-muted-foreground">EPF wage</dt>
                            <dd>
                              <Money value={emp.monthlyWage} size="sm" className="font-semibold" />
                              <span className="text-muted-foreground"> / month</span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>
      )}
    </div>
  )
}
