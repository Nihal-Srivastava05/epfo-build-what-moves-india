import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  HandCoins,
  Landmark,
  ShieldAlert,
  User,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StepActions, StepProgress } from '@/components/patterns/step-flow'
import { PageHeader } from '@/components/patterns/page-header'
import { Money } from '@/components/patterns/money'
import { MockBadge } from '@/components/patterns/mock-badge'
import { StatusPill } from '@/components/patterns/status-pill'
import { Term } from '@/components/patterns/term'
import type { FamilyLink } from '@/lib/types'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { fmtDate, rupees } from '@/lib/format'
import { TODAY, anilKyc, isRegisteredNominee, personById } from '@/lib/mock/db'
import { cn } from '@/lib/utils'

const DEMO_OTP = '284116'

/** A field's inline error, shown once it has been touched — so a fresh, empty
 * field never opens with red text before anyone has typed into it. */
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-stop">
      {children}
    </p>
  )
}

/** Fixed mock figures — a real settlement runs off the deceased member's own ledger. */
const AMOUNT = { pf: 214500, pension: 3250 }

/** Anyone can be a nominee — there is no account to check this against, so a UAN resolves to whichever mock record it matches, or a generic one. */
const MOCK_RECORDS: Record<string, { name: string; establishment: string }> = {
  '100234500021': { name: 'Anil Sharma', establishment: 'Northline Logistics Pvt Ltd' },
}

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other nominee']

const STEP_TITLES = ['Verify the deceased member', 'Documents & payment', 'Review & confirm']

/** The claimant's relationship to the deceased is the mirror of the family
 * link's relationship to the claimant — linking your father makes you their
 * daughter (or son), not "the father" the link is named for. */
function reciprocalRelation(relation: FamilyLink['relation']): string {
  if (relation === 'father' || relation === 'mother') return 'Daughter'
  if (relation === 'spouse') return 'Spouse'
  return 'Other nominee'
}

