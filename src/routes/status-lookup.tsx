import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Money } from '@/components/patterns/money'
import { ClaimTracker } from '@/components/patterns/claim-tracker'
import { StatusPill } from '@/components/patterns/status-pill'
import { MockBadge } from '@/components/patterns/mock-badge'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { fmtDate, fmtMonthLong } from '@/lib/format'

/**
 * The whole thirty-portal directory collapses to three persona entry points and
 * this one screen: a status answer that needs no account at all.
 */
export default function StatusLookup() {
  const { claims, challans, pensionPayments } = useData()
  const { t, lang } = useT()
  const motionOk = useMotionOk()
  const [ref, setRef] = useState('')
  const [result, setResult] = useState<'claim' | 'challan' | 'pension' | 'none' | null>(null)

  const claim = claims[0]
  const challan = challans[0]
  const payment = pensionPayments[0]

  const lookup = (kind: 'claim' | 'challan' | 'pension') => {
    const value = ref.trim().toUpperCase()
    if (!value) return
    if (kind === 'claim' && claims.some((c) => c.id.toUpperCase() === value)) return setResult('claim')
    if (kind === 'challan' && challans.some((c) => c.trrn === value)) return setResult('challan')
    if (kind === 'pension' && value.includes('00123456')) return setResult('pension')
    setResult('none')
  }

  const field = {
    claim: { label: 'Claim reference number', hint: claim.id },
    challan: { label: 'TRRN', hint: challan.trrn },
    pension: { label: 'PPO number', hint: 'MH/PUN/00123456' },
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">{t('landing.lookup')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {t('landing.lookupSub')} No sign-in, no CAPTCHA. The reference number is enough.
      </p>

      <Tabs
        defaultValue="claim"
        className="mt-8"
        onValueChange={() => {
          setResult(null)
          setRef('')
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="claim" className="flex-1">
            A claim
          </TabsTrigger>
          <TabsTrigger value="challan" className="flex-1">
            A challan
          </TabsTrigger>
          <TabsTrigger value="pension" className="flex-1">
            A pension
          </TabsTrigger>
        </TabsList>

        {(['claim', 'challan', 'pension'] as const).map((kind) => (
          <TabsContent key={kind} value={kind} className="mt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                lookup(kind)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`ref-${kind}`}>{field[kind].label}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`ref-${kind}`}
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder={field[kind].hint}
                    className="ident h-12"
                  />
                  <Button type="submit" size="lg" className="shrink-0">
                    <Search className="size-4" aria-hidden />
                    Check
                  </Button>
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  Try <span className="ident">{field[kind].hint}</span>
                  <MockBadge what="A demo reference. Only these resolve in the prototype." />
                </p>
              </div>
            </form>
          </TabsContent>
        ))}
      </Tabs>

      {result ? (
        <motion.div
          initial={motionOk ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.25 : 0 }}
          className="mt-8"
        >
          {result === 'claim' ? (
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ident text-sm text-muted-foreground">{claim.id}</p>
                  <Money value={claim.amount} size="xl" mark />
                </div>
                {claim.expectedBy ? (
                  <div className="text-right">
                    <p className="eyebrow mb-1">{t('member.expectedBy')}</p>
                    <p className="num font-semibold">{fmtDate(claim.expectedBy, lang)}</p>
                  </div>
                ) : null}
              </div>
              <ClaimTracker claim={claim} />
            </div>
          ) : null}

          {result === 'challan' ? (
            <div className="rounded-lg border bg-card p-5">
              <p className="ident text-sm text-muted-foreground">{challan.trrn}</p>
              <p className="mt-1 font-semibold">{fmtMonthLong(challan.month)}</p>
              <Money value={challan.total} size="xl" className="mt-2 block" />
              <p className="num mt-2 text-sm text-muted-foreground">
                Paid {fmtDate(challan.paidOn, lang)} for {challan.employees} employees
              </p>
              <StatusPill tone="ok" className="mt-3">
                Received and credited
              </StatusPill>
            </div>
          ) : null}

          {result === 'pension' ? (
            <div className="rounded-lg border bg-card p-5">
              <p className="eyebrow mb-1">Last credit</p>
              <Money value={payment.amount} size="xl" />
              <p className="num mt-2 text-sm text-muted-foreground">
                {fmtDate(payment.creditedOn, lang)} · {payment.mode} ·{' '}
                <span className="ident">{payment.reference}</span>
              </p>
              <StatusPill tone="ok" className="mt-3">
                Credited
              </StatusPill>
            </div>
          ) : null}

          {result === 'none' ? (
            <div className="rounded-lg border border-wait-line bg-wait-soft p-5">
              <p className="font-medium">We could not find that reference</p>
              <p className="mt-1 text-sm leading-relaxed">
                Check the number against your SMS or receipt. In this prototype only the demo references
                shown above resolve.
              </p>
            </div>
          ) : null}
        </motion.div>
      ) : null}

      <p className="mt-8 text-sm text-muted-foreground">
        Need more than a status?{' '}
        <Link to="/" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>{' '}
        — one account covers every role you hold.
      </p>
    </div>
  )
}
