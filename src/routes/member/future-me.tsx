import { useMemo, useState, type ReactNode } from 'react'
import { CalendarClock, PiggyBank, Wallet } from 'lucide-react'
import { PageHeader, PanelTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { MockBadge } from '@/components/patterns/mock-badge'
import { StatusPill } from '@/components/patterns/status-pill'
import { Progress } from '@/components/ui/progress'
import { FutureMeProjection, type ProjectionSeries } from '@/components/charts/future-me-projection'
import { useData } from '@/store/data'
import { serviceYears, totalBalance } from '@/lib/derive'
import { epfContribution, epfGrowthProjection, epsPensionEstimate } from '@/lib/calculators'
import { projectionPoints } from '@/lib/future-me'
import { employments, personById, RETIREMENT_AGE, TODAY } from '@/lib/mock/db'
import { compactInr, daysBetween } from '@/lib/format'
import { cn } from '@/lib/utils'

const ASSUMED_RAISE_PCT = 8
const MISSED_MONTHS = 3

function ScenarioToggle({
  pressed,
  onClick,
  activeClass,
  children,
}: {
  pressed: boolean
  onClick: () => void
  activeClass: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors duration-[var(--dur-fast)]',
        pressed ? activeClass : 'border-border text-muted-foreground hover:border-brand hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/**
 * The portal already has every number this needs — it has just never drawn
 * them forward. Three panes, in the order a person actually asks them:
 * where I stand, where I'm headed, and what would move that line.
 */
export default function FutureMe() {
  const contributions = useData((s) => s.contributions)
  const [showRaise, setShowRaise] = useState(false)
  const [showMiss, setShowMiss] = useState(false)

  const { wage, balance, age, yearsToRetirement, yearsAtRetirement } = useMemo(() => {
    const me = personById('p-priya')
    const current = employments.find((e) => e.current && e.personId === me.id)
    const ageNow = Math.floor(daysBetween(me.dob, TODAY) / 365.25)
    const yearsToGo = Math.max(1, RETIREMENT_AGE - ageNow)
    return {
      wage: current?.monthlyWage ?? 0,
      balance: totalBalance(contributions),
      age: ageNow,
      yearsToRetirement: yearsToGo,
      yearsAtRetirement: Math.round(serviceYears() + yearsToGo),
    }
  }, [contributions])

  const contribution = useMemo(() => epfContribution(wage), [wage])

  const baseline = useMemo(
    () => epfGrowthProjection({ currentBalance: balance, monthlyWage: wage, annualIncrementPct: 0, years: yearsToRetirement, startAge: age }),
    [balance, wage, yearsToRetirement, age],
  )
  const raiseScenario = useMemo(
    () =>
      epfGrowthProjection({
        currentBalance: balance,
        monthlyWage: wage,
        annualIncrementPct: ASSUMED_RAISE_PCT,
        years: yearsToRetirement,
        startAge: age,
      }),
    [balance, wage, yearsToRetirement, age],
  )
  const missScenario = useMemo(
    () =>
      epfGrowthProjection({
        currentBalance: balance,
        monthlyWage: wage,
        annualIncrementPct: 0,
        years: yearsToRetirement,
        startAge: age,
        missedMonths: MISSED_MONTHS,
      }),
    [balance, wage, yearsToRetirement, age],
  )

  const pension = useMemo(
    () => epsPensionEstimate({ monthlyWage: wage, yearsOfServiceAtRetirement: yearsAtRetirement }),
    [wage, yearsAtRetirement],
  )

  const series: ProjectionSeries[] = [
    { key: 'baseline', label: 'If nothing changes', color: 'var(--series-you)', points: projectionPoints(balance, baseline) },
  ]
  if (showRaise) {
    series.push({
      key: 'raise',
      label: `With a ${ASSUMED_RAISE_PCT}% raise most years`,
      color: 'var(--ok)',
      dashed: true,
      points: projectionPoints(balance, raiseScenario),
    })
  }
  if (showMiss) {
    series.push({
      key: 'miss',
      label: `If your employer misses ${MISSED_MONTHS} months`,
      color: 'var(--stop)',
      dashed: true,
      points: projectionPoints(balance, missScenario),
    })
  }

  const raiseDelta = raiseScenario.finalBalance - baseline.finalBalance
  const missDelta = baseline.finalBalance - missScenario.finalBalance

  return (
    <div className="space-y-6">
      <PageHeader
        title="Future Me"
        sub="A calm look at where your PF is headed, built from your own numbers — a projection, not a promise."
      />

      <section aria-labelledby="today" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-3.5" aria-hidden /> Current PF balance
          </p>
          <Money value={balance} size="xl" mark className="mt-2 block" />
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <PiggyBank className="size-3.5" aria-hidden /> Credited every month
          </p>
          <Money value={contribution.monthlyPfCredit} size="xl" mark className="mt-2 block" />
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden /> Years to retirement
          </p>
          <p className="figure mt-2 text-[1.75rem]">
            {yearsToRetirement}{' '}
            <span className="text-sm font-normal text-muted-foreground">at age {RETIREMENT_AGE}</span>
          </p>
        </div>
      </section>

      <FutureMeProjection
        series={series}
        startAge={age}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ScenarioToggle pressed={showRaise} onClick={() => setShowRaise((v) => !v)} activeClass="border-ok bg-ok-soft text-ok">
              +{ASSUMED_RAISE_PCT}% raise
            </ScenarioToggle>
            <ScenarioToggle pressed={showMiss} onClick={() => setShowMiss((v) => !v)} activeClass="border-stop bg-stop-soft text-stop">
              {MISSED_MONTHS} months missed
            </ScenarioToggle>
          </div>
        }
      />

      {showRaise || showMiss ? (
        <section aria-label="What each scenario changes" className="grid gap-3 sm:grid-cols-2">
          {showRaise ? (
            <div className="rounded-lg border border-ok-line bg-ok-soft p-4 text-sm leading-relaxed">
              A raise most years compounds quietly: about{' '}
              <Money value={raiseDelta} sign="+" size="md" className="font-semibold text-ok" /> more by
              retirement — {compactInr(raiseScenario.finalBalance)} instead of {compactInr(baseline.finalBalance)}.
            </div>
          ) : null}
          {showMiss ? (
            <div className="rounded-lg border border-stop-line bg-stop-soft p-4 text-sm leading-relaxed">
              {MISSED_MONTHS} unfiled months early on still cost you later, even after they stop: about{' '}
              <Money value={missDelta} sign="-" size="md" className="font-semibold text-stop" /> less by
              retirement, since that money never had years left to earn interest.
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="pension-readiness" className="rounded-lg border bg-card p-5">
        <PanelTitle className="mb-4">
          <span id="pension-readiness">Pension readiness</span>
        </PanelTitle>

        {pension.eligible ? (
          <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr] sm:items-center">
            <div>
              <p className="text-xs text-muted-foreground">Estimated monthly pension from age {RETIREMENT_AGE}</p>
              <Money value={pension.monthlyPension} size="xl" mark className="mt-2 block" />
              <StatusPill tone="ok" className="mt-3">
                On track
              </StatusPill>
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Years of service at retirement</span>
                <span className="num font-medium">{yearsAtRetirement} years</span>
              </div>
              <Progress value={Math.min(100, (yearsAtRetirement / 20) * 100)} className="mt-2" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {yearsAtRetirement >= 20
                  ? 'Past 20 years of service — the two-year bonus in the EPS formula already applies.'
                  : `${20 - yearsAtRetirement} more years of service would add a two-year bonus to the pension formula.`}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <StatusPill tone="wait">Not yet eligible</StatusPill>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
              EPS pays a monthly pension only after {pension.minServiceYears} years of service. At today's pace
              you'd reach retirement with {yearsAtRetirement} years — below that, so the pension contribution
              would be returned as a lump sum instead (Form 10C), not paid monthly.
            </p>
          </div>
        )}
      </section>

      <MockBadge
        what="Balance, wage and service years come from this prototype's demo record. Interest is held at 8.25% and both scenarios assume nothing else changes — not a real EPFO projection."
        className="self-start"
      />
    </div>
  )
}
