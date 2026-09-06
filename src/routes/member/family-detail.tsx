import { Fragment, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { InterestWorking } from '@/components/patterns/interest-working'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { buildLedger, currentStage, groupLedgerByFy, interestBreakdown, withdrawalReasons } from '@/lib/derive'
import { reasonLabelKey } from '@/lib/claims'
import { contributionsForPerson, establishmentByCode, employments, personById } from '@/lib/mock/db'
import { fmtDate, inr } from '@/lib/format'
import { cn } from '@/lib/utils'

const eventIcon: Record<string, typeof Wallet> = {
  medical: Stethoscope,
  home: House,
  education: GraduationCap,
  'left-job': DoorOpen,
}

/** Years per page — a long career (Anil's is 28 years) otherwise turns this
 *  one section into most of the page's scroll, even with every year collapsed. */
const YEARS_PER_PAGE = 5

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

  /**
   * Computed unconditionally, above the "not linked" early return, so hook
   * order never depends on whether the link exists — `contributionsForPerson`
   * with an empty id just yields an empty ledger rather than crashing.
   */
  const targetContributions = useMemo(
    () => contributionsForPerson(contributions, personId ?? ''),
    [contributions, personId],
  )
  const ledger = useMemo(() => buildLedger(targetContributions), [targetContributions])
  const interestWorking = useMemo(() => interestBreakdown(targetContributions), [targetContributions])
  const fyGroups = useMemo(() => groupLedgerByFy(ledger), [ledger])
  /** Untouched, only the newest year opens — same convention as the full passbook. */
  const [openYears, setOpenYears] = useState<Set<string> | null>(null)
  const [openInterest, setOpenInterest] = useState<string | null>(null)
  const effectiveOpenYears = openYears ?? new Set(fyGroups.length ? [fyGroups[0].fy] : [])
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(fyGroups.length / YEARS_PER_PAGE))
  const pagedGroups = fyGroups.slice(page * YEARS_PER_PAGE, page * YEARS_PER_PAGE + YEARS_PER_PAGE)
  const toggleYear = (year: string) => {
    const next = new Set(effectiveOpenYears)
    if (next.has(year)) next.delete(year)
    else next.add(year)
    setOpenYears(next)
  }

  if (!link) return <Navigate to="/member/family" replace />

  const person = personById(link.personId)
  const canViewBalance = link.scope.includes('view-balance')
  const canFileClaims = link.scope.includes('file-claims')

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

          <section aria-labelledby="family-passbook">
            <SectionTitle>
              <span id="family-passbook">{person.name}'s passbook</span>
            </SectionTitle>
            {fyGroups.length === 0 ? (
              <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
                No contributions on record yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">{person.name}'s provident fund ledger</caption>
                  <thead className="bg-muted">
                    <tr className="eyebrow">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Particulars</th>
                      <th className="px-4 py-3 text-right">Their share</th>
                      <th className="px-4 py-3 text-right">Employer</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  {pagedGroups.map((g) => {
                    const yearOpen = effectiveOpenYears.has(g.fy)
                    return (
                      <Fragment key={g.fy}>
                        <tbody className="border-t">
                          <tr className="bg-muted/60 transition-colors hover:bg-muted">
                            <td className="px-4 py-2.5 align-middle">
                              <button
                                type="button"
                                onClick={() => toggleYear(g.fy)}
                                aria-expanded={yearOpen}
                                aria-controls={`fam-fy-${g.fy}`}
                                className="flex items-center gap-2 font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                <ChevronDown
                                  className={cn(
                                    'size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--dur-fast)]',
                                    yearOpen && 'rotate-180',
                                  )}
                                  aria-hidden
                                />
                                <span className="num">FY {g.fy}</span>
                              </button>
                            </td>
                            <td className="px-4 py-2.5 text-[0.8125rem] text-muted-foreground">
                              <span className="num">{g.credits}</span> {g.credits === 1 ? 'credit' : 'credits'}
                              {g.interest > 0 ? (
                                <>
                                  {' · interest '}
                                  <span className="num font-semibold text-foreground">₹{inr(g.interest)}</span>
                                </>
                              ) : null}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Money value={g.employee} size="sm" className="font-semibold" />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Money value={g.employer} size="sm" className="font-semibold" />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Money value={g.closing} size="sm" className="font-bold" />
                            </td>
                          </tr>
                        </tbody>

                        {yearOpen ? (
                          <tbody id={`fam-fy-${g.fy}`} className="divide-y">
                            {g.rows.map((r) => {
                              const working = r.kind === 'interest' ? interestWorking.get(r.id) : undefined
                              const open = openInterest === r.id
                              return (
                                <Fragment key={r.id}>
                                  <tr className={r.kind === 'interest' ? 'bg-brand-tint' : 'transition-colors hover:bg-muted'}>
                                    <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground align-top">
                                      {fmtDate(r.date, lang)}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                      {working ? (
                                        <button
                                          type="button"
                                          onClick={() => setOpenInterest(open ? null : r.id)}
                                          aria-expanded={open}
                                          aria-controls={`fam-working-${r.id}`}
                                          className="flex items-start gap-2 text-left font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        >
                                          <ChevronDown
                                            className={cn(
                                              'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--dur-fast)]',
                                              open && 'rotate-180',
                                            )}
                                            aria-hidden
                                          />
                                          <span>
                                            {r.particulars}
                                            <StatusPill tone="neutral" className="ml-2 align-middle">
                                              Interest
                                            </StatusPill>
                                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                              <span className="num">{(working.rate * 100).toFixed(2)}%</span> a
                                              year ·{' '}
                                              <span className="font-medium text-primary">
                                                {open ? 'Hide the months' : 'See the months'}
                                              </span>
                                            </span>
                                          </span>
                                        </button>
                                      ) : (
                                        r.particulars
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right align-top">
                                      <Money value={r.employee} size="sm" />
                                    </td>
                                    <td className="px-4 py-3 text-right align-top">
                                      {r.employer ? (
                                        <Money value={r.employer} size="sm" />
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right align-top font-bold">
                                      <Money value={r.balanceAfter} size="sm" />
                                    </td>
                                  </tr>
                                  {working && open ? (
                                    <tr id={`fam-working-${r.id}`} className="bg-brand-tint">
                                      <td colSpan={5} className="px-4 pt-0 pb-4">
                                        <InterestWorking year={working} lang={lang} />
                                      </td>
                                    </tr>
                                  ) : null}
                                </Fragment>
                              )
                            })}
                          </tbody>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </table>
              </div>
            )}

            {fyGroups.length > YEARS_PER_PAGE ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  Years <span className="num">{page * YEARS_PER_PAGE + 1}</span>–
                  <span className="num">{Math.min(fyGroups.length, (page + 1) * YEARS_PER_PAGE)}</span> of{' '}
                  <span className="num">{fyGroups.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Newer
                  </Button>
                  <span className="text-muted-foreground">
                    Page <span className="num">{page + 1}</span> of <span className="num">{totalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Older
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
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
