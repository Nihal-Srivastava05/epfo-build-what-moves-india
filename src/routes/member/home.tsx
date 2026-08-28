import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/patterns/money'
import { ActionCard } from '@/components/patterns/action-card'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { GrievanceTracker } from '@/components/patterns/grievance-tracker'
import { PanelTitle, SectionTitle } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { TotalBalanceCard } from '@/components/patterns/total-balance-card'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { activeClaim } from '@/lib/derive'
import { activeGrievance, grievanceTone } from '@/lib/grievances'
import { employments, establishmentByCode, TODAY } from '@/lib/mock/db'
import { fmtDate, fmtMonth, fmtMonthLong } from '@/lib/format'
import type { StringKey } from '@/i18n/strings'

const quickActions: { to: string; titleKey: StringKey; subKey: StringKey }[] = [
  { to: '/member/claims/new', titleKey: 'member.withdraw', subKey: 'member.withdrawSub' },
  { to: '/member/passbook', titleKey: 'member.viewPassbook', subKey: 'member.passbookSub' },
  { to: '/member/kyc', titleKey: 'nav.kyc', subKey: 'member.kycSub' },
  { to: '/member/calculators', titleKey: 'nav.calculators', subKey: 'member.calculatorsSub' },
  { to: '/member/future-me', titleKey: 'member.futureMe', subKey: 'member.futureMeSub' },
  { to: '/member/help', titleKey: 'nav.help', subKey: 'member.helpSub' },
]

