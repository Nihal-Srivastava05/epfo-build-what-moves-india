/** Port of src/lib/derive.ts — only import paths changed. */
import { INTEREST_RATE, TODAY, employmentById, employments, establishmentByCode } from '../data/seed.js'
import type { Claim, Contribution, KycItem, LedgerRow } from '../data/types.js'
import { daysBetween, financialYear } from './format.js'

/** One month inside a year's interest working. */
export interface InterestMonth {
  month: string
  added: number
  closing: number
  interest: number
}

/** The whole working behind one "interest credited" row. */
export interface InterestYear {
  fy: string
  rate: number
  creditedOn: string
  months: InterestMonth[]
  sumOfBalances: number
  averageBalance: number
  interest: number
}

/**
 * Splits a year's credit across its months so the parts add up to the whole.
 * The largest remainders take the leftover paise instead of naive rounding.
 */
function allocateInterest(closings: number[], rate: number, total: number): number[] {
  const raw = closings.map((b) => (b * rate) / 12)
  const floors = raw.map(Math.floor)
  let left = total - floors.reduce((s, n) => s + n, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  const out = floors.slice()
  for (const { i } of order) {
    if (left <= 0) break
    out[i] += 1
    left -= 1
  }
  return out
}

/**
 * Builds the passbook the way EPFO actually computes it: interest accrues on
 * the monthly running balance and is credited at the close of each financial
 * year.
 */
function accumulate(contributions: Contribution[]): {
  rows: LedgerRow[]
  years: InterestYear[]
} {
  const credited = contributions
    .filter((c) => c.status !== 'missing')
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))

  const rows: LedgerRow[] = []
  const years: InterestYear[] = []
  let balance = 0
  let fyMonths: { month: string; added: number; closing: number }[] = []
  let currentFy = credited.length ? financialYear(credited[0].month) : ''

  const closeFy = (fy: string, lastMonth: string) => {
    if (fyMonths.length === 0) return
    const sumOfBalances = fyMonths.reduce((s, m) => s + m.closing, 0)
    const interest = Math.round((sumOfBalances / 12) * INTEREST_RATE)
    if (interest <= 0) {
      fyMonths = []
      return
    }
    balance += interest
    const [y] = lastMonth.split('-').map(Number)
    const creditedOn = `${y}-03-31`

    const shares = allocateInterest(
      fyMonths.map((m) => m.closing),
      INTEREST_RATE,
      interest,
    )
    years.push({
      fy,
      rate: INTEREST_RATE,
      creditedOn,
      months: fyMonths.map((m, i) => ({ ...m, interest: shares[i] })),
      sumOfBalances,
      averageBalance: Math.round(sumOfBalances / fyMonths.length),
      interest,
    })

    rows.push({
      id: `int-${fy}`,
      date: creditedOn,
      estCode: '',
      particulars: `Interest credited for ${fy}`,
      employee: interest,
      employer: 0,
      eps: 0,
      kind: 'interest',
      balanceAfter: balance,
      seq: rows.length,
    })
    fyMonths = []
  }

  for (const c of credited) {
    const fy = financialYear(c.month)
    if (fy !== currentFy) {
      closeFy(currentFy, c.month)
      currentFy = fy
    }
    const added = c.employeeShare + c.employerEpfShare
    balance += added
    fyMonths.push({ month: c.month, added, closing: balance })
    const emp = employmentById(c.employmentId)
    const estCode = emp?.estCode ?? ''
    rows.push({
      id: c.id,
      date: c.creditedOn ?? `${c.month}-15`,
      month: c.month,
      estCode,
      particulars: establishmentByCode(estCode)?.name ?? estCode,
      employee: c.employeeShare,
      employer: c.employerEpfShare,
      eps: c.epsShare,
      kind: 'contribution',
      balanceAfter: balance,
      seq: rows.length,
    })
  }

  return { rows, years }
}

function buildLedgerChronological(contributions: Contribution[]): LedgerRow[] {
  return accumulate(contributions).rows
}

/** The working behind every credited interest row, keyed by financial year. */
export function interestBreakdown(contributions: Contribution[]): Map<string, InterestYear> {
  return new Map(accumulate(contributions).years.map((y) => [`int-${y.fy}`, y]))
}

/** A financial year of the ledger, with the year's own totals. */
export interface FyGroup {
  fy: string
  rows: LedgerRow[]
  employee: number
  employer: number
  eps: number
  interest: number
  credits: number
  closing: number
}

/** Folds the ledger into financial years so a long career is a list of years rather than one unbroken scroll. */
export function groupLedgerByFy(rows: LedgerRow[]): FyGroup[] {
  const byFy = new Map<string, FyGroup>()

  for (const r of rows) {
    const fy = financialYear(r.month ?? r.date.slice(0, 7))
    const g =
      byFy.get(fy) ??
      ({
        fy,
        rows: [],
        employee: 0,
        employer: 0,
        eps: 0,
        interest: 0,
        credits: 0,
        closing: 0,
      } satisfies FyGroup)

    g.rows.push(r)
    if (r.kind === 'interest') {
      g.interest += r.employee
    } else {
      g.employee += r.employee
      g.employer += r.employer
      g.eps += r.eps
      g.credits += 1
    }
    byFy.set(fy, g)
  }

  for (const g of byFy.values()) {
    g.closing = g.rows.reduce((last, r) => (r.seq > last.seq ? r : last), g.rows[0]).balanceAfter
  }

  return Array.from(byFy.values()).sort((a, b) => b.fy.localeCompare(a.fy))
}

