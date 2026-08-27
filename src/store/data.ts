import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  approvals as seedApprovals,
  challans as seedChallans,
  claims as seedClaims,
  contributions as seedContributions,
  kycItems as seedKyc,
  notifications as seedNotifications,
  pensioner as seedPensioner,
  pensionPayments as seedPayments,
  roster as seedRoster,
  splitContribution,
  ADMIN_RATE,
  EDLI_RATE,
  TODAY,
  MISSING_MONTH,
  employments,
} from '@/lib/mock/db'
import type {
  Approval,
  Challan,
  Claim,
  Contribution,
  Grievance,
  KycItem,
  AppNotification,
  PensionPayment,
  Pensioner,
  RosterEntry,
} from '@/lib/types'
import { addDays, fmtMonthLong, rupees } from '@/lib/format'

export interface ClaimDraft {
  reasonKey: string
  amount: number
  step: number
  startedAt: string
}

interface DataState {
  contributions: Contribution[]
  claims: Claim[]
  kyc: KycItem[]
  approvals: Approval[]
  challans: Challan[]
  notifications: AppNotification[]
  grievances: Grievance[]
  pensioner: Pensioner
  pensionPayments: PensionPayment[]
  roster: RosterEntry[]
  /** Autosaved so a dropped session never loses a half-filled form. */
  claimDraft: ClaimDraft | null
  employerNotified: string[]

  fileReturn: (month: string) => string
  approveClaim: (claimId: string) => void
  settleClaim: (claimId: string) => void
  fixKyc: (key: KycItem['key']) => void
  fileClaim: (input: { reasonKey: string; formNumber: string; amount: number }) => Claim
  notifyEmployer: (month: string) => void
  submitLifeCertificate: (routeLabel: string) => void
  raiseGrievance: (input: Omit<Grievance, 'id' | 'raisedOn' | 'rung' | 'escalatesOn' | 'status'>) => Grievance
  saveDraft: (draft: ClaimDraft | null) => void
  resetDemo: () => void
}

const seed = () => ({
  contributions: structuredClone(seedContributions),
  claims: structuredClone(seedClaims),
  kyc: structuredClone(seedKyc),
  approvals: structuredClone(seedApprovals),
  challans: structuredClone(seedChallans),
  notifications: structuredClone(seedNotifications),
  grievances: [] as Grievance[],
  pensioner: structuredClone(seedPensioner),
  pensionPayments: structuredClone(seedPayments),
  roster: structuredClone(seedRoster),
  claimDraft: null,
  employerNotified: [] as string[],
})

