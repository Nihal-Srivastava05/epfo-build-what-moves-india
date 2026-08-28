import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MockBadge } from '@/components/patterns/mock-badge'
import {
  ContributionCalculator,
  EdliCalculator,
  GrowthCalculator,
  PensionCalculator,
  calculatorTabs,
} from '@/components/patterns/calculator-tools'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { serviceYears, totalBalance } from '@/lib/derive'
import { employments, personById, RETIREMENT_AGE, TODAY } from '@/lib/mock/db'
import { daysBetween } from '@/lib/format'

/**
 * The same four tools as the public page, but every field opens already set
 * to this member's own record — the wage on their current employment, their
 * running balance, their actual years of service — so the first number they
 * see is their own, not a stand-in they have to replace before it means
 * anything.
 */
export default function MemberCalculators() {
  const contributions = useData((s) => s.contributions)
  const { t } = useT()
  const [params, setParams] = useSearchParams()

  /* A ?tab= in the URL lets other pages point straight at one tool — the
     balance card sends people to the EPF growth tab, for instance. */
  const requested = params.get('tab')
  const tab = calculatorTabs.some((c) => c.value === requested) ? requested! : 'contribution'

  const { wage, balance, yearsToRetirement, yearsAtRetirement } = useMemo(() => {
    const me = personById('p-priya')
    const current = employments.find((e) => e.current && e.personId === me.id)
    const age = Math.floor(daysBetween(me.dob, TODAY) / 365.25)
    const yearsToGo = Math.max(1, RETIREMENT_AGE - age)
    return {
      wage: current?.monthlyWage ?? 0,
      balance: totalBalance(contributions),
      yearsToRetirement: yearsToGo,
      yearsAtRetirement: Math.round(serviceYears() + yearsToGo),
    }
  }, [contributions])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Filled in with your own wage, balance and years of service — change any field to try a
          different scenario.
        </p>
        <MockBadge what="Your wage, balance and service years here come from this prototype's demo record, not a real EPFO account." />
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-full min-w-max gap-1 sm:w-full">
            {calculatorTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 px-2.5">
                <tab.icon className="size-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{t(tab.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="contribution" className="mt-6">
          <ContributionCalculator defaultWage={wage} />
        </TabsContent>
        <TabsContent value="growth" className="mt-6">
          <GrowthCalculator defaultBalance={balance} defaultWage={wage} defaultYears={yearsToRetirement} />
        </TabsContent>
        <TabsContent value="pension" className="mt-6">
          <PensionCalculator defaultWage={wage} defaultYears={yearsAtRetirement} />
        </TabsContent>
        <TabsContent value="edli" className="mt-6">
          <EdliCalculator defaultWage={wage} defaultBalance={balance} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
