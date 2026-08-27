import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bell, Languages, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PersonaSwitcher } from '@/components/layout/persona-switcher'
import { SiteFooter } from '@/components/layout/site-footer'
import { Emblem } from '@/components/layout/emblem'
import { useSession } from '@/store/session'
import { useData } from '@/store/data'
import { navByPersona } from '@/lib/nav'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const persona = useSession((s) => s.persona)
  const { t } = useT()
  return (
    <>
      {navByPersona[persona].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split('/').length === 2}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-secondary font-medium text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('size-[1.125rem] shrink-0', isActive && 'text-gold')} aria-hidden />
              <span className="flex-1">{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  )
}

/** Mobile: the five destinations sit under the thumb, not behind a hamburger. */
function BottomNav() {
  const persona = useSession((s) => s.persona)
  const { t } = useT()
  const items = navByPersona[persona]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to.split('/').length === 2}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] leading-tight',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-5', isActive && 'text-gold')} aria-hidden />
                  <span className="text-center">{t(item.labelKey)}</span>
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
 * The URL is the source of truth for which persona is on screen. Landing on
 * /employer by a deep link switches the whole shell, rather than leaving the
 * navigation showing whoever was last active.
 */
function usePersonaFromRoute() {
  const { pathname } = useLocation()
  const persona = useSession((s) => s.persona)
  const setPersona = useSession((s) => s.setPersona)
  const segment = pathname.split('/')[1]
  useEffect(() => {
    if ((segment === 'member' || segment === 'employer' || segment === 'pensioner') && segment !== persona) {
      setPersona(segment)
    }
  }, [segment, persona, setPersona])
}

export function AppShell() {
  usePersonaFromRoute()
  const location = useLocation()
  const motionOk = useMotionOk()
  const { t, lang } = useT()
  const toggleLang = useSession((s) => s.toggleLang)
  const notifications = useData((s) => s.notifications)
  const persona = useSession((s) => s.persona)
  const unread = notifications.filter((n) =>
    persona === 'pensioner' ? n.personId === 'p-ram' : n.personId === 'p-priya',
  ).length

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EPFO home">
            <Emblem className="size-8" />
            <span className="hidden text-base font-semibold tracking-tight sm:block">
              {t('app.name')}
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="h-10 gap-1.5 px-2.5"
              aria-label={lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}
            >
              <Languages className="size-4" aria-hidden />
              <span className="text-sm font-medium">{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative size-10">
              <Link to="/notifications" aria-label={t('nav.notifications')}>
                <Bell className="size-[1.125rem]" aria-hidden />
                {unread > 0 ? (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-gold" aria-hidden />
                ) : null}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="size-10">
              <Link to="/settings" aria-label={t('nav.settings')}>
                <Settings2 className="size-[1.125rem]" aria-hidden />
              </Link>
            </Button>
            <PersonaSwitcher />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 lg:py-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-0.5" aria-label="Main">
            <NavItems />
          </nav>
        </aside>

        <main id="main" className="min-w-0 flex-1 pb-24 lg:pb-0">
          <Suspense
            fallback={
              <div className="space-y-4" aria-busy>
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
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
        </main>
      </div>

      <SiteFooter />
      <BottomNav />
    </div>
  )
}
