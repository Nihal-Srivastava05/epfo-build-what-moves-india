import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type MultiSelectOption = { value: string; label: string }

/**
 * A filter that can hold more than one answer. An empty selection means "all",
 * never "none" — a filter nobody has narrowed should not hide every row — so
 * the "all" entry at the top is a way to clear the selection, not a value of
 * its own. The menu stays open while boxes are ticked, because choosing two
 * employers should not cost two trips.
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  allLabel,
  summary,
  className,
  label,
}: {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (next: string[]) => void
  /** Shown on the trigger, and as the first entry, when nothing is selected. */
  allLabel: string
  /** Trigger text once more than one is selected, e.g. `${n} employers`. */
  summary: (count: number) => string
  className?: string
  /** Accessible name for the trigger — the visible text is a summary. */
  label: string
}) {
  const toggle = (v: string) =>
    onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const text =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? summary(1))
        : summary(value.length)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${text}`}
          className={cn(
            'flex h-11 w-fit items-center justify-between gap-2 rounded-sm border-[1.35px] border-input bg-card px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{text}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-(--radix-dropdown-menu-trigger-width)"
      >
        <DropdownMenuCheckboxItem
          checked={value.length === 0}
          onCheckedChange={() => onValueChange([])}
          onSelect={(e) => e.preventDefault()}
        >
          {allLabel}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={value.includes(o.value)}
            onCheckedChange={() => toggle(o.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
