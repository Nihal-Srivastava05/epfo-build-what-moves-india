import { personById } from '@/lib/mock/db'
import type { FamilyLink } from '@/lib/types'

export interface DelegateClaimAction {
  kind: 'delegate-claim'
  targetPersonId: string
  targetName: string
  relation: FamilyLink['relation']
  reasonKey: 'medical' | 'education' | 'home'
  reasonTitle: string
}

/**
 * "My father passed away, I want to raise a claim on his behalf" is a
 * fundamentally different action than a living withdrawal — there's no
 * account of theirs to bill it to, and the right next step depends on
 * whether they're already linked. This never auto-navigates on its own;
 * it always hands the person a choice between the two real paths.
 */
export type DeathClaimSuggestion =
  | { kind: 'death-claim-suggestion'; linked: true; targetPersonId: string; targetName: string; relation: FamilyLink['relation'] }
  | { kind: 'death-claim-suggestion'; linked: false; relation: FamilyLink['relation'] }

export type ResolvedAction = DelegateClaimAction | DeathClaimSuggestion

const CLAIM_VERB = /\b(file|raise|start|submit|claim)\b/i
const DEATH_WORDS = /\b(passed away|passed on|died|deceased|demise|no more|death claim)\b/i

const RELATION_WORDS: Record<FamilyLink['relation'], RegExp> = {
  father: /\b(father|dad|papa|pita)\b/i,
  mother: /\b(mother|mom|mum|amma|mata)\b/i,
  spouse: /\b(wife|husband|spouse)\b/i,
  other: /\b(brother|sister|sibling|son|daughter|child|parent)\b/i,
}

const REASON_WORDS: { key: DelegateClaimAction['reasonKey']; title: string; test: RegExp }[] = [
  { key: 'medical', title: 'Pay for medical treatment', test: /medical|surgery|hospital|treatment|illness|doctor|operation/i },
  { key: 'education', title: 'Education or marriage', test: /education|school|college|tuition|marriage|wedding/i },
  { key: 'home', title: 'Buy or build a home', test: /\bhome\b|\bhouse\b|construct|flat/i },
]

/**
 * Turns a sentence into an action, or returns null so the caller falls back
 * to plain Q&A. Deliberately regex-first and deterministic — this has to
 * work live, from a spoken sentence, without depending on whether an
 * on-device model happens to be available on the recording machine.
 *
 * A living-delegate claim only ever resolves to a family member who is both
 * linked *and* explicitly scoped for `file-claims` — the permission check is
 * load-bearing, not decorative. Anything else returns null, same as no
 * match at all.
 */
export function resolveAction(question: string, familyLinks: FamilyLink[]): ResolvedAction | null {
  const relation = (Object.keys(RELATION_WORDS) as FamilyLink['relation'][]).find((r) =>
    RELATION_WORDS[r].test(question),
  )
  if (!relation) return null

  // Checked first: "raise a claim for my father" also matches the living
  // delegate pattern below, and the two lead to completely different flows.
  if (DEATH_WORDS.test(question)) {
    const link = familyLinks.find((f) => f.relation === relation && f.scope.includes('file-claims'))
    if (!link) return { kind: 'death-claim-suggestion', linked: false, relation }
    const target = personById(link.personId)
    return { kind: 'death-claim-suggestion', linked: true, targetPersonId: link.personId, targetName: target.name, relation }
  }

  if (!CLAIM_VERB.test(question)) return null

  const link = familyLinks.find((f) => f.relation === relation && f.scope.includes('file-claims'))
  if (!link) return null

  const reason = REASON_WORDS.find((r) => r.test.test(question)) ?? REASON_WORDS[0]
  const target = personById(link.personId)

  return {
    kind: 'delegate-claim',
    targetPersonId: link.personId,
    targetName: target.name,
    relation,
    reasonKey: reason.key,
    reasonTitle: reason.title,
  }
}
