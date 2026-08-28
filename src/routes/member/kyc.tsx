import { BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/patterns/status-pill'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'

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
  const complete = kyc.filter((k) => k.status === 'verified').length

  return (
    <div>
      <p className="mb-5 max-w-prose text-sm leading-relaxed text-muted-foreground">
        Everything a claim can be rejected for, checked here rather than after you file.
      </p>

      {/* Account health as a standing score, not something discovered at submit. */}
      <div className="mb-6 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
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

      {/* One panel, one row per item. A verified row is a single line — the
          only thing that earns vertical space is the thing that is wrong. */}
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {kyc.map((k) => (
          <li key={k.key} className="px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {termFor[k.key] ? <Term id={termFor[k.key]!}>{k.label}</Term> : k.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className={/\d/.test(k.value) ? 'ident' : ''}>{k.value}</span>
                </p>
              </div>
              {k.status === 'verified' ? (
                <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
                  Verified
                </StatusPill>
              ) : (
                <>
                  <StatusPill tone={k.key === 'bank' ? 'stop' : 'wait'}>Needs you</StatusPill>
                  <Button
                    size="sm"
                    onClick={() => {
                      fixKyc(k.key)
                      toast.success(`${k.label} updated and verified.`)
                    }}
                  >
                    {k.fixLabel}
                  </Button>
                </>
              )}
            </div>

            {k.status !== 'verified' ? (
              <div className="mt-3 rounded-sm bg-muted p-3.5">
                <p className="text-[0.8125rem] leading-relaxed">{k.problem}</p>
                {k.correctedValue ? (
                  <div className="ident mt-2.5 text-xs">
                    <span className="block text-stop line-through">{k.value}</span>
                    <span className="block font-semibold text-ok">{k.correctedValue}</span>
                  </div>
                ) : null}
                {k.since ? (
                  <OwnerClock holder={k.holder} since={k.since} className="mt-2.5" compact />
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
