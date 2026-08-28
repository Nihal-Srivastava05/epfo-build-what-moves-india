import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Landmark, MessageSquareWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { reasonLabelKey, whatHappensNext } from '@/lib/claims'
import { fmtDate } from '@/lib/format'
import { establishmentByCode } from '@/lib/mock/db'

const formTermId: Record<string, string> = {
  'Form 19': 'form-19',
  'Form 13': 'form-13',
  'Form 31': 'form-31',
}

export default function ClaimDetail() {
  const { claimId = '' } = useParams()
  const claims = useData((s) => s.claims)
  const { t, lang } = useT()
  const claim = claims.find((c) => c.id === claimId)

  if (!claim) return <Navigate to="/member/claims" replace />

  const next = whatHappensNext(claim)
  const est = establishmentByCode(claim.estCode)

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/member/claims">
          <ArrowLeft className="size-4" aria-hidden />
          {t('nav.claims')}
        </Link>
      </Button>

      <PageHeader
        eyebrow={claim.id}
        title={t(reasonLabelKey[claim.reasonKey] ?? 'claim.reason.withdrawal')}
        sub={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Money value={claim.amount} size="lg" mark />
            <StatusPill tone={claim.settledOn ? 'ok' : 'wait'}>
              {claim.settledOn ? t('claims.settled') : t('claims.inProgress')}
            </StatusPill>
          </span>
        }
      />

      <section className="rounded-lg border bg-card p-5" aria-labelledby="tracker">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <h2 id="tracker" className="text-sm font-semibold">
            {t('member.trackClaim')}
          </h2>
          {claim.expectedBy && !claim.settledOn ? (
            <div className="text-right">
              <p className="eyebrow mb-1">{t('member.expectedBy')}</p>
              <p className="num font-semibold">{fmtDate(claim.expectedBy, lang)}</p>
            </div>
          ) : null}
        </div>
        <ClaimTracker claim={claim} />
      </section>

      {/* Not "under process" — the stage it is actually at, and what that means. */}
      <section className="mt-4 rounded-lg border border-info-line bg-info-soft p-5" aria-labelledby="next">
        <h2 id="next" className="eyebrow mb-2">
          {t('claims.whatNext')}
        </h2>
        <p className="font-medium">{next.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed">{next.body}</p>
      </section>

      <section className="mt-8" aria-labelledby="details">
        <SectionTitle>
          <span id="details">{t('claims.details')}</span>
        </SectionTitle>
        <dl className="divide-y rounded-lg border bg-card">
          {[
            { k: t('withdraw.reference'), v: <span className="ident">{claim.id}</span> },
            {
              k: 'Form used',
              v: <Term id={formTermId[claim.formNumber] ?? 'form-31'}>{claim.formNumber}</Term>,
            },
            { k: t('member.filedOn'), v: <span className="num">{fmtDate(claim.filedOn, lang)}</span> },
            claim.settledOn
              ? { k: t('claims.settled'), v: <span className="num">{fmtDate(claim.settledOn, lang)}</span> }
              : null,
            {
              k: t('withdraw.paidInto'),
              v: (
                <span className="flex items-center justify-end gap-2">
                  <Landmark className="size-4 text-muted-foreground" aria-hidden />
                  <span className="ident">****{claim.bankLast4}</span>
                </span>
              ),
            },
            { k: 'Employer', v: est.name },
          ]
            .filter(Boolean)
            .map((row) => (
              <div
                key={row!.k}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <dt className="text-sm text-muted-foreground">{row!.k}</dt>
                <dd className="text-right font-medium">{row!.v}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-5">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t('claims.somethingWrong')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The claim reference and your record are attached for you — you will not retype any of it.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link
            to={`/grievance/new?subject=${encodeURIComponent(`Query about claim ${claim.id}`)}`}
          >
            <MessageSquareWarning className="size-4" aria-hidden />
            {t('claims.raise')}
          </Link>
        </Button>
      </section>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Download className="size-4" aria-hidden />
          Acknowledgement
        </Button>
        <MockBadge what="Download is not wired up. A real acknowledgement would carry a verification code." />
      </div>
    </div>
  )
}
