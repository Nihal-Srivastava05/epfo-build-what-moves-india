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
      <div className="mb-4 flex items-start gap-3 rounded-lg bg-info-soft p-4 text-info">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Did EPFO really send this?</p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed">
            If a message claiming to be from EPFO is not in this list, we did not send it. We never ask
            for an OTP, a fee or your password — not by SMS, not on a call.
          </p>
        </div>
      </div>

      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {mine.map((n) => {
          const Icon = channelIcon[n.channel]
          return (
            <li key={n.id} className="flex items-start gap-3.5 px-5 py-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-muted">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <StatusPill tone="ok">Sent by EPFO</StatusPill>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">{n.body}</p>
                <p className="num mt-1.5 text-xs text-faint">
                  {channelLabel[n.channel]} · {fmtDate(n.sentAt, lang)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-sm text-muted-foreground">
        Got a message that is not here?{' '}
        <Link to="/grievance/new" className="font-medium text-foreground underline underline-offset-4">
          Report it
        </Link>
        .
      </p>
    </div>
  )
}
