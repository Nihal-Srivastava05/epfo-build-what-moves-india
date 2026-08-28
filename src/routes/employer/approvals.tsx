import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, ClipboardCheck, HandCoins, Repeat, ShieldAlert, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { tones, type Tone } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { daysBetween, fmtUan } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ApprovalKind } from '@/lib/types'

/**
 * The same four or five things come up for every employer, over and over,
 * across dozens of people. Naming the fix once and applying it to everyone
 * who needs it is the entire idea — a table forces you to make that same
 * decision a dozen times in a row and calls it thoroughness.
 */
const KIND_META: Record<
  ApprovalKind,
  { icon: typeof HandCoins; noun: (n: number) => string; blurb: string; tone: Tone }
> = {
  exit: {
    icon: UserMinus,
    noun: (n) => `missing exit date${n === 1 ? '' : 's'}`,
    blurb: 'Confirm when they left, so their PF account can be settled.',
    tone: 'wait',
  },
  kyc: {
    icon: ShieldAlert,
    noun: (n) => `KYC approval${n === 1 ? '' : 's'}`,
    blurb: 'They changed a bank account, mobile number, or identity detail — confirm it.',
    tone: 'info',
  },
  mismatch: {
    icon: ClipboardCheck,
    noun: (n) => `contribution mismatch${n === 1 ? '' : 'es'}`,
    blurb: "Filed wage doesn't match the payroll record. Confirm which figure is right.",
    tone: 'stop',
  },
  claim: {
    icon: HandCoins,
    noun: (n) => `claim approval${n === 1 ? '' : 's'}`,
    blurb: 'Attest so EPFO can process the withdrawal.',
    tone: 'brand',
  },
  transfer: {
    icon: Repeat,
    noun: (n) => `transfer-in approval${n === 1 ? '' : 's'}`,
    blurb: 'Confirm their PF is transferring in from a previous employer.',
    tone: 'neutral',
  },
}

const KIND_ORDER: ApprovalKind[] = ['exit', 'kyc', 'mismatch', 'claim', 'transfer']

export default function Approvals() {
  const { approvals, resolveApprovals } = useData()
  const motionOk = useMotionOk()
  const [expanded, setExpanded] = useState<ApprovalKind | null>(null)

  const groups = useMemo(
    () =>
      KIND_ORDER.map((kind) => ({
        kind,
        items: approvals
          .filter((a) => a.kind === kind)
          .sort((a, b) => daysBetween(b.waitingSince) - daysBetween(a.waitingSince)),
      })).filter((g) => g.items.length > 0),
    [approvals],
  )

  const total = approvals.length

  return (
    <div>
      <PageHeader
        title="Approvals"
        sub={
          total === 0
            ? 'Nobody is waiting on you.'
            : 'Grouped by what needs to happen, not one row per person — clear a whole group at once, or open it to handle someone individually.'
        }
      />

      {total === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-semibold">The queue is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nobody is waiting on you. Every claim has moved on to EPFO.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted-foreground">
            <span className="figure text-foreground">{total}</span>{' '}
            {total === 1 ? 'employee needs' : 'employees need'} action, in {groups.length}{' '}
            group{groups.length === 1 ? '' : 's'}.
          </p>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {groups.map((g) => {
                const meta = KIND_META[g.kind]
                const isOpen = expanded === g.kind
                return (
                  <motion.div
                    key={g.kind}
                    layout={motionOk}
                    exit={motionOk ? { opacity: 0, height: 0 } : undefined}
                    transition={{ duration: motionOk ? 0.25 : 0 }}
                    className="overflow-hidden rounded-lg border bg-card"
                  >
                    <div className="flex flex-wrap items-center gap-4 p-5">
                      <span className={cn('grid size-11 shrink-0 place-items-center rounded-sm', tones[meta.tone])}>
                        <meta.icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {g.items.length} {meta.noun(g.items.length)}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{meta.blurb}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setExpanded(isOpen ? null : g.kind)}>
                          {isOpen ? 'Hide names' : 'Review names'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            resolveApprovals(g.items.map((i) => i.id))
                            toast.success(`${g.items.length} ${meta.noun(g.items.length)} cleared.`)
                            if (isOpen) setExpanded(null)
                          }}
                        >
                          Approve all {g.items.length}
                        </Button>
                      </div>
                    </div>

                    {isOpen ? (
                      <ul className="divide-y border-t">
                        {g.items.map((a) => {
                          const days = daysBetween(a.waitingSince)
                          return (
                            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                              <span
                                className={cn(
                                  'grid size-8 shrink-0 place-items-center rounded-sm text-[0.6875rem] font-bold',
                                  days >= 7
                                    ? 'bg-stop-soft text-stop'
                                    : days >= 3
                                      ? 'bg-wait-soft text-wait'
                                      : 'bg-muted text-muted-foreground',
                                )}
                                title={`Waiting ${days} days`}
                              >
                                {days}d
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">
                                  {a.personName}{' '}
                                  <span className="ident font-normal text-muted-foreground">{fmtUan(a.uan)}</span>
                                </p>
                                <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{a.detail}</p>
                              </div>
                              {a.amount ? <Money value={a.amount} className="font-bold" /> : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  resolveApprovals([a.id])
                                  toast.success(`${a.personName} has been told.`)
                                }}
                              >
                                Approve
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
