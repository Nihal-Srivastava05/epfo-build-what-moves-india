import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Emblem } from '@/components/layout/emblem'
import { SiteFooter } from '@/components/layout/site-footer'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'

export function PublicShell() {
  const { t, lang } = useT()
  const toggleLang = useSession((s) => s.toggleLang)
  const location = useLocation()
  const motionOk = useMotionOk()
  const onSignIn = location.pathname.startsWith('/signin')

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-[68rem] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EPFO home">
            <Emblem className="size-8" />
            <span className="text-[0.9375rem] font-bold tracking-[-0.02em]">{t('app.name')}</span>
          </Link>
          <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground sm:inline">
            {t('app.prototype')}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 px-2.5">
              <Languages className="size-4" aria-hidden />
              <span className="text-sm font-semibold">{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/calculators">{t('nav.calculators')}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/glossary">{t('nav.glossary')}</Link>
            </Button>
            {onSignIn ? null : (
              <Button asChild size="sm" className="ml-1">
                <Link to="/signin/member">{t('signin.title')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <motion.div
          key={location.pathname}
          initial={motionOk ? { opacity: 0, y: 2 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.18 : 0, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
}
