import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, BadgeCheck, CheckCircle2, HandCoins, ShieldCheck, Users } from 'lucide-react'
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
import { MockBadge } from '@/components/patterns/mock-badge'
import { isRegisteredNominee, people, personById } from '@/lib/mock/db'
import type { FamilyLink } from '@/lib/types'
import { useData } from '@/store/data'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

const DEMO_OTP = '284116'

const STEP_TITLES = ['Who are you linking', 'Verify it’s them', 'What they allow']

const RELATIONS: FamilyLink['relation'][] = ['father', 'mother', 'spouse', 'other']

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-stop">
      {children}
    </p>
  )
}

/**
 * Linking is mutual, not a one-sided add: the family member's own UAN has to
 * resolve to a real record, and the OTP step stands in for *their* device
 * confirming it, not Priya's. Only then does step 3 hand over a scoped,
 * revocable permission — the thing the ask-anything bar is later allowed to
 * act on.
 */
export default function FamilyLink() {
  const motionOk = useMotionOk()
  const { linkFamilyMember, familyLinks } = useData()

  const [step, setStep] = useState(1)

  // Step 1 — who.
  const [name, setName] = useState('Anil Sharma')
  const [relation, setRelation] = useState<FamilyLink['relation']>('father')
  const [uan, setUan] = useState('100234500021')
  const [uanTouched, setUanTouched] = useState(false)

  // Step 2 — verify.
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [verified, setVerified] = useState(false)

  // Step 3 — scope.
  const [viewBalance, setViewBalance] = useState(true)
  const [fileClaims, setFileClaims] = useState(false)

  const [linkedId, setLinkedId] = useState<string | null>(null)

  const uanValid = /^\d{12}$/.test(uan)
  const match = uanValid ? people.find((p) => p.uan === uan) : undefined
  const nameValid = name.trim().length > 1
  const alreadyLinked = match ? familyLinks.some((f) => f.personId === match.id) : false
  /** Filing on someone's behalf is only ever available to their registered
   *  nominee — the same fact a real EPFO claim runs on, checked here rather
   *  than left as a checkbox anyone could tick. */
  const isNominee = match ? isRegisteredNominee(match.id, personById('p-priya').name) : false

  if (linkedId) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionOk ? 0.3 : 0 }}
          className="rounded-lg border border-ok-line bg-ok-soft p-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.03em]">Linked</h1>
          <p className="mt-2 text-muted-foreground">
            {match?.name} is now linked to your account, with the permissions you chose.
          </p>
        </motion.div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link to="/member/family">See your family</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to="/member">Back to home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Link a family member" />
      <StepProgress step={step} labels={STEP_TITLES} onBack={step > 1 ? () => setStep(step - 1) : undefined} />

      {step === 1 ? (
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <p className="eyebrow mb-1">Who are you linking?</p>
            <div className="space-y-2">
              <Label htmlFor="fam-name">Their name</Label>
              <Input id="fam-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fam-relation">Relationship to you</Label>
              <Select value={relation} onValueChange={(v) => setRelation(v as FamilyLink['relation'])}>
                <SelectTrigger id="fam-relation" className="w-full capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fam-uan">Their UAN</Label>
              <Input
                id="fam-uan"
                value={uan}
                onChange={(e) => setUan(e.target.value.replace(/\D/g, '').slice(0, 12))}
                onBlur={() => setUanTouched(true)}
                inputMode="numeric"
                aria-invalid={uanTouched && !match}
                aria-describedby={uanTouched && !match ? 'uan-error' : undefined}
                className="ident"
              />
              {uanTouched && uanValid && !match ? (
                <FieldError id="uan-error">No EPFO account is on record for this UAN.</FieldError>
              ) : uanTouched && !uanValid ? (
                <FieldError id="uan-error">Enter their 12-digit UAN.</FieldError>
              ) : null}
              {match && alreadyLinked ? (
                <FieldError id="uan-error">{match.name} is already linked to your account.</FieldError>
              ) : null}
              {match && !alreadyLinked ? (
                <p className="flex items-center gap-2 text-sm text-ok">
                  <BadgeCheck className="size-4" aria-hidden />
                  Found: {match.name}
                </p>
              ) : null}
            </div>
          </div>

          <StepActions>
            <Button asChild variant="ghost" size="lg">
              <Link to="/member/family">Cancel</Link>
            </Button>
            <Button
              size="lg"
              disabled={!nameValid || !match || alreadyLinked}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <p className="eyebrow mb-1">Verify it's really them</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A one-time code was sent to {match?.name}'s own phone. Linking only completes once they
              read it out to you — this is what makes it their consent, not just yours.
            </p>
            {!verified ? (
              <div className="space-y-2">
                <Label htmlFor="fam-otp">One-time code</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="fam-otp"
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
                  <MockBadge what="No SMS is sent. This stands in for the family member confirming on their own device." />
                </div>
                {otpError ? <p className="text-sm font-medium text-stop">{otpError}</p> : null}
                <Button
                  type="button"
                  className="mt-2"
                  onClick={() => {
                    if (otp !== DEMO_OTP) {
                      setOtpError(`Enter the code shown above (${DEMO_OTP}).`)
                      return
                    }
                    setVerified(true)
                  }}
                >
                  Verify
                </Button>
              </div>
            ) : (
              <motion.div
                initial={motionOk ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionOk ? 0.2 : 0 }}
                className="flex items-start gap-3 rounded-md border border-ok-line bg-ok-soft p-3.5"
              >
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                <p className="font-medium">Confirmed by {match?.name}</p>
              </motion.div>
            )}
          </div>

          <StepActions>
            <Button size="lg" disabled={!verified} onClick={() => setStep(3)}>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </StepActions>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <p className="eyebrow mb-1">What can you do on their behalf?</p>
            <p className="text-sm text-muted-foreground">
              Pick only what you need. Either can be switched off any time from Family settings.
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
              <Checkbox checked={viewBalance} onCheckedChange={(v) => setViewBalance(v === true)} className="mt-0.5" />
              <span className="flex items-start gap-2 text-sm leading-relaxed">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                View their balance and claim status.
              </span>
            </label>
            <label
              className={cn(
                'flex items-start gap-3 rounded-lg border p-4',
                isNominee ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
              )}
            >
              <Checkbox
                checked={fileClaims && isNominee}
                disabled={!isNominee}
                onCheckedChange={(v) => setFileClaims(v === true)}
                className="mt-0.5"
              />
              <span className="flex items-start gap-2 text-sm leading-relaxed">
                <HandCoins className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                File a claim for them, against their own balance and eligibility.
              </span>
            </label>
            <p className={cn('pl-7 text-xs leading-relaxed', isNominee ? 'text-ok' : 'text-muted-foreground')}>
              {isNominee
                ? `${match?.name} has registered you as their nominee, so this is available.`
                : `Only available if ${match?.name} has registered you as their nominee — the same fact a real EPFO claim runs on. This checks their actual nominee record, not just this checkbox.`}
            </p>
            <div className="flex items-start gap-2.5 rounded-lg border border-info-line bg-info-soft p-3.5 text-sm leading-relaxed">
              <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
              Not a shared login — {match?.name} keeps their own account exactly as it is. This only
              grants the permissions checked above.
            </div>
          </div>

          <StepActions>
            <Button
              size="lg"
              onClick={() => {
                const link = linkFamilyMember({
                  personId: match!.id,
                  relation,
                  scope: [
                    ...(viewBalance ? (['view-balance'] as const) : []),
                    ...(fileClaims && isNominee ? (['file-claims'] as const) : []),
                  ],
                })
                setLinkedId(link.id)
              }}
            >
              Confirm link
            </Button>
          </StepActions>
        </div>
      ) : null}
    </div>
  )
}
