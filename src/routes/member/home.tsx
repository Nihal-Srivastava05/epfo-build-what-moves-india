import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Building2, CheckCircle2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CountUpMoney } from '@/components/patterns/count-up'
import { Money } from '@/components/patterns/money'
import { ActionCard } from '@/components/patterns/action-card'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { SectionTitle } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { activeClaim, totalBalance } from '@/lib/derive'
import { employments, establishmentByCode, personById, TODAY } from '@/lib/mock/db'
import { fmtDate, fmtMonth, fmtMonthLong, fmtUan } from '@/lib/format'

export default function MemberHome() {
  const { contributions, claims, kyc, employerNotified } = useData()
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const me = personById('p-priya')

  const balance = totalBalance(contributions)
  const claim = activeClaim(claims)
  const missing = contributions.filter((c) => c.status === 'missing')
  const kycIssues = kyc.filter((k) => k.status !== 'verified')
  const nothingPending = missing.length === 0 && kycIssues.length === 0

  return (
    <div className="space-y-10">
      {/* Status first, menu second. */}
      <section aria-labelledby="balance">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* The balance is the heading of this page, so it is marked as one. */}
            <h1 id="balance" className="eyebrow mb-2">
              {t('member.balanceLabel')}
            </h1>
            <CountUpMoney value={balance} />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('member.asOf')} {fmtDate(TODAY, lang)}
              <span className="mx-2 text-border" aria-hidden>·</span>
              {me.name}
              <span className="mx-2 text-border" aria-hidden>·</span>
              <Term id="uan">UAN</Term> <span className="ident">{fmtUan(me.uan)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="lg">
              <Link to="/member/claims/new">
                <Wallet className="size-4" aria-hidden />
                {t('member.withdraw')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/member/passbook">{t('member.viewPassbook')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Needs your attention — every card carries its own fix. */}
      <section aria-labelledby="needs">
        <SectionTitle>
          <span id="needs">{t('member.needsAction')}</span>
        </SectionTitle>

        {nothingPending ? (
          <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
            <div>
              <p className="font-medium">{t('member.nothingNeeded')}</p>
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
                        <span className="font-medium text-foreground">{est.name}</span> {t('gap.body')}{' '}
                        {fmtMonthLong(c.month)}. {t('gap.due')} {fmtDate(c.holderSince ?? TODAY, lang)}.
                      </>
                    }
                    meta={
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill tone="stop">
                          {t('gap.amountMissing')} <Money value={c.employeeShare + c.employerEpfShare} size="sm" className="ml-1" />
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
        <section aria-labelledby="claim">
          <SectionTitle
            action={
              <Button asChild variant="ghost" size="sm" className="h-8">
                <Link to="/member/claims">
                  {t('common.viewAll')}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          >
            <span id="claim">{t('member.yourClaim')}</span>
          </SectionTitle>
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Money value={claim.amount} size="xl" mark />
                <p className="mt-1 text-sm text-muted-foreground">
                  {claim.reasonKey === 'medical' ? t('claim.reason.medical') : t('claim.reason.withdrawal')}
                  <span className="mx-2 text-border" aria-hidden>·</span>
                  <span className="ident">{claim.id}</span>
                </p>
              </div>
              {claim.expectedBy ? (
                <div className="text-right">
                  <p className="eyebrow mb-1">{t('member.expectedBy')}</p>
                  <p className="num font-semibold">{fmtDate(claim.expectedBy, lang)}</p>
                </div>
              ) : null}
            </div>
            <ClaimTracker claim={claim} />
          </div>
        </section>
      ) : null}

      {/* One UAN, one continuous money story across every employer. */}
      <section aria-labelledby="employers">
        <SectionTitle>
          <span id="employers">{t('member.employers')}</span>
        </SectionTitle>
        <ul className="divide-y rounded-xl border bg-card">
          {employments
            .slice()
            .reverse()
            .map((emp) => {
              const est = establishmentByCode(emp.estCode)
              const rows = contributions.filter((c) => c.employmentId === emp.id && c.status !== 'missing')
              const total = rows.reduce((s, c) => s + c.employeeShare + c.employerEpfShare, 0)
              return (
                <li key={emp.id} className="flex items-center gap-4 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{est.name}</p>
                    <p className="num mt-0.5 text-sm text-muted-foreground">
                      {fmtMonth(emp.joined.slice(0, 7), lang)} –{' '}
                      {emp.exited ? fmtMonth(emp.exited.slice(0, 7), lang) : lang === 'hi' ? 'अब तक' : 'now'}
                      <span className="mx-1.5 text-border" aria-hidden>·</span>
                      {rows.length} {lang === 'hi' ? 'महीने' : 'months'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={total} className="font-medium" />
                    {emp.current ? (
                      <p className="mt-0.5 text-xs text-ok">Current</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
        </ul>
        <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
          <Link to="/member/passbook">
            {t('member.viewPassbook')}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  )
}
