import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { StatusPill } from '@/components/patterns/status-pill'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { fmtDate, fmtUan } from '@/lib/format'

export default function Employees() {
  const roster = useData((s) => s.roster)
  const { lang } = useT()
  const [q, setQ] = useState('')

  const rows = roster.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.uan.includes(q.replace(/\s/g, '')),
  )

  return (
    <div>
      <PageHeader title="Employees" sub={`${roster.filter((r) => !r.exited).length} on roll`} />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or UAN"
        className="mb-4 h-11 max-w-sm"
        aria-label="Search employees"
      />

      {/* Cards on mobile, a table only where there is room for one. */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r) => (
          <li key={r.uan} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{r.name}</p>
                <p className="ident text-sm text-muted-foreground">{fmtUan(r.uan)}</p>
              </div>
              <StatusPill tone={r.kyc === 'verified' ? 'ok' : r.kyc === 'pending' ? 'neutral' : 'wait'}>
                {r.kyc === 'verified' ? 'KYC done' : r.kyc === 'pending' ? 'KYC pending' : 'KYC issue'}
              </StatusPill>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="num text-muted-foreground">{fmtDate(r.joined, lang)}</span>
              <Money value={r.monthlyWage} size="sm" />
            </div>
            {r.exited ? (
              <p className="num mt-2 text-xs text-muted-foreground">Left {fmtDate(r.exited, lang)}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">UAN</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Monthly wage</th>
              <th className="px-4 py-3 text-left font-medium">KYC</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.uan} className={r.exited ? 'text-muted-foreground' : ''}>
                <td className="px-4 py-3 font-medium">
                  {r.name}
                  {r.exited ? (
                    <span className="num ml-2 text-xs font-normal">left {fmtDate(r.exited, lang)}</span>
                  ) : null}
                </td>
                <td className="ident px-4 py-3">{fmtUan(r.uan)}</td>
                <td className="num px-4 py-3">{fmtDate(r.joined, lang)}</td>
                <td className="px-4 py-3 text-right">
                  <Money value={r.monthlyWage} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={r.kyc === 'verified' ? 'ok' : r.kyc === 'pending' ? 'neutral' : 'wait'}>
                    {r.kyc}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
