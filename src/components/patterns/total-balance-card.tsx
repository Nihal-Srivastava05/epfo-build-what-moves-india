import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { CountUpMoney } from '@/components/patterns/count-up'
import { Term } from '@/components/patterns/term'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'
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
  const motionOk = useMotionOk()
  /**
   * Which share the pointer is on. The bar and the figures below it are two
   * views of one fact, so hovering either end lights up both — the segment
   * lifts, its siblings recede, and the matching figure is picked out.
   */
  const [active, setActive] = useState<number | null>(null)

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
        className="flex w-full items-center"
        style={{ gap: 2, height: 14 }}
        role="img"
        aria-label={splits.map((s) => `${s.label}: ₹${inr(s.value)}`).join(', ')}
        onMouseLeave={() => setActive(null)}
      >
        {splits.map((s, i) => (
          <div
            key={s.label}
            className="relative h-2.5"
            style={{ width: `${(s.value / splitTotal) * 100}%` }}
            onMouseEnter={() => setActive(i)}
          >
            {/* A 10px band is too thin to point at, so the target reaches past
                the mark on both sides without moving anything. */}
            <span className="absolute inset-x-0 -inset-y-2 z-10" aria-hidden />
            <motion.span
              className={cn(
                'block size-full',
                s.tint,
                i === 0 && 'rounded-l-full',
                i === splits.length - 1 && 'rounded-r-full',
              )}
              animate={{
                scaleY: active === i ? 1.4 : 1,
                opacity: active === null || active === i ? 1 : 0.4,
              }}
              transition={{ duration: motionOk ? 0.18 : 0, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>

      {/* Three columns is a desktop luxury: at 360px the figures clip, so on
          a phone the same three facts become three rows. */}
      <dl
        className="grid gap-px overflow-hidden rounded-sm bg-hero-foreground/20 sm:grid-cols-3"
        onMouseLeave={() => setActive(null)}
      >
        {splits.map((s, i) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-3 bg-hero px-3.5 py-2.5 sm:block sm:py-3"
            onMouseEnter={() => setActive(i)}
          >
            {/* Each half grows from the edge it is aligned to, so the text
                swells in place instead of being pushed out of the cell — the
                value sits right-aligned on a phone and left-aligned above it. */}
            <dt
              className={cn(
                'flex w-fit origin-left items-center gap-1.5 text-[0.6875rem] text-hero-foreground/70 transition-transform duration-[var(--dur-fast)]',
                active === i && 'scale-110',
              )}
            >
              <span className={cn('size-2 shrink-0 rounded-full', s.tint)} aria-hidden />
              {s.label}
            </dt>
            <dd
              className={cn(
                'num w-fit origin-right text-[1.0625rem] font-bold transition-transform duration-[var(--dur-fast)] sm:mt-0.5 sm:origin-left',
                active === i && 'scale-110',
              )}
            >
              ₹{inr(s.value)}
            </dd>
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
        to="/member/calculators?tab=growth"
        className="group inline-flex items-center gap-1 self-start text-[0.8125rem] font-semibold text-hero-foreground underline decoration-hero-foreground/40 underline-offset-4 hover:decoration-hero-foreground"
      >
        {t('member.seeCalculators')}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  )
}
