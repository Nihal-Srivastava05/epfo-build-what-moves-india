import {
  Building2,
  CalendarClock,
  CircleUser,
  ClipboardCheck,
  FileText,
  HandCoins,
  Home,
  LifeBuoy,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import type { Persona } from '@/lib/types'
import type { StringKey } from '@/i18n/strings'

export interface NavItem {
  to: string
  labelKey: StringKey
  /** A shorter caption for the icon rail, where two lines read as clutter. */
  shortKey?: StringKey
  icon: typeof Home
  /** The old portal or form this replaces, shown as a grey "Was:" line. */
  was?: string
}

/**
 * Five or six destinations per persona. The thirty-portal directory collapses
 * to this: three entry points and one unauthenticated lookup.
 */
export const navByPersona: Record<Persona, NavItem[]> = {
  member: [
    { to: '/member', labelKey: 'nav.home', icon: Home, was: 'Member Home' },
    { to: '/member/passbook', labelKey: 'nav.passbook', icon: ScrollText, was: 'Member Passbook portal' },
    { to: '/member/claims', labelKey: 'nav.claims', icon: HandCoins, was: 'Online Claim Member' },
    { to: '/member/kyc', labelKey: 'nav.kyc', shortKey: 'nav.kyc.short', icon: ShieldCheck, was: 'Manage KYC' },
    { to: '/member/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'EPFiGMS' },
  ],
  employer: [
    { to: '/employer', labelKey: 'nav.dashboard', icon: Home, was: 'Employer e-Sewa' },
    { to: '/employer/return', labelKey: 'nav.return', shortKey: 'nav.return.short', icon: FileText, was: 'ECR upload' },
    { to: '/employer/employees', labelKey: 'nav.employees', icon: Users, was: 'Member profile' },
    { to: '/employer/approvals', labelKey: 'nav.approvals', icon: ClipboardCheck, was: 'Attestation queue' },
    { to: '/employer/challans', labelKey: 'nav.challans', icon: Receipt, was: 'Payment history' },
    { to: '/employer/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'Employer grievance' },
  ],
  pensioner: [
    { to: '/pensioner', labelKey: 'nav.home', icon: Home, was: 'Pensioners’ Portal' },
    { to: '/pensioner/payments', labelKey: 'nav.payments', icon: Wallet, was: 'Pension passbook' },
    { to: '/pensioner/life-certificate', labelKey: 'nav.lifeCertificate', shortKey: 'nav.lifeCertificate.short', icon: CalendarClock, was: 'Jeevan Pramaan' },
    { to: '/pensioner/details', labelKey: 'nav.details', shortKey: 'nav.details.short', icon: CircleUser, was: 'Know your PPO' },
    { to: '/pensioner/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'EPFiGMS' },
  ],
}

/**
 * The top bar names the screen you are on. Longest matching prefix wins, so
 * /member/claims/new is still "Claims" rather than falling through to nothing.
 */
export function navTitleKey(persona: Persona, pathname: string): StringKey | undefined {
  const match = navByPersona[persona]
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return match?.labelKey
}

/**
 * Screens that are not rail destinations, and the screen each one sits under.
 *
 * The path is not the hierarchy here: service history lives at /member/... but
 * belongs under the passbook, and a missing month is a hole in the ledger
 * rather than a page in its own right. Deriving the trail from URL segments
 * alone would put both at the top level and lose the way back.
 */
const SUBROUTES: { path: string; labelKey: StringKey; parent?: string }[] = [
  { path: '/member/service-history', labelKey: 'nav.serviceHistory', parent: '/member/passbook' },
  { path: '/member/gap/:month', labelKey: 'crumb.gap', parent: '/member/passbook' },
  { path: '/member/claims/new', labelKey: 'withdraw.title', parent: '/member/claims' },
  { path: '/member/claims/:claimId', labelKey: 'crumb.claim', parent: '/member/claims' },
  { path: '/member/calculators', labelKey: 'nav.calculators' },
  { path: '/profile', labelKey: 'nav.profile' },
  { path: '/notifications', labelKey: 'nav.notifications' },
  { path: '/settings', labelKey: 'nav.settings' },
  { path: '/grievance/new', labelKey: 'crumb.grievance' },
]

/** ':param' matches any one segment; everything else has to match literally. */
function pathMatches(pattern: string, pathname: string): boolean {
  const p = pattern.split('/')
  const a = pathname.split('/')
  if (p.length !== a.length) return false
  return p.every((seg, i) => seg.startsWith(':') || seg === a[i])
}

export interface Crumb {
  labelKey: StringKey
  /** Absent on the crumb for the page you are already on. */
  to?: string
}

/**
 * The trail from the persona's home to the current screen.
 *
 * Home returns its own single crumb rather than an empty trail: the trail sits
 * above the page content, so a screen without one starts higher than every
 * other screen and the whole page jumps as you navigate between them.
 */
export function breadcrumbsFor(persona: Persona, pathname: string): Crumb[] {
  const home = personaMeta[persona].home
  const clean = pathname.replace(/\/+$/, '') || '/'

  const navItems = navByPersona[persona]
  const homeLabel = navItems.find((i) => i.to === home)?.labelKey ?? 'crumb.home'
  if (clean === home) return [{ labelKey: homeLabel }]

  /** One step of the walk: what this path is called, and what it hangs off. */
  const resolve = (path: string): { labelKey: StringKey; parent?: string } | undefined => {
    const exact = navItems.find((i) => i.to === path)
    if (exact) return { labelKey: exact.labelKey, parent: path === home ? undefined : home }

    const sub = SUBROUTES.find((s) => pathMatches(s.path, path))
    if (sub) return { labelKey: sub.labelKey, parent: sub.parent ?? home }

    // An unlisted child of a rail destination still shows its section.
    const section = navItems
      .filter((i) => i.to !== home && path.startsWith(`${i.to}/`))
      .sort((a, b) => b.to.length - a.to.length)[0]
    if (section) return { labelKey: section.labelKey, parent: home }
    return undefined
  }

  const leaf = resolve(clean)
  /** An unrecognised path still gets a row, so the layout does not move. */
  if (!leaf) return [{ labelKey: homeLabel }]

  const trail: Crumb[] = [{ labelKey: leaf.labelKey }]
  let parent = leaf.parent
  // The chain is at most home -> section -> page; the guard is for a bad config.
  for (let i = 0; parent && parent !== home && i < 4; i += 1) {
    const step = resolve(parent)
    if (!step) break
    trail.unshift({ labelKey: step.labelKey, to: parent })
    parent = step.parent
  }
  trail.unshift({ labelKey: homeLabel, to: home })
  return trail
}

export const personaMeta: Record<Persona, { icon: typeof Home; home: string }> = {
  member: { icon: CircleUser, home: '/member' },
  employer: { icon: Building2, home: '/employer' },
  pensioner: { icon: HandCoins, home: '/pensioner' },
}
