import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchGlossary } from '@/lib/glossary'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import type { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'

const filters: { key: Persona | 'all'; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'member', label: 'Employees' },
  { key: 'employer', label: 'Employers' },
  { key: 'pensioner', label: 'Pensioners' },
]

export default function Glossary() {
  const [q, setQ] = useState('')
  const [audience, setAudience] = useState<Persona | 'all'>('all')
  const { lang } = useT()
  const signedIn = useSession((s) => s.signedIn)

  const results = searchGlossary(q, audience === 'all' ? undefined : audience).sort((a, b) =>
    a.term.localeCompare(b.term),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">What the words mean</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
        One line each. Search what you actually call it — “PF number” finds UAN, “insurance” finds EDLI.
        Every entry has its own link, so a letter or an SMS can point straight at one.
      </p>

      <div className="relative mt-6">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word, or what you call it"
          className="h-12 pl-10"
          aria-label="Search the glossary"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setAudience(f.key)}
            className={cn(
              '!min-h-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              audience === f.key
                ? 'border-foreground bg-foreground text-background'
                : 'hover:bg-secondary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 divide-y rounded-xl border bg-card">
        {results.map((g) => (
          <li key={g.id}>
            <Link
              to={`/glossary/${g.id}`}
              className="flex items-start gap-4 p-5 transition-colors hover:bg-secondary/40"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {g.term}
                  {g.expansion ? (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{g.expansion}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {lang === 'hi' ? g.oneLineHi : g.oneLine}
                </p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">
            Nothing matches “{q}”. Try what you would say out loud.
          </li>
        ) : null}
      </ul>

      {!signedIn ? (
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Back to sign in</Link>
        </Button>
      ) : null}
    </div>
  )
}
