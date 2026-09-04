/** Verbatim port of src/lib/format.ts (Hindi-only formatting helpers dropped
 * as unused — this server has no i18n layer). */
import { TODAY } from '../data/seed.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Indian digit grouping. Amounts are always shown, never left for the caller to derive. */
export function inr(value: number, opts: { paise?: boolean } = {}) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: opts.paise ? 2 : 0,
    minimumFractionDigits: opts.paise ? 2 : 0,
  }).format(value)
}

export function rupees(value: number, opts: { paise?: boolean } = {}) {
  return `₹${inr(value, opts)}`
}

/** Axis-tick money: lakh and crore, the units this audience counts in. */
export function compactInr(value: number) {
  const abs = Math.abs(value)
  const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
  if (abs >= 10_000_000) return `₹${trim(value / 10_000_000)}Cr`
  if (abs >= 100_000) return `₹${trim(value / 100_000)}L`
  if (abs >= 1_000) return `₹${trim(value / 1_000)}K`
  return `₹${Math.round(value)}`
}

/** "14 Aug 2026" — never a bare numeric date, which reads differently by country. */
export function fmtDate(iso: string) {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "Jun 2026" for a "YYYY-MM" key. */
export function fmtMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function fmtMonthLong(month: string) {
  const long = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const [y, m] = month.split('-').map(Number)
  return `${long[m - 1]} ${y}`
}

export function daysBetween(fromIso: string, toIso: string = TODAY) {
  const a = new Date(`${fromIso.slice(0, 10)}T00:00:00`).getTime()
  const b = new Date(`${toIso.slice(0, 10)}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Relative only inside 48 hours — beyond that a real date is easier to act on. */
export function fmtWhen(iso: string) {
  const days = daysBetween(iso)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return fmtDate(iso)
}

/** "9 days" / "71 days" — the clock half of every waiting object. */
export function fmtDuration(sinceIso: string) {
  const days = daysBetween(sinceIso)
  return days === 1 ? '1 day' : `${days} days`
}

/** "2 yr 9 mo" — one stint of service, in the units a service record is read in. */
export function fmtTenure(fromIso: string, toIso: string) {
  const from = new Date(`${fromIso.slice(0, 10)}T00:00:00`)
  const to = new Date(`${toIso.slice(0, 10)}T00:00:00`)
  to.setDate(to.getDate() + 1)
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  months = Math.max(0, months)

  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = [years ? `${years} yr` : '', rest ? `${rest} mo` : '']
  const joined = parts.filter(Boolean).join(' ')
  return joined || 'Less than a month'
}

export function fmtUan(uan: string) {
  return uan.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
}

/** "MH/BAN/0045123/000/0000142" — a PF account number in its five real parts. */
export function fmtMemberId(memberId: string) {
  const m = memberId.match(/^([A-Z]{2})([A-Z]{3})(\d{7})(\d{3})(\d{7})$/)
  return m ? `${m[1]}/${m[2]}/${m[3]}/${m[4]}/${m[5]}` : memberId
}

function isoDay(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoDay(d)
}

export function financialYear(month: string) {
  const [y, m] = month.split('-').map(Number)
  return m >= 4 ? `${y}-${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}-${String(y % 100).padStart(2, '0')}`
}
