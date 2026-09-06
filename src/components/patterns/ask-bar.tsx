import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Cpu, HandCoins, Mic, MicOff, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MockBadge } from '@/components/patterns/mock-badge'
import { answer as groundedAnswer } from '@/lib/assistant/engine'
import { resolveAction, type DelegateClaimAction } from '@/lib/assistant/actions'
import { checkAvailability, rephrase } from '@/lib/assistant/chrome-ai'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useSession } from '@/store/session'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'

interface QaTurn {
  text: string
  link?: { to: string; label: string }
  rephrased?: boolean
}

/**
 * The home screen's front door: type or speak, and it either resolves to a
 * real action (today, only "file a claim for a linked family member") or
 * falls back to the same grounded Q&A the floating assistant already uses.
 *
 * It never files anything itself — a match only produces a confirmation card
 * naming the account and the reason. A person still walks the real claim
 * flow (amount, pre-flight check, OTP) before anything is submitted. That
 * stop is deliberate: the same "never invents a number" discipline the
 * on-device assistant already holds, extended to "never assumes whose
 * account to touch."
 */
export function AskBar() {
  const navigate = useNavigate()
  const motionOk = useMotionOk()
  const { lang } = useT()
  const { persona, signedIn } = useSession()
  const { familyLinks } = useData()
  const speech = useSpeechRecognition(lang === 'hi' ? 'hi-IN' : 'en-IN')

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiState, setAiState] = useState<'checking' | 'on' | 'off'>('checking')
  const [pendingAction, setPendingAction] = useState<DelegateClaimAction | null>(null)
  const [qa, setQa] = useState<QaTurn | null>(null)

  useEffect(() => {
    checkAvailability().then((a) => setAiState(a === 'available' || a === 'downloadable' ? 'on' : 'off'))
  }, [])

  const ask = async (question: string) => {
    if (!question.trim() || busy) return
    // The bar keeps showing what was asked — typed or spoken — instead of
    // clearing itself the instant it's submitted. On a screen recording, a
    // query that vanishes before anyone can read it may as well not exist.
    setInput(question)
    setQa(null)
    setPendingAction(null)

    const action = resolveAction(question, familyLinks)
    if (action) {
      setPendingAction(action)
      return
    }

    setBusy(true)
    const grounded = groundedAnswer(question, persona, signedIn)
    let text = grounded.text
    let rephrased = false
    if (grounded.allowRephrase) {
      const better = await rephrase(question, grounded.facts)
      if (better) {
        text = better
        rephrased = true
      }
    }
    setQa({ text, link: grounded.link, rephrased })
    setBusy(false)
  }

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop()
      return
    }
    // ask() itself fills the bar with the transcript — see the comment there.
    speech.start((transcript) => ask(transcript))
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="size-4 text-ai" aria-hidden />
        <p className="text-sm font-semibold">Ask anything</p>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
            aiState === 'on' ? 'bg-ai-soft text-ai' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Cpu className="size-3" aria-hidden />
          {aiState === 'on' ? 'On-device AI' : 'Built-in answers'}
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="Check your balance, or file a claim for family"
          className="h-12"
          aria-label="Ask anything"
        />
        <Button
          type="button"
          variant={speech.listening ? 'default' : 'outline'}
          size="icon"
          className="size-12 shrink-0"
          disabled={!speech.supported}
          onClick={toggleMic}
          aria-label={speech.listening ? 'Stop listening' : 'Ask by voice'}
          title={speech.supported ? undefined : "Voice isn't supported in this browser — try Chrome or Edge"}
        >
          {speech.listening ? (
            <motion.span
              animate={motionOk ? { scale: [1, 1.15, 1] } : undefined}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="size-4" aria-hidden />
            </motion.span>
          ) : speech.supported ? (
            <Mic className="size-4" aria-hidden />
          ) : (
            <MicOff className="size-4" aria-hidden />
          )}
        </Button>
        <Button type="submit" size="icon" className="size-12 shrink-0" disabled={busy} aria-label="Send">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>

      <div className="mt-2 flex items-center gap-2">
        <MockBadge what="Speech-to-text runs in your browser. Nothing is sent anywhere." />
        <span className="text-xs text-muted-foreground">Voice runs on your device.</span>
      </div>

      {pendingAction ? (
        <motion.div
          initial={motionOk ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.2 : 0 }}
          className="mt-4 rounded-lg border border-info-line bg-info-soft p-4"
        >
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <HandCoins className="mt-0.5 size-4 shrink-0" aria-hidden />
            Filing on <span className="font-medium">{pendingAction.targetName}'s</span> account ·{' '}
            {pendingAction.reasonTitle} — you're their linked delegate.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                navigate(
                  `/member/claims/new?reason=${pendingAction.reasonKey}&onBehalfOf=${pendingAction.targetPersonId}`,
                )
              }
            >
              Continue
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : null}

      {qa ? (
        <motion.div
          initial={motionOk ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionOk ? 0.2 : 0 }}
          className="mt-4 rounded-lg bg-muted p-4 text-sm leading-relaxed"
        >
          {qa.text}
          {qa.link ? (
            <Link
              to={qa.link.to}
              className="mt-2 flex items-center gap-1 text-xs font-medium underline underline-offset-4"
            >
              {qa.link.label}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          ) : null}
          {qa.rephrased ? (
            <span className="mt-1.5 flex items-center gap-1 text-[0.625rem] font-semibold text-ai">
              <Cpu className="size-2.5" aria-hidden />
              Phrased on your device · figures come from your record
            </span>
          ) : null}
        </motion.div>
      ) : null}
      {busy ? <p className="mt-3 text-sm text-muted-foreground">Thinking…</p> : null}
    </div>
  )
}
