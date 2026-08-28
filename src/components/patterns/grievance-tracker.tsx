import type { Grievance } from '@/lib/types'
import { grievanceStages } from '@/lib/grievances'
import { StageTracker } from '@/components/patterns/stage-tracker'

export function GrievanceTracker({ grievance, className }: { grievance: Grievance; className?: string }) {
  return <StageTracker stages={grievanceStages(grievance)} className={className} />
}
