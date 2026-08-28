import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getTerm } from '@/lib/glossary'
import { useIsMobile } from '@/hooks/use-motion-ok'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * A tappable acronym. The meaning opens in place — never on a new page, because
 * nobody should lose a half-filled form to look up a word.
 */
export function Term({ id, children, className }: { id: string; children?: string; className?: string }) {
  const entry = getTerm(id)
  const isMobile = useIsMobile()
  const [more, setMore] = useState(false)
  const { t, lang } = useT()

  if (!entry) return <>{children ?? id}</>

  const label = children ?? entry.term
  const trigger = (
    <button
      type="button"
      className={cn(
        'inline items-baseline gap-1 rounded-xs underline decoration-brand-line decoration-dotted decoration-2 underline-offset-4',
        'font-semibold text-foreground transition-colors hover:decoration-brand hover:decoration-solid focus-visible:outline-2',
        '!min-h-0 align-baseline',
        className,
      )}
      aria-label={`${label} — what this means`}
    >
      {label}
    </button>
  )

  const body = (
    <div className="space-y-3">
      {entry.expansion ? <p className="eyebrow">{entry.expansion}</p> : null}
      <p className="text-[0.95rem] leading-relaxed">{lang === 'hi' ? entry.oneLineHi : entry.oneLine}</p>
      {entry.more ? (
        more ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{entry.more}</p>
        ) : (
          <button
            type="button"
            onClick={() => setMore(true)}
            className="!min-h-0 text-sm font-medium text-info underline underline-offset-4"
          >
            {t('common.explainMore')}
          </button>
        )
      ) : null}
      <div className="border-t pt-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
          <Link to={`/glossary/${entry.id}`}>
            <BookOpen className="size-4" aria-hidden />
            {t('nav.glossary')}
          </Link>
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl px-5 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle className="text-left">{entry.term}</SheetTitle>
            <SheetDescription className="sr-only">Meaning of {entry.term}</SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <p className="mb-2 font-semibold">{entry.term}</p>
        {body}
      </PopoverContent>
    </Popover>
  )
}
