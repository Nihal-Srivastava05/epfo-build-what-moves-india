import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTerm } from '@/lib/glossary'
import { useT } from '@/i18n'

export default function GlossaryTerm() {
  const { termId = '' } = useParams()
  const entry = getTerm(termId)
  const { lang } = useT()

  if (!entry) return <Navigate to="/glossary" replace />

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link to="/glossary">
          <ArrowLeft className="size-4" aria-hidden />
          All words
        </Link>
      </Button>

      <p className="eyebrow mb-2">{entry.expansion ?? 'Term'}</p>
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">{entry.term}</h1>
      <p className="mt-4 text-lg leading-relaxed">{lang === 'hi' ? entry.oneLineHi : entry.oneLine}</p>
      {entry.more ? (
        <p className="mt-4 leading-relaxed text-muted-foreground">{entry.more}</p>
      ) : null}

      <section className="mt-8 rounded-lg border bg-card p-5">
        <p className="eyebrow mb-3">Where you will see this</p>
        <ul className="space-y-1.5 text-sm">
          {entry.whereYouSeeIt.map((w) => (
            <li key={w} className="text-muted-foreground">
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-dashed p-5">
        <p className="eyebrow mb-2">Also called</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {entry.aliases.join(' · ')}
        </p>
      </section>
    </div>
  )
}
