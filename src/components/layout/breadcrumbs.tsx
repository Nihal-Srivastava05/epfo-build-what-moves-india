import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { breadcrumbsFor } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The way back, stated rather than remembered.
 *
 * The rail says which of the five sections you are in; it cannot say that this
 * screen hangs off the passbook, or hand you one tap to get there. Rendered by
 * the shell so every screen gets the same trail in the same place, and nothing
 * has to hand-roll its own back button.
 */
export function Breadcrumbs({ pathname, className }: { pathname: string; className?: string }) {
  const persona = useSession((s) => s.persona)
  const { t } = useT()
  const crumbs = breadcrumbsFor(persona, pathname)

  /** Home is its own trail, so it gets none. */
  if (crumbs.length === 0) return null

  return (
    <nav aria-label={t('crumb.trail')} className={cn('mb-4', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.to ?? 'page'}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-faint" aria-hidden />
              ) : null}
              {last || !c.to ? (
                <span aria-current="page" className="font-semibold text-foreground">
                  {t(c.labelKey)}
                </span>
              ) : (
                <Link
                  to={c.to}
                  className="rounded-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {t(c.labelKey)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
