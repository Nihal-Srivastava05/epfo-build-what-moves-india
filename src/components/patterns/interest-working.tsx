import { Money } from '@/components/patterns/money'
import { fmtMonth, inr } from '@/lib/format'
import type { InterestYear } from '@/lib/derive'
import type { Lang } from '@/store/session'

/**
 * The arithmetic behind one year's interest credit, month by month.
 *
 * A passbook that states a single "interest updated upto" figure and nothing
 * else forces the reader to either trust it or dispute it, and a great many
 * people dispute it. Every number here is the one the credit was actually
 * built from, and the column of monthly amounts adds up to the credited figure
 * exactly — so the row can be checked rather than argued with.
 */
export function InterestWorking({ year, lang }: { year: InterestYear; lang: Lang }) {
  const ratePct = (year.rate * 100).toFixed(2)

  return (
    <div className="rounded-sm border bg-card p-4">
      <h4 className="eyebrow">How this was worked out</h4>
      <p className="mt-1.5 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
        Interest is not applied to the closing balance once a year. Each month earns{' '}
        <span className="num">{ratePct}%</span> ÷ 12 on the balance that month ended with, and the
        twelve amounts are credited together on{' '}
        <span className="num">31 March</span>. That is why a month contributed late earns less for
        the year than the same month paid on time.
      </p>

      <div className="mt-3.5 overflow-x-auto">
        <table className="w-full min-w-[26rem] text-[0.8125rem]">
          <caption className="sr-only">
            Month by month interest for {year.fy} at {ratePct} percent
          </caption>
          <thead>
            <tr className="eyebrow border-b">
              <th className="py-2 pr-3 text-left font-semibold">Month</th>
              <th className="px-3 py-2 text-right font-semibold">Paid in</th>
              <th className="px-3 py-2 text-right font-semibold">Balance at month end</th>
              <th className="py-2 pl-3 text-right font-semibold">Interest earned</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {year.months.map((m) => (
              <tr key={m.month}>
                <td className="num py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {fmtMonth(m.month, lang)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={m.added} size="sm" />
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={m.closing} size="sm" />
                </td>
                <td className="py-2 pl-3 text-right">
                  <Money value={m.interest} size="sm" className="font-semibold" />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2">
              <td className="py-2.5 pr-3 font-bold">Credited for {year.fy}</td>
              <td className="px-3 py-2.5" />
              <td className="num px-3 py-2.5 text-right text-xs text-muted-foreground">
                {/* The figure the rate is actually applied to, stated so the
                    total below can be reproduced with a calculator. */}
                ₹{inr(year.sumOfBalances)} ÷ 12 × {ratePct}%
              </td>
              <td className="py-2.5 pl-3 text-right">
                <Money value={year.interest} size="sm" className="font-bold" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
