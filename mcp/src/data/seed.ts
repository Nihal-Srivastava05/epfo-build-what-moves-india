/**
 * Trimmed port of src/lib/mock/db.ts — member (Priya) + pensioner (Ram) rows
 * only. Employer-only data (roster, approvals, challans, gov notices) is
 * dropped since this server exposes no employer tools.
 *
 * Constants and generation logic are kept verbatim so every figure this
 * server returns matches the live Vite app exactly.
 */
import type {
  Claim,
  Contribution,
  Employment,
  Establishment,
  KycItem,
  AppNotification,
  PensionPayment,
  Person,
  Pensioner,
} from './types.js'

/**
 * The demo runs on a fixed "today" so every relative date ("9 days",
 * "expires in 94 days") stays true no matter when the server is run.
 */
export const TODAY = '2026-08-28'

export const EPF_RATE = 0.12
export const EPS_RATE = 0.0833
export const EPS_WAGE_CEILING = 15000
export const EDLI_RATE = 0.005
export const ADMIN_RATE = 0.005
export const INTEREST_RATE = 0.0825
export const RETIREMENT_AGE = 58

export const DEMO_UAN = '100234567890'
export const DEMO_PPO = 'MH/PUN/00123456'
export const DEMO_OTP = '284116'
export const PRIYA_PERSON_ID = 'p-priya'
export const RAM_PERSON_ID = 'p-ram'

export const people: Person[] = [
  {
    id: 'p-priya',
    name: 'Priya Sharma',
    uan: '100234567890',
    dob: '1994-03-11',
    gender: 'female',
    relationName: 'Anil Sharma',
    relationKind: 'father',
    aadhaarMasked: 'XXXX XXXX 4412',
    panMasked: 'ABXPS****K',
    mobileMasked: '+91 98XXX XX210',
    email: 'p****a@example.com',
    roles: ['member'],
  },
  {
    id: 'p-ram',
    name: 'Ram Prasad Verma',
    uan: '100119988774',
    dob: '1961-07-02',
    gender: 'male',
    relationName: 'Sushila Verma',
    relationKind: 'spouse',
    aadhaarMasked: 'XXXX XXXX 8830',
    panMasked: 'AKRPV****M',
    mobileMasked: '+91 94XXX XX776',
    email: 'r****a@example.com',
    roles: ['pensioner'],
  },
]

export const establishments: Establishment[] = [
  {
    code: 'MHBAN0045123000',
    name: 'Northline Logistics Pvt Ltd',
    hrName: 'Deepa Iyer',
    hrPhoneMasked: '+91 90XXX XX004',
    city: 'Pune, Maharashtra',
    coveredSince: '2016-06-01',
  },
  {
    code: 'MHPUN0031876000',
    name: 'Meridian Systems Pvt Ltd',
    hrName: 'Anand Rao',
    hrPhoneMasked: '+91 98XXX XX551',
    city: 'Pune, Maharashtra',
    coveredSince: '2012-04-01',
  },
  {
    code: 'KNBAN0022145000',
    name: 'Sunrise Retail Pvt Ltd',
    hrName: 'Latha Menon',
    hrPhoneMasked: '+91 99XXX XX318',
    city: 'Bengaluru, Karnataka',
    coveredSince: '2009-09-01',
  },
]

export const employments: Employment[] = [
  {
    id: 'e-sunrise',
    personId: 'p-priya',
    estCode: 'KNBAN0022145000',
    memberId: 'KNBAN00221450000011238',
    joined: '2019-07-01',
    exited: '2022-03-31',
    monthlyWage: 28000,
    current: false,
  },
  {
    id: 'e-meridian',
    personId: 'p-priya',
    estCode: 'MHPUN0031876000',
    memberId: 'MHPUN00318760000004417',
    joined: '2022-04-01',
    exited: '2024-03-31',
    monthlyWage: 41000,
    current: false,
  },
  {
    id: 'e-northline',
    personId: 'p-priya',
    estCode: 'MHBAN0045123000',
    memberId: 'MHBAN00451230000000142',
    joined: '2024-04-01',
    monthlyWage: 52000,
    current: true,
  },
]

/** The split every tool quotes, computed once, never typed by hand. */
export function splitContribution(wage: number) {
  const employee = Math.round(wage * EPF_RATE)
  const eps = Math.round(Math.min(wage, EPS_WAGE_CEILING) * EPS_RATE)
  const employerEpf = employee - eps
  return { employee, eps, employerEpf }
}

function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  const [fy, fm] = from.slice(0, 7).split('-').map(Number)
  const [ty, tm] = to.slice(0, 7).split('-').map(Number)
  let y = fy
  let m = fm
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

/** The one month Northline never filed. */
export const MISSING_MONTH = '2026-06'
export const MISSING_MONTH_EMPLOYMENT = 'e-northline'
export const MISSING_MONTH_DUE = '2026-07-15'

