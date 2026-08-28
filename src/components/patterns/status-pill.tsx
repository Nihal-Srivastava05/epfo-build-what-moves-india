import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'ok' | 'wait' | 'stop' | 'info' | 'brand' | 'neutral'

/**
 * Flat tint, no outline. Status colour lives outside the brand ramp so
 * "pending" never reads as decoration, and the pill never competes with the
 * one filled button on the screen.
 */
const tones: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  wait: 'bg-wait-soft text-wait',
  stop: 'bg-stop-soft text-stop',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-tint text-primary',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatusPill({
  tone = 'neutral',
  children,
  icon,
  className,
}: {
  tone?: Tone
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
