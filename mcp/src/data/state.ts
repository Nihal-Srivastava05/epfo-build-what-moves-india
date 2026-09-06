/**
 * The only mutable state this server has. In-memory, module-scope, one
 * server process = one "session" — mirrors the live app's per-tab
 * localStorage. Nothing else here ever writes to the seed data.
 */
import { addDays } from '../lib/format.js'
import { TODAY } from './seed.js'
import type { FamilyLink, Grievance } from './types.js'

let grievances: Grievance[] = []
let familyLinks: FamilyLink[] = []

export function listGrievances(): readonly Grievance[] {
  return grievances
}

export function listFamilyLinks(): readonly FamilyLink[] {
  return familyLinks
}

/** Reproduces src/store/data.ts's linkFamilyMember() exactly. */
export function addFamilyLink(input: {
  ownerId: string
  personId: string
  relation: FamilyLink['relation']
  scope: FamilyLink['scope']
}): FamilyLink {
  const link: FamilyLink = { id: `fam-${Date.now()}`, linkedOn: TODAY, ...input }
  familyLinks = [link, ...familyLinks]
  return link
}

/** Returns true if a link was actually removed. */
export function removeFamilyLink(id: string): boolean {
  const before = familyLinks.length
  familyLinks = familyLinks.filter((f) => f.id !== id)
  return familyLinks.length < before
}

/** Reproduces src/store/data.ts's raiseGrievance() exactly. */
export function addGrievance(input: {
  personId: string
  subject: string
  detail: string
  aboutType?: Grievance['aboutType']
  aboutId?: string
}): Grievance {
  const g: Grievance = {
    ...input,
    id: `GRV-2026-${Math.floor(100 + Math.random() * 899)}`,
    raisedOn: TODAY,
    rung: 'office',
    escalatesOn: addDays(TODAY, 15),
    status: 'open',
  }
  grievances = [g, ...grievances]
  return g
}

/** Mirrors the app's "Reset the demo" action. */
export function resetDemoState(): void {
  grievances = []
  familyLinks = []
}
