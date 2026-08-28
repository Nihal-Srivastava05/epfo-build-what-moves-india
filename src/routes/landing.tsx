import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Building2,
  CircleUser,
  HandCoins,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { useSession } from '@/store/session'
import type { Persona } from '@/lib/types'
import type { StringKey } from '@/i18n/strings'
import { cn } from '@/lib/utils'

const personas: { key: Persona; icon: typeof CircleUser; was: string }[] = [
  {
    key: 'member',
    icon: CircleUser,
    was: 'Member e-Sewa · Passbook · Claim status',
  },
  {
    key: 'employer',
    icon: Building2,
    was: 'Employer e-Sewa · ECR upload · Challan history',
  },
  {
    key: 'pensioner',
    icon: HandCoins,
    was: 'Pensioners’ Portal · Jeevan Pramaan',
  },
]

const stats: { n: string; labelKey: StringKey }[] = [
  { n: '9', labelKey: 'landing.statPortals' },
  { n: '1', labelKey: 'landing.statAccount' },
  { n: '3', labelKey: 'landing.statViews' },
]

/** Every task names the portal it replaces. The claim is checkable, not asserted. */
const tasks: {
  titleKey: StringKey
  subKey: StringKey
  was: string
  to: string
}[] = [
  {
    titleKey: 'landing.task.balance',
    subKey: 'landing.task.balanceSub',
    was: 'Member Passbook portal',
    to: '/signin/member',
  },
  {
    titleKey: 'landing.task.withdraw',
    subKey: 'landing.task.withdrawSub',
    was: 'Online Claim Member',
    to: '/signin/member',
  },
  {
    titleKey: 'landing.task.track',
    subKey: 'landing.task.trackSub',
    was: 'Know Your Claim Status',
    to: '/status',
  },
  {
    titleKey: 'landing.task.kyc',
    subKey: 'landing.task.kycSub',
    was: 'Manage KYC',
    to: '/signin/member',
  },
  {
    titleKey: 'landing.task.return',
    subKey: 'landing.task.returnSub',
    was: 'ECR upload',
    to: '/signin/employer',
  },
  {
    titleKey: 'landing.task.life',
    subKey: 'landing.task.lifeSub',
    was: 'Jeevan Pramaan',
    to: '/signin/pensioner',
  },
  {
    titleKey: 'landing.task.calc',
    subKey: 'landing.task.calcSub',
    was: 'EPF calculator sites',
    to: '/calculators',
  },
]

const uanLinks: { titleKey: StringKey; to: string }[] = [
  { titleKey: 'landing.uan.activate', to: '/signin/member' },
  { titleKey: 'landing.uan.track', to: '/status' },
  { titleKey: 'landing.uan.know', to: '/signin/member' },
  { titleKey: 'landing.uan.direct', to: '/signin/member' },
  { titleKey: 'landing.uan.existing', to: '/signin/member' },
  { titleKey: 'landing.uan.death', to: '/signin/member' },
]

export default function Landing() {
  const { t } = useT()
  const motionOk = useMotionOk()
  const setPersona = useSession((s) => s.setPersona)

  return (
    <div>
      <section className='mx-auto grid max-w-[68rem] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-18'>
        <div>
          <p className='eyebrow mb-4 inline-flex items-center gap-2'>
            <span className='h-px w-6 bg-brand' aria-hidden />
            {t('app.tagline')}
          </p>
          <h1 className='text-[2.25rem] leading-[1.06] font-extrabold tracking-[-0.035em] text-balance sm:text-[2.875rem]'>
            {t('landing.headline')}
          </h1>
          <p className='mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted-foreground'>
            {t('landing.sub')}
          </p>

          <div className='mt-7 flex flex-wrap gap-3'>
            <Button asChild size='lg'>
              <Link to='/signin/member' onClick={() => setPersona('member')}>
                {t('landing.signIn')}
                <ArrowRight className='size-4' aria-hidden />
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link to='/status'>
                <Search className='size-4' aria-hidden />
                {t('landing.lookup')}
              </Link>
            </Button>
          </div>

          <dl className='mt-9 flex flex-wrap gap-x-10 gap-y-4'>
            {stats.map((s) => (
              <div key={s.labelKey}>
                <dt className='figure text-[1.5rem]'>{s.n}</dt>
                <dd className='mt-0.5 text-[0.8125rem] text-muted-foreground'>
                  {t(s.labelKey)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The picker is the sign-in panel: three people, three identifiers. */}
        <div className='rounded-lg border bg-muted p-5 sm:p-6'>
          <p className='eyebrow mb-4'>{t('landing.choose')}</p>
          <div className='flex flex-col gap-2.5'>
            {personas.map((p, i) => (
              <motion.div
                key={p.key}
                initial={motionOk ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionOk ? 0.26 : 0,
                  delay: motionOk ? 0.04 + i * 0.05 : 0,
                }}
              >
                <Link
                  to={`/signin/${p.key}`}
                  onClick={() => setPersona(p.key)}
                  className={cn(
                    'group flex items-center gap-3.5 rounded-md border-[1.35px] border-transparent bg-card p-3.5',
                    'ring-1 ring-border transition-colors duration-[var(--dur-fast)]',
                    'hover:border-brand hover:ring-brand',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <span className='grid size-10 shrink-0 place-items-center rounded-sm bg-brand-tint text-primary'>
                    <p.icon className='size-[1.125rem]' aria-hidden />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-[0.9375rem] font-semibold tracking-[-0.01em]'>
                      {t(`persona.${p.key}`)}
                    </span>
                    <span className='block text-[0.8125rem] text-muted-foreground'>
                      {t(`persona.${p.key}.sub`)}
                    </span>
                  </span>
                  <ArrowRight
                    className='size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary'
                    aria-hidden
                  />
                </Link>
              </motion.div>
            ))}
          </div>
          <p className='mt-4 text-xs leading-relaxed text-muted-foreground'>
            {t('signin.oneAccount')}
          </p>
        </div>
      </section>

      <section className='border-t bg-background' aria-labelledby='uan-links'>
        <div className='mx-auto max-w-[68rem] px-4 py-12 sm:px-6 lg:py-14'>
          <h2 id='uan-links' className='eyebrow mb-5'>
            {t('landing.uanTitle')}
          </h2>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {uanLinks.map((link) => (
              <Link
                key={link.titleKey}
                to={link.to}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border bg-card p-4',
                  'text-[0.875rem] font-medium tracking-[-0.005em]',
                  'transition-colors duration-[var(--dur-fast)] hover:border-brand',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                {t(link.titleKey)}
                <ArrowRight
                  className='size-4 shrink-0 text-faint'
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className='border-t bg-background' aria-labelledby='tasks'>
        <div className='mx-auto max-w-[68rem] px-4 py-12 sm:px-6 lg:py-14'>
          <h2 id='tasks' className='eyebrow mb-5'>
            {t('landing.tasks')}
          </h2>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {tasks.map((task) => (
              <Link
                key={task.titleKey}
                to={task.to}
                className={cn(
                  'flex flex-col gap-1.5 rounded-lg border bg-card p-5',
                  'transition-colors duration-[var(--dur-fast)] hover:border-brand',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <span className='text-[0.9375rem] font-semibold tracking-[-0.01em]'>
                  {t(task.titleKey)}
                </span>
                <span className='text-[0.8125rem] leading-relaxed text-muted-foreground'>
                  {t(task.subKey)}
                </span>
                <span className='mt-2 text-[0.6875rem] font-semibold text-faint'>
                  {t('common.was')}: {task.was}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
