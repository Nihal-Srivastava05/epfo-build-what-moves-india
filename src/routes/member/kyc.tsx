import { BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'

const termFor: Record<string, string | undefined> = {
  aadhaar: undefined,
  pan: undefined,
  bank: 'ifsc',
  mobile: undefined,
  nominee: 'nominee',
  exit: 'exit-date',
}

export default function Kyc() {
  const { kyc, fixKyc } = useData()
  const { t } = useT()
  const complete = kyc.filter((k) => k.status === 'verified').length

  return (
    <div>
      <PageHeader
        title={t('nav.kyc')}
        sub="Everything a claim can be rejected for, checked here rather than after you file."
      />

      {/* Account health as a standing score, not something discovered at submit. */}
      <div className="mb-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">
            <span className="num">{complete}</span> of <span className="num">{kyc.length}</span> complete
          </p>
          <StatusPill tone={complete === kyc.length ? 'ok' : 'wait'}>
            {complete === kyc.length ? 'Ready to claim' : `${kyc.length - complete} to fix`}
          </StatusPill>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {kyc.map((k) => (
            <div
              key={k.key}
              className={`h-1.5 flex-1 rounded-full ${k.status === 'verified' ? 'bg-ok' : 'bg-wait'}`}
            />
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {kyc.map((k) => (
          <li key={k.key} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {termFor[k.key] ? <Term id={termFor[k.key]!}>{k.label}</Term> : k.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className={/\d/.test(k.value) ? 'ident' : ''}>{k.value}</span>
                </p>
              </div>
              {k.status === 'verified' ? (
                <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
                  Verified
                </StatusPill>
              ) : (
                <StatusPill tone={k.key === 'bank' ? 'stop' : 'wait'}>Needs you</StatusPill>
              )}
            </div>

            {k.status !== 'verified' ? (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm leading-relaxed">{k.problem}</p>
                {k.correctedValue ? (
                  <div className="ident mt-3 rounded-md border bg-secondary/40 p-3 text-xs">
                    <span className="block text-stop line-through">{k.value}</span>
                    <span className="block font-semibold text-ok">{k.correctedValue}</span>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      fixKyc(k.key)
                      toast.success(`${k.label} updated and verified.`)
                    }}
                  >
                    {k.fixLabel}
                  </Button>
                  {k.since ? <OwnerClock holder={k.holder} since={k.since} compact /> : null}
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
