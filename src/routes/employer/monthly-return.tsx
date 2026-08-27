import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, FileUp, MinusCircle, PlusCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { StepActions, StepProgress } from '@/components/patterns/step-flow'
import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import {
  ADMIN_RATE,
  EDLI_RATE,
  EPS_WAGE_CEILING,
  TODAY,
  splitContribution,
} from '@/lib/mock/db'
import { fmtDate, fmtMonthLong } from '@/lib/format'

const DEFAULT_MONTH = '2026-08'

export default function MonthlyReturn() {
  const { contributions, roster, fileReturn } = useData()
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const [step, setStep] = useState(1)
  const [filed, setFiled] = useState<{ trrn: string; month: string } | null>(null)

  const missing = contributions.filter((c) => c.status === 'missing')
  /**
   * Pinned once filed: the month stops being "missing" the instant we file it,
   * so recomputing here would make the receipt name the wrong month.
   */
  const month = filed?.month ?? missing[0]?.month ?? DEFAULT_MONTH
  /** Who was actually on the roll in the month being filed. */
  const active = useMemo(
    () =>
      roster.filter(
        (r) => r.joined.slice(0, 7) <= month && (!r.exited || r.exited.slice(0, 7) > month),
      ),
    [roster, month],
  )

  /**
   * The changes the system found since the last filed month, read off the
   * roster rather than left for the employer to spot and re-key.
   */
  const diffs = useMemo(() => {
    const out: { kind: 'joiner' | 'exit' | 'revision'; name: string; detail: string }[] = []
    for (const r of roster) {
      if (r.joined.slice(0, 7) === month) {
        out.push({
          kind: 'joiner',
          name: r.name,
          detail: `Joined ${fmtDate(r.joined, lang)} · first month of contribution`,
        })
      }
      if (r.exited && r.exited.slice(0, 7) === month) {
        out.push({
          kind: 'exit',
          name: r.name,
          detail: `Left ${fmtDate(r.exited, lang)} · removed from this return`,
        })
      }
    }
    out.push({
      kind: 'revision',
      name: 'Sneha Patil',
      detail: 'Wage revised ₹54,000 → ₹57,000',
    })
    return out
  }, [roster, month, lang])

  const totals = useMemo(() => {
    return active.reduce(
      (acc, r) => {
        const s = splitContribution(r.monthlyWage)
        acc.employee += s.employee
        acc.employerEpf += s.employerEpf
        acc.eps += s.eps
        acc.edli += Math.round(Math.min(r.monthlyWage, EPS_WAGE_CEILING) * EDLI_RATE)
        acc.admin += Math.round(Math.min(r.monthlyWage, EPS_WAGE_CEILING) * ADMIN_RATE)
        return acc
      },
      { employee: 0, employerEpf: 0, eps: 0, edli: 0, admin: 0 },
    )
  }, [active])

  const grand = totals.employee + totals.employerEpf + totals.eps + totals.edli + totals.admin

  if (filed) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionOk ? 0.3 : 0 }}
          className="rounded-xl border border-ok-line bg-ok-soft p-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">
            {fmtMonthLong(month)} filed and paid
          </h1>
          <p className="mt-2 text-muted-foreground">
            <Money value={grand} size="lg" /> for {active.length} employees
          </p>
          <div className="mt-6 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-1">
              <Term id="trrn">TRRN</Term>
            </p>
            <p className="ident text-lg font-semibold">{filed.trrn}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Paid {fmtDate(TODAY, lang)}. The receipt is in your challan history.
            </p>
          </div>
          {/* The point of the whole build, said plainly. */}
          <div className="mt-4 rounded-lg border border-info-line bg-info-soft p-4 text-left">
            <p className="text-sm leading-relaxed">
              <span className="font-medium">{active.length} employees</span> just had this month credited
              to their passbooks. The gap Priya Sharma could see on her home screen is now closed.
            </p>
            <Button asChild variant="link" size="sm" className="mt-1 -ml-4">
              <Link to="/member">{t('common.otherSide')} →</Link>
            </Button>
          </div>
        </motion.div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link to="/employer">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  const labels = ['Wages', 'Totals', 'Pay']

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={fmtMonthLong(month)}
        title="Monthly return"
        sub={
          missing.length
            ? 'This month was never filed. Filing it credits every employee immediately.'
            : 'Carry over last month, review what changed, and pay.'
        }
      />
      <StepProgress step={step} labels={labels} onBack={step > 1 ? () => setStep(step - 1) : undefined} />

      {step === 1 ? (
        <div className="space-y-5">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Carried over from the last filed month</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="num">{active.length}</span> employees, wages unchanged unless listed
                  below.
                </p>
              </div>
              <StatusPill tone="ok">Default</StatusPill>
            </div>
            <Button variant="outline" size="sm" className="mt-4">
              <FileUp className="size-4" aria-hidden />
              Upload a payroll export instead
              <MockBadge what="File upload is not wired up in this prototype." className="ml-1" />
            </Button>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">
              We found <span className="num">{diffs.length}</span> changes since then
            </p>
            <ul className="divide-y rounded-xl border bg-card">
              {diffs.map((d, i) => (
                <motion.li
                  key={d.name}
                  initial={motionOk ? { opacity: 0, y: 4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionOk ? 0.22 : 0, delay: motionOk ? i * 0.04 : 0 }}
                  className="flex items-start gap-3 p-4"
                >
                  {d.kind === 'joiner' ? (
                    <PlusCircle className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                  ) : d.kind === 'exit' ? (
                    <MinusCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <TrendingUp className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{d.detail}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <StepActions>
            <Button size="lg" onClick={() => setStep(2)}>
              Looks right, continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          {/* Every line states the rule that produced it. */}
          <dl className="divide-y rounded-xl border bg-card">
            {[
              { label: 'Employee EPF', value: totals.employee, rule: '12% of each wage' },
              { label: 'Employer EPF', value: totals.employerEpf, rule: '12% of wage, less the pension share' },
              { label: 'Pension (EPS)', value: totals.eps, rule: `8.33% of wage, capped at ₹${EPS_WAGE_CEILING.toLocaleString('en-IN')}` },
              { label: 'Insurance (EDLI)', value: totals.edli, rule: '0.5% of capped wage' },
              { label: 'Admin charges', value: totals.admin, rule: '0.5% of capped wage' },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <dt className="font-medium">{row.label}</dt>
                  <dd className="mt-0.5 text-xs text-muted-foreground">{row.rule}</dd>
                </div>
                <dd className="shrink-0">
                  <Money value={row.value} className="font-medium" />
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 bg-secondary/50 px-5 py-4">
              <dt className="font-semibold">Total payable</dt>
              <dd>
                <Money value={grand} size="lg" mark />
              </dd>
            </div>
          </dl>

          <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
            <div>
              <p className="font-medium">Validation passed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every UAN is active, every IFSC resolves, and no employee appears twice. Nothing will
                bounce back after payment.
              </p>
            </div>
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
              {t('withdraw.back')}
            </Button>
            <Button size="lg" onClick={() => setStep(3)}>
              {t('withdraw.continue')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div className="rounded-xl border bg-card p-5">
            <p className="eyebrow mb-2">Challan for {fmtMonthLong(month)}</p>
            <Money value={grand} size="xl" mark />
            <p className="mt-2 text-sm text-muted-foreground">
              {active.length} employees · paying generates the <Term id="trrn">TRRN</Term> and closes the
              return in one action.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="mb-3 font-medium">Pay from</p>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">HDFC Bank ****8802</p>
                <p className="text-sm text-muted-foreground">Net banking · Northline Logistics Pvt Ltd</p>
              </div>
              <MockBadge what="No payment is made. This is a simulated challan." />
            </div>
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(2)}>
              {t('withdraw.back')}
            </Button>
            <Button size="lg" onClick={() => setFiled({ trrn: fileReturn(month), month })}>
              Pay <Money value={grand} size="sm" className="mx-1" /> and file
            </Button>
          </StepActions>
        </div>
      ) : null}
    </div>
  )
}
