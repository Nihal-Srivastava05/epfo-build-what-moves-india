import {
  INTEREST_RATE,
  TODAY,
  employmentById,
  employments,
  establishmentByCode,
} from '@/lib/mock/db'
import type { Claim, Contribution, KycItem, LedgerRow } from '@/lib/types'
import { daysBetween, financialYear } from '@/lib/format'

/** One month inside a year's interest working. */
export interface InterestMonth {
  month: string
  /** Contributions credited in the month — already inside `closing`. */
  added: number
  /** The balance the month closed on: what this month's interest is charged to. */
  closing: number
  /** This month's share of the year's credit. These sum to `InterestYear.interest` exactly. */
  interest: number
}

/** The whole working behind one "interest credited" row. */
export interface InterestYear {
  fy: string
  /** The rate declared for the year. One constant today; per-year when EPFO declares them. */
  rate: number
  creditedOn: string
  months: InterestMonth[]
  /** The twelve closing balances added together — the figure the rate is applied to. */
  sumOfBalances: number
  /** A real average over the months that had a balance, for the one-line summary. */
  averageBalance: number
  interest: number
}

/**
 * Splits a year's credit across its months so the parts add up to the whole.
 *
 * Each month's raw share is a fraction of a rupee, and rounding them one by one
 * leaves a total that disagrees with the credited figure by a rupee or two — on
 * a screen built to explain that figure, that is the one error worth ruling out.
 * The largest remainders take the leftover paise instead.
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
 * Builds the passbook the way EPFO actually computes it: interest accrues on the
 * monthly running balance and is credited at the close of each financial year.
 * Doing the arithmetic here means no screen ever asks the user to derive it.
 *
 * The ledger rows and the working behind each interest row come out of this one
 * pass. Computing the explanation separately would let it drift from the figure
 * it claims to explain, which is the whole complaint about the original row.
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
    rows.push({
      id: c.id,
      date: c.creditedOn ?? `${c.month}-15`,
      month: c.month,
      estCode: emp.estCode,
      particulars: establishmentByCode(emp.estCode).name,
      employee: c.employeeShare,
      employer: c.employerEpfShare,
      eps: c.epsShare,
      kind: 'contribution',
      balanceAfter: balance,
    })
  }

  return { rows, years }
}

function buildLedgerChronological(contributions: Contribution[]): LedgerRow[] {
  return accumulate(contributions).rows
}

/**
 * The working behind every credited interest row, keyed by financial year. Only
 * closed years appear — the year in progress has no declared rate yet, which is
 * itself the answer to "why does my interest stop last March?".
 */
export function interestBreakdown(contributions: Contribution[]): Map<string, InterestYear> {
  return new Map(accumulate(contributions).years.map((y) => [`int-${y.fy}`, y]))
}

/**
 * Display order: newest credit first. A month filed late therefore appears at
 * the top with the date it was actually credited, which is what a passbook does.
 */
export function buildLedger(contributions: Contribution[]): LedgerRow[] {
  return buildLedgerChronological(contributions)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/**
 * Taken from the chronological accumulation, not from the display order — a
 * late-filed month sorts to the top by credit date but carries an older
 * running balance, so reading the first display row would understate the total.
 */
export function totalBalance(contributions: Contribution[]) {
  const chrono = buildLedgerChronological(contributions)
  return chrono.length ? chrono[chrono.length - 1].balanceAfter : 0
}

export function employeeShareTotal(contributions: Contribution[]) {
  return contributions
    .filter((c) => c.status !== 'missing')
    .reduce((sum, c) => sum + c.employeeShare, 0)
}

export function employerShareTotal(contributions: Contribution[]) {
  return contributions
    .filter((c) => c.status !== 'missing')
    .reduce((sum, c) => sum + c.employerEpfShare, 0)
}

/**
 * Whatever the running balance holds over and above the two contribution
 * streams is accrued interest. Deriving it this way rather than re-summing the
 * interest rows means the three parts always add back to the total on screen.
 */
export function interestTotal(contributions: Contribution[]) {
  return (
    totalBalance(contributions) -
    employeeShareTotal(contributions) -
    employerShareTotal(contributions)
  )
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
  titleHi: string
  blurb: string
  blurbHi: string
  formNumber: string
  /** The statutory rule, stated on the card rather than left in a circular. */
  rule: string
  ruleHi: string
  minServiceYears: number
  cap: number
  eligible: boolean
  /** Present only when not eligible: why, in one sentence. */
  blockedBecause?: string
}

/**
 * Eligibility and caps are computed from the record and shown before the form
 * opens. The user picks a reason in plain language; the form number follows.
 */
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
      titleHi: 'इलाज का ख़र्च',
      blurb: 'For you, your spouse, children or parents.',
      blurbHi: 'आपके, जीवनसाथी, बच्चों या माता-पिता के लिए।',
      formNumber: 'Form 31',
      rule: 'Six months of your wages, or your own share of the balance — whichever is lower. No minimum service.',
      ruleHi: 'छह महीने का वेतन या आपका अपना हिस्सा — जो कम हो। कोई न्यूनतम सेवा नहीं।',
      minServiceYears: 0,
      cap: Math.min(wage * 6, share),
      eligible: true,
    },
    {
      key: 'home',
      title: 'Buy or build a home',
      titleHi: 'घर ख़रीदना या बनाना',
      blurb: 'Purchase, construction, or repaying a home loan.',
      blurbHi: 'ख़रीद, निर्माण या गृह ऋण चुकाने के लिए।',
      formNumber: 'Form 31',
      rule: 'Up to 90% of your total balance, after 5 years of EPF membership.',
      ruleHi: '5 वर्ष की सदस्यता के बाद, कुल शेष का 90% तक।',
      minServiceYears: 5,
      cap: Math.round(balance * 0.9),
      eligible: years >= 5,
      blockedBecause: years >= 5 ? undefined : `You have ${years} years of membership. This needs 5.`,
    },
    {
      key: 'education',
      title: 'Education or marriage',
      titleHi: 'शिक्षा या विवाह',
      blurb: 'Your own, or for your children or siblings.',
      blurbHi: 'आपका अपना, या बच्चों/भाई-बहन का।',
      formNumber: 'Form 31',
      rule: 'Half of your own share of the balance, after 7 years of EPF membership.',
      ruleHi: '7 वर्ष की सदस्यता के बाद, आपके अपने हिस्से का आधा।',
      minServiceYears: 7,
      cap: Math.round(share * 0.5),
      eligible: years >= 7,
      blockedBecause: years >= 7 ? undefined : `You have ${years} years of membership. This needs 7.`,
    },
    {
      key: 'left-job',
      title: 'I have left my job',
      titleHi: 'मैंने नौकरी छोड़ दी है',
      blurb: 'Close the account and take the full balance.',
      blurbHi: 'खाता बंद करके पूरी राशि लेना।',
      formNumber: 'Form 19',
      rule: 'The full balance, two months after your last working day.',
      ruleHi: 'अंतिम कार्यदिवस के दो महीने बाद, पूरी राशि।',
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
  fixHref: string
}

/**
 * The pre-submit check. Everything a claim can be rejected for weeks later is
 * knowable now, so it is checked now and named exactly.
 */
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
      fixHref: '/member/kyc',
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
      fixHref: '/member/kyc',
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
      fixHref: '/member/kyc',
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
