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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EPFO home">
            <Emblem className="size-8" />
            <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
          </Link>
          <span className="ml-1 rounded-full border border-dashed px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
            {t('app.prototype')}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="h-10 gap-1.5 px-2.5">
              <Languages className="size-4" aria-hidden />
              <span className="text-sm font-medium">{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-10">
              <Link to="/glossary">{t('nav.glossary')}</Link>
            </Button>
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
