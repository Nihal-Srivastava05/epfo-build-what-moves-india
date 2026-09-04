/** Port of src/lib/claims.ts. i18n (StringKey/reasonLabelKey) dropped in
 * favor of a plain English REASON_LABELS map — this server has no i18n layer. */
import type { Claim, Holder } from '../data/types.js'
import { establishments } from '../data/seed.js'

/** Plain-language names for the reasons. The form number is never the title. */
export const REASON_LABELS: Record<string, string> = {
  medical: 'Medical treatment',
  home: 'Buy or build a home',
  education: 'Education or marriage',
  'left-job': 'Left job',
  'job-change': 'Job change (transfer)',
  death: 'Death claim',
  'nominee-pension': 'Nominee pension',
}

export function currentStage(claim: Claim) {
  return claim.stages.find((s) => s.state === 'current')
}

/** "What happens next" in one sentence, derived from the stage the claim is actually at. */
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
