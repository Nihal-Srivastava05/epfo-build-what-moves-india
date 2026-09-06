import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, HandCoins, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { personById } from '@/lib/mock/db'
import { fmtDate } from '@/lib/format'
import { useData } from '@/store/data'
import { useMotionOk } from '@/hooks/use-motion-ok'

const SCOPE_LABEL: Record<'view-balance' | 'file-claims', { label: string; icon: typeof ShieldCheck }> = {
  'view-balance': { label: 'View balance', icon: ShieldCheck },
  'file-claims': { label: 'File claims on their behalf', icon: HandCoins },
}

/**
 * Family is a list of scoped, revocable permissions on other people's own
 * records — not a second inbox. Each card names exactly what Priya can do,
 * because a permission nobody can see is indistinguishable from a backdoor.
 */
export default function Family() {
  const { familyLinks } = useData()
  const motionOk = useMotionOk()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Family"
        sub="Link a family member once, with their own consent, and act for them on the things you're both given permission for."
        action={
          <Button asChild size="lg">
            <Link to="/member/family/link">
              <UserPlus className="size-4" aria-hidden />
              Link a family member
            </Link>
          </Button>
        }
      />

      {familyLinks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <Users className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No family linked yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Link a parent, spouse or child so you can check on their account or file a claim for them —
            with their consent, and a permission you can switch off any time.
          </p>
          <Button asChild className="mt-2">
            <Link to="/member/family/link">Link a family member</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {familyLinks.map((link, i) => {
            const person = personById(link.personId)
            return (
              <motion.div
                key={link.id}
                initial={motionOk ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionOk ? 0.22 : 0, delay: motionOk ? i * 0.05 : 0 }}
              >
                <Link
                  to={`/member/family/${link.personId}`}
                  className="group flex items-center gap-3 rounded-lg border bg-card p-5 transition-colors duration-[var(--dur-fast)] hover:border-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {link.relation} · linked {fmtDate(link.linkedOn)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {link.scope.map((s) => {
                        const meta = SCOPE_LABEL[s]
                        return (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs font-medium"
                          >
                            <meta.icon className="size-3" aria-hidden />
                            {meta.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
