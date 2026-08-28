import { BadgeCheck } from 'lucide-react'
import { PageHeader } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate } from '@/lib/format'
import { personById } from '@/lib/mock/db'

export default function Details() {
  const pensioner = useData((s) => s.pensioner)
  const { lang } = useT()
  const me = personById('p-ram')

  const rows: { label: React.ReactNode; value: string; verified?: boolean }[] = [
    { label: 'Name', value: me.name, verified: true },
    { label: 'Date of birth', value: fmtDate(me.dob, lang), verified: true },
    { label: <Term id="ppo">PPO number</Term>, value: pensioner.ppo, verified: true },
    { label: 'Scheme', value: pensioner.scheme },
    { label: 'Bank', value: `${pensioner.bankName} ending ${pensioner.bankLast4}`, verified: true },
    { label: 'Aadhaar', value: me.aadhaarMasked, verified: true },
    { label: 'Mobile', value: me.mobileMasked, verified: true },
    { label: 'Family pension nominee', value: pensioner.familyPensionNominee, verified: true },
  ]

  return (
    <div>
      <PageHeader
        title="My details"
        sub="What EPFO holds about you. Everything marked verified has been checked against a source."
      />
      <dl className="divide-y rounded-lg border bg-card">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="flex items-center gap-2 text-right font-medium">
              <span className={typeof r.value === 'string' && /\d/.test(r.value) ? 'ident' : ''}>
                {r.value}
              </span>
              {r.verified ? (
                <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
                  Verified
                </StatusPill>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        To change your bank or address, we re-verify with a code sent to your registered mobile. That is
        the only time this prototype would ask for one.
      </p>
    </div>
  )
}
