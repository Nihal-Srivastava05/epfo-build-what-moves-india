import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * No dead ends, enforced by the type system: `fix` is required, so a warning
 * that cannot state what resolves it will not compile.
 *
 * The card states its severity with a 1.35px coloured edge rather than a fill,
 * so a screen with four of these still has one obvious place to look.
 */
export interface ActionCardProps {
  severity: 'blocker' | 'warning' | 'info'
  title: string
  detail: ReactNode
  fix: { label: string; onClick?: () => void; href?: string }
  meta?: ReactNode
  className?: string
}

const tone = {
  blocker: { wrap: 'border-stop', icon: 'text-stop', chip: 'bg-stop-soft text-stop' },
  warning: { wrap: 'border-wait', icon: 'text-wait', chip: 'bg-wait-soft text-wait' },
  info: { wrap: 'border-brand', icon: 'text-primary', chip: 'bg-brand-tint text-primary' },
}

export function ActionCard({ severity, title, detail, fix, meta, className }: ActionCardProps) {
  const t = tone[severity]
  const Icon = severity === 'info' ? Info : AlertTriangle
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border-[1.35px] bg-card p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5',
        t.wrap,
        className,
      )}
    >
      <span
        className={cn('flex size-8 shrink-0 items-center justify-center rounded-sm', t.chip)}
        aria-hidden
      >
        <Icon className="size-[1.125rem]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {title}
        </p>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</div>
        {meta ? <div className="mt-2.5">{meta}</div> : null}
      </div>

      <Button
        size="sm"
        variant="default"
        className="self-start sm:self-center"
        onClick={fix.onClick}
        {...(fix.href ? { asChild: true } : {})}
      >
        {fix.href ? (
          <a href={fix.href}>
            {fix.label}
            <ArrowRight className="size-4" aria-hidden />
          </a>
        ) : (
          <>
            {fix.label}
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>
    </div>
  )
}
