import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate } from '@/lib/format'

const reasonLabel: Record<string, string> = {
  medical: 'Medical treatment',
  home: 'Buying or building a home',
  education: 'Education or marriage',
  'left-job': 'Left the job',
  'job-change': 'Transfer on job change',
}

export default function Claims() {
  const claims = useData((s) => s.claims)
  const { t, lang } = useT()
  const open = claims.filter((c) => !c.settledOn)
  const past = claims.filter((c) => c.settledOn)

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('nav.claims')}
        action={
          <Button asChild>
            <Link to="/member/claims/new">
              <Plus className="size-4" aria-hidden />
              {t('member.withdraw')}
            </Link>
          </Button>
        }
      />

      {open.length > 0 ? (
        <section aria-labelledby="open">
          <SectionTitle>
            <span id="open">In progress</span>
          </SectionTitle>
          <div className="space-y-4">
            {open.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-5">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Money value={c.amount} size="xl" mark />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {reasonLabel[c.reasonKey] ?? 'Withdrawal'}
                      <span className="mx-2 text-border" aria-hidden>·</span>
                      <span className="ident">{c.id}</span>
                      <span className="mx-2 text-border" aria-hidden>·</span>
                      <Term id={c.formNumber === 'Form 19' ? 'form-19' : c.formNumber === 'Form 13' ? 'form-13' : 'form-31'}>
                        {c.formNumber}
                      </Term>
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
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="past">
        <SectionTitle>
          <span id="past">Past claims</span>
        </SectionTitle>
        {past.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            Nothing settled yet.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {past.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{reasonLabel[c.reasonKey] ?? 'Withdrawal'}</p>
                  <p className="ident mt-0.5 text-sm text-muted-foreground">
                    {c.id} · {c.formNumber}
                  </p>
                </div>
                <div className="text-right">
                  <Money value={c.amount} className="font-medium" />
                  <p className="num mt-0.5 text-xs text-muted-foreground">
                    Settled {fmtDate(c.settledOn!, lang)}
                  </p>
                </div>
                <StatusPill tone="ok">Done</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
