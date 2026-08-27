import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
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
  const signIn = useSession((s) => s.signIn)
  const navigate = useNavigate()
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
    navigate(personaMeta[persona].home, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link to="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← {t('landing.choose')}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
          <Icon className="size-5 text-gold" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('signin.title')}</h1>
          <p className="text-sm text-muted-foreground">{t(`persona.${persona}`)}</p>
        </div>
      </div>

      <p className="mb-6 flex items-start gap-2 rounded-lg border border-info-line bg-info-soft p-3 text-sm leading-relaxed">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
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
            <Label htmlFor="identity">
              <Term id={identity[persona].termId}>{t(identity[persona].labelKey)}</Term>
            </Label>
            <Input
              id="identity"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="ident h-12 text-base"
              inputMode={persona === 'member' ? 'numeric' : 'text'}
              autoComplete="off"
            />
            {persona === 'member' ? (
              <p className="text-sm text-muted-foreground">{t('signin.uanHint')}</p>
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
            <Label htmlFor="otp">{t('signin.otp')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('signin.otpSent')} +91 98XXX XX210
            </p>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              inputMode="numeric"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'otp-error' : undefined}
              className="ident h-14 text-center text-2xl tracking-[0.4em]"
              placeholder="000000"
            />
            {error ? (
              <p id="otp-error" className="text-sm font-medium text-stop">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-3">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-muted-foreground">{t('signin.mockOtp')}</p>
              <p className="ident mt-1.5 text-lg font-semibold tracking-[0.2em]">{DEMO_OTP}</p>
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
