import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { Term } from '@/components/patterns/term'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { fmtDate, fmtMonth, fmtTenure } from '@/lib/format'
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
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/member/passbook">
          <ArrowLeft className="size-4" aria-hidden />
          {t('nav.passbook')}
        </Link>
      </Button>

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
        <>
          {/* The one number a service record exists to answer, and the threshold
              it is measured against — a total nobody should have to add up from
              the rows below. */}
          <section aria-labelledby="total-service" className="rounded-lg border bg-card p-5">
            <h2 id="total-service" className="eyebrow">
              Total membership
            </h2>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="num text-2xl font-bold tracking-[-0.02em]">
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

          {/* A rail with the line behind it, not inside the list: an <ol> may
              only contain <li>, and the line is decoration either way. */}
          <div className="relative mt-6">
            <div className="absolute top-1 bottom-1 left-[15px] w-px bg-border" aria-hidden />

            <ol>
              {history.map((emp, i) => {
                const est = establishmentByCode(emp.estCode)
                return (
                  <li key={emp.id} className="relative flex gap-4 pb-8 last:pb-0">
                    <motion.span
                      className={cn(
                        'relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2 bg-card',
                        emp.current ? 'border-ok bg-ok-soft' : 'border-border',
                      )}
                      initial={motionOk ? { scale: 0.6, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: motionOk ? i * 0.06 : 0, ease: 'easeOut' }}
                    >
                      <Building2
                        className={cn('size-4', emp.current ? 'text-ok' : 'text-muted-foreground')}
                        aria-hidden
                      />
                    </motion.span>

                    <div className="min-w-0 flex-1 rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold tracking-[-0.01em]">{est.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{est.city}</p>
                        </div>
                        {emp.current ? (
                          <span className="shrink-0 rounded-full bg-ok-soft px-2.5 py-0.5 text-[0.6875rem] font-semibold text-ok">
                            Current
                          </span>
                        ) : null}
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 text-[0.8125rem] sm:grid-cols-4">
                        <div>
                          <dt className="text-xs text-muted-foreground">Joined</dt>
                          <dd className="num font-medium">{fmtDate(emp.joined, lang)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            {emp.current ? 'Still there' : 'Left'}
                          </dt>
                          <dd className="num font-medium">
                            {emp.current ? 'Present' : fmtDate(emp.exited!, lang)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Tenure</dt>
                          <dd className="num font-medium">
                            {fmtTenure(emp.joined, emp.exited ?? TODAY, lang)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Monthly EPF wage</dt>
                          <dd>
                            <Money value={emp.monthlyWage} size="sm" className="font-semibold" />
                          </dd>
                        </div>
                      </dl>

                      <p className="ident mt-2.5 text-xs text-muted-foreground">
                        Establishment code {est.code}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
