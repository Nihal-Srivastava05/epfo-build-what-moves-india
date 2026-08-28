import type { Claim, Holder } from '@/lib/types'
import { establishments } from '@/lib/mock/db'
import type { StringKey } from '@/i18n/strings'

/** Plain-language names for the reasons. The form number is never the title. */
export const reasonLabelKey: Record<string, StringKey> = {
  medical: 'claim.reason.medical',
  home: 'claim.reason.home',
  education: 'claim.reason.education',
  'left-job': 'claim.reason.leftJob',
  'job-change': 'claim.reason.jobChange',
  death: 'claim.reason.death',
  'nominee-pension': 'claim.reason.nomineePension',
}

/** The three steps, named the same way wherever they are described. */
export const WITHDRAW_STEPS: { titleKey: StringKey; blurbKey: StringKey }[] = [
  { titleKey: 'withdraw.step1', blurbKey: 'withdraw.step1.blurb' },
  { titleKey: 'withdraw.step2', blurbKey: 'withdraw.step2.blurb' },
  { titleKey: 'withdraw.step3', blurbKey: 'withdraw.step3.blurb' },
]

export function currentStage(claim: Claim) {
  return claim.stages.find((s) => s.state === 'current')
}

/**
 * "What happens next" in one sentence, derived from the stage the claim is
 * actually at — never a generic "under process".
 */
export function whatHappensNext(claim: Claim): { title: string; body: string } {
  if (claim.settledOn) {
    return {
      title: 'This claim is finished',
      body: 'The money has been credited. Nothing further is needed from you or your employer.',
    }
  }
  const stage = currentStage(claim)
  const holder: Holder = stage?.holder ?? 'epfo'
  if (holder === 'employer') {
    return {
      title: `${establishments[0].name} has to attest it`,
      body: 'They confirm you work there and that the reason is genuine. They have 3 days. You do not need to call them — we chase this automatically if it runs late.',
    }
  }
  if (holder === 'epfo') {
    return {
      title: 'EPFO is verifying it',
      body: 'Your KYC and eligibility are checked against your record. This takes up to 7 days, and no documents are needed from you.',
    }
  }
  return {
    title: 'Your bank is crediting it',
    body: 'The money has left EPFO and is with your bank. Banks usually credit within one working day.',
  }
}

export function claimTone(claim: Claim): 'ok' | 'wait' {
  return claim.settledOn ? 'ok' : 'wait'
}
