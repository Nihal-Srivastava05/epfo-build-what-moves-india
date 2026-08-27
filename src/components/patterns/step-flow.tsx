import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

/**
 * A persistent "step 2 of 3" on every long flow, with the label of each step
 * spelled out so nobody has to guess how much is left.
 */
export function StepProgress({
  step,
  labels,
  onBack,
  className,
}: {
  step: number
  labels: string[]
  onBack?: () => void
  className?: string
}) {
  const motionOk = useMotionOk()
  return (
    <div className={cn('mb-8', className)}>
      <div className="mb-3 flex items-center gap-3">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-9 px-2">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
        ) : null}
        <p className="num text-sm font-medium text-muted-foreground">
          Step {step} of {labels.length}
          <span className="mx-2 text-border" aria-hidden>
            ·
          </span>
          <span className="text-foreground">{labels[step - 1]}</span>
        </p>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={labels.length}
        aria-label={`Step ${step} of ${labels.length}: ${labels[step - 1]}`}
      >
        {labels.map((label, i) => (
          <div key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            {i < step ? (
              <motion.div
                layoutId={`step-fill-${i}`}
                className="h-full rounded-full bg-primary"
                initial={{ scaleX: motionOk ? 0 : 1 }}
                animate={{ scaleX: 1 }}
                style={{ originX: 0 }}
                transition={{ duration: motionOk ? 0.32 : 0, ease: 'easeOut' }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function StepActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-16 z-30 -mx-4 mt-8 flex flex-col-reverse gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur',
        'sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-t-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
