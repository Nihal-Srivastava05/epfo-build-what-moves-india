/**
 * Trimmed port of src/lib/types.ts — member + pensioner entities only.
 * Employer-only shapes (Approval, RosterEntry, Challan, GovNotice) are dropped.
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
  memberId: string
  joined: string
  exited?: string
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
  holder?: Holder
}

export type ClaimKind = 'withdraw-partial' | 'withdraw-final' | 'transfer' | 'pension' | 'edli'

export interface Claim {
  id: string
  personId: string
  kind: ClaimKind
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
  problem?: string
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

export type NotificationChannel = 'sms' | 'email' | 'call' | 'inbox'

export interface AppNotification {
  id: string
  personId: string
  channel: NotificationChannel
  sentAt: string
  title: string
  body: string
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
  seq: number
}
