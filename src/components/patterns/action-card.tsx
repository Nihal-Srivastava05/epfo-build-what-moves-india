import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * No dead ends, enforced by the type system: `fix` is required, so a warning
 * that cannot state what resolves it will not compile.
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
  blocker: {
    wrap: 'border-stop-line bg-stop-soft',
    icon: 'text-stop',
    rule: 'shadow-[inset_3px_0_0_var(--stop)]',
  },
  warning: {
    wrap: 'border-wait-line bg-wait-soft',
    icon: 'text-wait',
    rule: 'shadow-[inset_3px_0_0_var(--wait)]',
  },
  info: {
    wrap: 'border-info-line bg-info-soft',
    icon: 'text-info',
    rule: 'shadow-[inset_3px_0_0_var(--info)]',
  },
}

export function ActionCard({ severity, title, detail, fix, meta, className }: ActionCardProps) {
  const t = tone[severity]
  const Icon = severity === 'info' ? Info : AlertTriangle
  return (
    <div className={cn('rounded-lg border p-4 sm:p-5', t.wrap, t.rule, className)}>
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', t.icon)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-foreground">{title}</p>
          <div className="mt-1.5 text-sm leading-relaxed text-foreground/80">{detail}</div>
          {meta ? <div className="mt-3">{meta}</div> : null}
          <div className="mt-4">
            <Button
              size="sm"
              variant="default"
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
        </div>
      </div>
    </div>
  )
}
