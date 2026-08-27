import { glossary, searchGlossary } from '@/lib/glossary'
import { activeClaim, totalBalance, withdrawalReasons } from '@/lib/derive'
import { fmtDate, fmtMonthLong, rupees } from '@/lib/format'
import { establishments, TODAY } from '@/lib/mock/db'
import type { Persona } from '@/lib/types'
import { useData } from '@/store/data'

export interface Answer {
  /** The deterministic reply. Always produced, always safe to show. */
  text: string
  /** The facts this reply was built from; the only thing the model may restate. */
  facts: string
  /** Whether the on-device model may rephrase this. Never for a bare number. */
  allowRephrase: boolean
  link?: { to: string; label: string }
  termId?: string
}

const NEED_HUMAN =
  'I do not know this one. Rather than guess, let me open a grievance with your question already filled in.'

function factsFor(persona: Persona, signedIn: boolean): string {
  if (!signedIn) return 'The person is not signed in. No account facts are available.'
  const { contributions, claims, kyc, pensioner, pensionPayments } = useData.getState()

  if (persona === 'pensioner') {
    const last = pensionPayments[0]
    return [
      `Today is ${fmtDate(TODAY)}.`,
      `Pensioner: Ram Prasad Verma, PPO ${pensioner.ppo}.`,
      `Monthly pension: ${rupees(pensioner.monthlyAmount)}.`,
      `Next credit due: ${fmtDate(pensioner.nextCreditOn)}.`,
      `Last credit: ${rupees(last.amount)} on ${fmtDate(last.creditedOn)}.`,
      `Bank: ${pensioner.bankName} ending ${pensioner.bankLast4}.`,
      `Life certificate valid until ${fmtDate(pensioner.lifeCertificateValidTill)}, last submitted ${fmtDate(pensioner.lastSubmittedOn)}.`,
    ].join('\n')
  }

  if (persona === 'employer') {
    const { approvals, challans } = useData.getState()
    const missing = contributions.filter((c) => c.status === 'missing')
    return [
      `Today is ${fmtDate(TODAY)}.`,
      `Establishment: ${establishments[0].name}, code ${establishments[0].code}.`,
      `Approvals waiting: ${approvals.length}.`,
      missing.length
        ? `Unfiled month: ${fmtMonthLong(missing[0].month)}.`
        : 'No unfiled months remain.',
      `Last challan paid: ${challans[0] ? `${challans[0].trrn} on ${fmtDate(challans[0].paidOn)}` : 'none'}.`,
    ].join('\n')
  }

  const claim = activeClaim(claims)
  const missing = contributions.filter((c) => c.status === 'missing')
  const bank = kyc.find((k) => k.key === 'bank')!
  return [
    `Today is ${fmtDate(TODAY)}.`,
    `Member: Priya Sharma, UAN 1002 3456 7890.`,
    `Total EPF balance: ${rupees(totalBalance(contributions))}.`,
    claim
      ? `Open claim ${claim.id} for ${rupees(claim.amount)}, filed ${fmtDate(claim.filedOn)}, currently at "${claim.stages.find((s) => s.state === 'current')?.label ?? 'settled'}", expected by ${claim.expectedBy ? fmtDate(claim.expectedBy) : 'unknown'}.`
      : 'No open claim.',
    missing.length
      ? `${fmtMonthLong(missing[0].month)} contribution is missing; ${establishments[0].name} has not filed that return.`
      : 'No missing contribution months.',
    `Bank details status: ${bank.status}. ${bank.problem ?? ''}`,
    `Nominee: ${kyc.find((k) => k.key === 'nominee')?.value}.`,
  ].join('\n')
}

/**
 * The grounded core. Every answer about money, a date or an eligibility verdict
 * is assembled here from the record — the model is never asked to produce one.
 */
