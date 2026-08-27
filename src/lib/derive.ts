import {
  INTEREST_RATE,
  TODAY,
  employmentById,
  employments,
  establishmentByCode,
} from '@/lib/mock/db'
import type { Claim, Contribution, KycItem, LedgerRow } from '@/lib/types'
import { daysBetween, financialYear } from '@/lib/format'

/**
 * Builds the passbook the way EPFO actually computes it: interest accrues on the
 * monthly running balance and is credited at the close of each financial year.
 * Doing the arithmetic here means no screen ever asks the user to derive it.
 */
function buildLedgerChronological(contributions: Contribution[]): LedgerRow[] {
  const credited = contributions
    .filter((c) => c.status !== 'missing')
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))

  const rows: LedgerRow[] = []
  let balance = 0
  let fyBalanceMonths = 0
  let fyMonthCount = 0
  let currentFy = credited.length ? financialYear(credited[0].month) : ''

  const closeFy = (fy: string, lastMonth: string) => {
    if (!fyMonthCount) return
    const interest = Math.round((fyBalanceMonths / 12) * INTEREST_RATE)
    if (interest <= 0) return
    balance += interest
    const [y] = lastMonth.split('-').map(Number)
    rows.push({
      id: `int-${fy}`,
      date: `${y}-03-31`,
      estCode: '',
      particulars: `Interest credited for ${fy}`,
      employee: interest,
      employer: 0,
      eps: 0,
      kind: 'interest',
      balanceAfter: balance,
    })
    fyBalanceMonths = 0
    fyMonthCount = 0
  }

  for (const c of credited) {
    const fy = financialYear(c.month)
    if (fy !== currentFy) {
      closeFy(currentFy, c.month)
      currentFy = fy
    }
    balance += c.employeeShare + c.employerEpfShare
    fyBalanceMonths += balance
    fyMonthCount += 1
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

  return rows
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
