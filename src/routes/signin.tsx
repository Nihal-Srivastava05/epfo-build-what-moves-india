import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/store/session'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { Term } from '@/components/patterns/term'
import { MockBadge } from '@/components/patterns/mock-badge'
import type { Persona } from '@/lib/types'
import { personaMeta } from '@/lib/nav'
import { cn } from '@/lib/utils'

const DEMO_OTP = '284116'

const identity: Record<Persona, { labelKey: 'signin.uan' | 'signin.ppo' | 'signin.est'; value: string; termId: string }> = {
  member: { labelKey: 'signin.uan', value: '1002 3456 7890', termId: 'uan' },
  employer: { labelKey: 'signin.est', value: 'MHBAN0045123000', termId: 'ecr' },
  pensioner: { labelKey: 'signin.ppo', value: 'MH/PUN/00123456', termId: 'ppo' },
}

export default function SignIn() {
  const { persona: routePersona } = useParams()
  const persona = (routePersona as Persona) ?? 'member'
  const [stage, setStage] = useState<'id' | 'otp'>('id')
  const [id, setId] = useState(identity[persona].value)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const signIn = useSession((s) => s.signIn)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { t } = useT()
  const motionOk = useMotionOk()
  const Icon = personaMeta[persona].icon

  const verify = () => {
    if (otp.length !== 6) {
      setError('Enter all six digits of the code.')
      return
    }
    if (otp !== DEMO_OTP) {
      setError(`That code does not match. In this prototype the code is ${DEMO_OTP}.`)
      return
    }
    signIn(persona)
    const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null
    navigate(safeRedirect ?? personaMeta[persona].home, { replace: true })
  }

  const copyOtp = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_OTP)
      setCopied(true)
      toast.success('Code copied.')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy the code.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[27rem] px-4 py-12 sm:py-16">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link to="/">
          <ArrowLeft className="size-4" aria-hidden />
          {t('landing.choose')}
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-tint text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">{t('signin.title')}</h1>
          <p className="text-sm text-muted-foreground">{t(`persona.${persona}`)}</p>
        </div>
      </div>

      <p className="mb-6 flex items-start gap-2.5 rounded-sm bg-brand-tint p-3.5 text-[0.8125rem] leading-relaxed text-primary">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('signin.oneAccount')}
      </p>

      {stage === 'id' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setStage('otp')
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="identity" className="text-xs font-semibold text-muted-foreground">
              <Term id={identity[persona].termId}>{t(identity[persona].labelKey)}</Term>
            </Label>
            <Input
              id="identity"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="ident h-12 text-base font-semibold tracking-[0.03em]"
              inputMode={persona === 'member' ? 'numeric' : 'text'}
              autoComplete="off"
            />
            {persona === 'member' ? (
              <p className="text-[0.8125rem] text-muted-foreground">{t('signin.uanHint')}</p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full">
            {t('signin.send')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <motion.form
          initial={motionOk ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.2 : 0 }}
          onSubmit={(e) => {
            e.preventDefault()
            verify()
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-semibold text-muted-foreground">
              {t('signin.otp')}
            </Label>
            <p className="text-[0.8125rem] text-muted-foreground">
              {t('signin.otpSent')} +91 98XXX XX210
            </p>

            {/* One real field behind six boxes: the caret, paste and screen
                reader all keep working, and the digits still land in cells. */}
            <div className="relative">
              <input
                id="otp"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setError('')
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'otp-error' : undefined}
                className="peer absolute inset-0 z-10 w-full rounded-sm bg-transparent text-transparent caret-transparent outline-none"
              />
              <div className="flex gap-2" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'num grid h-14 flex-1 place-items-center rounded-sm border-[1.35px] bg-card text-[1.375rem] font-bold',
                      error ? 'border-stop' : otp.length > i ? 'border-brand' : 'border-input',
                      otp.length === i ? 'peer-focus:border-brand peer-focus:bg-brand-tint' : '',
                    )}
                  >
                    {otp[i] ?? ''}
                  </span>
                ))}
              </div>
            </div>

            {error ? (
              <p id="otp-error" className="text-[0.8125rem] font-semibold text-stop">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-3 rounded-sm border border-dashed p-3.5">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] text-muted-foreground">{t('signin.mockOtp')}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <p className="ident text-lg font-bold tracking-[0.2em]">{DEMO_OTP}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={copyOtp}
                  aria-label="Copy code"
                >
                  {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                </Button>
              </div>
            </div>
            <MockBadge what="No SMS is sent. This code is fixed so reviewers can sign in." />
          </div>

          <Button type="submit" size="lg" className="w-full">
            {t('signin.verify')}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStage('id')}>
            {t('withdraw.back')}
          </Button>
        </motion.form>
      )}
    </div>
  )
}
