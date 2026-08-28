import { establishmentByCode } from '@/lib/mock/db'
import type { LedgerRow } from '@/lib/types'
import { financialYear, fmtMonth } from '@/lib/format'

/**
 * The passbook's own rows, rearranged for plotting. Nothing here re-derives a
 * figure: every rupee comes from the same ledger the table renders, so the
 * chart view and the table view can never disagree.
 */

export type Grain = 'month' | 'fy'

export interface Bucket {
  key: string
  /** Full period name, for tooltips and screen readers. */
  label: string
  /** Short axis form — several of these sit side by side. */
  tick: string
  employee: number
  employer: number
  interest: number
  total: number
  /** A month the employer never filed: the gap is the point, so it is drawn. */
  unfiled: boolean
}

/** The period a row belongs to. Interest is credited on 31 March, which
 *  `financialYear` correctly reads as the year that just closed. */
function periodOf(row: LedgerRow, grain: Grain) {
  const month = row.month ?? row.date.slice(0, 7)
  return grain === 'fy' ? financialYear(month) : month
}

function stepMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** Every period from first to last, gaps included — a time axis that skips the
 *  empty stretches would flatter the record by hiding them. */
function periodRange(first: string, last: string, grain: Grain) {
  const out: string[] = []
  if (grain === 'fy') {
    for (let y = Number(first.slice(0, 4)); y <= Number(last.slice(0, 4)); y++) {
      out.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`)
    }
    return out
  }
  let m = first
  for (let guard = 0; guard < 1200; guard++) {
    out.push(m)
    if (m === last) break
    m = stepMonth(m)
  }
  return out
}

function labelFor(key: string, grain: Grain, lang: 'en' | 'hi') {
  return grain === 'fy' ? `FY ${key}` : fmtMonth(key, lang)
}

/** "Jun ’26" — a month tick has to sit beside eleven others. */
export function monthTick(month: string, lang: 'en' | 'hi' = 'en') {
  return `${fmtMonth(month, lang).split(' ')[0]} ’${month.slice(2, 4)}`
}

function tickFor(key: string, grain: Grain, lang: 'en' | 'hi') {
  return grain === 'fy' ? key : monthTick(key, lang)
}

export function bucketLedger(
  rows: LedgerRow[],
  grain: Grain,
  unfiledMonths: string[],
  lang: 'en' | 'hi' = 'en',
): Bucket[] {
  if (rows.length === 0) return []

  const byKey = new Map<string, Bucket>()
  const blank = (key: string): Bucket => ({
    key,
    label: labelFor(key, grain, lang),
    tick: tickFor(key, grain, lang),
    employee: 0,
    employer: 0,
    interest: 0,
    total: 0,
    unfiled: false,
  })

  for (const r of rows) {
    const key = periodOf(r, grain)
    const b = byKey.get(key) ?? blank(key)
    // An interest row carries its amount in `employee`; it belongs to neither
    // party, so it is stacked as its own band rather than folded into a share.
    if (r.kind === 'interest') b.interest += r.employee
    else {
      b.employee += r.employee
      b.employer += r.employer
    }
    b.total = b.employee + b.employer + b.interest
    byKey.set(key, b)
  }

  const keys = Array.from(byKey.keys()).sort()
  const unfiled = new Set(grain === 'month' ? unfiledMonths : [])

  return periodRange(keys[0], keys[keys.length - 1], grain).map((key) => {
    const b = byKey.get(key) ?? blank(key)
    return unfiled.has(key) ? { ...b, unfiled: true } : b
  })
}

export interface TrendPoint {
  date: string
  balance: number
}

/** The running balance in credit order — the ledger's own `balanceAfter`, so
 *  the last point is the figure the table foots to. */
export function balanceTrend(rows: LedgerRow[]): TrendPoint[] {
  return rows
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((r) => ({ date: r.date, balance: r.balanceAfter }))
}

export interface EmployerTotal {
  code: string
  name: string
  employee: number
  employer: number
  total: number
  months: number
}

/** Interest is earned by the balance, not by a job, so it is left out here and
 *  said so on the card rather than silently apportioned. */
export function employerTotals(rows: LedgerRow[]): EmployerTotal[] {
  const byCode = new Map<string, EmployerTotal>()
  for (const r of rows) {
    if (r.kind === 'interest' || !r.estCode) continue
    const t = byCode.get(r.estCode) ?? {
      code: r.estCode,
      name: establishmentByCode(r.estCode).name,
      employee: 0,
      employer: 0,
      total: 0,
      months: 0,
    }
    t.employee += r.employee
    t.employer += r.employer
    t.total = t.employee + t.employer
    t.months += 1
    byCode.set(r.estCode, t)
  }
  return Array.from(byCode.values()).sort((a, b) => b.total - a.total)
}
