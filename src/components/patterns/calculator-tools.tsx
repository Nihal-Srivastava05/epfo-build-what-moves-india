import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Calculator, LineChart, PiggyBank, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Money } from '@/components/patterns/money'
import { Term } from '@/components/patterns/term'
import {
  edliEstimate,
  epfContribution,
  epfGrowthProjection,
  epsPensionEstimate,
} from '@/lib/calculators'
import { EPS_WAGE_CEILING } from '@/lib/mock/db'
import { compactInr } from '@/lib/format'
import type { StringKey } from '@/i18n/strings'

/** The four tabs both the public and the signed-in calculator pages share. */
export const calculatorTabs: { value: string; labelKey: StringKey; icon: typeof Calculator }[] = [
  { value: 'contribution', labelKey: 'calc.tab.contribution', icon: Calculator },
  { value: 'growth', labelKey: 'calc.tab.growth', icon: LineChart },
  { value: 'pension', labelKey: 'calc.tab.pension', icon: PiggyBank },
  { value: 'edli', labelKey: 'calc.tab.edli', icon: ShieldCheck },
]

/** A labelled number input, the one control every calculator here is built from. */
function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  suffix,
  min = 0,
  max,
}: {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="num pr-14"
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function ResultRow({ label, value, emphasis = false }: { label: ReactNode; value: number; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className={emphasis ? 'font-semibold' : 'text-sm text-muted-foreground'}>{label}</span>
      <Money value={value} size={emphasis ? 'lg' : 'md'} mark={emphasis} />
    </div>
  )
}

function ToolShell({
  intro,
  form,
  result,
}: {
  intro: ReactNode
  form: ReactNode
  result: ReactNode
}) {
  return (
    <div className="space-y-5">
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div className="space-y-4 rounded-lg border bg-card p-5">{form}</div>
        <div className="rounded-lg border bg-muted/40 p-5">{result}</div>
      </div>
    </div>
  )
}

/** What most people ask first: "how much of my salary actually reaches my PF?" */
export function ContributionCalculator({ defaultWage = 25_000 }: { defaultWage?: number } = {}) {
  const [wage, setWage] = useState(defaultWage)
  const c = useMemo(() => epfContribution(wage), [wage])

  return (
    <ToolShell
      intro={
        <>
          Your basic wage plus dearness allowance — not your gross salary — is what these percentages apply
          to. Your <Term id="epf">EPF</Term> share is fixed at 12%; your employer's 12% is split between{' '}
          <Term id="epf">EPF</Term> and <Term id="eps">EPS</Term>, capped at the wage ceiling.
        </>
      }
      form={
        <NumberField
          id="contrib-wage"
          label="Monthly basic wage + DA"
          hint="The figure your salary slip calls PF wages."
          value={wage}
          onChange={setWage}
          suffix="₹ / month"
        />
      }
      result={
        <div className="divide-y">
          <ResultRow label="Your EPF contribution (12%)" value={c.employee} />
          <ResultRow label={<>Employer's EPF share</>} value={c.employerEpf} />
          <ResultRow
            label={
              <>
                Employer's <Term id="eps">EPS</Term> share (8.33%, capped)
              </>
            }
            value={c.eps}
          />
          <ResultRow label="EDLI (employer pays, insurance)" value={c.edli} />
          <ResultRow label="Admin charges (employer pays)" value={c.admin} />
          <ResultRow label="Credited to your EPF every month" value={c.monthlyPfCredit} emphasis />
          <ResultRow label="Total cost to your employer" value={c.employerOutgo} emphasis />
        </div>
      }
    />
  )
}

/** The one people actually search for: "what will my EPF be worth at retirement?" */
export function GrowthCalculator({
  defaultBalance = 200_000,
  defaultWage = 25_000,
  defaultIncrement = 8,
  defaultYears = 20,
}: {
  defaultBalance?: number
  defaultWage?: number
  defaultIncrement?: number
  defaultYears?: number
} = {}) {
  const [balance, setBalance] = useState(defaultBalance)
  const [wage, setWage] = useState(defaultWage)
  const [increment, setIncrement] = useState(defaultIncrement)
  const [years, setYears] = useState(defaultYears)
  const projection = useMemo(
    () => epfGrowthProjection({ currentBalance: balance, monthlyWage: wage, annualIncrementPct: increment, years }),
    [balance, wage, increment, years],
  )
  const milestones = [5, 10, 15, 20, 25, 30].filter((y) => y <= years)

  return (
    <ToolShell
      intro={
        <>
          Interest compounds on your running balance and is credited once a year, at 8.25% — same as the
          rest of this site. A steady annual increment stands in for real raises and job changes, which
          this cannot predict.
        </>
      }
      form={
        <>
          <NumberField
            id="growth-balance"
            label="Current EPF balance"
            value={balance}
            onChange={setBalance}
            suffix="₹"
          />
          <NumberField
            id="growth-wage"
            label="Monthly basic wage + DA"
            value={wage}
            onChange={setWage}
            suffix="₹ / month"
          />
          <NumberField
            id="growth-increment"
            label="Expected annual wage increase"
            hint="A raise most years, averaged out."
            value={increment}
            onChange={setIncrement}
            suffix="% / year"
            max={30}
          />
          <NumberField
            id="growth-years"
            label="Years to project"
            value={years}
            onChange={(v) => setYears(Math.min(40, Math.max(1, v)))}
            suffix="years"
            max={40}
          />
        </>
      }
      result={
        <div>
          <p className="eyebrow mb-1">Projected balance after {years} years</p>
          <Money value={projection.finalBalance} size="xl" mark className="block" />
          <div className="mt-4 divide-y border-t">
            <ResultRow label="Total you and your employer contribute" value={projection.totalContributed} />
            <ResultRow label="Total interest earned" value={projection.totalInterest} />
          </div>
          {milestones.length > 1 ? (
            <div className="mt-4 border-t pt-4">
              <p className="eyebrow mb-2">Along the way</p>
              <ul className="space-y-1.5 text-sm">
                {milestones.map((y) => {
                  const row = projection.years[y - 1]
                  return (
                    <li key={y} className="flex items-baseline justify-between">
                      <span className="text-muted-foreground">Year {y}</span>
                      <span className="num font-medium">{compactInr(row.balance)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      }
    />
  )
}

/** "Will I actually get a pension, and roughly how much?" */
export function PensionCalculator({
  defaultWage = 25_000,
  defaultYears = 22,
}: { defaultWage?: number; defaultYears?: number } = {}) {
  const [wage, setWage] = useState(defaultWage)
  const [years, setYears] = useState(defaultYears)
  const p = useMemo(() => epsPensionEstimate({ monthlyWage: wage, yearsOfServiceAtRetirement: years }), [wage, years])

  return (
    <ToolShell
      intro={
        <>
          <Term id="eps">EPS</Term> pays a monthly pension from age 58, worked out as pensionable salary ×
          pensionable service ÷ 70. The salary side is always capped at the{' '}
          <Term id="wage-ceiling">wage ceiling</Term> — ₹{compactInr(EPS_WAGE_CEILING).slice(1)} — no matter
          how much you actually earn.
        </>
      }
      form={
        <>
          <NumberField
            id="pension-wage"
            label="Monthly basic wage + DA"
            value={wage}
            onChange={setWage}
            suffix="₹ / month"
          />
          <NumberField
            id="pension-years"
            label="Total years of service at retirement"
            hint="Across every employer, under this one UAN."
            value={years}
            onChange={setYears}
            suffix="years"
            max={45}
          />
        </>
      }
      result={
        p.eligible ? (
          <div>
            <p className="eyebrow mb-1">Estimated monthly pension</p>
            <Money value={p.monthlyPension} size="xl" mark className="block" />
            <div className="mt-4 divide-y border-t text-sm">
              <ResultRow
                label={
                  <>
                    Pensionable salary (capped at ₹{compactInr(EPS_WAGE_CEILING).slice(1)})
                  </>
                }
                value={p.pensionableSalary}
              />
              <div className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">Pensionable service used</span>
                <span className="num font-medium">
                  {p.pensionableService} years{p.bonusYears ? ` (incl. ${p.bonusYears}-year bonus)` : ''}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-semibold">No monthly pension at this length of service</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              EPS needs {p.minServiceYears} years of service to pay a monthly pension. Below that, the
              pension contribution is returned as a lump sum (Form 10C) instead — not calculated here.
            </p>
          </div>
        )
      }
    />
  )
}

/** The one nobody asks until they need it: what a family would actually receive. */
export function EdliCalculator({
  defaultWage = 25_000,
  defaultBalance = 200_000,
}: { defaultWage?: number; defaultBalance?: number } = {}) {
  const [wage, setWage] = useState(defaultWage)
  const [balance, setBalance] = useState(defaultBalance)
  const e = useMemo(() => edliEstimate({ avgMonthlyWage: wage, avgPfBalance: balance }), [wage, balance])

  return (
    <ToolShell
      intro={
        <>
          <Term id="edli">EDLI</Term> is life cover that comes free with EPF — your employer pays for it,
          you pay nothing. If a member dies while in service, EPFO pays this to whoever they named as
          nominee. It is why keeping a nominee on record matters.
        </>
      }
      form={
        <>
          <NumberField
            id="edli-wage"
            label="Average monthly wage, last 12 months"
            value={wage}
            onChange={setWage}
            suffix="₹ / month"
          />
          <NumberField
            id="edli-balance"
            label="Average EPF balance, last 12 months"
            value={balance}
            onChange={setBalance}
            suffix="₹"
          />
        </>
      }
      result={
        <div>
          <p className="eyebrow mb-1">Estimated amount paid to the nominee</p>
          <Money value={e.total} size="xl" mark className="block" />
          <div className="mt-4 divide-y border-t">
            <ResultRow label="35× average wage (capped)" value={e.base} />
            <ResultRow label="Bonus: half of average balance (capped at ₹1,75,000)" value={e.bonus} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Never less than ₹{compactInr(e.minGuarantee).slice(1)} for a member with at least 12 months of
            continuous service, and never more than ₹7,00,000 in total.
          </p>
        </div>
      }
    />
  )
}
