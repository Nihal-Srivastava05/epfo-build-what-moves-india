import type { ClaimStage, Grievance, GrievanceRung } from '@/lib/types'

/** The ladder a grievance climbs on its own — same order everywhere it is shown. */
export const GRIEVANCE_RUNGS: { key: GrievanceRung; label: string }[] = [
  { key: 'office', label: 'Your PF office' },
  { key: 'regional', label: 'Regional EPFO office' },
  { key: 'cpgrams', label: 'CPGRAMS' },
]

export function openGrievances(grievances: Grievance[], personId: string) {
  return grievances.filter((g) => g.personId === personId && g.status === 'open')
}

/** Most recent open grievance for this person — mirrors `activeClaim`. */
export function activeGrievance(grievances: Grievance[], personId: string) {
  return openGrievances(grievances, personId)[0]
}

/** Turns a grievance's single `rung` into the same stage shape a claim uses,
 * so the same tracker component can draw both. */
export function grievanceStages(g: Grievance): ClaimStage[] {
  const idx = GRIEVANCE_RUNGS.findIndex((r) => r.key === g.rung)
  return GRIEVANCE_RUNGS.map((r, i) => ({
    key: r.key,
    label: r.label,
    state: i < idx || (i === idx && g.status === 'resolved') ? 'done' : i === idx ? 'current' : 'todo',
    on: i === 0 ? g.raisedOn : undefined,
  }))
}

export function grievanceTone(g: Grievance): 'ok' | 'wait' {
  return g.status === 'resolved' ? 'ok' : 'wait'
}