export default function DeathClaimFile() {
  const { lang } = useT()
  const motionOk = useMotionOk()
  const { fileDeathClaim, familyLinks, kyc } = useData()
  const ownBank = kyc.find((k) => k.key === 'bank')!

  const [params] = useSearchParams()
  const initialType = params.get('type') === 'pension' ? 'pension' : 'pf'
  const [type, setType] = useState<'pf' | 'pension'>(initialType)

  /**
   * Reached from a linked family member's suggestion or their Family card.
   * Re-derived once, at mount, from the URL and the current family links —
   * this only ever pre-fills what's already true (who they are, what your
   * relationship is), never the date of death, which is a fact about this
   * specific claim and always has to be entered fresh.
   */
  const linkedId = params.get('linked') || undefined
  const linkedLink = linkedId
    ? familyLinks.find(
        (f) => f.personId === linkedId && f.scope.includes('file-claims') && isRegisteredNominee(linkedId, personById(f.ownerId).name),
      )
    : undefined
  const linkedPerson = linkedLink ? personById(linkedLink.personId) : undefined
  /** Only Anil is ever a linked deceased today — his bank is the one already
   *  on file, the same record `isRegisteredNominee` checked the nominee against. */
  const linkedBank = linkedLink ? anilKyc.find((k) => k.key === 'bank') : undefined

  const [step, setStep] = useState(1)

  // Step 1 — verifying the deceased member, not the person filing.
  const [deceasedUan, setDeceasedUan] = useState(linkedPerson?.uan.replace(/\s/g, '') ?? '100234500021')
  const [deceasedAadhaar, setDeceasedAadhaar] = useState('XXXX XXXX 5588')
  const [dateOfDeath, setDateOfDeath] = useState('')
  const [verified, setVerified] = useState(Boolean(linkedLink))
  const [relation, setRelation] = useState(linkedLink ? reciprocalRelation(linkedLink.relation) : 'Daughter')
  const [claimantName, setClaimantName] = useState(linkedLink ? 'Priya Sharma' : '')
  const [claimantMobile, setClaimantMobile] = useState('')

  // Step 2 — documents and where the money goes.
  const [deathCert, setDeathCert] = useState(false)
  const [relationProof, setRelationProof] = useState(false)
  const [payoutTo, setPayoutTo] = useState<'linked' | 'own'>(linkedBank ? 'linked' : 'own')

  // Step 3 — confirm.
  const [agreed, setAgreed] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [filedId, setFiledId] = useState<string | null>(null)

  /** Every field validates as it is typed, but only shows red once it has been left. */
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }))

  const record = MOCK_RECORDS[deceasedUan] ?? { name: 'EPF member', establishment: 'their last employer' }

  const uanValid = /^\d{12}$/.test(deceasedUan)
  const aadhaarValid = deceasedAadhaar.trim().length >= 8
  const dodValid = Boolean(dateOfDeath) && dateOfDeath <= TODAY
  const nameValid = claimantName.trim().length > 1
  const mobileValid = /^\d{10}$/.test(claimantMobile)

  const canVerify = uanValid && aadhaarValid && dodValid
  const step1Complete = verified && nameValid && mobileValid
  const docsReady = deathCert && relationProof

  const amount = AMOUNT[type]

  if (filedId) {
    const claim = useData.getState().claims.find((c) => c.id === filedId)!
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <motion.div
          initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionOk ? 0.3 : 0 }}
          className="rounded-lg border border-ok-line bg-ok-soft p-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.03em]">Claim filed</h1>
          <p className="mt-2 text-muted-foreground">
            <Money value={claim.amount} size="lg" /> ·{' '}
            {type === 'pension' ? 'Nominee / Family Pension Claim' : 'PF Death Claim'}
          </p>
          <p className="mt-1 text-sm font-medium">
            Filed as {record.name}'s {relation.toLowerCase()}
          </p>
          <div className="mt-6 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-1">Reference number</p>
            <p className="ident text-[1.125rem] font-bold">{claim.id}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Quote this number in any call or grievance about this claim. We have also sent it by SMS to{' '}
              {claimantMobile}.
            </p>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-2">What happens next</p>
            <p className="text-sm leading-relaxed">
              EPFO is verifying the death certificate and your relationship to {record.name}. No employer
              step is needed here. You should see this settled by{' '}
              <span className="num font-medium">{fmtDate(claim.expectedBy!, lang)}</span>.
            </p>
          </div>
        </motion.div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to={`/signin/member?redirect=${encodeURIComponent(`/member/claims/${claim.id}`)}`}>
              Track this claim
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <PageHeader title={type === 'pension' ? 'Nominee / Family Pension Claim' : 'PF Death Claim'} />
      <StepProgress
        step={step}
        labels={STEP_TITLES}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
      />

      {step === 1 ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <p className="eyebrow mb-3">Which benefit are you filing?</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(['pf', 'pension'] as const).map((k) => {
                const Icon = k === 'pf' ? Wallet : HandCoins
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={cn(
                      'flex items-center gap-3 rounded-md border-[1.35px] p-3.5 text-left transition-colors duration-[var(--dur-fast)]',
                      type === k ? 'border-brand bg-brand-tint' : 'border-border hover:border-brand',
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-[0.875rem] font-semibold">
                        {k === 'pf' ? 'PF Death Claim' : 'Nominee / Family Pension Claim'}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {k === 'pf' ? 'One-time · Form 20' : 'Monthly · Form 10D'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-5">
            <p className="eyebrow mb-1">Verify the deceased member</p>
            <p className="text-sm text-muted-foreground">
              {linkedLink
                ? `${linkedPerson?.name} is already linked to your account, so their UAN and Aadhaar are pre-filled and verified — you only need to confirm the date of death below.`
                : 'No sign-in is needed for this. We identify the deceased member by their own UAN and Aadhaar, not by the person filing.'}
            </p>
            <div className="space-y-2">
              <Label htmlFor="deceased-uan">Deceased member's <Term id="uan">UAN</Term></Label>
              <Input
                id="deceased-uan"
                value={deceasedUan}
                onChange={(e) => {
                  setDeceasedUan(e.target.value.replace(/\D/g, '').slice(0, 12))
                  setVerified(false)
                }}
                onBlur={() => touch('uan')}
                inputMode="numeric"
                aria-invalid={touched.uan && !uanValid}
                aria-describedby={touched.uan && !uanValid ? 'uan-error' : undefined}
                className="ident"
              />
              {touched.uan && !uanValid ? (
                <FieldError id="uan-error">Enter the deceased member's 12-digit UAN.</FieldError>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deceased-aadhaar">Deceased member's Aadhaar number</Label>
              <Input
                id="deceased-aadhaar"
                value={deceasedAadhaar}
                onChange={(e) => {
                  setDeceasedAadhaar(e.target.value)
                  setVerified(false)
                }}
                onBlur={() => touch('aadhaar')}
                aria-invalid={touched.aadhaar && !aadhaarValid}
                aria-describedby={touched.aadhaar && !aadhaarValid ? 'aadhaar-error' : undefined}
                className="ident"
              />
              {touched.aadhaar && !aadhaarValid ? (
                <FieldError id="aadhaar-error">Enter the deceased member's Aadhaar number.</FieldError>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-of-death">Date of death</Label>
              <Input
                id="date-of-death"
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                onBlur={() => touch('dod')}
                max={TODAY}
                aria-invalid={touched.dod && !dodValid}
                aria-describedby={touched.dod && !dodValid ? 'dod-error' : undefined}
                className="num max-w-52"
              />
              {touched.dod && !dodValid ? (
                <FieldError id="dod-error">
                  {dateOfDeath ? 'Date of death cannot be in the future.' : 'Enter the date of death.'}
                </FieldError>
              ) : null}
            </div>

            {!verified ? (
              <div className="flex items-center gap-3 pt-1">
                <Button type="button" disabled={!canVerify} onClick={() => setVerified(true)}>
                  Verify
                </Button>
                <MockBadge what="No real EPFO record is checked. Any UAN, Aadhaar and date are accepted." />
              </div>
            ) : (
              <motion.div
                initial={motionOk ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionOk ? 0.2 : 0 }}
                className="flex items-start gap-3 rounded-md border border-ok-line bg-ok-soft p-3.5"
              >
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                <div>
                  <p className="font-medium">{record.name}</p>
                  <p className="text-sm text-muted-foreground">Last employer: {record.establishment}</p>
                </div>
              </motion.div>
            )}
          </div>

          {verified ? (
            <motion.div
              initial={motionOk ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionOk ? 0.22 : 0 }}
              className="space-y-4 rounded-lg border bg-card p-5"
            >
              <p className="eyebrow mb-1">About you</p>
              <div className="space-y-2">
                <Label htmlFor="claimant-name">Your name</Label>
                <Input
                  id="claimant-name"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  onBlur={() => touch('name')}
                  aria-invalid={touched.name && !nameValid}
                  aria-describedby={touched.name && !nameValid ? 'name-error' : undefined}
                />
                {touched.name && !nameValid ? <FieldError id="name-error">Enter your name.</FieldError> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="relation">Your relationship to {record.name}</Label>
                <Select value={relation} onValueChange={setRelation}>
                  <SelectTrigger id="relation" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimant-mobile">Your mobile number</Label>
                <Input
                  id="claimant-mobile"
                  value={claimantMobile}
                  onChange={(e) => setClaimantMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => touch('mobile')}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  aria-invalid={touched.mobile && !mobileValid}
                  aria-describedby={touched.mobile && !mobileValid ? 'mobile-error' : undefined}
                  className="ident"
                />
                {touched.mobile && !mobileValid ? (
                  <FieldError id="mobile-error">Enter a valid 10-digit mobile number.</FieldError>
                ) : (
                  <p className="text-xs text-muted-foreground">We will send updates and the confirmation code here.</p>
                )}
              </div>
            </motion.div>
          ) : null}

          <StepActions>
            <Button size="lg" disabled={!step1Complete} onClick={() => setStep(2)}>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              {type === 'pension' ? 'Monthly pension amount' : 'Balance payable'}
            </p>
            <Money value={amount} size="xl" mark className="mt-2 block" />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {type === 'pension'
                ? "Based on the deceased member's pensionable service and salary."
                : "The deceased member's full PF balance, including employer and interest credits."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <p className="eyebrow mb-3">Documents</p>
            <label className="flex cursor-pointer items-start gap-3 py-2">
              <Checkbox checked={deathCert} onCheckedChange={(v) => setDeathCert(v === true)} className="mt-0.5" />
              <span className="text-sm leading-relaxed">
                I have the death certificate issued by the municipal authority.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-2">
              <Checkbox
                checked={relationProof}
                onCheckedChange={(v) => setRelationProof(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                I have proof of my relationship to the deceased (nomination record, or a succession
                certificate if none was registered).
              </span>
            </label>
            <MockBadge what="Nothing is uploaded in the prototype — checking these stands in for document verification." />
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-5">
            <p className="eyebrow mb-1">{type === 'pension' ? 'Pay the pension into' : 'Pay the claim into'}</p>

            {linkedBank ? (
              <>
                <p className="text-sm text-muted-foreground">Choose whose bank account this should go to.</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPayoutTo('linked')}
                    className={cn(
                      'flex items-start gap-3 rounded-md border-[1.35px] p-3.5 text-left transition-colors duration-[var(--dur-fast)]',
                      payoutTo === 'linked' ? 'border-brand bg-brand-tint' : 'border-border hover:border-brand',
                    )}
                  >
                    <Landmark className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-[0.875rem] font-semibold">{record.name}'s account</span>
                      <span className="block text-xs text-muted-foreground">On file · verified</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutTo('own')}
                    className={cn(
                      'flex items-start gap-3 rounded-md border-[1.35px] p-3.5 text-left transition-colors duration-[var(--dur-fast)]',
                      payoutTo === 'own' ? 'border-brand bg-brand-tint' : 'border-border hover:border-brand',
                    )}
                  >
                    <User className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-[0.875rem] font-semibold">My own account</span>
                      <span className="block text-xs text-muted-foreground">Enter your bank details</span>
                    </span>
                  </button>
                </div>
              </>
            ) : null}

            {payoutTo === 'linked' && linkedBank ? (
              <div className="flex items-start gap-3 rounded-md border border-ok-line bg-ok-soft p-3.5">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                <div>
                  <p className="font-medium">{linkedBank.value.split(' · ')[0]}</p>
                  <p className="ident mt-0.5 text-sm text-muted-foreground">
                    <Term id="ifsc">IFSC</Term> {linkedBank.value.split(' · ')[1]}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This is your own bank account, as the claimant — not the deceased member's. Shown, not
                  re-entered — EPFO already has it on file against your UAN.
                </p>
                <div className="flex items-start gap-3 rounded-md border p-3.5">
                  <Landmark className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{ownBank.value.split(' · ')[0]}</p>
                    <p className="ident mt-0.5 text-sm text-muted-foreground">
                      <Term id="ifsc">IFSC</Term> {ownBank.value.split(' · ')[1]}
                    </p>
                  </div>
                  {ownBank.status === 'verified' ? (
                    <StatusPill tone="ok" icon={<BadgeCheck className="size-3.5" />}>
                      Verified
                    </StatusPill>
                  ) : (
                    <StatusPill tone="stop">Needs fixing</StatusPill>
                  )}
                </div>
              </>
            )}
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button size="lg" disabled={!docsReady} onClick={() => setStep(3)}>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <dl className="divide-y rounded-lg border bg-card">
            {[
              { k: 'Benefit', v: type === 'pension' ? 'Nominee / Family Pension Claim' : 'PF Death Claim', editStep: 1 },
              { k: 'Deceased member', v: `${record.name} · ${deceasedUan}`, editStep: 1 },
              { k: 'Your relationship', v: relation, editStep: 1 },
              { k: 'Filed by', v: `${claimantName} · ${claimantMobile}`, editStep: 1 },
              { k: type === 'pension' ? 'Monthly amount' : 'Amount', v: rupees(amount), editStep: 2, big: true },
              {
                k: 'Paid into',
                v:
                  payoutTo === 'linked' && linkedBank
                    ? `${record.name}'s account · ${linkedBank.value}`
                    : `Your account · ${ownBank.value}`,
                editStep: 2,
              },
              {
                k: 'Form used',
                v: type === 'pension' ? <Term id="form-10d">Form 10D</Term> : <Term id="form-20">Form 20</Term>,
              },
            ].map((row) => (
              <div key={row.k} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5">
                <dt className="text-sm text-muted-foreground">{row.k}</dt>
                <dd className="flex items-baseline gap-3 text-right">
                  <span className={cn('font-medium', row.big && 'num text-lg')}>{row.v}</span>
                  {row.editStep ? (
                    <button
                      type="button"
                      onClick={() => setStep(row.editStep)}
                      className="!min-h-0 text-sm font-medium text-info underline underline-offset-4"
                    >
                      Edit
                    </button>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-start gap-3 rounded-lg border border-wait-line bg-wait-soft p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-wait" aria-hidden />
            <p className="text-sm leading-relaxed">
              EPFO never asks for money to process a claim, and never calls asking for this code. If
              someone does, it is a scam.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span className="text-sm leading-relaxed">
              The details above are correct to the best of my knowledge.
            </span>
          </label>

          <div className="space-y-2 rounded-lg border bg-card p-5">
            <Label htmlFor="claim-otp">Confirmation code</Label>
            <p className="text-sm text-muted-foreground">Sent to {claimantMobile || 'your mobile number'}</p>
            <div className="flex items-center gap-3">
              <Input
                id="claim-otp"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setOtpError('')
                }}
                inputMode="numeric"
                placeholder="000000"
                aria-invalid={Boolean(otpError)}
                className="ident h-12 max-w-40 text-center text-lg tracking-[0.3em]"
              />
              <span className="ident text-sm text-muted-foreground">{DEMO_OTP}</span>
              <MockBadge what="No SMS is sent. The code is fixed for the prototype." />
            </div>
            {otpError ? <p className="text-sm font-medium text-stop">{otpError}</p> : null}
          </div>

          <StepActions>
            <Button variant="ghost" size="lg" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              size="lg"
              disabled={!agreed}
              onClick={() => {
                if (otp !== DEMO_OTP) {
                  setOtpError(`Enter the code shown above (${DEMO_OTP}).`)
                  return
                }
                const claim = fileDeathClaim({
                  type,
                  deceasedName: record.name,
                  deceasedUan,
                  relation,
                  amount,
                  bankLast4: (payoutTo === 'linked' ? linkedBank : ownBank)?.value.match(/\*{4}(\d{4})/)?.[1],
                })
                setFiledId(claim.id)
              }}
            >
              Confirm
            </Button>
          </StepActions>
        </div>
      ) : null}

      <div className="mt-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/death-claim">Cancel</Link>
        </Button>
      </div>
    </div>
  )
}
