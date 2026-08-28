import { Link } from 'react-router-dom'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'

/**
 * Government attribution where it earns trust — in the footer, on one line,
 * next to the number a person would actually ring. The working surface above
 * it is a product.
 */
export function SiteFooter() {
  const { t } = useT()
  const signedIn = useSession((s) => s.signedIn)
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto max-w-[68rem] px-4 py-6 pb-28 sm:px-6 lg:pb-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-muted-foreground">
          <span
            className="h-3 w-[1.125rem] shrink-0 rounded-[1px] border border-border"
            style={{
              background:
                'linear-gradient(180deg,#FF9933 0 33%,#FFFFFF 33% 66%,#138808 66% 100%)',
            }}
            aria-hidden
          />
          <span className="min-w-0">{t('app.ministry')}</span>
          <span className="num ml-auto whitespace-nowrap">Helpline 1800 118 005</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-xs">
          <Link to="/glossary" className="text-muted-foreground hover:text-foreground">
            {t('nav.glossary')}
          </Link>
          <Link to="/status" className="text-muted-foreground hover:text-foreground">
            {t('landing.lookup')}
          </Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">
            About this prototype
          </Link>
          {/* Settings sits behind the sign-in guard, so it is not offered before one. */}
          {signedIn ? (
            <Link to="/settings" className="text-muted-foreground hover:text-foreground">
              {t('nav.settings')}
            </Link>
          ) : null}
          <span className="text-faint sm:ml-auto">
            {t('app.prototypeNote')}{' '}
            <Link to="/about" className="font-semibold text-foreground underline underline-offset-4">
              What is real and what is mocked
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
