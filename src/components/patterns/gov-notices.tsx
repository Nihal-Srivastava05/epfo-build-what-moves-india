import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone } from 'lucide-react'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useT } from '@/i18n'
import { fmtDate } from '@/lib/format'
import { govNotices } from '@/lib/mock/db'
import { cn } from '@/lib/utils'

/**
 * What EPFO has published, as opposed to what has happened to you.
 *
 * Kept deliberately apart from "Needs your attention" and from notifications:
 * those are the reader's own account speaking, and a general circular has no
 * business competing with a bank detail that is about to bounce a payment. The
 * eyebrow says so in as many words, because a government notice on a personal
 * dashboard is otherwise easy to read as personal.
 *
 * One list, drawn the same way on the public front page and the signed-in home,
 * so the two can never quote different notices.
 */
export function GovNotices({ className, limit = 3 }: { className?: string; limit?: number }) {
  const { t, lang } = useT()
  const notices = govNotices.slice(0, limit)
  if (notices.length === 0) return null

  /*
   * Amber fill rather than the plain card, so the band is found without being
   * looked for. It borrows the existing `wait` tokens instead of a new yellow:
   * one amber in the app means one thing, and a second would just be
   * decoration competing with it.
   */
  return (
    <section
      aria-labelledby="gov-notices"
      className={cn(
        'rounded-lg border-[1.35px] border-wait-line bg-wait-soft p-5',
        className,
      )}
    >
      <div className="mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {/* The eyebrow type, spelled out rather than via `.eyebrow`: that class
            carries text-muted-foreground in the same utility layer, so it wins
            the tie against a colour utility and the amber never lands. */}
        <h2
          id="gov-notices"
          className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.055em] text-wait uppercase"
        >
          <Megaphone className="size-3.5" aria-hidden />
          {t('notices.title')}
        </h2>
        <MockBadge what="Illustrative notices. The wording, the circular numbers and the dates are invented — but the figures in them match the rates this site uses everywhere else." />
      </div>
      <p className="mb-3.5 max-w-prose text-[0.8125rem] leading-relaxed text-foreground/70">
        {t('notices.all')}
      </p>

      <ul className="divide-y divide-wait-line border-t border-wait-line">
        {notices.map((n) => {
          const title = lang === 'hi' ? n.titleHi : n.title
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-semibold leading-snug tracking-[-0.005em]">
                  {title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t('notices.issued')}{' '}
                  <span className="num">{fmtDate(n.issuedOn, lang)}</span>
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  <span className="ident">{n.ref}</span>
                </span>
              </span>
              {n.to ? (
                <ArrowRight
                  className="mt-0.5 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-wait"
                  aria-hidden
                />
              ) : null}
            </>
          )

          return (
            <li key={n.id}>
              {n.to ? (
                <Link
                  to={n.to}
                  className="group flex items-start gap-3 py-3 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3 py-3">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
