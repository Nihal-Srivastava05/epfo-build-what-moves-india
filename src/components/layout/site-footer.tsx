import { Link } from 'react-router-dom'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'

/**
 * A prototype does not get to wear a ministry's name, so the footer carries
 * only what is true of it: where to ring, where the words are explained, and a
 * standing admission that every figure above is invented.
 */
export function SiteFooter() {
  const { t } = useT()
  const signedIn = useSession((s) => s.signedIn)
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto max-w-[68rem] px-4 py-6 pb-28 sm:px-6 lg:pb-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <Link to="/glossary" className="text-muted-foreground hover:text-foreground">
            {t('nav.glossary')}
          </Link>
          <Link to="/status" className="text-muted-foreground hover:text-foreground">
            {t('landing.lookup')}
          </Link>
          <Link to="/calculators" className="text-muted-foreground hover:text-foreground">
            {t('nav.calculators')}
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
          <span className="num text-muted-foreground">Helpline 1800 118 005</span>
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
