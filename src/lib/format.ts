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

/**
 * "2 yr 9 mo" — one stint of service, in the units a service record is read in.
 *
 * Both endpoints count, because EPFO reckons service by days worked and the
 * last day is one of them: 1 Jul 2019 to 31 Mar 2022 is 2 years 9 months, not
 * 2 years 8 months and 30 days. Getting this wrong understates every closed
 * stint by a month, which is the kind of error that decides a pension.
 */
export function fmtTenure(fromIso: string, toIso: string, lang: 'en' | 'hi' = 'en') {
  const from = new Date(`${fromIso.slice(0, 10)}T00:00:00`)
  const to = new Date(`${toIso.slice(0, 10)}T00:00:00`)
  to.setDate(to.getDate() + 1)
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  months = Math.max(0, months)

  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts =
    lang === 'hi'
      ? [years ? `${years} वर्ष` : '', rest ? `${rest} माह` : '']
      : [years ? `${years} yr` : '', rest ? `${rest} mo` : '']
  const joined = parts.filter(Boolean).join(' ')
  if (joined) return joined
  return lang === 'hi' ? '1 माह से कम' : 'Less than a month'
}

export function fmtUan(uan: string) {
  return uan.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
}

/**
 * "MH/BAN/0045123/000/0000142" — a PF account number in the five parts it is
 * actually made of: region, office, establishment, extension, member serial.
 * Twenty-two unbroken characters is a string nobody can read back over a phone.
 */
export function fmtMemberId(memberId: string) {
  const m = memberId.match(/^([A-Z]{2})([A-Z]{3})(\d{7})(\d{3})(\d{7})$/)
  return m ? `${m[1]}/${m[2]}/${m[3]}/${m[4]}/${m[5]}` : memberId
}

/**
 * Every date in this app is a local calendar day, so it has to be read back out
 * in local time. toISOString() would convert to UTC first, which lands on the
 * previous day everywhere east of Greenwich — IST included — and silently
 * returned a date one day early for the whole audience this is built for.
 */
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
