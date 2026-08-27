import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'ok' | 'wait' | 'stop' | 'info' | 'neutral'

const tones: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok border-ok-line',
  wait: 'bg-wait-soft text-wait border-wait-line',
  stop: 'bg-stop-soft text-stop border-stop-line',
  info: 'bg-info-soft text-info border-info-line',
  neutral: 'bg-muted text-muted-foreground border-border',
}

/** Status colours live outside the brand ramp, so "pending" never reads as decoration. */
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
