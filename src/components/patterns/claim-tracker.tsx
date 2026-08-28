import type { Claim } from '@/lib/types'
import { StageTracker } from '@/components/patterns/stage-tracker'

export function ClaimTracker({ claim, className }: { claim: Claim; className?: string }) {
  return <StageTracker stages={claim.stages} className={className} />
}
