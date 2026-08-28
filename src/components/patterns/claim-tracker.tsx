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
 *
 * A rail on wide screens, because four stages side by side is a distance the
 * eye can measure; a column on a phone, because four columns at 320px is not.
 * Either way the connecting line draws only as far as the work is done, and
 * only the current node pulses.
 */
export function ClaimTracker({ claim, className }: { claim: Claim; className?: string }) {
  const motionOk = useMotionOk()
  const { lang } = useT()
  const stages = claim.stages
  const doneCount = stages.filter((s) => s.state === 'done').length
  const fill = stages.length > 1 ? (doneCount - 0.5) / (stages.length - 1) : 0
  const clamped = Math.max(0, Math.min(1, fill))

  return (
    <>
      {/* Rail — sm and up */}
      <ol
        className={cn('hidden sm:grid', className)}
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((stage, i) => (
          <li key={stage.key} className="flex min-w-0 flex-col gap-2.5 pr-3 last:pr-0">
            <div className="flex items-center" aria-hidden>
              <StageDot state={stage.state} motionOk={motionOk} />
              {i < stages.length - 1 ? (
                <span className="relative ml-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.span
                    className="absolute inset-0 origin-left rounded-full bg-ok"
                    initial={{ scaleX: motionOk ? 0 : (stage.state === 'done' ? 1 : 0) }}
                    animate={{ scaleX: stage.state === 'done' ? 1 : 0 }}
                    transition={{
                      duration: motionOk ? 0.42 : 0,
                      delay: motionOk ? i * 0.08 : 0,
                      ease: 'easeOut',
                    }}
                  />
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-[0.8125rem] font-semibold leading-snug',
                  stage.state === 'todo' && 'text-faint',
                )}
              >
                {lang === 'hi' && stage.labelHi ? stage.labelHi : stage.label}
              </p>
              {stage.state === 'done' && stage.on ? (
                <p className="num mt-0.5 text-xs text-muted-foreground">{fmtDate(stage.on, lang)}</p>
              ) : null}
              {stage.state === 'current' && stage.holder && stage.on ? (
                <OwnerClock holder={stage.holder} since={stage.on} className="mt-0.5" compact />
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {/* Column — phones */}
      <ol className={cn('relative sm:hidden', className)}>
        <div className="absolute top-0 bottom-0 left-[11px] w-px bg-border" aria-hidden />
        <motion.div
          className="absolute top-0 left-[11px] h-full w-px origin-top bg-ok"
          initial={{ scaleY: motionOk ? 0 : clamped }}
          animate={{ scaleY: clamped }}
          transition={{ duration: motionOk ? 0.6 : 0, ease: 'easeOut' }}
          aria-hidden
        />
        {stages.map((stage) => (
          <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0">
            <span className="relative z-10 mt-0.5">
              <StageDot state={stage.state} motionOk={motionOk} large />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn('font-semibold leading-snug', stage.state === 'todo' && 'text-faint')}
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
    </>
  )
}

function StageDot({
  state,
  motionOk,
  large = false,
}: {
  state: 'done' | 'current' | 'todo'
  motionOk: boolean
  large?: boolean
}) {
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full border-2 bg-card',
        large ? 'size-6' : 'size-3.5',
        state === 'done' && 'border-ok bg-ok text-card',
        state === 'current' && 'border-wait bg-wait-soft',
        state === 'todo' && 'border-border',
      )}
    >
      {state === 'done' && large ? (
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      ) : null}
      {state === 'current' && motionOk ? (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-wait"
          animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden
        />
      ) : null}
    </span>
  )
}
