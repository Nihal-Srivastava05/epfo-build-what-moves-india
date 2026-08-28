import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bell, Languages, Settings2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountMenu } from '@/components/layout/account-menu'
import { SiteFooter } from '@/components/layout/site-footer'
import { Emblem } from '@/components/layout/emblem'
import { useSession } from '@/store/session'
import { useData } from '@/store/data'
import { navByPersona, navTitleKey } from '@/lib/nav'
import { preflight } from '@/lib/derive'
import { useT } from '@/i18n'
import type { StringKey } from '@/i18n/strings'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

/**
 * Destinations that are carrying unfinished work. KYC is the only one so far:
 * if anything in the pre-submit check is still open, a claim cannot be paid —
 * and the dot sits on the screen that *fixes* it, not on the one it blocks.
 */
function useNavAlerts(): Set<string> {
  const persona = useSession((s) => s.persona)
  const kyc = useData((s) => s.kyc)
  const alerts = new Set<string>()
  if (persona === 'member' && preflight(kyc).length > 0) alerts.add('/member/kyc')
  return alerts
}

/** Amber, not red: nothing has gone wrong yet — a step is simply not done. */
function AlertDot({ className }: { className?: string }) {
  return (
    <span
      className={cn('absolute size-2 rounded-full bg-wait ring-2 ring-sidebar', className)}
      aria-hidden
    />
  )
}

/**
 * A permanent icon rail rather than a text sidebar. Five destinations is few
 * enough that the icon plus its own caption is faster to hit than a list, and
 * it gives the working area back the 200px a sidebar would have taken.
 */
function NavRail() {
  const persona = useSession((s) => s.persona)
  const alerts = useNavAlerts()
  const { t } = useT()
  return (
    <nav
      className='sticky top-0 hidden h-dvh w-[86px] shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-4 lg:flex'
      aria-label='Main'
    >
      <Link
        to='/'
        className='mb-4 grid size-10 place-items-center rounded-md text-[1.05rem]'
        aria-label='EPFO home'
      >
        <Emblem className='size-10 text-[1.05rem]' />
      </Link>

      {navByPersona[persona].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split('/').length === 2}
          className={({ isActive }) =>
            cn(
              'flex w-[70px] flex-col items-center gap-1.5 rounded-md px-1 pt-2.5 pb-2 transition-colors duration-[var(--dur-fast)]',
              isActive
                ? 'bg-brand-tint text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <span className="relative">
            <item.icon className="size-5 shrink-0" aria-hidden />
            {alerts.has(item.to) ? <AlertDot className="-top-0.5 -right-1" /> : null}
          </span>
          <span className="text-center text-[0.625rem] leading-tight font-semibold">
            {t(item.shortKey ?? item.labelKey)}
            {alerts.has(item.to) ? (
              <span className="sr-only"> — {t('nav.alert')}</span>
            ) : null}
          </span>
        </NavLink>
      ))}

      {/* Your own record is not one of the five tasks, so it sits apart from
          them — pinned to the foot of the rail, where an account always is. */}
      <NavLink
        to='/profile'
        className={({ isActive }) =>
          cn(
            'mt-auto flex w-[70px] flex-col items-center gap-1.5 rounded-md px-1 pt-2.5 pb-2 transition-colors duration-[var(--dur-fast)]',
            isActive
              ? 'bg-brand-tint text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )
        }
      >
        <UserRound className='size-5 shrink-0' aria-hidden />
        <span className='text-center text-[0.625rem] leading-tight font-semibold'>
          {t('nav.profile')}
        </span>
      </NavLink>
    </nav>
  )
}

