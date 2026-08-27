import { Link } from 'react-router-dom'
import { Emblem } from '@/components/layout/emblem'
import { useT } from '@/i18n'

/**
 * Government attribution where it earns trust — in the footer. The working
 * surface above it is a product.
 */
export function SiteFooter() {
  const { t } = useT()
  return (
    <footer className="mt-auto border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Emblem className="size-7" />
              <span className="font-semibold tracking-tight">{t('app.name')}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('app.ministry')}
            </p>
            <p className="mt-3 rounded-md border border-dashed px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {t('app.prototypeNote')}{' '}
              <Link to="/about" className="font-medium text-foreground underline underline-offset-4">
                What is real and what is mocked
              </Link>
            </p>
          </div>
          <nav className="grid gap-2 text-sm" aria-label="Footer">
            <Link to="/glossary" className="text-muted-foreground hover:text-foreground">
              {t('nav.glossary')}
            </Link>
            <Link to="/status" className="text-muted-foreground hover:text-foreground">
              {t('landing.lookup')}
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground">
              About this prototype
            </Link>
            <Link to="/settings" className="text-muted-foreground hover:text-foreground">
              {t('nav.settings')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
