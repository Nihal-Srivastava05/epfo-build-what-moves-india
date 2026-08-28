import { TODAY } from '@/lib/mock/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

/** Indian digit grouping. Amounts are always shown, never left for the user to derive. */
export function inr(value: number, opts: { paise?: boolean } = {}) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: opts.paise ? 2 : 0,
    minimumFractionDigits: opts.paise ? 2 : 0,
  }).format(value)
}

export function rupees(value: number, opts: { paise?: boolean } = {}) {
  return `₹${inr(value, opts)}`
}

/**
 * Axis-tick money: lakh and crore, the units this audience counts in. Never for
 * a figure the user has to act on — those stay unabbreviated, in full digits.
 */
export function compactInr(value: number) {
  const abs = Math.abs(value)
  const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
  if (abs >= 10_000_000) return `₹${trim(value / 10_000_000)}Cr`
  if (abs >= 100_000) return `₹${trim(value / 100_000)}L`
  if (abs >= 1_000) return `₹${trim(value / 1_000)}K`
  return `₹${Math.round(value)}`
}

/** "14 Aug 2026" — never a bare numeric date, which reads differently by country. */
export function fmtDate(iso: string, lang: 'en' | 'hi' = 'en') {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  const months = lang === 'hi' ? MONTHS_HI : MONTHS
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/** "Jun 2026" for a "YYYY-MM" key. */
export function fmtMonth(month: string, lang: 'en' | 'hi' = 'en') {
  const [y, m] = month.split('-').map(Number)
  const months = lang === 'hi' ? MONTHS_HI : MONTHS
  return `${months[m - 1]} ${y}`
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

/**
 * Relative only inside 48 hours, per the content rules — beyond that a real
 * date is easier to act on than "3 weeks ago".
 */
export function fmtWhen(iso: string, lang: 'en' | 'hi' = 'en') {
  const days = daysBetween(iso)
  if (days === 0) return lang === 'hi' ? 'आज' : 'Today'
  if (days === 1) return lang === 'hi' ? 'कल' : 'Yesterday'
  return fmtDate(iso, lang)
}

/** "9 days" / "71 days" — the clock half of every waiting object. */
export function fmtDuration(sinceIso: string, lang: 'en' | 'hi' = 'en') {
  const days = daysBetween(sinceIso)
  if (lang === 'hi') return days === 1 ? '1 दिन' : `${days} दिन`
  return days === 1 ? '1 day' : `${days} days`
}

export function fmtUan(uan: string) {
  return uan.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function financialYear(month: string) {
  const [y, m] = month.split('-').map(Number)
  return m >= 4 ? `${y}-${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}-${String(y % 100).padStart(2, '0')}`
}
