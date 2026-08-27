import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import type { Claim } from '@/lib/types'
import { fmtDate } from '@/lib/format'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { useT } from '@/i18n'
import { OwnerClock } from '@/components/patterns/owner-clock'
import { cn } from '@/lib/utils'

/**
 * "Where is it and when does it land" answered on the first screen.
 * The connecting line draws to the current stage; only that node pulses.
 */
export function ClaimTracker({ claim, className }: { claim: Claim; className?: string }) {
  const motionOk = useMotionOk()
  const { lang } = useT()
  const doneCount = claim.stages.filter((s) => s.state === 'done').length
  const fill = claim.stages.length > 1 ? (doneCount - 0.5) / (claim.stages.length - 1) : 0

  return (
    <ol className={cn('relative', className)}>
      <div className="absolute top-0 bottom-0 left-[11px] w-px bg-border" aria-hidden />
      <motion.div
        className="absolute top-0 left-[11px] w-px origin-top bg-ok"
        style={{ height: '100%' }}
        initial={{ scaleY: motionOk ? 0 : Math.max(0, Math.min(1, fill)) }}
        animate={{ scaleY: Math.max(0, Math.min(1, fill)) }}
        transition={{ duration: motionOk ? 0.6 : 0, ease: 'easeOut' }}
        aria-hidden
      />
      {claim.stages.map((stage) => (
        <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0">
          <span
            className={cn(
              'relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-background',
              stage.state === 'done' && 'border-ok bg-ok text-white',
              stage.state === 'current' && 'border-wait bg-wait-soft',
              stage.state === 'todo' && 'border-border',
            )}
          >
            {stage.state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
            {stage.state === 'current' && motionOk ? (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-wait"
                animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden
              />
            ) : null}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={cn(
                'font-medium leading-snug',
                stage.state === 'todo' && 'text-muted-foreground',
              )}
            >
              {lang === 'hi' && stage.labelHi ? stage.labelHi : stage.label}
            </p>
            {stage.state === 'done' && stage.on ? (
              <p className="num mt-0.5 text-sm text-muted-foreground">{fmtDate(stage.on, lang)}</p>
            ) : null}
            {stage.state === 'current' && stage.holder && stage.on ? (
              <OwnerClock holder={stage.holder} since={stage.on} className="mt-1" compact />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
