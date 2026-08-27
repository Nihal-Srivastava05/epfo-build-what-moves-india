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
    { to: '/member/kyc', labelKey: 'nav.kyc', icon: ShieldCheck, was: 'Manage KYC' },
    { to: '/member/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'EPFiGMS' },
  ],
  employer: [
    { to: '/employer', labelKey: 'nav.dashboard', icon: Home, was: 'Employer e-Sewa' },
    { to: '/employer/return', labelKey: 'nav.return', icon: FileText, was: 'ECR upload' },
    { to: '/employer/employees', labelKey: 'nav.employees', icon: Users, was: 'Member profile' },
    { to: '/employer/approvals', labelKey: 'nav.approvals', icon: ClipboardCheck, was: 'Attestation queue' },
    { to: '/employer/challans', labelKey: 'nav.challans', icon: Receipt, was: 'Payment history' },
    { to: '/employer/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'Employer grievance' },
  ],
  pensioner: [
    { to: '/pensioner', labelKey: 'nav.home', icon: Home, was: 'Pensioners’ Portal' },
    { to: '/pensioner/payments', labelKey: 'nav.payments', icon: Wallet, was: 'Pension passbook' },
    { to: '/pensioner/life-certificate', labelKey: 'nav.lifeCertificate', icon: CalendarClock, was: 'Jeevan Pramaan' },
    { to: '/pensioner/details', labelKey: 'nav.details', icon: CircleUser, was: 'Know your PPO' },
    { to: '/pensioner/help', labelKey: 'nav.help', icon: LifeBuoy, was: 'EPFiGMS' },
  ],
}

export const personaMeta: Record<Persona, { icon: typeof Home; home: string }> = {
  member: { icon: CircleUser, home: '/member' },
  employer: { icon: Building2, home: '/employer' },
  pensioner: { icon: HandCoins, home: '/pensioner' },
}