function notify(
  state: DataState,
  n: Omit<AppNotification, 'id' | 'sentAt' | 'official'>,
): AppNotification[] {
  return [
    {
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sentAt: new Date().toISOString(),
      official: true,
    },
    ...state.notifications,
  ]
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...seed(),

      /**
       * The single most important action in the prototype.
       * The employer files a month; the member's gap closes. One row, two views.
       */
      fileReturn: (month) => {
        const trrn = `2026${month.slice(5)}00${Math.floor(10000 + Math.random() * 89999)}`
        const state = get()
        const employees = state.roster.filter((r) => !r.exited).length
        const totals = state.roster
          .filter((r) => !r.exited)
          .reduce(
            (acc, r) => {
              const s = splitContribution(r.monthlyWage)
              acc.epf += s.employee + s.employerEpf
              acc.eps += s.eps
              acc.edli += Math.round(Math.min(r.monthlyWage, 15000) * EDLI_RATE)
              acc.admin += Math.round(Math.min(r.monthlyWage, 15000) * ADMIN_RATE)
              return acc
            },
            { epf: 0, eps: 0, edli: 0, admin: 0 },
          )

        set({
          contributions: state.contributions.map((c) =>
            c.month === month && c.status === 'missing'
              ? { ...c, status: 'late', creditedOn: TODAY, holder: undefined, holderSince: undefined }
              : c,
          ),
          challans: [
            {
              trrn,
              estCode: 'MHBAN0045123000',
              month,
              ...totals,
              total: totals.epf + totals.eps + totals.edli + totals.admin,
              paidOn: TODAY,
              employees,
            },
            ...state.challans,
          ],
          notifications: notify(state, {
            personId: 'p-priya',
            channel: 'sms',
            title: `${fmtMonthLong(month)} contribution credited`,
            body: `Northline Logistics Pvt Ltd filed the ${fmtMonthLong(month)} return. Your account has been updated.`,
            aboutType: 'contribution',
            aboutId: `c-e-northline-${month}`,
          }),
        })
        return trrn
      },

      /** The employer clears an attestation; the member's tracker moves a stage. */
      approveClaim: (claimId) => {
        const state = get()
        set({
          claims: state.claims.map((c) =>
            c.id !== claimId
              ? c
              : {
                  ...c,
                  stages: c.stages.map((s) =>
                    s.key === 'employer'
                      ? { ...s, state: 'done', on: TODAY }
                      : s.key === 'epfo'
                        ? { ...s, state: 'current', on: TODAY }
                        : s,
                  ),
                },
          ),
          approvals: state.approvals.filter((a) => a.claimId !== claimId),
          notifications: notify(state, {
            personId: 'p-priya',
            channel: 'sms',
            title: `Claim ${claimId} attested by your employer`,
            body: 'Your employer has attested the claim. It is now with EPFO for verification.',
            aboutType: 'claim',
            aboutId: claimId,
          }),
        })
      },

      settleClaim: (claimId) => {
        const state = get()
        set({
          claims: state.claims.map((c) =>
            c.id !== claimId
              ? c
              : {
                  ...c,
                  settledOn: TODAY,
                  stages: c.stages.map((s) => ({ ...s, state: 'done', on: s.on ?? TODAY })),
                },
          ),
          notifications: notify(state, {
            personId: 'p-priya',
            channel: 'sms',
            title: `Claim ${claimId} credited`,
            body: 'The amount has been credited to your bank account.',
            aboutType: 'claim',
            aboutId: claimId,
          }),
        })
      },

      fixKyc: (key) => {
        const state = get()
        set({
          kyc: state.kyc.map((k) =>
            k.key === key
              ? { ...k, status: 'verified', value: k.correctedValue ?? k.value, problem: undefined, fixLabel: undefined, holder: 'epfo' }
              : k,
          ),
          roster:
            key === 'bank'
              ? state.roster.map((r) => (r.uan === '100234567890' ? { ...r, kyc: 'verified' as const } : r))
              : state.roster,
        })
      },

      /**
       * Filing a claim writes into the employer's approval queue in the same
       * action — the member never has to tell their employer a claim exists.
       */
      fileClaim: ({ reasonKey, formNumber, amount }) => {
        const state = get()
        const id = `CLM-2026-${Math.floor(1000 + Math.random() * 8999)}`
        const bank = state.kyc.find((k) => k.key === 'bank')
        const claim: Claim = {
          id,
          personId: 'p-priya',
          kind: 'withdraw-partial',
          reasonKey,
          formNumber,
          amount,
          filedOn: TODAY,
          expectedBy: addDays(TODAY, 10),
          bankLast4: bank?.value.match(/\*{4}(\d{4})/)?.[1] ?? '4471',
          estCode: 'MHBAN0045123000',
          stages: [
            { key: 'filed', label: 'Filed', labelHi: 'दायर किया गया', state: 'done', on: TODAY },
            { key: 'employer', label: 'Employer attestation', labelHi: 'नियोक्ता का सत्यापन', state: 'current', holder: 'employer', on: TODAY },
            { key: 'epfo', label: 'EPFO verification', labelHi: 'ईपीएफ़ओ जाँच', state: 'todo', holder: 'epfo' },
            { key: 'credited', label: 'Credited to your bank', labelHi: 'आपके बैंक में जमा', state: 'todo', holder: 'bank' },
          ],
        }
        set({
          claims: [claim, ...state.claims],
          approvals: [
            {
              id: `ap-${id}`,
              estCode: 'MHBAN0045123000',
              kind: 'claim',
              personName: 'Priya Sharma',
              uan: '100234567890',
              detail: 'Withdrawal — needs your attestation',
              amount,
              waitingSince: TODAY,
              claimId: id,
            },
            ...state.approvals,
          ],
          claimDraft: null,
          notifications: notify(state, {
            personId: 'p-priya',
            channel: 'sms',
            title: `Claim ${id} received`,
            body: `Your claim for ${rupees(amount)} was received today. It is with your employer for attestation.`,
            aboutType: 'claim',
            aboutId: id,
          }),
        })
        return claim
      },

      /** The nudge travels along the relation. The member is never the messenger. */
      notifyEmployer: (month) => {
        const state = get()
        if (state.employerNotified.includes(month)) return
        set({
          employerNotified: [...state.employerNotified, month],
          notifications: notify(state, {
            personId: 'p-priya',
            channel: 'inbox',
            title: `We have written to Northline Logistics about ${fmtMonthLong(month)}`,
            body: 'EPFO has raised this with your employer directly. You do not need to call them. We will tell you when it is filed.',
            aboutType: 'contribution',
            aboutId: `c-e-northline-${month}`,
          }),
        })
      },

      submitLifeCertificate: (routeLabel) => {
        const state = get()
        set({
          pensioner: {
            ...state.pensioner,
            lastSubmittedOn: TODAY,
            lifeCertificateValidTill: addDays(TODAY, 365),
          },
          notifications: notify(state, {
            personId: 'p-ram',
            channel: 'sms',
            title: 'Life certificate accepted',
            body: `Submitted via ${routeLabel}. Your pension continues without interruption.`,
            aboutType: 'pension',
          }),
        })
      },

      raiseGrievance: (input) => {
        const state = get()
        const g: Grievance = {
          ...input,
          id: `GRV-2026-${Math.floor(100 + Math.random() * 899)}`,
          raisedOn: TODAY,
          rung: 'office',
          escalatesOn: addDays(TODAY, 15),
          status: 'open',
        }
        set({ grievances: [g, ...state.grievances] })
        return g
      },

      saveDraft: (claimDraft) => set({ claimDraft }),

      resetDemo: () => set({ ...seed() }),
    }),
    { name: 'epfo-data', version: 3 },
  ),
)

/** Convenience: the missing month, if it is still missing. */
export function selectMissingMonths(contributions: Contribution[]) {
  const northline = employments.find((e) => e.id === 'e-northline')!
  return contributions.filter((c) => c.status === 'missing' && c.employmentId === northline.id)
}

export const DEMO_MISSING_MONTH = MISSING_MONTH
