import { cn } from '@/lib/utils'
import { inr } from '@/lib/format'

/**
 * Every amount in the app renders through here: Indian digit grouping, tabular
 * figures so columns line up, and gold reserved for the figure that matters.
 */
export function Money({
  value,
  className,
  size = 'md',
  mark = false,
  paise = false,
  sign,
}: {
  value: number
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  mark?: boolean
  paise?: boolean
  sign?: '+' | '-'
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
    xl: 'text-3xl font-semibold tracking-tight',
    hero: 'text-[2.75rem] leading-[1.05] font-semibold tracking-tight sm:text-5xl',
  }
  return (
    <span
      className={cn('num whitespace-nowrap', sizes[size], mark && 'text-gold', className)}
      aria-label={`${sign === '-' ? 'minus ' : ''}${inr(value, { paise })} rupees`}
    >
      {sign}₹{inr(value, { paise })}
    </span>
  )
}
