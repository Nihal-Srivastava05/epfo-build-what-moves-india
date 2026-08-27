import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { fmtDate } from '@/lib/format'
import type { Grievance as GrievanceType } from '@/lib/types'

/**
 * A grievance is a state on an existing object, not a separate website.
 * Whatever it is about is attached automatically, so nothing is retyped.
 */
export default function Grievance() {
  const [params] = useSearchParams()
  const { raiseGrievance, claims, contributions } = useData()
  const persona = useSession((s) => s.persona)
  const { lang } = useT()
  const [subject, setSubject] = useState(params.get('subject') ?? '')
  const [detail, setDetail] = useState(params.get('detail') ?? '')
  const [raised, setRaised] = useState<GrievanceType | null>(null)

  const claim = claims.find((c) => !c.settledOn)
  const missing = contributions.find((c) => c.status === 'missing')
  const attachments = [
    claim ? { type: 'claim' as const, id: claim.id, label: `Claim ${claim.id}` } : null,
    missing ? { type: 'contribution' as const, id: missing.id, label: `Missing month ${missing.month}` } : null,
  ].filter(Boolean) as { type: 'claim' | 'contribution'; id: string; label: string }[]

  const [about, setAbout] = useState(attachments[0]?.id ?? '')

  if (raised) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-ok-line bg-ok-soft p-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">Grievance raised</h1>
          <p className="ident mt-2 text-lg">{raised.id}</p>
        </div>
        {/* The ladder, with the date it climbs on its own. */}
        <div className="mt-6 rounded-xl border bg-card p-5">
          <p className="eyebrow mb-3">What happens next</p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <StatusPill tone="wait">Now</StatusPill>
              <span>Your regional EPFO office has 15 working days.</span>
            </li>
            <li className="flex items-start gap-3">
              <StatusPill tone="neutral">{fmtDate(raised.escalatesOn, lang)}</StatusPill>
              <span>If unresolved, it moves to the zonal office by itself. You do not have to chase it.</span>
            </li>
            <li className="flex items-start gap-3">
              <StatusPill tone="neutral">After that</StatusPill>
              <span>It escalates to CPGRAMS, the central government grievance system.</span>
            </li>
          </ol>
        </div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link to={`/${persona}`}>Back to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Raise a grievance"
        sub="Attached to whatever it is about, so you never explain your problem a second time."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const attachment = attachments.find((a) => a.id === about)
          setRaised(
            raiseGrievance({
              personId: persona === 'pensioner' ? 'p-ram' : 'p-priya',
              subject: subject || 'General query',
              detail,
              aboutType: attachment?.type,
              aboutId: attachment?.id,
            }),
          )
        }}
        className="space-y-5"
      >
        {attachments.length > 0 ? (
          <div className="space-y-2">
            <Label>What is this about?</Label>
            <div className="space-y-2">
              {attachments.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm"
                >
                  <input
                    type="radio"
                    name="about"
                    value={a.id}
                    checked={about === a.id}
                    onChange={() => setAbout(a.id)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span className="flex-1">{a.label}</span>
                  <StatusPill tone="info">Attached automatically</StatusPill>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="subject">In one line, what is wrong?</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="My June contribution has not been credited"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="detail">Anything else we should know? (optional)</Label>
          <textarea
            id="detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-transparent px-3 py-2.5 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <p className="rounded-lg border border-dashed p-4 text-sm leading-relaxed text-muted-foreground">
          Your UAN, employer, claim reference and KYC status are attached for you. You do not need to
          repeat any of it.
        </p>

        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Raise it
        </Button>
      </form>
    </div>
  )
}
