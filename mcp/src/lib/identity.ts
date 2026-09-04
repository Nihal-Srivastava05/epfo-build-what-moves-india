/** New glue code (not a port): resolves which demo person a tool call is about. */
import { DEMO_PPO, DEMO_UAN, contributions, employments, pensioner, people } from '../data/seed.js'
import type { Person } from '../data/types.js'

export function resolveMember(uanInput?: string): Person | undefined {
  const uan = (uanInput ?? DEMO_UAN).replace(/\s+/g, '')
  return people.find((p) => p.roles.includes('member') && p.uan === uan)
}

export function resolvePensionerPerson(ppoInput?: string): Person | undefined {
  const ppo = (ppoInput ?? DEMO_PPO).trim().toUpperCase()
  if (pensioner.ppo.toUpperCase() !== ppo) return undefined
  return people.find((p) => p.id === pensioner.personId)
}

/** Resolves a person from either an optional uan or ppo, member first. Used by
 * tools (notifications, grievances) that serve both personas. */
export function resolvePerson(uanInput?: string, ppoInput?: string): Person | undefined {
  if (ppoInput) return resolvePensionerPerson(ppoInput) ?? resolveMember(uanInput)
  return resolveMember(uanInput) ?? resolvePensionerPerson(ppoInput)
}

export function contributionsForPerson(personId: string) {
  const ids = new Set(employments.filter((e) => e.personId === personId).map((e) => e.id))
  return contributions.filter((c) => ids.has(c.employmentId))
}
