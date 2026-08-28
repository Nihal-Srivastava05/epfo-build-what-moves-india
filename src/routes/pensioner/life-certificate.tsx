import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Building2, CheckCircle2, Clock, ScanFace, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/patterns/page-header'
import { StatusPill } from '@/components/patterns/status-pill'
import { MockBadge } from '@/components/patterns/mock-badge'
import { Term } from '@/components/patterns/term'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { daysBetween, fmtDate } from '@/lib/format'

const routes = [
  {
    key: 'face',
    icon: ScanFace,
    title: 'Face scan on this phone',
    time: 'About 2 minutes, right now',
    detail:
      'Look at the camera and blink when asked. Works on any Android phone with a front camera. Nothing is posted and nobody visits.',
    tone: 'ok' as const,
  },
  {
    key: 'bank',
    icon: Building2,
    title: 'At your bank or a common service centre',
    time: 'About 30 minutes, plus the journey',
    detail:
      'Carry your PPO number and Aadhaar. Any branch of any bank can do it, not only the one your pension is paid into.',
    tone: 'neutral' as const,
  },
  {
    key: 'post',
    icon: Truck,
    title: 'A postman comes to you',
    time: 'Booked today, visit within 3 days',
    detail:
      'An India Post agent visits your home with a fingerprint device. Free of charge. Best if travelling is difficult.',
    tone: 'neutral' as const,
  },
]

export default function LifeCertificate() {
  const { pensioner, submitLifeCertificate } = useData()
  const { lang } = useT()
  const motionOk = useMotionOk()
  const [done, setDone] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const daysLeft = daysBetween(new Date().toISOString().slice(0, 10), pensioner.lifeCertificateValidTill)

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionOk ? 0.3 : 0 }}
          className="rounded-lg border border-ok-line bg-ok-soft p-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 size-12 text-ok" aria-hidden />
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.03em]">Life certificate accepted</h1>
          <p className="mt-2 text-muted-foreground">Submitted by {done}</p>
          <div className="mt-6 rounded-lg border bg-card p-4 text-left">
            <p className="eyebrow mb-1">Now valid until</p>
            <p className="num text-[1.125rem] font-bold">
              {fmtDate(pensioner.lifeCertificateValidTill, lang)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Your pension continues without interruption. We will remind you three months before this
              date, by SMS and here.
            </p>
          </div>
        </motion.div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link to="/pensioner">Back to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Validity first. The answer to "am I in trouble?" before the options. */}
      <div className="mb-8 rounded-lg border bg-card p-5 rule-brand">
        <p className="eyebrow mb-2">Your certificate right now</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="num text-[1.5rem] font-extrabold tracking-[-0.03em]">
            Valid until {fmtDate(pensioner.lifeCertificateValidTill, lang)}
          </p>
          <StatusPill tone={daysLeft <= 30 ? 'stop' : daysLeft <= 120 ? 'wait' : 'ok'}>
            <Clock className="size-3.5" aria-hidden />
            {daysLeft} days left
          </StatusPill>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Last submitted {fmtDate(pensioner.lastSubmittedOn, lang)}. If it lapses, your pension stops
          until a new one is submitted — it is not lost, but it does not arrive.
        </p>
      </div>

      <PageHeader
        title="Submit your life certificate"
        sub={
          <>
            Three ways, all free and all equally valid. Also called{' '}
            <Term id="life-certificate">Jeevan Pramaan</Term>.
          </>
        }
      />

      <div className="space-y-3">
        {routes.map((r, i) => (
          <motion.div
            key={r.key}
            initial={motionOk ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionOk ? 0.25 : 0, delay: motionOk ? i * 0.05 : 0 }}
            className="rounded-lg border bg-card p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                <r.icon className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{r.title}</p>
                  <StatusPill tone={r.tone}>{r.time}</StatusPill>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {/* One filled button per screen. The other two routes are
                      equally valid, so they are offered, not pushed. */}
                  <Button
                    variant={i === 0 ? 'default' : 'outline'}
                    onClick={() => {
                      if (r.key === 'face') {
                        setScanning(true)
                        window.setTimeout(() => {
                          setScanning(false)
                          submitLifeCertificate('face scan')
                          setDone('face scan')
                        }, 1800)
                        return
                      }
                      submitLifeCertificate(r.key === 'bank' ? 'a bank visit' : 'an India Post visit')
                      setDone(r.key === 'bank' ? 'a bank visit' : 'an India Post visit')
                    }}
                    disabled={scanning}
                  >
                    {r.key === 'face'
                      ? scanning
                        ? 'Scanning…'
                        : 'Start the scan'
                      : r.key === 'bank'
                        ? 'Find the nearest centre'
                        : 'Book a visit'}
                  </Button>
                  <MockBadge
                    what={
                      r.key === 'face'
                        ? 'No camera is used. The scan is simulated.'
                        : 'No booking is made. This is a simulated confirmation.'
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-wait-line bg-wait-soft p-4 text-sm leading-relaxed">
        EPFO never asks for an OTP or a fee to submit a life certificate. If someone calls offering to do
        it for money, it is a scam.
      </p>
    </div>
  )
}
