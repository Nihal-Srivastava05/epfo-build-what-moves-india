import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Building2, CircleUser, HandCoins, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { useSession } from '@/store/session'
import type { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'

const personas: {
  key: Persona
  icon: typeof CircleUser
  was: string
}[] = [
  { key: 'member', icon: CircleUser, was: 'Member e-Sewa · Passbook · Claim status' },
  { key: 'employer', icon: Building2, was: 'Employer e-Sewa · ECR upload · Challan history' },
  { key: 'pensioner', icon: HandCoins, was: 'Pensioners’ Portal · Jeevan Pramaan' },
]

export default function Landing() {
  const { t } = useT()
  const motionOk = useMotionOk()
  const setPersona = useSession((s) => s.setPersona)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <section className="max-w-2xl">
        <p className="eyebrow mb-4 inline-flex items-center gap-2">
          <span className="h-px w-6 bg-gold" aria-hidden />
          {t('app.tagline')}
        </p>
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {t('landing.headline')}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t('landing.sub')}</p>
      </section>

      <section className="mt-12" aria-labelledby="choose">
        <h2 id="choose" className="mb-5 text-lg font-semibold tracking-tight">
          {t('landing.choose')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {personas.map((p, i) => (
            <motion.div
              key={p.key}
              initial={motionOk ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionOk ? 0.3 : 0, delay: motionOk ? 0.05 + i * 0.05 : 0 }}
            >
              <Link
                to={`/signin/${p.key}`}
                onClick={() => setPersona(p.key)}
                className={cn(
                  'group flex h-full flex-col rounded-xl border bg-card p-5 transition-all',
                  'hover:border-gold-line hover:shadow-[0_1px_0_var(--gold-line),0_8px_24px_-16px_rgb(0_0_0/0.4)]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <p.icon className="mb-4 size-6 text-gold" aria-hidden />
                <p className="text-lg font-semibold tracking-tight">{t(`persona.${p.key}`)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(`persona.${p.key}.sub`)}</p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
                  <span className="font-medium">{t('common.was')}:</span> {p.was}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {t('landing.continue')}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-dashed p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">{t('landing.lookup')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('landing.lookupSub')}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/status">
              <Search className="size-4" aria-hidden />
              Check a status
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