export function answer(question: string, persona: Persona, signedIn: boolean): Answer {
  const q = question.toLowerCase().trim()
  const facts = factsFor(persona, signedIn)
  const store = useData.getState()

  // 1. Meanings — available whether or not anyone is signed in.
  const meaningAsked = /what (is|are|does|do)|meaning|mean|explain|समझ|मतलब|क्या है/.test(q)
  const hit =
    glossary.find((g) => new RegExp(`\\b${g.term.toLowerCase()}\\b`).test(q)) ??
    glossary.find((g) => g.aliases.some((a) => q.includes(a))) ??
    (meaningAsked ? searchGlossary(q.replace(/what (is|are|does|do)|meaning|mean|explain/g, ''))[0] : undefined)

  if (hit && (meaningAsked || q.split(/\s+/).length <= 3)) {
    return {
      text: hit.oneLine,
      facts: `${hit.term}${hit.expansion ? ` (${hit.expansion})` : ''}: ${hit.oneLine} ${hit.more ?? ''}`,
      allowRephrase: true,
      termId: hit.id,
      link: { to: `/glossary/${hit.id}`, label: `More about ${hit.term}` },
    }
  }

  if (!signedIn) {
    return {
      text: 'I can explain what any term on this site means. For anything about your own account, sign in first — I never discuss an account without one.',
      facts,
      allowRephrase: false,
      link: { to: '/', label: 'Sign in' },
    }
  }

  // 2. Account questions, answered from the record in a fixed shape.
  if (/balance|how much.*(have|saved)|कितना|शेष/.test(q) && persona === 'member') {
    return {
      text: `Your total EPF balance is ${rupees(totalBalance(store.contributions))} as on ${fmtDate(TODAY)}.`,
      facts,
      allowRephrase: false,
      link: { to: '/member/passbook', label: 'Open your passbook' },
    }
  }

  if (/claim|where is my money|status|दावा|कहाँ/.test(q) && persona === 'member') {
    const claim = activeClaim(store.claims)
    if (!claim) {
      return { text: 'You have no claim in progress right now.', facts, allowRephrase: false, link: { to: '/member/claims/new', label: 'Start a withdrawal' } }
    }
    const stage = claim.stages.find((s) => s.state === 'current')
    return {
      text: `Claim ${claim.id} for ${rupees(claim.amount)} is at "${stage?.label ?? 'settled'}". ${stage?.holder === 'employer' ? `${establishments[0].name} has it.` : ''} Expected by ${claim.expectedBy ? fmtDate(claim.expectedBy) : 'a date not yet set'}.`,
      facts,
      allowRephrase: false,
      link: { to: '/member/claims', label: 'Track this claim' },
    }
  }

  if (/withdraw|take out|eligib|निकाल|पात्र/.test(q) && persona === 'member') {
    const reasons = withdrawalReasons(store.contributions).filter((r) => r.eligible)
    return {
      text: `You can withdraw for ${reasons.length} reasons today. The largest is ${reasons.sort((a, b) => b.cap - a.cap)[0].title.toLowerCase()}, up to ${rupees(reasons[0].cap)}.`,
      facts,
      allowRephrase: false,
      link: { to: '/member/claims/new', label: 'See all reasons and limits' },
    }
  }

  if (/missing|not credited|gap|नहीं आया|महीना/.test(q) && persona === 'member') {
    const missing = store.contributions.filter((c) => c.status === 'missing')
    if (!missing.length) {
      return { text: 'Every month is credited. Nothing is missing from your account.', facts, allowRephrase: false }
    }
    return {
      text: `${fmtMonthLong(missing[0].month)} has not been credited. ${establishments[0].name} did not file that month's return. EPFO has raised it with them.`,
      facts,
      allowRephrase: false,
      link: { to: `/member/gap/${missing[0].month}`, label: 'See what happens next' },
    }
  }

  if (/life certificate|jeevan|alive|प्रमाण/.test(q) && persona === 'pensioner') {
    return {
      text: `Your life certificate is valid until ${fmtDate(store.pensioner.lifeCertificateValidTill)}. There are three free ways to renew it.`,
      facts,
      allowRephrase: false,
      link: { to: '/pensioner/life-certificate', label: 'Renew it' },
    }
  }

  if (/pension|credit|payment|पेंशन/.test(q) && persona === 'pensioner') {
    return {
      text: `Your monthly pension is ${rupees(store.pensioner.monthlyAmount)}. The next credit is due on ${fmtDate(store.pensioner.nextCreditOn)}.`,
      facts,
      allowRephrase: false,
      link: { to: '/pensioner/payments', label: 'See all payments' },
    }
  }

  if (/return|ecr|file|challan|approval/.test(q) && persona === 'employer') {
    const missing = store.contributions.filter((c) => c.status === 'missing')
    return {
      text: missing.length
        ? `${fmtMonthLong(missing[0].month)} is still unfiled, and ${store.approvals.length} approvals are waiting.`
        : `All returns are filed. ${store.approvals.length} approvals are waiting.`,
      facts,
      allowRephrase: false,
      link: { to: missing.length ? '/employer/return' : '/employer/approvals', label: missing.length ? 'File it now' : 'Open approvals' },
    }
  }

  // 3. Fraud, which is the question people most need a straight answer to.
  if (/scam|fraud|fake|real|otp|धोखा|असली/.test(q)) {
    return {
      text: 'EPFO never asks for an OTP, a fee or your password, and nobody can speed up a claim for money. Every message EPFO sends you is listed in your notifications — if it is not there, it did not come from us.',
      facts: 'EPFO never asks for OTP, fee or password. All official messages appear in the notification centre.',
      allowRephrase: true,
      link: { to: '/notifications', label: 'Check what we sent you' },
    }
  }

  // 4. No guessing.
  return {
    text: NEED_HUMAN,
    facts,
    allowRephrase: false,
    link: { to: '/grievance/new', label: 'Raise a grievance' },
  }
}