/** Mobile: the five destinations sit under the thumb, not behind a hamburger. */
function BottomNav() {
  const persona = useSession((s) => s.persona)
  const alerts = useNavAlerts()
  const { t } = useT()
  const items = navByPersona[persona]
  return (
    <nav
      className='fixed inset-x-0 bottom-0 z-40 border-t bg-card lg:hidden'
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label='Main'
    >
      <ul className='mx-auto flex max-w-2xl'>
        {items.map((item) => (
          <li key={item.to} className='flex-1'>
            <NavLink
              to={item.to}
              end={item.to.split('/').length === 2}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-[0.625rem] leading-tight font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <item.icon className={cn('size-5', isActive && 'text-primary')} aria-hidden />
                    {alerts.has(item.to) ? (
                      <AlertDot className="-top-0.5 -right-1 ring-card" />
                    ) : null}
                  </span>
                  <span className="text-center">
                    {t(item.shortKey ?? item.labelKey)}
                    {alerts.has(item.to) ? (
                      <span className="sr-only"> — {t('nav.alert')}</span>
                    ) : null}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Screens reachable from the account menu or a link rather than the nav rail.
 * They still have to name themselves in the top bar, and navTitleKey only
 * knows about the rail.
 */
const STANDALONE_TITLE_KEYS: Record<string, StringKey> = {
  '/settings': 'nav.settings',
  '/notifications': 'nav.notifications',
  '/profile': 'nav.profile',
  '/member/service-history': 'nav.serviceHistory',
  '/member/calculators': 'nav.calculators',
  '/': 'app.name',
}

export function AppShell() {
  const location = useLocation()
  const motionOk = useMotionOk()
  const { t, lang } = useT()
  const toggleLang = useSession((s) => s.toggleLang)
  const notifications = useData((s) => s.notifications)
  const persona = useSession((s) => s.persona)
  const unread = notifications.filter((n) =>
    persona === 'pensioner' ? n.personId === 'p-ram' : n.personId === 'p-priya',
  ).length

  const titleKey = navTitleKey(persona, location.pathname)
  const title = t(
    STANDALONE_TITLE_KEYS[location.pathname] ?? titleKey ?? 'app.name',
  )

  return (
    <div className='flex min-h-dvh'>
      <NavRail />

      <div className='flex min-w-0 flex-1 flex-col'>
        {/* The bar names the screen you are on, and nothing else. Who you are
            belongs to the account menu and the profile page, not to every
            screen's chrome. */}
        <header className='sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6'>
          <Link to='/' className='lg:hidden' aria-label='EPFO home'>
            <Emblem className='size-8' />
          </Link>

          <div className='min-w-0'>
            <h1 className='truncate text-[0.9375rem] font-semibold tracking-[-0.01em]'>
              {title}
            </h1>
          </div>

          <div className='ml-auto flex items-center gap-0.5'>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleLang}
              className='gap-1.5 px-2.5'
              aria-label={
                lang === 'en' ? 'हिन्दी में देखें' : 'View in English'
              }
            >
              <Languages className='size-4' aria-hidden />
              <span className='text-sm font-semibold'>
                {lang === 'en' ? 'हिन्दी' : 'EN'}
              </span>
            </Button>
            <Button asChild variant='ghost' size='icon' className='relative'>
              <Link to='/notifications' aria-label={t('nav.notifications')}>
                <Bell className='size-[1.125rem]' aria-hidden />
                {unread > 0 ? (
                  <span
                    className='absolute top-2 right-2 size-2 rounded-full bg-stop ring-2 ring-card'
                    aria-hidden
                  />
                ) : null}
              </Link>
            </Button>
            <Button
              asChild
              variant='ghost'
              size='icon'
              className='hidden sm:inline-flex'
            >
              <Link to='/settings' aria-label={t('nav.settings')}>
                <Settings2 className='size-[1.125rem]' aria-hidden />
              </Link>
            </Button>
            <AccountMenu className='ml-1' />
          </div>
        </header>

        <main
          id='main'
          className='min-w-0 flex-1 px-4 py-6 pb-28 lg:px-7 lg:pb-10'
        >
          <div className='mx-auto max-w-[68rem]'>
            <Suspense
              fallback={
                <div className='space-y-4' aria-busy>
                  <Skeleton className='h-9 w-56' />
                  <Skeleton className='h-40 w-full' />
                  <Skeleton className='h-24 w-full' />
                </div>
              }
            >
              <motion.div
                key={location.pathname}
                initial={motionOk ? { opacity: 0, y: 2 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionOk ? 0.18 : 0, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>

        <SiteFooter />
      </div>

      <BottomNav />
    </div>
  )
}
