import { Clock } from 'lucide-react'
import type { Holder } from '@/lib/types'
import { fmtDuration } from '@/lib/format'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { establishments } from '@/lib/mock/db'

const holderName: Record<Holder, string> = {
  you: 'you',
  employer: establishments[0].name,
  epfo: 'EPFO',
  bank: 'your bank',
}

/**
 * Every pending object names who is holding it and for how long.
 * "Waiting on Northline Logistics · 9 days" instead of "under process".
 */
export function OwnerClock({
  holder,
  since,
  className,
  compact = false,
}: {
  holder: Holder
  since: string
  className?: string
  compact?: boolean
}) {
  const { lang } = useT()
  const who = lang === 'hi'
    ? { you: 'आप', employer: 'आपका नियोक्ता', epfo: 'ईपीएफ़ओ', bank: 'आपका बैंक' }[holder]
    : holderName[holder]
  const label = lang === 'hi' ? 'प्रतीक्षा' : 'Waiting on'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-muted-foreground',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      <span>
        {label} <span className="font-medium text-foreground">{who}</span>
        <span aria-hidden> · </span>
        <span className="num">{fmtDuration(since, lang)}</span>
      </span>
    </span>
  )
}
