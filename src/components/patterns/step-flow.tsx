import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

/**
 * Every step is named under its own bar, so "how much is left" is answered by
 * looking rather than by counting. The old pattern — one bar and a "step 2 of
 * 3" caption — makes you hold the total in your head.
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
    <div className={cn('mb-7', className)}>
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-3">
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
      ) : null}
      <div
        className="flex gap-2.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={labels.length}
        aria-label={`Step ${step} of ${labels.length}: ${labels[step - 1]}`}
      >
        {labels.map((label, i) => {
          const state = i < step - 1 ? 'done' : i === step - 1 ? 'current' : 'todo'
          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-1 overflow-hidden rounded-full bg-border">
                {state !== 'todo' ? (
                  <motion.div
                    className={cn(
                      'h-full origin-left rounded-full',
                      state === 'current' ? 'bg-primary' : 'bg-brand-line',
                    )}
                    initial={{ scaleX: motionOk ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: motionOk ? 0.32 : 0, ease: 'easeOut' }}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  'truncate text-xs font-semibold',
                  state === 'todo' ? 'text-faint' : state === 'current' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StepActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-16 z-30 -mx-4 mt-7 flex flex-col-reverse gap-3 border-t bg-card/95 px-4 py-4 backdrop-blur',
        'sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:border-t sm:bg-transparent sm:px-0 sm:pt-5 sm:pb-0 sm:backdrop-blur-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
