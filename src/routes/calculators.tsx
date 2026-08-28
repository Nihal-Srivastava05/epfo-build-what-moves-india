import { Link, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ContributionCalculator,
  EdliCalculator,
  GrowthCalculator,
  PensionCalculator,
  calculatorTabs,
} from '@/components/patterns/calculator-tools'
import { useT } from '@/i18n'

/**
 * Four questions cover almost everyone who arrives looking for a calculator:
 * what lands in my PF each month, what it grows to, what pension it buys, and
 * what my family gets if I never reach retirement. All four run on the exact
 * rates the rest of this site uses, not a separate set of assumptions.
 */
export default function Calculators() {
  const { t } = useT()
  /**
   * The tab lives in the URL, the same way the signed-in calculators page does
   * it, so a link can point at one calculator — a notice about the pension
   * ceiling should open the pension tab, not the default one.
   */
  const [params, setParams] = useSearchParams()
  const known = calculatorTabs.map((c) => c.value)
  const tab = known.includes(params.get('tab') ?? '') ? params.get('tab')! : 'contribution'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">{t('calc.title')}</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">{t('calc.sub')}</p>

      <Tabs
        value={tab}
        onValueChange={(v) => setParams({ tab: v }, { replace: true })}
        className="mt-8"
      >
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
          <ContributionCalculator />
        </TabsContent>
        <TabsContent value="growth" className="mt-6">
          <GrowthCalculator />
        </TabsContent>
        <TabsContent value="pension" className="mt-6">
          <PensionCalculator />
        </TabsContent>
        <TabsContent value="edli" className="mt-6">
          <EdliCalculator />
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-sm text-muted-foreground">
        These are estimates from the published formulas — your real numbers can differ with wage changes,
        breaks in service, or scheme options this does not model.{' '}
        <Link to="/glossary" className="font-medium text-foreground underline underline-offset-4">
          {t('nav.glossary')}
        </Link>
      </p>
    </div>
  )
}
