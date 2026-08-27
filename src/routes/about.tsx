import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FlaskConical, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

const works = [
  'Signing in as any of the three personas, from one account with one code',
  'The full withdrawal journey: reason, computed cap, pre-submit check, fix, confirm, reference number',
  'The employer monthly return: carried-over wages, detected changes, computed totals, payment, TRRN',
  'Approving a claim as the employer and watching the member’s tracker advance',
  'The contribution gap: who is holding it, how long, and asking EPFO to chase the employer',
  'The life certificate, with three routes and a new validity date',
  'Passbook with real arithmetic — 91 ledger rows, interest computed on the monthly running balance',
  'Glossary, in-place term definitions, grounded assistant, notifications, grievance ladder',
  'Lite mode, Hindi, dark mode, keyboard navigation, reduced motion',
]

const mocked = [
  'Every person, employer, amount and date. Priya Sharma and Northline Logistics do not exist.',
  'OTPs. The code is fixed at 284116 and printed on screen. No SMS is sent.',
  'Payments. No challan is paid and no money moves.',
  'The life-certificate face scan. No camera is opened; the result is simulated.',
  'PDF exports and receipt downloads.',
  'All government integrations — UIDAI, NPCI, bank IFSC directories, CPPS, Jeevan Pramaan.',
]

const scale = [
  {
    title: 'The data model, not the screens, is the hard part',
    body: 'This prototype works because member and employer read one record. In production that means a single source of truth for contributions, claims and KYC, with both portals as views over it rather than separate systems that reconcile overnight.',
  },
  {
    title: 'The pre-submit check needs a rules service',
    body: 'Every rejection reason must be expressible as a check that runs before submission. That is a service EPFO would own, fed by actual rejection data, so each new reason becomes an inline validation within a release rather than another line in a circular.',
  },
  {
    title: 'The assistant must never be the source of a number',
    body: 'Here the on-device model only rephrases facts the app already computed, and any answer containing an amount or date not present in those facts is discarded. That constraint should survive any future move to a hosted model.',
  },
  {
    title: 'Assisted and offline paths stay',
    body: 'Lite mode, the glossary working without a network, and a design that a common service centre operator can drive on someone’s behalf are not extras. They are the difference between a service that reaches everyone and one that reaches the already-connected.',
  },
]

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">About this prototype</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        An independent redesign concept for the EPFO web estate, built to show that nine portals can be
        one account. It is not affiliated with, endorsed by, or connected to EPFO or the Government of
        India, and no government system was touched to build it.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="size-5 text-ok" aria-hidden />
          What actually works
        </h2>
        <ul className="space-y-2.5">
          {works.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FlaskConical className="size-5 text-wait" aria-hidden />
          What is mocked
        </h2>
        <ul className="space-y-2.5">
          {mocked.map((m) => (
            <li key={m} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-wait" aria-hidden />
              {m}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-3 rounded-lg border border-wait-line bg-wait-soft p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-wait" aria-hidden />
          No real Aadhaar, PAN, bank account, phone number or payment detail appears anywhere in this
          build. Every identifier is synthetic and masked.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Server className="size-5 text-info" aria-hidden />
          How this would work at real scale
        </h2>
        <div className="space-y-4">
          {scale.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-5">
              <p className="font-medium">{s.title}</p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-dashed p-5">
        <h2 className="font-semibold">The on-device assistant</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
          The help assistant runs on Chrome’s built-in model, on your own device. Nothing is sent to a
          server and no API key exists. It is only ever allowed to rephrase facts the app has already
          computed — any reply containing a rupee amount, date or reference number that was not in those
          facts is thrown away and the fixed answer is shown instead. Where the built-in model is not
          available, the same fixed answers appear, and the badge in the assistant says so.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/">Try the prototype</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/glossary">Read the glossary</Link>
        </Button>
      </div>
    </div>
  )
}
