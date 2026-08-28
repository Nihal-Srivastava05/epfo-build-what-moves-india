import type {
  Approval,
  Challan,
  Claim,
  Contribution,
  Employment,
  Establishment,
  KycItem,
  AppNotification,
  PensionPayment,
  Person,
  Pensioner,
  RosterEntry,
} from '@/lib/types'

/**
 * The demo runs on a fixed "today" so every relative date in the UI
 * ("9 days", "expires in 94 days") stays true no matter when it is opened.
 */
export const TODAY = '2026-08-28'

export const EPF_RATE = 0.12
/** EPS is 8.33% of wage, but capped at the statutory ceiling. */
export const EPS_RATE = 0.0833
export const EPS_WAGE_CEILING = 15000
export const EDLI_RATE = 0.005
export const ADMIN_RATE = 0.005
export const INTEREST_RATE = 0.0825

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
  {
    id: 'p-hr',
    name: 'Deepa Iyer',
    uan: '100455512399',
    dob: '1988-11-23',
    gender: 'female',
    relationName: 'Ravi Iyer',
    relationKind: 'father',
    aadhaarMasked: 'XXXX XXXX 1190',
    panMasked: 'BQTPI****R',
    mobileMasked: '+91 90XXX XX004',
    email: 'd****a@example.com',
    roles: ['employer'],
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
    joined: '2019-07-01',
    exited: '2022-03-31',
    monthlyWage: 28000,
    current: false,
  },
  {
    id: 'e-meridian',
    personId: 'p-priya',
    estCode: 'MHPUN0031876000',
    joined: '2022-04-01',
    exited: '2024-03-31',
    monthlyWage: 41000,
    current: false,
  },
  {
    id: 'e-northline',
    personId: 'p-priya',
    estCode: 'MHBAN0045123000',
    joined: '2024-04-01',
    monthlyWage: 52000,
    current: true,
  },
]

/** The split every screen quotes, computed once, never typed by hand. */
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

/** The one month Northline never filed. Both personas resolve to this constant. */
export const MISSING_MONTH = '2026-06'
export const MISSING_MONTH_EMPLOYMENT = 'e-northline'
/** Employers file by the 15th of the following month. */
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

/**
 * Priya's live claim. The 9-day wait on this object is the same 9 days the
 * employer sees at the top of their approval queue — one row, two screens.
 */
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
        label: 'Employer attestation', labelHi: 'नियोक्ता का सत्यापन',
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

/**
 * Two things are wrong with Priya's account on purpose. Both are knowable at
 * rest, which is the point: nothing here should first surface at submit time.
 */
export const kycItems: KycItem[] = [
  {
    key: 'aadhaar',
    label: 'Aadhaar',
    value: 'XXXX XXXX 4412',
    status: 'verified',
    holder: 'epfo',
  },
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
    problem:
      'Without a nominee, your family has to prove their claim in court if anything happens to you.',
    fixLabel: 'Add a nominee',
    correctedValue: 'Anil Sharma (father) · 100%',
  },
  {
    key: 'exit',
    label: 'Exit dates',
    value: 'All past jobs marked',
    status: 'verified',
    holder: 'employer',
  },
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


export const approvals: Approval[] = [
  {
    id: 'ap-1',
    estCode: 'MHBAN0045123000',
    kind: 'claim',
    personName: 'Priya Sharma',
    uan: '100234567890',
    detail: 'Medical advance — needs your attestation',
    amount: 65000,
    waitingSince: '2026-08-19',
    claimId: 'CLM-2026-0839',
  },
  {
    id: 'ap-2',
    estCode: 'MHBAN0045123000',
    kind: 'transfer',
    personName: 'Arjun Nair',
    uan: '100388120945',
    detail: 'Transfer-in from previous employer',
    waitingSince: '2026-08-23',
  },
  {
    id: 'ap-3',
    estCode: 'MHBAN0045123000',
    kind: 'kyc',
    personName: 'Fatima Sheikh',
    uan: '100411203877',
    detail: 'Bank account change — approve KYC',
    waitingSince: '2026-08-25',
  },
  {
    id: 'ap-4',
    estCode: 'MHBAN0045123000',
    kind: 'exit',
    personName: 'Ravi Kumar',
    uan: '100502993410',
    detail: 'Mark exit date — left on 20 Aug 2026',
    waitingSince: '2026-08-27',
  },
]

export const roster: RosterEntry[] = [
  { uan: '100234567890', name: 'Priya Sharma', joined: '2024-04-01', monthlyWage: 52000, kyc: 'attention' },
  { uan: '100388120945', name: 'Arjun Nair', joined: '2026-07-14', monthlyWage: 38000, kyc: 'pending' },
  { uan: '100411203877', name: 'Fatima Sheikh', joined: '2023-01-09', monthlyWage: 46000, kyc: 'attention' },
  { uan: '100502993410', name: 'Ravi Kumar', joined: '2021-08-02', monthlyWage: 33000, kyc: 'verified', exited: '2026-08-20' },
  { uan: '100633471028', name: 'Sneha Patil', joined: '2022-11-21', monthlyWage: 57000, kyc: 'verified' },
  { uan: '100744019265', name: 'Imran Qureshi', joined: '2025-02-17', monthlyWage: 29500, kyc: 'verified' },
  { uan: '100855630182', name: 'Anita Deshmukh', joined: '2020-06-15', monthlyWage: 61000, kyc: 'verified' },
  { uan: '100966284517', name: 'Vikram Joshi', joined: '2024-09-02', monthlyWage: 44000, kyc: 'verified' },
]

/**
 * Derived from the roster rather than typed in, so the employee count and the
 * totals on the employer's screens can never drift apart.
 */
function challanFor(month: string, trrn: string, paidOn: string): Challan {
  const active = roster.filter(
    (r) => r.joined.slice(0, 7) <= month && (!r.exited || r.exited.slice(0, 7) > month),
  )
  const totals = active.reduce(
    (acc, r) => {
      const s = splitContribution(r.monthlyWage)
      acc.epf += s.employee + s.employerEpf
      acc.eps += s.eps
      acc.edli += Math.round(Math.min(r.monthlyWage, EPS_WAGE_CEILING) * EDLI_RATE)
      acc.admin += Math.round(Math.min(r.monthlyWage, EPS_WAGE_CEILING) * ADMIN_RATE)
      return acc
    },
    { epf: 0, eps: 0, edli: 0, admin: 0 },
  )
  return {
    trrn,
    estCode: 'MHBAN0045123000',
    month,
    ...totals,
    total: totals.epf + totals.eps + totals.edli + totals.admin,
    paidOn,
    employees: active.length,
  }
}

export const challans: Challan[] = [
  challanFor('2026-07', '2026070012845', '2026-08-13'),
  challanFor('2026-05', '2026050012511', '2026-06-12'),
  challanFor('2026-04', '2026040012388', '2026-05-14'),
  challanFor('2026-03', '2026030012240', '2026-04-11'),
]

/**
 * The verification log behind "Did EPFO really send this?".
 * If a message is not in this list, EPFO did not send it.
 */
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

export function personById(id: string) {
  return people.find((p) => p.id === id)!
}

export function establishmentByCode(code: string) {
  return establishments.find((e) => e.code === code)!
}

export function employmentById(id: string) {
  return employments.find((e) => e.id === id)!
}