function buildContributions(): Contribution[] {
  const rows: Contribution[] = []
  for (const emp of employments) {
    const { employee, eps, employerEpf } = splitContribution(emp.monthlyWage)
    const last = emp.exited ? emp.exited.slice(0, 7) : '2026-07'
    for (const month of monthsBetween(emp.joined, last)) {
      const missing = emp.id === MISSING_MONTH_EMPLOYMENT && month === MISSING_MONTH
      const [y, m] = month.split('-').map(Number)
      const creditMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
      rows.push({
        id: `c-${emp.id}-${month}`,
        employmentId: emp.id,
        month,
        employeeShare: employee,
        employerEpfShare: employerEpf,
        epsShare: eps,
        status: missing ? 'missing' : 'credited',
        creditedOn: missing ? undefined : `${creditMonth}-12`,
        holder: missing ? 'employer' : undefined,
        holderSince: missing ? MISSING_MONTH_DUE : undefined,
      })
    }
  }
  return rows
}

export const contributions: Contribution[] = buildContributions()

/** Priya's live claim, plus one settled transfer. */
export const claims: Claim[] = [
  {
    id: 'CLM-2026-0839',
    personId: 'p-priya',
    kind: 'withdraw-partial',
    reasonKey: 'medical',
    formNumber: 'Form 31',
    amount: 65000,
    filedOn: '2026-08-19',
    expectedBy: '2026-09-02',
    bankLast4: '4471',
    estCode: 'MHBAN0045123000',
    stages: [
      { key: 'filed', label: 'Filed', labelHi: 'दायर किया गया', state: 'done', on: '2026-08-19' },
      {
        key: 'employer',
        label: 'Employer attestation',
        labelHi: 'नियोक्ता का सत्यापन',
        state: 'current',
        holder: 'employer',
        on: '2026-08-19',
      },
      { key: 'epfo', label: 'EPFO verification', labelHi: 'ईपीएफ़ओ जाँच', state: 'todo', holder: 'epfo' },
      { key: 'credited', label: 'Credited to your bank', labelHi: 'आपके बैंक में जमा', state: 'todo', holder: 'bank' },
    ],
  },
  {
    id: 'CLM-2024-1122',
    personId: 'p-priya',
    kind: 'transfer',
    reasonKey: 'job-change',
    formNumber: 'Form 13',
    amount: 386670,
    filedOn: '2024-04-08',
    settledOn: '2024-04-29',
    bankLast4: '4471',
    estCode: 'MHBAN0045123000',
    stages: [
      { key: 'filed', label: 'Filed', labelHi: 'दायर किया गया', state: 'done', on: '2024-04-08' },
      { key: 'employer', label: 'Employer attestation', labelHi: 'नियोक्ता का सत्यापन', state: 'done', on: '2024-04-15' },
      { key: 'epfo', label: 'EPFO verification', labelHi: 'ईपीएफ़ओ जाँच', state: 'done', on: '2024-04-24' },
      { key: 'credited', label: 'Transferred to current account', labelHi: 'वर्तमान खाते में स्थानांतरित', state: 'done', on: '2024-04-29' },
    ],
  },
]

/** Two things are deliberately wrong with Priya's KYC — knowable at rest. */
export const kycItems: KycItem[] = [
  { key: 'aadhaar', label: 'Aadhaar', value: 'XXXX XXXX 4412', status: 'verified', holder: 'epfo' },
  { key: 'pan', label: 'PAN', value: 'ABXPS****K', status: 'verified', holder: 'epfo' },
  {
    key: 'bank',
    label: 'Bank account',
    value: 'Pragati National Bank ****4471 · PRGB0234500',
    status: 'attention',
    holder: 'you',
    since: '2026-05-04',
    problem:
      'Your branch merged in April 2026 and its IFSC changed. Payments to PRGB0234500 will be returned by the bank.',
    fixLabel: 'Use the new IFSC',
    correctedValue: 'Pragati National Bank ****4471 · PRGB0234501',
  },
  { key: 'mobile', label: 'Mobile number', value: '+91 98XXX XX210', status: 'verified', holder: 'you' },
  {
    key: 'nominee',
    label: 'Nominee',
    value: 'Not added',
    status: 'attention',
    holder: 'you',
    since: '2024-04-01',
    problem: 'Without a nominee, your family has to prove their claim in court if anything happens to you.',
    fixLabel: 'Add a nominee',
    correctedValue: 'Anil Sharma (father) · 100%',
  },
  { key: 'exit', label: 'Exit dates', value: 'All past jobs marked', status: 'verified', holder: 'employer' },
]

