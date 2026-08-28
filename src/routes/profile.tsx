import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Download, Pencil, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { useIdentity } from '@/hooks/use-identity'
import { serviceYears } from '@/lib/derive'
import { downloadCsv, exportName } from '@/lib/export'
import { daysBetween, fmtDate, fmtMonth, fmtUan, rupees } from '@/lib/format'
import { TODAY, employments, establishmentByCode, establishments, personById } from '@/lib/mock/db'
import type { Gender, KycItem, KycStatus, Person } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Everything EPFO holds about the person signed in, on one page reached from
 * the avatar. It is deliberately a *reading* page: nothing here is edited in
 * place, because every editable field is a KYC record that has to be
 * re-verified. So each of those carries a link to the one screen that owns it,
 * and the page never shows a value without saying whether it has been checked.
 */

const genderLabel: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
}

const relationLabel: Record<Person['relationKind'], string> = {
  father: 'Father’s name',
  mother: 'Mother’s name',
  spouse: 'Spouse’s name',
}

interface Row {
  key: string
  label: ReactNode
  /** Plain-text label for the CSV, where the on-screen one is a glossary link. */
  csvLabel?: string
  /** Undefined means EPFO holds nothing here — said plainly, never left blank. */
  value?: string
  /** EPFO holds nothing here. Said in words, never rendered as a blank cell. */
  missing?: boolean
  hint?: string
  status?: KycStatus
  /** The quick link: the one screen that can change this value. */
  action?: { label: string; to: string; icon?: typeof Pencil }
}

interface Group {
  title: string
  note?: string
  rows: Row[]
}

/** A value with a digit in it is set in the tabular identifier face. */
function isIdent(value: string) {
  return /\d/.test(value)
}

function age(dob: string) {
  return Math.floor(daysBetween(dob, TODAY) / 365.25)
}

