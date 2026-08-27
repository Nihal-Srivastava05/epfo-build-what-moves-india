import { Link } from 'react-router-dom'
import { Mail, MessageSquare, Phone, ShieldCheck, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { fmtDate } from '@/lib/format'

const channelIcon = { sms: MessageSquare, email: Mail, call: Phone, inbox: Inbox }
const channelLabel = { sms: 'SMS', email: 'Email', call: 'Phone call', inbox: 'In this app' }

export default function Notifications() {
  const notifications = useData((s) => s.notifications)
  const persona = useSession((s) => s.persona)
  const { lang } = useT()

  const personId = persona === 'pensioner' ? 'p-ram' : 'p-priya'
  const mine = notifications.filter((n) => n.personId === personId)

  return (
    <div>
      <PageHeader
        title="Notifications"
        sub="One list. Every SMS, email and call EPFO sent you appears here as well."
      />

      {/* The anti-scam primitive: absence from this list is the tell. */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-info-line bg-info-soft p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
        <div>
          <p className="font-medium">Did EPFO really send this?</p>
          <p className="mt-1 text-sm leading-relaxed">
            If a message claiming to be from EPFO is not in this list, we did not send it. We never ask
            for an OTP, a fee or your password — not by SMS, not on a call.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {mine.map((n) => {
          const Icon = channelIcon[n.channel]
          return (
            <li key={n.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    <StatusPill tone="ok">Sent by EPFO</StatusPill>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                  <p className="num mt-2 text-xs text-muted-foreground">
                    {channelLabel[n.channel]} · {fmtDate(n.sentAt, lang)}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-sm text-muted-foreground">
        Got a message that is not here?{' '}
        <Link to="/grievance/new" className="font-medium text-foreground underline underline-offset-4">
          Report it
        </Link>
        .
      </p>
    </div>
  )
}
