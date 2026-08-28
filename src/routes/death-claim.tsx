import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, HandCoins, HeartCrack, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

const options = [
  {
    type: 'pf' as const,
    icon: Wallet,
    titleKey: 'deathClaim.pf.title' as const,
    bodyKey: 'deathClaim.pf.body' as const,
    facts: ['One-time payment', 'Form 20', 'Paid to nominee(s), or legal heirs if none registered'],
  },
  {
    type: 'pension' as const,
    icon: HandCoins,
    titleKey: 'deathClaim.pension.title' as const,
    bodyKey: 'deathClaim.pension.body' as const,
    facts: ['Recurring, monthly', 'Form 10D', 'Paid to spouse, children, or an eligible nominee'],
  },
]

/**
 * The two benefits are shown side by side, not one after the other, so the
 * difference is a comparison you can see rather than a paragraph you have to
 * remember. Each card carries its own path into the flow that files it.
 */
export default function DeathClaim() {
  const { t } = useT()
  const motionOk = useMotionOk()

  const startHref = (type: 'pf' | 'pension') => `/death-claim/file?type=${type}`

  return (
    <div className="mx-auto max-w-[52rem] px-4 py-10 sm:py-14">
      <PageHeader eyebrow={t('deathClaim.eyebrow')} title={t('deathClaim.title')} sub={t('deathClaim.sub')} />

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((opt, i) => (
          <motion.div
            key={opt.type}
            initial={motionOk ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionOk ? 0.25 : 0, delay: motionOk ? i * 0.06 : 0 }}
            className={cn('flex flex-col rounded-lg border-[1.35px] bg-card p-5', 'border-border')}
          >
            <div className="flex-1">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-brand-tint text-primary">
                <opt.icon className="size-[1.125rem]" aria-hidden />
              </span>
              <h2 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.01em]">{t(opt.titleKey)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(opt.bodyKey)}</p>
              <ul className="mt-4 space-y-1.5 text-[0.8125rem] text-muted-foreground">
                {opt.facts.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild size="lg" className="mt-5 w-full">
              <Link to={startHref(opt.type)}>
                {t('deathClaim.start')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 flex items-start gap-2.5 rounded-lg border border-info-line bg-info-soft p-4 text-sm leading-relaxed">
        <HeartCrack className="mt-0.5 size-4 shrink-0" aria-hidden />
        Both can apply to the same family at once — filing one does not use up or delay the other.
      </p>
    </div>
  )
}
