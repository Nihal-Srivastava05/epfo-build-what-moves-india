import { cn } from '@/lib/utils'
import { inr } from '@/lib/format'

/**
 * Every amount in the app renders through here: Indian digit grouping, tabular
 * figures so columns line up, and the brand blue reserved for the one figure a
 * screen exists to show. Display sizes get a tighter track and heavier weight —
 * a balance should read as a number, not as a sentence.
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
    sm: 'num text-[0.8125rem]',
    md: 'num text-sm font-medium',
    lg: 'num text-lg font-bold',
    xl: 'figure text-[1.75rem]',
    hero: 'figure text-[2.5rem] sm:text-[2.875rem]',
  }
  return (
    <span
      className={cn('whitespace-nowrap', sizes[size], mark && 'text-primary', className)}
      aria-label={`${sign === '-' ? 'minus ' : ''}${inr(value, { paise })} rupees`}
    >
      {sign}₹{inr(value, { paise })}
    </span>
  )
}
