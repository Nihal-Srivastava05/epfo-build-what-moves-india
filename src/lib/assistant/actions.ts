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

const CLAIM_VERB = /\b(file|raise|start|submit|claim)\b/i

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
 * Turns a sentence into a delegated-claim action, or returns null so the
 * caller falls back to plain Q&A. Deliberately regex-first and deterministic
 * — this has to work live, from a spoken sentence, without depending on
 * whether an on-device model happens to be available on the recording
 * machine.
 *
 * Only ever resolves to a family member who is both linked *and* explicitly
 * scoped for `file-claims` — the permission check is load-bearing, not
 * decorative. Anything else returns null, same as no match at all.
 */
export function resolveAction(question: string, familyLinks: FamilyLink[]): DelegateClaimAction | null {
  if (!CLAIM_VERB.test(question)) return null

  const relation = (Object.keys(RELATION_WORDS) as FamilyLink['relation'][]).find((r) =>
    RELATION_WORDS[r].test(question),
  )
  if (!relation) return null

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