/** Display order: newest credit first. */
export function buildLedger(contributions: Contribution[]): LedgerRow[] {
  return buildLedgerChronological(contributions)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export function totalBalance(contributions: Contribution[]) {
  const chrono = buildLedgerChronological(contributions)
  return chrono.length ? chrono[chrono.length - 1].balanceAfter : 0
}

export function employeeShareTotal(contributions: Contribution[]) {
  return contributions.filter((c) => c.status !== 'missing').reduce((sum, c) => sum + c.employeeShare, 0)
}

export function employerShareTotal(contributions: Contribution[]) {
  return contributions.filter((c) => c.status !== 'missing').reduce((sum, c) => sum + c.employerEpfShare, 0)
}

export function interestTotal(contributions: Contribution[]) {
  return totalBalance(contributions) - employeeShareTotal(contributions) - employerShareTotal(contributions)
}

export function pensionShareTotal(contributions: Contribution[]) {
  return contributions.filter((c) => c.status !== 'missing').reduce((sum, c) => sum + c.epsShare, 0)
}

/** Total EPF membership in whole years, across every employer under the one UAN. */
export function serviceYears() {
  const first = employments.map((e) => e.joined).sort()[0]
  return Math.floor(daysBetween(first, TODAY) / 365.25)
}

export interface WithdrawalReason {
  key: string
  title: string
  blurb: string
  formNumber: string
  rule: string
  minServiceYears: number
  cap: number
  eligible: boolean
  blockedBecause?: string
}

/** Eligibility and caps are computed from the record, not asserted. */
export function withdrawalReasons(contributions: Contribution[]): WithdrawalReason[] {
  const current = employments.find((e) => e.current)!
  const wage = current.monthlyWage
  const balance = totalBalance(contributions)
  const share = employeeShareTotal(contributions)
  const years = serviceYears()

  return [
    {
      key: 'medical',
      title: 'Pay for medical treatment',
      blurb: 'For you, your spouse, children or parents.',
      formNumber: 'Form 31',
      rule: 'Six months of your wages, or your own share of the balance — whichever is lower. No minimum service.',
      minServiceYears: 0,
      cap: Math.min(wage * 6, share),
      eligible: true,
    },
    {
      key: 'home',
      title: 'Buy or build a home',
      blurb: 'Purchase, construction, or repaying a home loan.',
      formNumber: 'Form 31',
      rule: 'Up to 90% of your total balance, after 5 years of EPF membership.',
      minServiceYears: 5,
      cap: Math.round(balance * 0.9),
      eligible: years >= 5,
      blockedBecause: years >= 5 ? undefined : `You have ${years} years of membership. This needs 5.`,
    },
    {
      key: 'education',
      title: 'Education or marriage',
      blurb: 'Your own, or for your children or siblings.',
      formNumber: 'Form 31',
      rule: 'Half of your own share of the balance, after 7 years of EPF membership.',
      minServiceYears: 7,
      cap: Math.round(share * 0.5),
      eligible: years >= 7,
      blockedBecause: years >= 7 ? undefined : `You have ${years} years of membership. This needs 7.`,
    },
    {
      key: 'left-job',
      title: 'I have left my job',
      blurb: 'Close the account and take the full balance.',
      formNumber: 'Form 19',
      rule: 'The full balance, two months after your last working day.',
      minServiceYears: 0,
      cap: balance,
      eligible: false,
      blockedBecause:
        'Your record shows you are still working at Northline Logistics. Your employer marks an exit date when you leave.',
    },
  ]
}

export interface PreflightIssue {
  key: string
  severity: 'blocker' | 'warning'
  title: string
  detail: string
  fixLabel: string
}

/** The pre-submit check. Everything a claim can be rejected for weeks later is knowable now. */
export function preflight(kyc: KycItem[]): PreflightIssue[] {
  const issues: PreflightIssue[] = []
  const bank = kyc.find((k) => k.key === 'bank')
  if (bank && bank.status !== 'verified') {
    issues.push({
      key: 'bank',
      severity: 'blocker',
      title: 'Your bank IFSC will not accept this payment',
      detail: bank.problem ?? 'Bank details need attention.',
      fixLabel: bank.fixLabel ?? 'Fix bank details',
    })
  }
  const nominee = kyc.find((k) => k.key === 'nominee')
  if (nominee && nominee.status !== 'verified') {
    issues.push({
      key: 'nominee',
      severity: 'warning',
      title: 'No nominee on record',
      detail: nominee.problem ?? 'Add a nominee.',
      fixLabel: nominee.fixLabel ?? 'Add a nominee',
    })
  }
  const aadhaar = kyc.find((k) => k.key === 'aadhaar')
  if (aadhaar && aadhaar.status !== 'verified') {
    issues.push({
      key: 'aadhaar',
      severity: 'blocker',
      title: 'Aadhaar is not verified',
      detail: 'Claims cannot be settled until Aadhaar is verified against your UAN.',
      fixLabel: 'Verify Aadhaar',
    })
  }
  return issues
}

export function activeClaim(claims: Claim[]) {
  return claims.find((c) => !c.settledOn)
}

export function currentStage(claim: Claim) {
  return claim.stages.find((s) => s.state === 'current')
}

export function claimProgress(claim: Claim) {
  const done = claim.stages.filter((s) => s.state === 'done').length
  return Math.round((done / claim.stages.length) * 100)
}
