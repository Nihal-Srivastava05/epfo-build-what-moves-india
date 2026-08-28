import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CountUpMoney } from '@/components/patterns/count-up'
import { Term } from '@/components/patterns/term'
import { useT } from '@/i18n'
import {
  employeeShareTotal,
  employerShareTotal,
  interestTotal,
  pensionShareTotal,
  totalBalance,
} from '@/lib/derive'
import { fmtDate, inr } from '@/lib/format'
import { TODAY } from '@/lib/mock/db'
import type { Contribution } from '@/lib/types'

const SPLIT_TINT = ['bg-hero-foreground/90', 'bg-hero-foreground/55', 'bg-hero-foreground/30'] as const

/**
 * The one balance card, used everywhere the total appears. A number a person
 * remembers from one screen has to be the same number — and drawn the same
 * way — on the next, or the two screens read as disagreeing with each other.
 */
export function TotalBalanceCard({
  contributions,
  headingLevel = 'h2',
}: {
  contributions: Contribution[]
  /** Home marks this as the page's h1; every other screen nests it as an h2. */
  headingLevel?: 'h1' | 'h2'
}) {
  const { t, lang } = useT()
  const Heading = headingLevel

  const balance = totalBalance(contributions)
  const splits = [
    { label: t('member.yourShare'), value: employeeShareTotal(contributions), tint: SPLIT_TINT[0] },
    { label: t('member.employerShare'), value: employerShareTotal(contributions), tint: SPLIT_TINT[1] },
    { label: t('member.interest'), value: interestTotal(contributions), tint: SPLIT_TINT[2] },
  ]
  const splitTotal = splits.reduce((s, x) => s + x.value, 0) || 1

  return (
    <section
      aria-labelledby="balance"
      className="flex flex-col gap-5 rounded-lg bg-hero p-6 text-hero-foreground"
    >
      <Heading
        id="balance"
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.055em] text-hero-foreground/70"
      >
        {t('member.balanceLabel')}
      </Heading>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <CountUpMoney value={balance} />
        <p className="pb-1.5 text-[0.8125rem] text-hero-foreground/70">
          {t('member.asOf')} {fmtDate(TODAY, lang)}
        </p>
      </div>

      {/* The bar makes the shares comparable at a glance before the reader
          parses any digits; the tint on each swatch below repeats on the
          matching segment so the two views read as one fact. */}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full"
        style={{ gap: 2 }}
        role="img"
        aria-label={splits.map((s) => `${s.label}: ₹${inr(s.value)}`).join(', ')}
      >
        {splits.map((s) => (
          <span
            key={s.label}
            className={`${s.tint} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(s.value / splitTotal) * 100}%` }}
          />
        ))}
      </div>

      {/* Three columns is a desktop luxury: at 360px the figures clip, so on
          a phone the same three facts become three rows. */}
      <dl className="grid gap-px overflow-hidden rounded-sm bg-hero-foreground/20 sm:grid-cols-3">
        {splits.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-3 bg-hero px-3.5 py-2.5 sm:block sm:py-3"
          >
            <dt className="flex items-center gap-1.5 text-[0.6875rem] text-hero-foreground/70">
              <span className={`size-2 shrink-0 rounded-full ${s.tint}`} aria-hidden />
              {s.label}
            </dt>
            <dd className="num text-[1.0625rem] font-bold sm:mt-0.5">₹{inr(s.value)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-auto text-[0.8125rem] text-hero-foreground/80">
        {/* EPS is a different pot from the PF balance, so it is stated apart
            from the three parts that add up to the figure above. */}
        <Term id="eps" className="text-hero-foreground decoration-hero-foreground/50 hover:decoration-hero-foreground">
          {lang === 'hi' ? 'पेंशन (ईपीएस)' : 'Pension (EPS)'}
        </Term>{' '}
        <span className="num font-semibold">₹{inr(pensionShareTotal(contributions))}</span>{' '}
        <span className="text-hero-foreground/60">— {t('member.pensionAside')}</span>
      </p>

      <Link
        to="/member/calculators"
        className="group inline-flex items-center gap-1 self-start text-[0.8125rem] font-semibold text-hero-foreground underline decoration-hero-foreground/40 underline-offset-4 hover:decoration-hero-foreground"
      >
        {t('member.seeCalculators')}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  )
}
