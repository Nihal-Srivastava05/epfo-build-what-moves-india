import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ChevronRight, HandCoins, RotateCcw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { WITHDRAW_STEPS, reasonLabelKey } from '@/lib/claims'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Claims() {
  const { claims, claimDraft, saveDraft } = useData()
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const open = claims.filter((c) => !c.settledOn)
  const past = claims.filter((c) => c.settledOn)

  return (
    <div className="space-y-4">
      {/* The three steps are shown before you commit to them, so the shape of
          the task is known up front rather than discovered one screen at a time. */}
      <section className="overflow-hidden rounded-lg border bg-card" aria-labelledby="start">
        <div className="border-b bg-muted p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-background">
                <Wallet className="size-5 text-primary" aria-hidden />
              </span>
              <div>
                <h2 id="start" className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
                  {t('claims.startTitle')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('claims.startSub')}</p>
              </div>
            </div>
            <Button asChild size="lg">
              <Link to="/member/claims/new">
                {t('claims.start')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <ol className="grid gap-px bg-border sm:grid-cols-3">
          {WITHDRAW_STEPS.map((step, i) => (
            <li key={step.titleKey} className="bg-card p-5">
              <span className="num mb-2 flex size-6 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <p className="font-medium">{t(step.titleKey)}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(step.blurbKey)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Nothing typed is ever lost to a dropped session. */}
      {claimDraft ? (
        <motion.section
          initial={motionOk ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.25 : 0 }}
          className="flex flex-wrap items-center gap-4 rounded-lg border border-info-line bg-info-soft p-5"
        >
          <RotateCcw className="size-5 shrink-0 text-info" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t('claims.resumeTitle')}</p>
            <p className="mt-1 text-sm">
              {t('claims.resumeSub')}{' '}
              <span className="text-muted-foreground">
                ({t('withdraw.stepOf', { n: claimDraft.step })})
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/member/claims/new">{t('claims.resume')}</Link>
            </Button>
            <Button variant="ghost" onClick={() => saveDraft(null)}>
              {t('claims.discard')}
            </Button>
          </div>
        </motion.section>
      ) : null}

      {open.length > 0 ? (
        <section aria-labelledby="open">
          <SectionTitle>
            <span id="open">{t('claims.inProgress')}</span>
          </SectionTitle>
          <div className="space-y-4">
            {open.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-lg border bg-card">
                  <div className="p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Money value={c.amount} size="xl" mark />
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t(reasonLabelKey[c.reasonKey] ?? 'claim.reason.withdrawal')}
                          <span className="mx-2 text-border" aria-hidden>·</span>
                          <span className="ident">{c.id}</span>
                        </p>
                      </div>
                      {c.expectedBy ? (
                        <div className="text-right">
                          <p className="eyebrow mb-1">{t('member.expectedBy')}</p>
                          <p className="num font-semibold">{fmtDate(c.expectedBy, lang)}</p>
                        </div>
                      ) : null}
                    </div>
                    <ClaimTracker claim={c} />
                  </div>
                  <Link
                    to={`/member/claims/${c.id}`}
                    className="flex items-center justify-between gap-2 border-t bg-muted px-5 py-3.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {t('claims.viewDetail')}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="past">
        <SectionTitle>
          <span id="past">{t('claims.past')}</span>
        </SectionTitle>
        {past.length === 0 && open.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <HandCoins className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">{t('claims.none')}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('claims.noneSub')}
            </p>
          </div>
        ) : past.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Nothing settled yet.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {past.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/member/claims/${c.id}`}
                  className={cn(
                    'flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-muted',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {t(reasonLabelKey[c.reasonKey] ?? 'claim.reason.withdrawal')}
                    </p>
                    <p className="ident mt-0.5 text-sm text-muted-foreground">
                      {c.id} · {c.formNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={c.amount} className="font-medium" />
                    <p className="num mt-0.5 text-xs text-muted-foreground">
                      {t('claims.settled')} {fmtDate(c.settledOn!, lang)}
                    </p>
                  </div>
                  <StatusPill tone="ok">{t('common.done')}</StatusPill>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
