/**
 * The only mutable state this server has. In-memory, module-scope, one
 * server process = one "session" — mirrors the live app's per-tab
 * localStorage. Nothing else here ever writes to the seed data.
 */
import { addDays } from '../lib/format.js'
import { TODAY } from './seed.js'
import type { Grievance } from './types.js'

let grievances: Grievance[] = []

export function listGrievances(): readonly Grievance[] {
  return grievances
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
}
