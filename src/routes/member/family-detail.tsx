import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  DoorOpen,
  GraduationCap,
  HeartCrack,
  House,
  Lock,
  Stethoscope,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { TotalBalanceCard } from '@/components/patterns/total-balance-card'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { currentStage, withdrawalReasons } from '@/lib/derive'
import { reasonLabelKey } from '@/lib/claims'
import { contributionsForPerson, establishmentByCode, employments, personById } from '@/lib/mock/db'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const eventIcon: Record<string, typeof Wallet> = {
  medical: Stethoscope,
  home: House,
  education: GraduationCap,
  'left-job': DoorOpen,
}

/**
 * Someone else's account, viewed with permission — never Priya's own profile.
 * Every section here is gated by `scope`: a permission nobody can see is
 * indistinguishable from a backdoor, so if it isn't granted, it isn't shown.
 */
export default function FamilyMemberDetail() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useT()
  const { familyLinks, claims, contributions, revokeFamilyLink } = useData()

  const link = familyLinks.find((f) => f.personId === personId)
  if (!link) return <Navigate to="/member/family" replace />

  const person = personById(link.personId)
  const canViewBalance = link.scope.includes('view-balance')
  const canFileClaims = link.scope.includes('file-claims')

  const targetContributions = contributionsForPerson(contributions, link.personId)
  const employment = employments.find((e) => e.personId === link.personId && e.current)
  const establishment = employment ? establishmentByCode(employment.estCode) : undefined
  const reasons = canFileClaims ? withdrawalReasons(targetContributions, link.personId) : []
  const theirClaims = claims.filter((c) => c.personId === link.personId)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        eyebrow={`Family · ${link.relation}`}
        title={person.name}
        action={
          <Button
            variant="outline"
            onClick={() => {
              revokeFamilyLink(link.id)
              toast.success(`Revoked. ${person.name} is no longer linked.`)
              navigate('/member/family')
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Revoke access
          </Button>
        }
      />

      <p className="flex items-start gap-2.5 rounded-lg border border-info-line bg-info-soft p-4 text-sm leading-relaxed">
        <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
        You're viewing {person.name}'s account as their linked {link.relation}. Only what's been
        shared with you is shown here — this is their account, not your own profile.
      </p>

      {!canViewBalance && !canFileClaims ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No permissions have been shared yet.
        </div>
      ) : null}

      {canViewBalance ? (
        <>
          <TotalBalanceCard contributions={targetContributions} headingLevel="h2" />
          <div className="rounded-lg border bg-card">
            <dl className="divide-y">
              {[
                { k: 'UAN', v: person.uan, ident: true },
                { k: 'Relation to you', v: link.relation, capitalize: true },
                { k: 'Employer', v: establishment?.name ?? '—' },
              ].map((row) => (
                <div key={row.k} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <dt className="text-sm text-muted-foreground">{row.k}</dt>
                  <dd className={cn('font-medium', row.capitalize && 'capitalize', row.ident && 'ident')}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : null}

      {canFileClaims ? (
        <section aria-labelledby="family-events">
          <SectionTitle>
            <span id="family-events">Raise a claim for {person.name}</span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {reasons.map((r) => {
              const Icon = eventIcon[r.key] ?? Wallet
              return (
                <li key={r.key} className="flex">
                  {r.eligible ? (
                    <Link
                      to={`/member/claims/new?reason=${r.key}&onBehalfOf=${link.personId}`}
                      className="group flex w-full flex-col rounded-lg border bg-card p-4 transition-colors duration-[var(--dur-fast)] hover:border-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-tint text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="mt-3 block text-sm font-semibold">
                        {lang === 'hi' ? r.titleHi : r.title}
                      </span>
                      <span className="mt-auto block pt-3 text-xs text-muted-foreground">
                        {t('withdraw.youCanTake')}
                      </span>
                      <Money value={r.cap} size="lg" mark />
                    </Link>
                  ) : (
                    <div className="flex w-full flex-col rounded-lg border bg-card p-4 opacity-70">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Lock className="size-4" aria-hidden />
                      </span>
                      <span className="mt-3 block text-sm font-semibold">
                        {lang === 'hi' ? r.titleHi : r.title}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">{r.blockedBecause}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <Button asChild variant="outline" className="mt-3">
            <Link to={`/death-claim?linked=${link.personId}`}>
              <HeartCrack className="size-4" aria-hidden />
              Raise a death claim for {person.name}
            </Link>
          </Button>
        </section>
      ) : null}

      {theirClaims.length > 0 ? (
        <section aria-labelledby="family-claims">
          <SectionTitle>
            <span id="family-claims">Claims on {person.name}'s account</span>
          </SectionTitle>
          <div className="space-y-2">
            {theirClaims.map((c) => {
              const stage = currentStage(c)
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{t(reasonLabelKey[c.reasonKey] ?? 'claim.reason.medical')}</p>
                    <p className="ident text-xs text-muted-foreground">
                      {c.id} · filed {fmtDate(c.filedOn, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money value={c.amount} />
                    <StatusPill tone={c.settledOn ? 'ok' : 'wait'}>
                      {c.settledOn ? 'Settled' : (stage?.label ?? 'In progress')}
                    </StatusPill>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
