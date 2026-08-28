import { Link } from 'react-router-dom'
import { CalendarCheck, ShieldAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanelTitle } from '@/components/patterns/page-header'
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
  const last = pensionPayments[0]
  const daysLeft = daysBetween(new Date().toISOString().slice(0, 10), pensioner.lifeCertificateValidTill)
  const expiringSoon = daysLeft <= 120

  return (
    <div className="space-y-4">
      {/* Amount and date first. That is what a pensioner opens this for. */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="flex flex-col gap-4 rounded-lg bg-hero p-6 text-hero-foreground">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.055em] text-hero-foreground/70">
            Every month
          </p>
          <Money value={pensioner.monthlyAmount} size="hero" />
          <p className="text-[0.8125rem] text-hero-foreground/80">
            Into {pensioner.bankName} ending <span className="ident">{pensioner.bankLast4}</span>
          </p>
          <p className="num mt-auto text-xs text-hero-foreground/60">
            {me.name} · PPO {pensioner.ppo} · {pensioner.scheme}
          </p>
        </section>

        <section className="flex flex-col rounded-lg border bg-card p-5">
          <p className="eyebrow mb-2">Next credit</p>
          <p className="figure text-[1.75rem]">{fmtDate(pensioner.nextCreditOn, lang)}</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Paid on the first working day of every month through <Term id="cpps">CPPS</Term>.
          </p>
          {last ? (
            <p className="mt-auto flex items-center gap-2 border-t pt-3 text-[0.8125rem] text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
              Last credit <Money value={last.amount} size="sm" className="font-bold text-foreground" />{' '}
              on {fmtDate(last.creditedOn, lang)}
            </p>
          ) : null}
        </section>
      </div>

      {expiringSoon ? (
        <ActionCard
          severity={daysLeft <= 30 ? 'blocker' : 'warning'}
          title={`Your life certificate expires in ${daysLeft} days`}
          detail={
            <>
              It is valid until{' '}
              <span className="num font-semibold text-foreground">
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
            <p className="font-semibold">Your life certificate is up to date</p>
            <p className="num mt-1 text-sm text-muted-foreground">
              Valid until {fmtDate(pensioner.lifeCertificateValidTill, lang)}. Nothing is needed from you.
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="recent" className="rounded-lg border bg-card">
        <PanelTitle
          className="border-b px-5 py-3.5"
          action={
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link to="/pensioner/payments">All payments</Link>
            </Button>
          }
        >
          <span id="recent">Recent payments</span>
        </PanelTitle>
        <ul className="divide-y">
          {pensionPayments.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-muted">
                <Wallet className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{fmtMonthLong(p.month)}</p>
                <p className="num text-xs text-muted-foreground">{fmtDate(p.creditedOn, lang)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Money value={p.amount} className="font-bold" />
                <StatusPill tone="ok">Credited</StatusPill>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Fraud aimed at pensioners is the most common of all, so it is said here. */}
      <section className="flex items-start gap-3.5 rounded-lg border-[1.35px] border-wait bg-card p-5">
        <span
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-wait-soft text-wait"
          aria-hidden
        >
          <ShieldAlert className="size-[1.125rem]" />
        </span>
        <div>
          <p className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
            Nobody from EPFO will ever ask you for an OTP
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
