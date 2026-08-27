import { FlaskConical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Anything synthetic says so, everywhere it appears. Honesty is a judging
 * criterion and, more to the point, the alternative is misleading.
 */
export function MockBadge({ what, className }: { what: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            '!min-h-0 inline-flex cursor-help items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground',
            className,
          )}
        >
          <FlaskConical className="size-3" aria-hidden />
          Mock
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{what}</TooltipContent>
    </Tooltip>
  )
}
