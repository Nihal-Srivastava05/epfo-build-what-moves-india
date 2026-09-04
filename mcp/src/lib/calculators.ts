/** Verbatim port of src/lib/calculators.ts. */
import { ADMIN_RATE, EDLI_RATE, EPS_WAGE_CEILING, INTEREST_RATE, splitContribution } from '../data/seed.js'

export interface ContributionBreakdown {
  wage: number
  employee: number
  employerEpf: number
  eps: number
  edli: number
  admin: number
  monthlyPfCredit: number
  employerOutgo: number
}

export function epfContribution(wage: number): ContributionBreakdown {
  const { employee, eps, employerEpf } = splitContribution(wage)
  const cappedWage = Math.min(wage, EPS_WAGE_CEILING)
  const edli = Math.round(cappedWage * EDLI_RATE)
  const admin = Math.round(cappedWage * ADMIN_RATE)
  return {
    wage,
    employee,
    employerEpf,
    eps,
    edli,
    admin,
    monthlyPfCredit: employee + employerEpf,
    employerOutgo: employerEpf + eps + edli + admin,
  }
}

export interface GrowthYear {
  year: number
  age?: number
  wage: number
  contribution: number
  interest: number
  balance: number
}

export interface GrowthProjection {
  years: GrowthYear[]
  finalBalance: number
  totalContributed: number
  totalInterest: number
}

/**
 * Interest accrues on the running monthly balance and is credited once a
 * year — the same mechanics as the passbook, just run forward instead of
 * back over real months. A flat annual increment stands in for a real wage
 * curve.
 */
export function epfGrowthProjection(opts: {
  currentBalance: number
  monthlyWage: number
  annualIncrementPct: number
  years: number
  startAge?: number
  interestRate?: number
  missedMonths?: number
}): GrowthProjection {
  const rate = opts.interestRate ?? INTEREST_RATE
  let balance = Math.max(0, opts.currentBalance)
  let wage = Math.max(0, opts.monthlyWage)
  let missedLeft = opts.missedMonths ?? 0
  const rows: GrowthYear[] = []
  let totalContributed = 0
  let totalInterest = 0

  for (let y = 1; y <= opts.years; y++) {
    const { employee, employerEpf } = splitContribution(wage)
    const monthly = employee + employerEpf
    let sumOfMonths = 0
    let yearContributed = 0
    for (let m = 0; m < 12; m++) {
      if (missedLeft > 0) {
        missedLeft--
      } else {
        balance += monthly
        yearContributed += monthly
      }
      sumOfMonths += balance
    }
    const interest = Math.round((sumOfMonths / 12) * rate)
    balance += interest
    totalContributed += yearContributed
    totalInterest += interest

    rows.push({
      year: y,
      age: opts.startAge ? opts.startAge + y : undefined,
      wage: Math.round(wage),
      contribution: yearContributed,
      interest,
      balance,
    })

    wage *= 1 + opts.annualIncrementPct / 100
  }

  return { years: rows, finalBalance: balance, totalContributed, totalInterest }
}

export interface PensionEstimate {
  pensionableSalary: number
  pensionableService: number
  bonusYears: number
  monthlyPension: number
  eligible: boolean
  minServiceYears: number
}

/** EPS-95's own formula: (pensionable salary × pensionable service) / 70. */
export function epsPensionEstimate(opts: { monthlyWage: number; yearsOfServiceAtRetirement: number }): PensionEstimate {
  const pensionableSalary = Math.min(opts.monthlyWage, EPS_WAGE_CEILING)
  const minServiceYears = 10
  const eligible = opts.yearsOfServiceAtRetirement >= minServiceYears
  const bonusYears = opts.yearsOfServiceAtRetirement >= 20 ? 2 : 0
  const pensionableService = Math.floor(opts.yearsOfServiceAtRetirement) + bonusYears
  const raw = Math.round((pensionableSalary * pensionableService) / 70)
  const monthlyPension = eligible ? Math.max(raw, 1000) : 0
  return { pensionableSalary, pensionableService, bonusYears, monthlyPension, eligible, minServiceYears }
}

export interface EdliEstimate {
  base: number
  bonus: number
  total: number
  minGuarantee: number
}

/** The 2021 formula: 35× average wage (capped) plus half the average balance (capped), floored at a minimum guarantee. */
export function edliEstimate(opts: { avgMonthlyWage: number; avgPfBalance: number }): EdliEstimate {
  const cappedWage = Math.min(opts.avgMonthlyWage, EPS_WAGE_CEILING)
  const base = Math.round(35 * cappedWage)
  const bonus = Math.round(Math.min(0.5 * opts.avgPfBalance, 175_000))
  const minGuarantee = 250_000
  const total = Math.max(base + bonus, minGuarantee)
  return { base, bonus, total, minGuarantee }
}
