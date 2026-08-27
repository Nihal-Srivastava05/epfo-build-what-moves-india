import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Landmark,
  Lock,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { StepActions, StepProgress } from '@/components/patterns/step-flow'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { ActionCard } from '@/components/patterns/action-card'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { preflight, totalBalance, withdrawalReasons } from '@/lib/derive'
import { WITHDRAW_STEPS } from '@/lib/claims'
import { fmtDate, rupees } from '@/lib/format'
import { TODAY, establishments } from '@/lib/mock/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DEMO_OTP = '284116'

export default function Withdraw() {
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const { contributions, kyc, claimDraft, saveDraft, fileClaim, fixKyc } = useData()

  const reasons = useMemo(() => withdrawalReasons(contributions), [contributions])
  const balance = useMemo(() => totalBalance(contributions), [contributions])
  const [step, setStep] = useState(claimDraft?.step ?? 1)
  const [reasonKey, setReasonKey] = useState(claimDraft?.reasonKey ?? '')
  const [amount, setAmount] = useState<string>(claimDraft?.amount ? String(claimDraft.amount) : '')
  const [agreed, setAgreed] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [filedId, setFiledId] = useState<string | null>(null)

  const reason = reasons.find((r) => r.key === reasonKey)
  const issues = preflight(kyc)
  const blockers = issues.filter((i) => i.severity === 'blocker')
  const bank = kyc.find((k) => k.key === 'bank')!
  const amountNum = Number(amount) || 0
  const overCap = reason ? amountNum > reason.cap : false

  /** Every field autosaves. A dropped session resumes instead of starting over. */
  useEffect(() => {
    if (filedId) return
    if (!reasonKey && step === 1) return
    saveDraft({ reasonKey, amount: amountNum, step, startedAt: claimDraft?.startedAt ?? TODAY })
  }, [reasonKey, amountNum, step, filedId, saveDraft, claimDraft?.startedAt])

  const labels = WITHDRAW_STEPS.map((s) => t(s.titleKey))

  if (filedId) {
    const claim = useData.getState().claims.find((c) => c.id === filedId)!
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionOk ? 0.3 : 0 }}
          className="rounded-xl border border-ok-line bg-ok-soft p-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">{t('withdraw.filed')}</h1>
          <p className="mt-2 text-muted-foreground">
            <Money value={claim.amount} size="lg" /> · {reason?.title}
          </p>
          <div className="mt-6 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-1">{t('withdraw.reference')}</p>
            <p className="ident text-lg font-semibold">{claim.id}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Quote this number in any call or grievance about this claim.
            </p>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-2">{t('withdraw.whoHasIt')}</p>
            <p className="text-sm leading-relaxed">
              <span className="font-medium">{establishments[0].name}</span> has been sent this claim for
              attestation. They have 3 days. EPFO settles within 7 days after that, so you should see the
              money by <span className="num font-medium">{fmtDate(claim.expectedBy!, lang)}</span>.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              You do not need to contact them. We will tell you at every step.
            </p>
          </div>
        </motion.div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link to="/member">Back to home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to={`/member/claims/${claim.id}`}>{t('member.trackClaim')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('withdraw.title')} />
      <StepProgress
        step={step}
        labels={labels}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
      />
      <p className="-mt-6 mb-8 text-sm leading-relaxed text-muted-foreground">
        {t(WITHDRAW_STEPS[step - 1].blurbKey)}
      </p>

      {/* Step 1 — name the task, not the form. Choosing a reason picks the form silently. */}
      {step === 1 ? (
        <div className="space-y-3">
          {reasons.map((r, i) => (
            <motion.button
              key={r.key}
              type="button"
              disabled={!r.eligible}
              onClick={() => {
                setReasonKey(r.key)
                setStep(2)
              }}
              initial={motionOk ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionOk ? 0.25 : 0, delay: motionOk ? i * 0.04 : 0 }}
              className={cn(
                'flex w-full flex-col rounded-xl border bg-card p-5 text-left transition-all',
                r.eligible
                  ? 'hover:border-gold-line hover:shadow-[0_8px_24px_-18px_rgb(0_0_0/0.5)]'
                  : 'cursor-not-allowed opacity-70',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight">
                    {lang === 'hi' ? r.titleHi : r.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lang === 'hi' ? r.blurbHi : r.blurb}
                  </p>
                </div>
                {r.eligible ? (
                  <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <Lock className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </div>

              {r.eligible ? (
                <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t pt-4">
                  <span className="text-sm text-muted-foreground">{t('withdraw.youCanTake')}</span>
                  <Money value={r.cap} size="lg" mark />
                </div>
              ) : (
                <div className="mt-4 border-t pt-4">
                  <StatusPill tone="neutral">{t('withdraw.notEligible')}</StatusPill>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {r.blockedBecause}
                  </p>
                </div>
              )}

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium">{t('withdraw.rule')}:</span>{' '}
                {lang === 'hi' ? r.ruleHi : r.rule}
                <span className="mx-1.5 text-border" aria-hidden>·</span>
                <span className="text-muted-foreground/70">
                  {t('common.was')} {r.formNumber}
                </span>
              </p>
            </motion.button>
          ))}
        </div>
      ) : null}

      {/* Step 2 — the computed cap above the field, the verified bank shown not re-entered. */}
      {step === 2 && reason ? (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{lang === 'hi' ? reason.titleHi : reason.title}</p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm text-muted-foreground">{t('withdraw.youCanTake')}</span>
              <Money value={reason.cap} size="xl" mark />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {lang === 'hi' ? reason.ruleHi : reason.rule}
            </p>

            <div className="mt-5 space-y-2">
              <Label htmlFor="amount">{t('withdraw.amount')}</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  inputMode="numeric"
                  placeholder="0"
                  aria-invalid={overCap}
                  aria-describedby={overCap ? 'amount-error' : undefined}
                  className="num h-12 pl-8 text-lg"
                />
              </div>
              {overCap ? (
                <p id="amount-error" className="text-sm font-medium text-stop">
                  That is more than you can take for this reason. The most is {rupees(reason.cap)}.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {[25, 50, 100].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setAmount(String(Math.round((reason.cap * pct) / 100)))}
                  >
                    {pct === 100 ? 'Full amount' : `${pct}%`}
                  </Button>
                ))}
              </div>

              {/* The consequence of the number, shown as it is typed. */}
              {amountNum > 0 && !overCap ? (
                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
                  <span className="text-sm text-muted-foreground">{t('withdraw.leftAfter')}</span>
                  <Money value={Math.max(0, balance - amountNum)} className="font-medium" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="eyebrow mb-3">{t('withdraw.paidInto')}</p>
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{bank.value.split(' · ')[0]}</p>
                <p className="ident mt-0.5 text-sm text-muted-foreground">
                  <Term id="ifsc">IFSC</Term> {bank.value.split(' · ')[1]}
                </p>
              </div>
              {bank.status === 'verified' ? (
                <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
                  Verified
                </StatusPill>
              ) : (
                <StatusPill tone="stop">Needs fixing</StatusPill>
              )}
            </div>
            {/* Shown, not re-entered — but changeable, so it is a decision. */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                This is the account EPFO has already verified against your UAN.
              </p>
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link to="/member/kyc">{t('withdraw.changeBank')}</Link>
              </Button>
            </div>
          </div>

          {/* The pre-submit check. Everything a rejection letter would have said, now. */}
          <section aria-labelledby="preflight">
            <div className="mb-3 flex items-center gap-2">
              <h2 id="preflight" className="text-sm font-semibold">
                {t('withdraw.checkTitle')}
              </h2>
            </div>
            {issues.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                <div>
                  <p className="font-medium">{t('withdraw.checkPass')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('withdraw.noDocuments')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('withdraw.checkFail')}</p>
                {issues.map((issue) => (
                  <ActionCard
                    key={issue.key}
                    severity={issue.severity}
                    title={issue.title}
                    detail={
                      <>
                        {issue.detail}
                        {issue.key === 'bank' ? (
                          <span className="ident mt-3 block rounded-md border bg-card p-2.5 text-xs">
                            <span className="block text-stop line-through">PUNB0234500</span>
                            <span className="block font-semibold text-ok">PUNB0234501</span>
                          </span>
                        ) : null}
                      </>
                    }
                    fix={{
                      label: issue.fixLabel,
                      onClick: () => {
                        fixKyc(issue.key as 'bank' | 'nominee')
                        toast.success(
                          issue.key === 'bank'
                            ? 'Bank IFSC updated. We rechecked — this claim will go through.'
                            : 'Nominee added.',
                          { icon: <Wrench className="size-4" /> },
                        )
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="rounded-lg border border-info-line bg-info-soft p-4 text-sm leading-relaxed">
            {t('withdraw.sla')}
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
              {t('withdraw.back')}
            </Button>
            <Button
              size="lg"
              disabled={!amountNum || overCap || blockers.length > 0}
              onClick={() => setStep(3)}
            >
              {t('withdraw.continue')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
          {blockers.length > 0 ? (
            <p className="-mt-4 text-right text-sm text-muted-foreground">
              Fix the item above to continue.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Step 3 — read back, one checkbox, one code. */}
      {step === 3 && reason ? (
        <div className="space-y-6">
          <dl className="divide-y rounded-xl border bg-card">
            {[
              { k: 'Reason', v: lang === 'hi' ? reason.titleHi : reason.title, editStep: 1 },
              { k: 'Amount', v: rupees(amountNum), editStep: 2, big: true },
              { k: 'Paid into', v: bank.value, editStep: 2 },
              { k: 'Form used', v: reason.formNumber },
              { k: 'Documents needed', v: 'None' },
            ].map((row) => (
              <div
                key={row.k}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5"
              >
                <dt className="text-sm text-muted-foreground">{row.k}</dt>
                <dd className="flex items-baseline gap-3 text-right">
                  <span className={cn('font-medium', row.big && 'num text-lg')}>{row.v}</span>
                  {row.editStep ? (
                    <button
                      type="button"
                      onClick={() => setStep(row.editStep!)}
                      className="!min-h-0 text-sm font-medium text-info underline underline-offset-4"
                    >
                      {t('withdraw.edit')}
                    </button>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>

          {/* Fraud targets this exact screen, so the warning lives here. */}
          <div className="flex items-start gap-3 rounded-lg border border-wait-line bg-wait-soft p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-wait" aria-hidden />
            <p className="text-sm leading-relaxed">{t('withdraw.scam')}</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              The details above are correct and this money is for the reason I chose.
            </span>
          </label>

          <div className="space-y-2 rounded-xl border bg-card p-5">
            <Label htmlFor="claim-otp">{t('signin.otp')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('signin.otpSent')} +91 98XXX XX210
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="claim-otp"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setOtpError('')
                }}
                inputMode="numeric"
                placeholder="000000"
                aria-invalid={Boolean(otpError)}
                className="ident h-12 max-w-40 text-center text-lg tracking-[0.3em]"
              />
              <span className="ident text-sm text-muted-foreground">{DEMO_OTP}</span>
              <MockBadge what="No SMS is sent. The code is fixed for the prototype." />
            </div>
            {otpError ? <p className="text-sm font-medium text-stop">{otpError}</p> : null}
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(2)}>
              {t('withdraw.back')}
            </Button>
            <Button
              size="lg"
              disabled={!agreed}
              onClick={() => {
                if (otp !== DEMO_OTP) {
                  setOtpError(`Enter the code shown above (${DEMO_OTP}).`)
                  return
                }
                const claim = fileClaim({
                  reasonKey: reason.key,
                  formNumber: reason.formNumber,
                  amount: amountNum,
                })
                setFiledId(claim.id)
              }}
            >
              {t('withdraw.confirm')}
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 1 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Not sure which applies? Ask the assistant at the bottom of the screen — it reads your own
          record and will not guess.
        </p>
      ) : null}
      <div className="mt-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/member">{t('common.cancel')}</Link>
        </Button>
      </div>
    </div>
  )
}
