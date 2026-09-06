import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Cpu, HandCoins, HeartCrack, Mic, MicOff, Send, Sparkles, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MockBadge } from '@/components/patterns/mock-badge'
import { VoiceWave } from '@/components/patterns/voice-wave'
import { answer as groundedAnswer } from '@/lib/assistant/engine'
import { resolveAction, type ResolvedAction } from '@/lib/assistant/actions'
import { checkAvailability, rephrase } from '@/lib/assistant/chrome-ai'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useMicMeter } from '@/hooks/use-mic-meter'
import { useSession } from '@/store/session'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { fmtAgo } from '@/lib/format'

interface Turn {
  id: number
  role: 'user' | 'assistant'
  /** Plain reply text. Absent on an action turn, which renders as a card. */
  text?: string
  link?: { to: string; label: string }
  rephrased?: boolean
  action?: ResolvedAction
}

let nextTurnId = 0

/**
 * The home screen's front door: type or speak, and it either resolves to a
 * real action (today, only "file a claim for a linked family member") or
 * falls back to the same grounded Q&A the floating assistant already uses.
 *
 * It starts as a single bar and becomes a thread on the first answer, so a
 * follow-up ("and my father's?") has the earlier turns still on screen to
 * read against. Nothing is persisted — the thread is the length of one visit.
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
  const meter = useMicMeter()

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiState, setAiState] = useState<'checking' | 'on' | 'off'>('checking')
  const [turns, setTurns] = useState<Turn[]>([])
  const threadRef = useRef<HTMLDivElement>(null)

  const open = turns.length > 0

  useEffect(() => {
    checkAvailability().then((a) => setAiState(a === 'available' || a === 'downloadable' ? 'on' : 'off'))
  }, [])

  // Newest turn last, so the thread reads downward like every other message
  // list. Anything older stays scrolled up rather than being thrown away.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: motionOk ? 'smooth' : 'auto' })
  }, [turns, busy, motionOk])

  const push = (turn: Omit<Turn, 'id'>) => setTurns((prev) => [...prev, { ...turn, id: nextTurnId++ }])

  const ask = async (question: string) => {
    if (!question.trim() || busy) return
    // The question becomes a message in the thread, so the bar can clear
    // itself — what was asked is still on screen to read, typed or spoken.
    setInput('')
    push({ role: 'user', text: question })

    const action = resolveAction(question, familyLinks)
    if (action) {
      push({ role: 'assistant', action })
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
    push({ role: 'assistant', text, link: grounded.link, rephrased })
    setBusy(false)
  }

  // Speech recognition ends itself on a pause, an error or a final phrase, so
  // the meter follows `listening` rather than the button — otherwise a
  // sentence that ends on its own would leave the mic stream open.
  useEffect(() => {
    if (!speech.listening) meter.stop()
    return () => meter.stop()
    // `meter` is a stable bag of refs; only the listening flag should re-run this.
  }, [speech.listening])

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop()
      return
    }
    speech.start((transcript) => ask(transcript))
    // Fire and forget: the permission prompt may take a while, or never be
    // answered. Listening has already started either way.
    void meter.start()
  }

  return (
    <div
      className={`rounded-lg border bg-card p-5 transition-shadow ${
        speech.listening ? 'border-ai-line shadow-[0_0_0_3px_var(--ai-soft)]' : ''
      }`}
    >
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
        {open ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 size-7 shrink-0"
            onClick={() => setTurns([])}
            aria-label="Clear this conversation"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      {open ? (
        <motion.div
          initial={motionOk ? { opacity: 0, height: 0 } : false}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: motionOk ? 0.25 : 0 }}
          className="mb-3 overflow-hidden"
        >
          <div
            ref={threadRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1"
          >
            {turns.map((turn) => (
              <TurnBubble key={turn.id} turn={turn} motionOk={motionOk} navigate={navigate} />
            ))}
            {busy ? (
              <div className="mr-auto max-w-[85%] rounded-lg rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="flex items-center gap-2"
      >
        {speech.listening ? (
          /* While the mic is open the text field steps aside for the meter.
             One control, one job: you are either typing or being heard, and
             the surface says which without a word. */
          <motion.div
            initial={motionOk ? { opacity: 0, scale: 0.98 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: motionOk ? 0.18 : 0 }}
            className="relative flex h-12 flex-1 items-center gap-3 overflow-hidden rounded-md border border-ai-line bg-ai-soft px-3.5"
          >
            {/* A slow sweep across the field, so the surface itself reads as
                live even during a silence between two sentences. */}
            {motionOk ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-ai/10 to-transparent"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
              />
            ) : null}
            <VoiceWave bands={meter.bands} live={meter.live} motionOk={motionOk} />
            {/* The state is announced once; the words are not, since they are
                the speaker's own sentence being revised phrase by phrase and
                would flood a screen reader. */}
            <span className="relative min-w-0 flex-1 truncate text-sm" role="status">
              {speech.transcript ? (
                <span className="font-medium" aria-hidden>
                  {speech.transcript}
                </span>
              ) : (
                <span className="text-muted-foreground">Listening — say it in {lang === 'hi' ? 'Hindi' : 'English'}…</span>
              )}
            </span>

            {/* The pause bar. It refills from empty every time a word lands,
                and only when it runs out does the sentence get sent — so the
                wait is visible instead of feeling like a hang, and a speaker
                who sees it moving knows they can keep going. */}
            {speech.settling && speech.transcript ? (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-ai/15">
                {motionOk ? (
                  <motion.span
                    key={speech.settleKey}
                    className="block h-full origin-left bg-ai"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: speech.silenceMs / 1000, ease: 'linear' }}
                  />
                ) : null}
              </span>
            ) : null}
          </motion.div>
        ) : (
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={open ? 'Ask a follow-up' : 'Check your balance, or file a claim for family'}
            className="h-12"
            aria-label="Ask anything"
          />
        )}
        <span className="relative shrink-0">
          {/* Two rings leaving the button on an offset delay. They sit behind
              it and never take a click, so the button stays a button. */}
          {speech.listening && motionOk
            ? [0, 0.75].map((delay) => (
                <motion.span
                  key={delay}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-md border-2 border-ai"
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay, ease: 'easeOut' }}
                />
              ))
            : null}
          <Button
            type="button"
            variant={speech.listening ? 'default' : 'outline'}
            size="icon"
            className={`relative size-12 ${speech.listening ? 'bg-ai text-white hover:bg-ai/90' : ''}`}
            disabled={!speech.supported}
            onClick={toggleMic}
            aria-label={
              speech.listening ? (speech.transcript ? 'Done speaking — send this' : 'Stop listening') : 'Ask by voice'
            }
            title={speech.supported ? undefined : "Voice isn't supported in this browser — try Chrome or Edge"}
          >
            {speech.listening ? (
              /* A stop square, not a mic: while it is open, the only thing
                 this button does is close it — and closing it sends whatever
                 has been said, since pressing stop means "I'm done talking". */
              <Square className="size-3.5 fill-current" aria-hidden />
            ) : speech.supported ? (
              <Mic className="size-4" aria-hidden />
            ) : (
              <MicOff className="size-4" aria-hidden />
            )}
          </Button>
        </span>
        <Button
          type="submit"
          size="icon"
          className="size-12 shrink-0"
          disabled={busy || speech.listening}
          aria-label="Send"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </form>

      <div className="mt-2 flex items-center gap-2">
        <MockBadge what="Speech-to-text runs in your browser. Nothing is sent anywhere." />
        <span className="text-xs text-muted-foreground">Voice runs on your device.</span>
      </div>
    </div>
  )
}

