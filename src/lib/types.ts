/**
 * One relational record, not per-screen fixtures.
 *
 * The whole argument of the redesign is that member and employer are two views
 * of the same object. That only holds if there is genuinely one object, so every
 * screen in this app reads from the graph below and nothing keeps its own copy.
 */

/** Who is holding a pending item up. Every waiting object must name one. */
export type Holder = 'you' | 'employer' | 'epfo' | 'bank'

export type Persona = 'member' | 'employer' | 'pensioner'

export type Gender = 'female' | 'male' | 'other'

export interface Person {
  id: string
  name: string
  uan: string
  dob: string
  gender: Gender
  /** EPFO records one relation on every member. Which one it is, is stated. */
  relationName: string
  relationKind: 'father' | 'mother' | 'spouse'
  aadhaarMasked: string
  panMasked: string
  mobileMasked: string
  email: string
  roles: Persona[]
}

export interface Establishment {
  code: string
  name: string
  hrName: string
  hrPhoneMasked: string
  city: string
  coveredSince: string
}

export interface Employment {
  id: string
  personId: string
  estCode: string
  /**
   * The PF account number this employer opened for you: establishment code plus
   * a member serial. Every employer issues its own, which is exactly what the
   * UAN exists to tie together — see the `uan` glossary entry.
   */
  memberId: string
  joined: string
  exited?: string
  /** Monthly EPF wage. Contributions are computed from this, never stored twice. */
  monthlyWage: number
  current: boolean
}

export type ContributionStatus = 'credited' | 'missing' | 'late'

export interface Contribution {
  id: string
  employmentId: string
  /** ISO month, e.g. "2026-06". */
  month: string
  employeeShare: number
  employerEpfShare: number
  epsShare: number
  status: ContributionStatus
  creditedOn?: string
  /** Set while the month is missing: who must act, and since when. */
  holder?: Holder
  holderSince?: string
}

export type ClaimStageState = 'done' | 'current' | 'todo'

export interface ClaimStage {
  key: string
  label: string
  labelHi?: string
  state: ClaimStageState
  on?: string
  /** Who this stage waits on while it is current. */
  holder?: Holder
}

export type ClaimKind = 'withdraw-partial' | 'withdraw-final' | 'transfer' | 'pension' | 'edli'

export interface Claim {
  id: string
  personId: string
  kind: ClaimKind
  /** Plain-language reason. The form number is derived, never chosen by the user. */
  reasonKey: string
  formNumber: string
  amount: number
  filedOn: string
  expectedBy?: string
  settledOn?: string
  stages: ClaimStage[]
  bankLast4: string
  estCode: string
}

export type KycStatus = 'verified' | 'attention' | 'pending'

export interface KycItem {
  key: 'aadhaar' | 'pan' | 'bank' | 'mobile' | 'nominee' | 'exit'
  label: string
  value: string
  status: KycStatus
  holder: Holder
  since?: string
  /** Stated only when status !== 'verified': what exactly is wrong. */
  problem?: string
  /** And what fixes it. A problem without a fix is a dead end. */
  fixLabel?: string
  correctedValue?: string
}

export interface Pensioner {
  personId: string
  ppo: string
  monthlyAmount: number
  nextCreditOn: string
  bankName: string
  bankLast4: string
  lifeCertificateValidTill: string
  lastSubmittedOn: string
  familyPensionNominee: string
  scheme: string
}

export interface PensionPayment {
  id: string
  month: string
  amount: number
  creditedOn: string
  mode: string
  reference: string
}

export interface Challan {
  trrn: string
  estCode: string
  month: string
  epf: number
  eps: number
  edli: number
  admin: number
  total: number
  paidOn: string
  employees: number
}

export type ApprovalKind = 'claim' | 'kyc' | 'transfer' | 'exit' | 'mismatch'

export interface Approval {
  id: string
  estCode: string
  kind: ApprovalKind
  personName: string
  uan: string
  detail: string
  amount?: number
  waitingSince: string
  /** Links back to the member-side object this is the other half of. */
  claimId?: string
}

export interface RosterEntry {
  uan: string
  name: string
  joined: string
  monthlyWage: number
  kyc: KycStatus
  exited?: string
}

export type NotificationChannel = 'sms' | 'email' | 'call' | 'inbox'

export interface AppNotification {
  id: string
  personId: string
  channel: NotificationChannel
  sentAt: string
  title: string
  body: string
  /** Everything EPFO actually sent is logged here. Anything absent is a scam. */
  official: true
  aboutType?: 'claim' | 'contribution' | 'kyc' | 'return' | 'pension'
  aboutId?: string
}

export type GrievanceRung = 'office' | 'regional' | 'cpgrams'

export interface Grievance {
  id: string
  personId: string
  subject: string
  detail: string
  raisedOn: string
  aboutType?: 'claim' | 'contribution' | 'kyc' | 'return' | 'pension'
  aboutId?: string
  rung: GrievanceRung
  escalatesOn: string
  status: 'open' | 'resolved'
  resolution?: string
}

export interface LedgerRow {
  id: string
  date: string
  month?: string
  estCode: string
  particulars: string
  employee: number
  employer: number
  eps: number
  kind: 'contribution' | 'interest' | 'transfer-in' | 'withdrawal'
  balanceAfter: number
  /**
   * Position in the accumulation, which is not the display order: a month is
   * credited the following month, so March's row carries an April date and
   * sorts above the interest that was added after it. Anything asking "what did
   * this period close on" has to follow this, not the dates on screen.
   */
  seq: number
}
