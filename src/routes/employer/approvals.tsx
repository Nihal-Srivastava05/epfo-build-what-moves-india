import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { daysBetween, fmtUan } from '@/lib/format'

const kindLabel = {
  claim: 'Withdrawal',
  kyc: 'KYC',
  transfer: 'Transfer',
  exit: 'Exit date',
} as const

export default function Approvals() {
  const { approvals, approveClaim } = useData()
  const motionOk = useMotionOk()

  /** Sorted by how long a person has been waiting, not by when it arrived. */
  const queue = approvals
    .slice()
    .sort((a, b) => daysBetween(b.waitingSince) - daysBetween(a.waitingSince))

  return (
    <div>
      <PageHeader
        title="Approvals"
        sub="Sorted by how long each person has been waiting. The longest wait is at the top."
      />

      {queue.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-ok-line bg-ok-soft p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-medium">The queue is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nobody is waiting on you. Their claims have moved on to EPFO.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {queue.map((a) => {
              const days = daysBetween(a.waitingSince)
              return (
                <motion.li
                  key={a.id}
                  layout={motionOk}
                  exit={motionOk ? { opacity: 0, height: 0, marginBottom: 0 } : undefined}
                  transition={{ duration: motionOk ? 0.25 : 0 }}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <div className="flex flex-wrap items-start gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{a.personName}</p>
                        <StatusPill tone={days >= 7 ? 'stop' : days >= 3 ? 'wait' : 'neutral'}>
                          {kindLabel[a.kind]}
                        </StatusPill>
                      </div>
                      <p className="ident mt-1 text-sm text-muted-foreground">{fmtUan(a.uan)}</p>
                      <p className="mt-2 text-sm">{a.detail}</p>
                      {a.amount ? (
                        <p className="mt-1">
                          <Money value={a.amount} className="font-medium" />
                        </p>
                      ) : null}
                      <OwnerClock holder="employer" since={a.waitingSince} className="mt-3" compact />
                      {a.claimId ? (
                        <p className="ident mt-2 text-xs text-muted-foreground">
                          {a.claimId} — {a.personName.split(' ')[0]} is watching this reference on their
                          own claim tracker.
                        </p>
                      ) : null}
                    </div>
                    <Button
                      onClick={() => {
                        if (a.claimId) approveClaim(a.claimId)
                        else useData.setState((s) => ({ approvals: s.approvals.filter((x) => x.id !== a.id) }))
                        toast.success(`${a.personName} has been told. ${a.claimId ? 'Their claim moved to EPFO.' : ''}`)
                      }}
                    >
                      Approve
                    </Button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