function TurnBubble({
  turn,
  motionOk,
  navigate,
}: {
  turn: Turn
  motionOk: boolean
  navigate: ReturnType<typeof useNavigate>
}) {
  const enter = {
    initial: motionOk ? { opacity: 0, y: 4 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionOk ? 0.2 : 0 },
  } as const

  if (turn.role === 'user') {
    return (
      <motion.p
        {...enter}
        className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground"
      >
        {turn.text}
      </motion.p>
    )
  }

  const action = turn.action

  if (action?.kind === 'delegate-claim') {
    return (
      <motion.div {...enter} className="mr-auto max-w-[85%] rounded-lg rounded-bl-sm border border-info-line bg-info-soft p-4">
        <p className="flex items-start gap-2 text-sm leading-relaxed">
          <HandCoins className="mt-0.5 size-4 shrink-0" aria-hidden />
          Filing on <span className="font-medium">{action.targetName}'s</span> account · {action.reasonTitle} — you're
          their linked delegate.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              navigate(`/member/claims/new?reason=${action.reasonKey}&onBehalfOf=${action.targetPersonId}`)
            }
          >
            Continue
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </motion.div>
    )
  }

  // A death claim never has an account of theirs to bill it to, and the right
  // next step depends on whether they're already linked — so this always
  // offers a real choice rather than picking one path for them.
  if (action?.kind === 'death-claim-suggestion') {
    return (
      <motion.div {...enter} className="mr-auto max-w-[85%] rounded-lg rounded-bl-sm border border-info-line bg-info-soft p-4">
        <p className="flex items-start gap-2 text-sm leading-relaxed">
          <HeartCrack className="mt-0.5 size-4 shrink-0" aria-hidden />
          {action.linked
            ? `We're sorry for your loss. You had added your ${action.relation === 'other' ? action.targetName : action.relation} in your EPFO family circle ${fmtAgo(action.linkedOn)}, so their details don't need further verification.`
            : `We're sorry for your loss. Here's how to raise this.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {action.linked ? (
            <Button size="sm" onClick={() => navigate(`/death-claim?linked=${action.targetPersonId}`)}>
              Raise it now, already verified
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          ) : null}
          <Button asChild size="sm" variant={action.linked ? 'outline' : 'default'}>
            <Link to="/death-claim">
              {action.linked ? 'Use the public Death Claim page instead' : 'Go to the Death Claim page'}
            </Link>
          </Button>
          {!action.linked ? (
            <Button asChild size="sm" variant="ghost">
              <Link to="/member/family/link">Link them first to skip this next time</Link>
            </Button>
          ) : null}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div {...enter} className="mr-auto max-w-[85%] rounded-lg rounded-bl-sm bg-muted p-3.5 text-sm leading-relaxed">
      {turn.text}
      {turn.link ? (
        <Link to={turn.link.to} className="mt-2 flex items-center gap-1 text-xs font-medium underline underline-offset-4">
          {turn.link.label}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      ) : null}
      {turn.rephrased ? (
        <span className="mt-1.5 flex items-center gap-1 text-[0.625rem] font-semibold text-ai">
          <Cpu className="size-2.5" aria-hidden />
          Phrased on your device · figures come from your record
        </span>
      ) : null}
    </motion.div>
  )
}