export default function MemberHome() {
  const { contributions, claims, kyc, employerNotified, grievances } = useData()
  const { t, lang } = useT()
  const motionOk = useMotionOk()

  const claim = activeClaim(claims)
  const grievance = activeGrievance(grievances, 'p-priya')
  const missing = contributions.filter((c) => c.status === 'missing')
  const kycIssues = kyc.filter((k) => k.status !== 'verified')
  const nothingPending = missing.length === 0 && kycIssues.length === 0

  return (
    <div className="space-y-4">
      {/* Status first, menu second. The balance is the heading of this page,
          so it is marked as one. */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <TotalBalanceCard contributions={contributions} headingLevel="h1" />

        <section aria-labelledby="doitnow" className="flex flex-col rounded-lg border bg-card p-5">
          <h2 id="doitnow" className="eyebrow mb-3.5">
            {t('member.doItNow')}
          </h2>
          <div className="grid flex-1 gap-2.5 sm:grid-cols-2 sm:grid-rows-3">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col justify-center gap-1 rounded-md border p-3.5 transition-colors duration-[var(--dur-fast)] hover:border-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="text-[0.8125rem] font-semibold">{t(a.titleKey)}</span>
                <span className="text-[0.6875rem] leading-snug text-muted-foreground">
                  {t(a.subKey)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Needs your attention — every card carries its own fix. */}
      <section aria-labelledby="needs">
        <SectionTitle>
          <span id="needs">{t('member.needsAction')}</span>
        </SectionTitle>

        {nothingPending ? (
          <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
            <div>
              <p className="font-semibold">{t('member.nothingNeeded')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('member.nothingNeededSub')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {missing.map((c, i) => {
              const emp = employments.find((e) => e.id === c.employmentId)!
              const est = establishmentByCode(emp.estCode)
              const notified = employerNotified.includes(c.month)
              return (
                <motion.div
                  key={c.id}
                  initial={motionOk ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionOk ? 0.25 : 0, delay: motionOk ? i * 0.03 : 0 }}
                >
                  <ActionCard
                    severity="blocker"
                    title={`${t('gap.title')} — ${fmtMonth(c.month, lang)}`}
                    detail={
                      <>
                        <span className="font-semibold text-foreground">{est.name}</span>{' '}
                        {t('gap.body')} {fmtMonthLong(c.month)}. {t('gap.due')}{' '}
                        {fmtDate(c.holderSince ?? TODAY, lang)}.
                      </>
                    }
                    meta={
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="stop">
                          {t('gap.amountMissing')}{' '}
                          <Money
                            value={c.employeeShare + c.employerEpfShare}
                            size="sm"
                            className="ml-1 font-bold"
                          />
                        </StatusPill>
                        {notified ? <StatusPill tone="ok">{t('gap.notified')}</StatusPill> : null}
                      </div>
                    }
                    fix={{ label: t('gap.seeNext'), href: `#/member/gap/${c.month}` }}
                  />
                </motion.div>
              )
            })}

            {kycIssues.map((k, i) => (
              <motion.div
                key={k.key}
                initial={motionOk ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionOk ? 0.25 : 0, delay: motionOk ? (missing.length + i) * 0.03 : 0 }}
              >
                <ActionCard
                  severity={k.key === 'bank' ? 'blocker' : 'warning'}
                  title={k.key === 'bank' ? t('kyc.bankTitle') : t('kyc.nomineeTitle')}
                  detail={k.key === 'bank' ? t('kyc.bankProblem') : t('kyc.nomineeProblem')}
                  fix={{
                    label: k.key === 'bank' ? t('kyc.bankFix') : t('kyc.nomineeFix'),
                    href: '#/member/kyc',
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Where is it and when does it land — on the first screen. */}
      {claim ? (
        <section aria-labelledby="claim" className="rounded-lg border bg-card p-5">
          <PanelTitle
            className="mb-4"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/member/claims">
                  {t('common.viewAll')}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          >
            <span id="claim" className="flex flex-wrap items-center gap-2.5">
              {t('member.yourClaim')}
              <StatusPill tone="brand">
                {claim.reasonKey === 'medical' ? t('claim.reason.medical') : t('claim.reason.withdrawal')}
                <Money value={claim.amount} size="sm" className="font-bold" />
              </StatusPill>
              {claim.expectedBy ? (
                <span className="num text-xs font-normal text-muted-foreground">
                  {t('member.expectedBy')} {fmtDate(claim.expectedBy, lang)}
                </span>
              ) : null}
            </span>
          </PanelTitle>
          <ClaimTracker claim={claim} />
        </section>
      ) : null}

      {/* Same idea as the claim tracker above — where a grievance sits and
          what moves it forward, without having to chase it by phone. */}
      {grievance ? (
        <section aria-labelledby="grievance" className="rounded-lg border bg-card p-5">
          <PanelTitle
            className="mb-4"
            action={
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/member/help">
                  {t('nav.help')}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          >
            <span id="grievance" className="flex flex-wrap items-center gap-2.5">
              Your grievance
              <StatusPill tone={grievanceTone(grievance)}>{grievance.subject}</StatusPill>
              <span className="num text-xs font-normal text-muted-foreground">
                Escalates {fmtDate(grievance.escalatesOn, lang)}
              </span>
            </span>
          </PanelTitle>
          <GrievanceTracker grievance={grievance} />
        </section>
      ) : null}

      {/* One UAN, one continuous money story across every employer. */}
      <section aria-labelledby="employers" className="rounded-lg border bg-card">
        <PanelTitle
          className="border-b px-5 py-3.5"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/member/passbook">
                {t('member.viewPassbook')}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          }
        >
          <span id="employers">{t('member.employers')}</span>
        </PanelTitle>
        <ul className="divide-y">
          {employments
            .slice()
            .reverse()
            .map((emp) => {
              const est = establishmentByCode(emp.estCode)
              const rows = contributions.filter((c) => c.employmentId === emp.id && c.status !== 'missing')
              const total = rows.reduce((s, c) => s + c.employeeShare + c.employerEpfShare, 0)
              return (
                <li key={emp.id} className="flex items-center gap-3.5 px-5 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-muted">
                    <Building2 className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{est.name}</p>
                    <p className="num mt-0.5 text-xs text-muted-foreground">
                      {fmtMonth(emp.joined.slice(0, 7), lang)} –{' '}
                      {emp.exited ? fmtMonth(emp.exited.slice(0, 7), lang) : lang === 'hi' ? 'अब तक' : 'now'}
                      <span className="mx-1.5 text-border" aria-hidden>·</span>
                      {rows.length} {lang === 'hi' ? 'महीने' : 'months'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={total} className="font-bold" />
                    {emp.current ? (
                      <p className="mt-0.5 text-[0.6875rem] font-semibold text-ok">Current</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
        </ul>
      </section>
    </div>
  )
}
