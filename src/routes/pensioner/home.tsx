import { Link } from 'react-router-dom'
import { CalendarCheck, ShieldAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { ActionCard } from '@/components/patterns/action-card'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { daysBetween, fmtDate, fmtMonthLong } from '@/lib/format'
import { personById } from '@/lib/mock/db'

export default function PensionerHome() {
  const { pensioner, pensionPayments } = useData()
  const { lang } = useT()
  const me = personById('p-ram')
  const daysLeft = daysBetween(new Date().toISOString().slice(0, 10), pensioner.lifeCertificateValidTill)
  const expiringSoon = daysLeft <= 120

  return (
    <div className="space-y-10">
      {/* Amount and date first. That is what a pensioner opens this for. */}
      <section>
        <PageHeader
          eyebrow={`${me.name} · PPO ${pensioner.ppo}`}
          title="Your pension"
          sub={pensioner.scheme}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <p className="eyebrow mb-2">Every month</p>
            <Money value={pensioner.monthlyAmount} size="xl" />
            <p className="mt-2 text-sm text-muted-foreground">
              Into {pensioner.bankName} ending <span className="ident">{pensioner.bankLast4}</span>
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 rule-gold">
            <p className="eyebrow mb-2">Next credit</p>
            <p className="num text-2xl font-semibold tracking-tight">
              {fmtDate(pensioner.nextCreditOn, lang)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Paid on the first working day of every month through <Term id="cpps">CPPS</Term>.
            </p>
          </div>
        </div>
      </section>

      {expiringSoon ? (
        <ActionCard
          severity={daysLeft <= 30 ? 'blocker' : 'warning'}
          title={`Your life certificate expires in ${daysLeft} days`}
          detail={
            <>
              It is valid until{' '}
              <span className="num font-medium text-foreground">
                {fmtDate(pensioner.lifeCertificateValidTill, lang)}
              </span>
              . If it lapses, your pension stops until you submit a new one. There are three free ways to
              do it and the quickest takes about two minutes.
            </>
          }
          fix={{ label: 'Submit it now', href: '#/pensioner/life-certificate' }}
        />
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-ok-line bg-ok-soft p-4">
          <CalendarCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-medium">Your life certificate is up to date</p>
            <p className="num mt-1 text-sm text-muted-foreground">
              Valid until {fmtDate(pensioner.lifeCertificateValidTill, lang)}. Nothing is needed from you.
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="recent">
        <SectionTitle
          action={
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/pensioner/payments">All payments</Link>
            </Button>
          }
        >
          <span id="recent">Recent payments</span>
        </SectionTitle>
        <ul className="divide-y rounded-xl border bg-card">
          {pensionPayments.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Wallet className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{fmtMonthLong(p.month)}</p>
                <p className="num text-sm text-muted-foreground">{fmtDate(p.creditedOn, lang)}</p>
              </div>
              <div className="text-right">
                <Money value={p.amount} className="font-medium" />
                <StatusPill tone="ok" className="mt-1">
                  Credited
                </StatusPill>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Fraud aimed at pensioners is the most common of all, so it is said here. */}
      <section className="flex items-start gap-3 rounded-xl border border-wait-line bg-wait-soft p-5">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-wait" aria-hidden />
        <div>
          <p className="font-medium">Nobody from EPFO will ever ask you for an OTP</p>
          <p className="mt-1 text-sm leading-relaxed">
            Not for your pension, not for your life certificate, not for a fee. Every message we send you
            is listed in your notifications — if a message is not there, it did not come from us.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link to="/notifications">Check what we sent you</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