function FieldRow({ row }: { row: Row }) {
  const Icon = row.action?.icon ?? Pencil
  const missing = row.missing || !row.value
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
      <div className="min-w-[9rem] flex-1">
        <dt className="text-sm text-muted-foreground">{row.label}</dt>
        <dd className="mt-0.5">
          <span
            className={cn(
              'text-sm font-medium',
              missing && 'text-muted-foreground italic',
              row.value && isIdent(row.value) && 'ident',
            )}
          >
            {row.value ?? 'Not on record'}
          </span>
          {row.hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{row.hint}</span> : null}
        </dd>
      </div>

      {row.status === 'verified' ? (
        <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
          Verified
        </StatusPill>
      ) : row.status ? (
        <StatusPill tone={missing ? 'stop' : 'wait'}>Needs you</StatusPill>
      ) : null}

      {row.action ? (
        <Button asChild size="sm" variant={row.status && row.status !== 'verified' ? 'default' : 'ghost'}>
          <Link to={row.action.to}>
            <Icon className="size-3.5" aria-hidden />
            {row.action.label}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

/** KYC rows read from the KYC store, so this page can never drift from it. */
function kycRow(
  items: KycItem[],
  key: KycItem['key'],
  label: ReactNode,
  action: { label: string; addLabel: string; to: string },
  csvLabel?: string,
): Row {
  const item = items.find((k) => k.key === key)
  const missing = !item || /^not added$/i.test(item.value)
  return {
    key,
    label,
    csvLabel,
    value: item?.value,
    missing,
    hint: item?.status === 'verified' ? undefined : item?.problem,
    status: item?.status ?? 'pending',
    action: {
      // The KYC screen's own wording for the fix, so the two screens never
      // describe the same repair with two different verbs.
      label: missing ? action.addLabel : (item?.fixLabel ?? action.label),
      to: action.to,
      icon: missing ? Plus : Pencil,
    },
  }
}

function memberGroups(kyc: KycItem[], me: Person): Group[] {
  const current = employments.find((e) => e.current && e.personId === me.id)
  const est = current ? establishmentByCode(current.estCode) : undefined
  const firstJoined = employments
    .filter((e) => e.personId === me.id)
    .map((e) => e.joined)
    .sort()[0]

  return [
    {
      title: 'Personal details',
      note: 'Held from your Aadhaar. A change here is made at Aadhaar first, then flows in.',
      rows: [
        { key: 'name', label: 'Name', value: me.name, status: 'verified' },
        {
          key: 'dob',
          label: 'Date of birth',
          value: fmtDate(me.dob),
          hint: `${age(me.dob)} years old`,
          status: 'verified',
        },
        { key: 'gender', label: 'Gender', value: genderLabel[me.gender], status: 'verified' },
        { key: 'relation', label: relationLabel[me.relationKind], value: me.relationName },
      ],
    },
    {
      title: 'Identity and contact',
      note: 'These decide whether a claim can be paid. Aadhaar, mobile and bank are fixed on the KYC screen; PAN and email are held elsewhere.',
      rows: [
        kycRow(kyc, 'aadhaar', 'Aadhaar', {
          label: 'Change',
          addLabel: 'Link Aadhaar',
          to: '/member/kyc',
        }),
        {
          // PAN is issued by the Income Tax Department, not EPFO. A "Change"
          // button here would promise something this service cannot do, so the
          // row states where the correction actually has to be made.
          key: 'pan',
          label: 'PAN',
          value: kyc.find((k) => k.key === 'pan')?.value,
          status: kyc.find((k) => k.key === 'pan')?.status,
          hint: 'Corrected with the Income Tax Department. The new PAN then flows in here.',
        },
        kycRow(kyc, 'mobile', 'Mobile number', {
          label: 'Change',
          addLabel: 'Add mobile number',
          to: '/member/kyc',
        }),
        {
          // No quick link: email is not a KYC record, so there is no screen
          // that re-verifies it. A button here would be a dead end.
          key: 'email',
          label: 'Email',
          value: me.email,
          hint: 'Where claim acknowledgements are sent. Changed by writing to your EPFO office.',
        },
      ],
    },
    {
      title: 'Where money is paid',
      note: 'Every settlement goes here. A wrong IFSC is the single most common reason a claim is returned.',
      rows: [
        kycRow(
          kyc,
          'bank',
          <Term id="ifsc">Bank account</Term>,
          { label: 'Change', addLabel: 'Add bank account', to: '/member/kyc' },
          'Bank account',
        ),
        kycRow(
          kyc,
          'nominee',
          <Term id="nominee">Nominee</Term>,
          { label: 'Change', addLabel: 'Add a nominee', to: '/member/kyc' },
          'Nominee',
        ),
      ],
    },
    {
      title: 'Employment',
      note: 'Your employer owns these. Ask them to correct anything wrong here — EPFO cannot.',
      rows: [
        {
          key: 'employer',
          label: 'Current employer',
          value: est?.name,
          hint: est ? est.city : 'No current employer on record.',
          status: est ? 'verified' : undefined,
        },
        { key: 'est', label: 'Establishment code', value: est?.code },
        {
          key: 'joined',
          label: 'Date of joining',
          value: current ? fmtDate(current.joined) : undefined,
        },
        {
          key: 'wage',
          label: 'Monthly EPF wage',
          value: current ? rupees(current.monthlyWage) : undefined,
          hint: current ? 'What your 12% is calculated on.' : undefined,
        },
        {
          key: 'since',
          label: 'EPF member since',
          value: firstJoined ? fmtMonth(firstJoined.slice(0, 7)) : undefined,
          hint: `${serviceYears()} years of membership across ${employments.filter((e) => e.personId === me.id).length} employers`,
          // The one screen that holds every past employer, gap and wage — this
          // row states the total, that screen shows the working behind it.
          action: {
            label: 'View service history',
            to: '/member/service-history',
            icon: ArrowRight,
          },
        },
      ],
    },
  ]
}

function employerGroups(me: Person, onRoll: number): Group[] {
  const est = establishments[0]
  return [
    {
      title: 'Personal details',
      rows: [
        { key: 'name', label: 'Name', value: me.name, status: 'verified' },
        { key: 'dob', label: 'Date of birth', value: fmtDate(me.dob), status: 'verified' },
        { key: 'gender', label: 'Gender', value: genderLabel[me.gender] },
        { key: 'relation', label: relationLabel[me.relationKind], value: me.relationName },
      ],
    },
    {
      title: 'Identity and contact',
      rows: [
        { key: 'aadhaar', label: 'Aadhaar', value: me.aadhaarMasked, status: 'verified' },
        { key: 'pan', label: 'PAN', value: me.panMasked, status: 'verified' },
        { key: 'mobile', label: 'Mobile number', value: me.mobileMasked, status: 'verified' },
        { key: 'email', label: 'Email', value: me.email },
      ],
    },
    {
      title: 'Establishment you file for',
      note: 'You sign returns and attestations on behalf of this establishment.',
      rows: [
        { key: 'est-name', label: 'Establishment', value: est.name, status: 'verified' },
        { key: 'est-code', label: 'Establishment code', value: est.code },
        { key: 'city', label: 'Location', value: est.city },
        { key: 'covered', label: 'Covered since', value: fmtDate(est.coveredSince) },
        {
          key: 'roster',
          label: 'Employees on roll',
          value: String(onRoll),
          action: { label: 'Open the roster', to: '/employer/employees' },
        },
      ],
    },
  ]
}

function pensionerGroups(me: Person, bank: string, nominee: string): Group[] {
  return [
    {
      title: 'Personal details',
      rows: [
        { key: 'name', label: 'Name', value: me.name, status: 'verified' },
        {
          key: 'dob',
          label: 'Date of birth',
          value: fmtDate(me.dob),
          hint: `${age(me.dob)} years old`,
          status: 'verified',
        },
        { key: 'gender', label: 'Gender', value: genderLabel[me.gender], status: 'verified' },
        { key: 'relation', label: relationLabel[me.relationKind], value: me.relationName },
      ],
    },
    {
      title: 'Identity and contact',
      rows: [
        { key: 'aadhaar', label: 'Aadhaar', value: me.aadhaarMasked, status: 'verified' },
        { key: 'pan', label: 'PAN', value: me.panMasked, status: 'verified' },
        { key: 'mobile', label: 'Mobile number', value: me.mobileMasked, status: 'verified' },
        { key: 'email', label: 'Email', value: me.email },
      ],
    },
    {
      title: 'Pension',
      rows: [
        {
          key: 'bank',
          label: 'Bank account',
          value: bank,
          status: 'verified',
          action: { label: 'Change', to: '/pensioner/details' },
        },
        { key: 'nominee', label: 'Family pension nominee', value: nominee, status: 'verified' },
        {
          key: 'details',
          label: 'Everything else on your record',
          value: 'Scheme, life certificate, payment route',
          action: { label: 'Open', to: '/pensioner/details' },
        },
      ],
    },
  ]
}

export default function Profile() {
  const persona = useSession((s) => s.persona)
  const kyc = useData((s) => s.kyc)
  const pensioner = useData((s) => s.pensioner)
  const onRoll = useData((s) => s.roster.filter((r) => !r.exited).length)
  const identity = useIdentity()
  const { t } = useT()

  const me = personById(
    persona === 'member' ? 'p-priya' : persona === 'employer' ? 'p-hr' : 'p-ram',
  )

  const groups =
    persona === 'member'
      ? memberGroups(kyc, me)
      : persona === 'employer'
        ? employerGroups(me, onRoll)
        : pensionerGroups(
            me,
            `${pensioner.bankName} ending ${pensioner.bankLast4}`,
            pensioner.familyPensionNominee,
          )

  /** Only the member's record has a live KYC score to report. */
  const verified = persona === 'member' ? kyc.filter((k) => k.status === 'verified').length : 0
  const pending = persona === 'member' ? kyc.length - verified : 0

  const exportProfile = () => {
    downloadCsv(exportName(['epfo-profile', me.uan], 'csv'), [
      ['EPFO profile (prototype — every figure below is synthetic)'],
      ['Name', me.name],
      ['UAN', me.uan],
      ...groups.flatMap((g) => [
        [],
        [g.title],
        ...g.rows.map((r) => [
          r.csvLabel ?? (typeof r.label === 'string' ? r.label : r.key),
          r.value ?? 'Not on record',
          r.status ?? '',
        ]),
      ]),
    ])
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('nav.profile')}
        sub="Everything EPFO holds about you, in one place. Nothing here is edited in passing — each value links to the screen that can change it, so a correction is always re-verified."
        action={
          <Button variant="outline" onClick={exportProfile}>
            <Download className="size-4" aria-hidden />
            Download
          </Button>
        }
      />

      {/* The identity card. The UAN is the largest thing on the page because it
          is the one number every EPFO conversation starts with. */}
      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
            aria-hidden
          >
            {identity.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[1.25rem] font-bold tracking-[-0.02em]">{me.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(`persona.${persona}`)}</p>
          </div>
          {persona === 'member' ? (
            <StatusPill
              tone={pending === 0 ? 'ok' : 'wait'}
              icon={pending === 0 ? <ShieldCheck className="size-3.5" /> : undefined}
            >
              {pending === 0 ? 'Ready to claim' : `${pending} to fix`}
            </StatusPill>
          ) : null}
        </div>

        <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <div>
            <dt className="eyebrow mb-1.5">{persona === 'pensioner' ? 'PPO number' : 'UAN'}</dt>
            <dd className="ident text-[1.375rem] font-bold tracking-[-0.01em]">
              {persona === 'pensioner' ? pensioner.ppo : fmtUan(me.uan)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow mb-1.5">Registered mobile</dt>
            <dd className="ident text-[1.375rem] font-bold tracking-[-0.01em]">{me.mobileMasked}</dd>
          </div>
        </dl>

        {persona === 'member' && pending > 0 ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-muted p-3.5">
            <p className="text-[0.8125rem] leading-relaxed">
              <span className="num font-semibold">{verified}</span> of{' '}
              <span className="num font-semibold">{kyc.length}</span> records verified.{' '}
              {pending === 1 ? 'One thing' : `${pending} things`} would hold a claim up today.
            </p>
            <Button asChild size="sm">
              <Link to="/member/kyc">{t('nav.kyc')}</Link>
            </Button>
          </div>
        ) : null}
      </section>

      {groups.map((g) => (
        <section key={g.title} className="mt-7">
          <SectionTitle>{g.title}</SectionTitle>
          <dl className="divide-y overflow-hidden rounded-lg border bg-card">
            {g.rows.map((r) => (
              <FieldRow key={r.key} row={r} />
            ))}
          </dl>
          {g.note ? <p className="mt-2.5 text-xs text-muted-foreground">{g.note}</p> : null}
        </section>
      ))}

      <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
        {persona === 'employer'
          ? 'Identifiers are masked everywhere in this prototype. Changing anything on this page is re-verified with a code sent to your registered mobile — that is the only time you would be asked for one.'
          : 'Identifiers are masked everywhere in this prototype. Changing a bank account, mobile number or nominee is re-verified with a code sent to your registered mobile — that is the only time you would be asked for one.'}
      </p>
    </div>
  )
}
