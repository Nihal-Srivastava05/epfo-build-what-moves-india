import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  ChartColumn,
  ChevronDown,
  Download,
  Info,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { MockBadge } from '@/components/patterns/mock-badge'
import { MultiSelect } from '@/components/patterns/multi-select'
import { BalanceTrend } from '@/components/charts/balance-trend'
import { ContributionBars } from '@/components/charts/contribution-bars'
import { EmployerSplit } from '@/components/charts/employer-split'
import { Term } from '@/components/patterns/term'
import { TotalBalanceCard } from '@/components/patterns/total-balance-card'
import { InterestWorking } from '@/components/patterns/interest-working'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { buildLedger, groupLedgerByFy, interestBreakdown } from '@/lib/derive'
import { financialYear, fmtDate, fmtMonth, inr } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  EPF_RATE,
  INTEREST_RATE,
  employmentById,
  employments,
  establishmentByCode,
  establishments,
  personById,
  splitContribution,
} from '@/lib/mock/db'
import type { Grain } from '@/lib/chart-data'
import { downloadCsv, exportName } from '@/lib/export'

export default function Passbook() {
  const contributions = useData((s) => s.contributions)
  const { lang } = useT()
  const ledger = useMemo(() => buildLedger(contributions), [contributions])
  /** The working behind each interest row, from the same pass that built it. */
  const interestWorking = useMemo(() => interestBreakdown(contributions), [contributions])
  const [openInterest, setOpenInterest] = useState<string | null>(null)
  /**
   * Years the reader has opened. Only the newest opens by itself: a career is a
   * list of years first, and the year you are asked about is almost always the
   * one that just closed.
   */
  const [openYears, setOpenYears] = useState<Set<string> | null>(null)

  const years = useMemo(() => {
    const set = new Set(ledger.map((r) => financialYear(r.month ?? r.date.slice(0, 7))))
    return ['all', ...Array.from(set).sort().reverse()]
  }, [ledger])
  const [fy, setFy] = useState('all')
  /** Empty means every employer — see MultiSelect. */
  const [ests, setEsts] = useState<string[]>([])
  const estOptions = establishments.map((e) => ({ value: e.code, label: e.name }))
  const allEsts = ests.length === 0

  const rows = useMemo(
    () =>
      ledger.filter(
        (r) =>
          (fy === 'all' || financialYear(r.month ?? r.date.slice(0, 7)) === fy) &&
          (allEsts || (r.estCode ? ests.includes(r.estCode) : false) || r.kind === 'interest'),
      ),
    [ledger, fy, ests, allEsts],
  )

  const fyGroups = useMemo(() => groupLedgerByFy(rows), [rows])
  /** Untouched, the newest year stands open; every other year is one click. */
  const effectiveOpenYears = openYears ?? new Set(fyGroups.length ? [fyGroups[0].fy] : [])

  /**
   * Seeded from what is actually open rather than from state, because until the
   * first click the open year is implicit — starting from the raw state would
   * silently shut the newest year the moment another one was opened.
   */
  const toggleYear = (year: string) => {
    const next = new Set(effectiveOpenYears)
    if (next.has(year)) next.delete(year)
    else next.add(year)
    setOpenYears(next)
  }

  /**
   * Narrowing the ledger resets which years are open, so a filter down to one
   * year always lands on that year's rows rather than on a collapsed heading
   * left over from the previous slice.
   */
  const changeFy = (next: string) => {
    setFy(next)
    setOpenYears(null)
    setOpenInterest(null)
  }
  const changeEsts = (next: string[]) => {
    setEsts(next)
    setOpenYears(null)
    setOpenInterest(null)
  }

  /**
   * The table is the record; the charts are the shape of it. Both read the same
   * filtered rows, so switching view can never change what is being looked at.
   */
  const [view, setView] = useState<'table' | 'chart'>('table')
  /**
   * Left on 'auto' the period follows the year filter — eighty-five monthly
   * bars is a texture, twelve is a chart — until the reader says otherwise.
   */
  const [grain, setGrain] = useState<Grain | 'auto'>('auto')
  const shownGrain: Grain = grain === 'auto' ? (fy === 'all' ? 'fy' : 'month') : grain

  const missing = contributions.filter((c) => c.status === 'missing')
  /** Months an employer never filed, narrowed by the same two filters, so the
   *  gap is only drawn on a chart that is actually showing that employer. */
  const unfiledMonths = useMemo(
    () =>
      contributions
        .filter(
          (c) =>
            c.status === 'missing' &&
            (fy === 'all' || financialYear(c.month) === fy) &&
            (allEsts || ests.includes(employmentById(c.employmentId).estCode)),
        )
        .map((c) => c.month),
    [contributions, fy, ests, allEsts],
  )

  const me = personById('p-priya')

  const current = employments.find((e) => e.current && e.personId === me.id)
  const currentEst = current ? establishmentByCode(current.estCode) : undefined
  const monthly = splitContribution(current?.monthlyWage ?? 0)

  /**
   * Exports exactly what is on screen, filters included — a file that disagrees
   * with the table above it is worse than no file. Amounts go out as plain
   * integers so a spreadsheet can add them up; the rendered ₹ grouping is a
   * display concern and does not belong in a data column.
   */
  const exportCsv = () => {
    const closing = rows.length ? rows[0].balanceAfter : 0
    const scope = fy === 'all' ? 'all years' : `FY ${fy}`
    const employer = allEsts
      ? 'all employers'
      : ests.map((code) => establishmentByCode(code).name).join('; ')

    downloadCsv(exportName(['epfo-passbook', me.uan, fy === 'all' ? 'all' : fy], 'csv'), [
      ['EPFO passbook (prototype — every figure below is synthetic)'],
      ['Member', me.name],
      ['UAN', me.uan],
      ['Scope', `${scope}, ${employer}`],
      ['Generated', new Date().toISOString()],
      [],
      ['Date', 'Particulars', 'Establishment', 'Your share', 'Employer share', 'Pension (EPS)', 'Balance'],
      ...rows.map((r) => [
        r.date,
        r.particulars,
        r.estCode,
        r.employee,
        r.employer,
        r.eps,
        r.balanceAfter,
      ]),
      [],
      [
        '',
        fy === 'all' && allEsts ? 'Closing balance' : 'Balance after the latest row shown',
        '',
        '',
        '',
        '',
        closing,
      ],
    ])
  }

  return (
    <div>
      {/* The same balance card as the home screen, so the number a person
          remembers from one page is the number that greets them on the next.
          Beside it: who is paying into the account right now, because the first
          question a ledger raises is "whose money is this row?". */}
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <TotalBalanceCard contributions={contributions} />

        {/* Current employment. Every figure is derived from the same record the
            ledger below is built from — nothing here is typed by hand. */}
        <section aria-labelledby="employment" className="flex flex-col rounded-lg border bg-card p-5">
          <h2 id="employment" className="eyebrow mb-3.5">
            Currently employed at
          </h2>

          {current && currentEst ? (
            <>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-muted">
                  <Building2 className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold tracking-[-0.01em]">{currentEst.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{currentEst.city}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 border-t pt-4 text-[0.8125rem]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Establishment code</dt>
                  <dd className="ident font-medium">{currentEst.code}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Working here since</dt>
                  <dd className="num font-medium">{fmtDate(current.joined, lang)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Monthly EPF wage</dt>
                  <dd>
                    <Money value={current.monthlyWage} size="sm" className="font-semibold" />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Going in each month</dt>
                  <dd>
                    <Money
                      value={monthly.employee + monthly.employerEpf}
                      size="sm"
                      className="font-semibold"
                      mark
                    />
                  </dd>
                </div>
              </dl>

              <p className="mt-auto pt-4 text-xs leading-relaxed text-muted-foreground">
                Your <span className="num">{(EPF_RATE * 100).toFixed(0)}%</span> and your employer’s
                match land as one row a month in the ledger below. Anything wrong with these details
                is corrected by your employer, not by EPFO.
              </p>

              <Link
                to="/member/service-history"
                className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-primary hover:underline"
              >
                View service history
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </>
          ) : (
            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
              No current employer on your record. The ledger below still holds everything paid in by
              every past employer.
            </p>
          )}
        </section>
      </div>

      <p className="mb-4 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
        Every rupee, per employer, per year — searchable here rather than locked in a PDF. Interest
        is credited once a year at {(INTEREST_RATE * 100).toFixed(2)}%, calculated on your monthly
        running balance — open any interest row to see the months it was built from. The year now in
        progress carries no interest yet: EPFO declares the rate after the year closes, which is why
        the last credit is dated 31 March.
      </p>

      {/* One control row above everything it scopes: the view switch, then the
          two filters, then the export that writes out exactly what they leave.
          Both views read the same rows, so switching never changes the slice. */}
      <Tabs
        value={view}
        onValueChange={(v) => setView(v as 'table' | 'chart')}
        className="gap-0"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <TabsList aria-label="Passbook view">
            <TabsTrigger value="table">
              <Table2 aria-hidden />
              Table
            </TabsTrigger>
            <TabsTrigger value="chart">
              <ChartColumn aria-hidden />
              Charts
            </TabsTrigger>
          </TabsList>

          <Select value={fy} onValueChange={changeFy}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y === 'all' ? 'All years' : `FY ${y}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MultiSelect
            className="w-60"
            label="Employers"
            options={estOptions}
            value={ests}
            onValueChange={changeEsts}
            allLabel="All employers"
            summary={(n) => `${n} employers`}
          />

          {/* The export sits with the filters, because what it writes out is
              whatever those two are currently showing. */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="size-4" aria-hidden />
              Export CSV
            </Button>
            <MockBadge what="The download is real and opens in any spreadsheet. The figures inside it are synthetic, like everything else here." />
          </div>
        </div>

        {missing.length > 0 ? (
          <p className="mb-4 flex items-start gap-2.5 rounded-sm bg-stop-soft p-3.5 text-[0.8125rem] leading-relaxed text-stop">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {fmtMonth(missing[0].month, lang)} is not in this ledger because your employer never
              filed it. It is not lost — it was never sent.
            </span>
          </p>
        ) : null}

        <TabsContent value="table">
          {/* Ledger rules and tabular figures: it should read like a passbook. */}
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Provident fund ledger</caption>
              <thead className="bg-muted">
                <tr className="eyebrow">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-right">Your share</th>
                  <th className="px-4 py-3 text-right">Employer</th>
                  <th className="px-4 py-3 text-right">
                    <Term id="eps" className="text-muted-foreground">Pension</Term>
                  </th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              {fyGroups.map((g) => {
                const yearOpen = effectiveOpenYears.has(g.fy)
                return (
                  <Fragment key={g.fy}>
                  <tbody className="border-t">
                    {/* The year, and what it came to. Closed, this is all a
                        fifteen-year career shows — fifteen rows instead of
                        one hundred and eighty. */}
                    <tr className="bg-muted/60 transition-colors hover:bg-muted">
                      <td className="px-4 py-2.5 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleYear(g.fy)}
                          aria-expanded={yearOpen}
                          aria-controls={`fy-${g.fy}`}
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
                        <span className="num">{g.credits}</span>{' '}
                        {g.credits === 1 ? 'credit' : 'credits'}
                        {g.interest > 0 ? (
                          <>
                            {' · interest '}
                            <span className="num font-semibold text-foreground">
                              ₹{inr(g.interest)}
                            </span>
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
                        <Money value={g.eps} size="sm" className="font-semibold" />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Money value={g.closing} size="sm" className="font-bold" />
                      </td>
                    </tr>
                  </tbody>

                  {yearOpen ? (
                    <tbody id={`fy-${g.fy}`} className="divide-y">
                      {g.rows.map((r) => {
                          const working =
                            r.kind === 'interest' ? interestWorking.get(r.id) : undefined
                          const open = openInterest === r.id
                          return (
                            <Fragment key={r.id}>
                      <tr
                        className={
                          r.kind === 'interest' ? 'bg-brand-tint' : 'transition-colors hover:bg-muted'
                        }
                      >
                        <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground align-top">
                          {fmtDate(r.date, lang)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {working ? (
                            /* One lump figure with no working is the second-biggest
                               source of grievance on a passbook. The rate and the
                               balance it was charged to are stated on the row; the
                               month-by-month arithmetic is one click under it. */
                            <>
                              <button
                                type="button"
                                onClick={() => setOpenInterest(open ? null : r.id)}
                                aria-expanded={open}
                                aria-controls={`working-${r.id}`}
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
                                    <span className="num">
                                      {(working.rate * 100).toFixed(2)}%
                                    </span>{' '}
                                    a year, charged to each month’s closing balance — average{' '}
                                    <span className="num">₹{inr(working.averageBalance)}</span> over{' '}
                                    <span className="num">{working.months.length}</span> months.{' '}
                                    <span className="font-medium text-primary">
                                      {open ? 'Hide the months' : 'See the months'}
                                    </span>
                                  </span>
                                </span>
                              </button>
                            </>
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
                        <td className="px-4 py-3 text-right align-top">
                          {r.eps ? (
                            <Money value={r.eps} size="sm" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top font-bold">
                          <Money value={r.balanceAfter} size="sm" />
                        </td>
                      </tr>

                              {working && open ? (
                                <tr id={`working-${r.id}`} className="bg-brand-tint">
                                  <td colSpan={6} className="px-4 pt-0 pb-4">
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
              {/* A passbook ends in its own total. It is the balance after the
                  latest row shown, not the account total, so a filtered view never
                  claims more than it displays. */}
              {rows.length ? (
                <tfoot className="border-t bg-muted">
                  <tr>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-[0.8125rem] font-bold">
                      {fy === 'all' && allEsts ? 'Closing balance' : 'Balance after the latest row shown'}
                    </td>
                    <td className="px-4 py-3" colSpan={3} />
                    <td className="px-4 py-3 text-right">
                      <Money value={rows[0].balanceAfter} size="sm" className="font-bold" />
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </TabsContent>

        {/* The charts answer the questions the table makes you do arithmetic
            for: is it growing, who is paying, and which job built which part.
            Every figure in them is a row above, never a re-derived number. */}
        <TabsContent value="chart" className="space-y-4">
          {rows.length === 0 ? (
            <p className="panel p-5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Nothing to plot — no entry matches these filters.
            </p>
          ) : (
            <>
              <BalanceTrend rows={rows} lang={lang} />
              <ContributionBars
                rows={rows}
                unfiledMonths={unfiledMonths}
                lang={lang}
                grain={shownGrain}
                onGrainChange={setGrain}
              />
              <EmployerSplit rows={rows} />
            </>
          )}
        </TabsContent>

        <p className="mt-3 text-sm text-muted-foreground">
          Showing <span className="num">{rows.length}</span> of{' '}
          <span className="num">{ledger.length}</span> entries across{' '}
          <span className="num">{fyGroups.length}</span>{' '}
          {fyGroups.length === 1 ? 'financial year' : 'financial years'}.
        </p>
      </Tabs>
    </div>
  )
}