export const pensioner: Pensioner = {
  personId: 'p-ram',
  ppo: 'MH/PUN/00123456',
  monthlyAmount: 8450,
  nextCreditOn: '2026-09-01',
  bankName: 'Sahyadri Grameen Bank',
  bankLast4: '9038',
  lifeCertificateValidTill: '2026-11-30',
  lastSubmittedOn: '2025-11-24',
  familyPensionNominee: 'Sushila Verma (spouse)',
  scheme: 'Employees’ Pension Scheme 1995',
}

export const pensionPayments: PensionPayment[] = [
  { id: 'pp-2026-08', month: '2026-08', amount: 8450, creditedOn: '2026-08-01', mode: 'NEFT', reference: 'CPPS8842190' },
  { id: 'pp-2026-07', month: '2026-07', amount: 8450, creditedOn: '2026-07-01', mode: 'NEFT', reference: 'CPPS8730114' },
  { id: 'pp-2026-06', month: '2026-06', amount: 8450, creditedOn: '2026-06-01', mode: 'NEFT', reference: 'CPPS8619073' },
  { id: 'pp-2026-05', month: '2026-05', amount: 8450, creditedOn: '2026-05-02', mode: 'NEFT', reference: 'CPPS8508855' },
  { id: 'pp-2026-04', month: '2026-04', amount: 8450, creditedOn: '2026-04-01', mode: 'NEFT', reference: 'CPPS8397412' },
  { id: 'pp-2026-03', month: '2026-03', amount: 8200, creditedOn: '2026-03-02', mode: 'NEFT', reference: 'CPPS8286330' },
]

/** The verification log behind "Did EPFO really send this?". */
export const notifications: AppNotification[] = [
  {
    id: 'n-1',
    personId: 'p-priya',
    channel: 'sms',
    sentAt: '2026-08-19T14:22:00+05:30',
    title: 'Claim CLM-2026-0839 received',
    body: 'Your medical advance claim for ₹65,000 was received on 19 Aug 2026. It is with your employer for attestation.',
    official: true,
    aboutType: 'claim',
    aboutId: 'CLM-2026-0839',
  },
  {
    id: 'n-2',
    personId: 'p-priya',
    channel: 'inbox',
    sentAt: '2026-07-16T09:05:00+05:30',
    title: 'June 2026 contribution not received',
    body: 'Northline Logistics Pvt Ltd has not filed the June 2026 return. We have written to them. No action is needed from you.',
    official: true,
    aboutType: 'contribution',
    aboutId: 'c-e-northline-2026-06',
  },
  {
    id: 'n-3',
    personId: 'p-priya',
    channel: 'email',
    sentAt: '2026-05-04T18:40:00+05:30',
    title: 'Your bank branch IFSC has changed',
    body: 'Your branch merged on 30 Apr 2026. Update the IFSC on your account before filing any claim.',
    official: true,
    aboutType: 'kyc',
    aboutId: 'bank',
  },
  {
    id: 'n-4',
    personId: 'p-ram',
    channel: 'sms',
    sentAt: '2026-08-01T08:10:00+05:30',
    title: 'Pension credited for August 2026',
    body: '₹8,450 was credited to your Sahyadri Grameen Bank account ending 9038 on 01 Aug 2026.',
    official: true,
    aboutType: 'pension',
    aboutId: 'pp-2026-08',
  },
  {
    id: 'n-5',
    personId: 'p-ram',
    channel: 'inbox',
    sentAt: '2026-08-15T10:00:00+05:30',
    title: 'Life certificate due by 30 Nov 2026',
    body: 'Submit your life certificate before 30 Nov 2026 to keep your pension running. Three ways to do it, all free.',
    official: true,
    aboutType: 'pension',
  },
]

/** The three free ways to submit a life certificate — ported from
 * src/routes/pensioner/life-certificate.tsx, UI-only fields dropped. */
export const LIFE_CERTIFICATE_ROUTES = [
  {
    key: 'face',
    title: 'Face scan on this phone',
    time: 'About 2 minutes, right now',
    detail:
      'Look at the camera and blink when asked. Works on any Android phone with a front camera. Nothing is posted and nobody visits.',
  },
  {
    key: 'bank',
    title: 'At your bank or a common service centre',
    time: 'About 30 minutes, plus the journey',
    detail:
      'Carry your PPO number and Aadhaar. Any branch of any bank can do it, not only the one your pension is paid into.',
  },
  {
    key: 'post',
    title: 'A postman comes to you',
    time: 'Booked today, visit within 3 days',
    detail: 'An India Post agent visits your home with a fingerprint device. Free of charge. Best if travelling is difficult.',
  },
] as const

export function personById(id: string) {
  return people.find((p) => p.id === id)
}

export function establishmentByCode(code: string) {
  return establishments.find((e) => e.code === code)
}

export function employmentById(id: string) {
  return employments.find((e) => e.id === id)
}
