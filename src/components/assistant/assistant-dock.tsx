import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Cpu, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSession } from '@/store/session'
import { answer as groundedAnswer } from '@/lib/assistant/engine'
import { checkAvailability, rephrase } from '@/lib/assistant/chrome-ai'
import { useMotionOk } from '@/hooks/use-motion-ok'
import { cn } from '@/lib/utils'

interface Turn {
  id: number
  role: 'you' | 'app'
  text: string
  link?: { to: string; label: string }
  /** True when Chrome's on-device model rephrased this, rather than the fixed answer. */
  rephrased?: boolean
}

const SUGGESTIONS: Record<string, string[]> = {
  member: ['Where is my claim?', 'What is EDLI?', 'Why is a month missing?', 'How much can I withdraw?'],
  employer: ['What is still unfiled?', 'What does ECR mean?', 'How many approvals are waiting?'],
  pensioner: ['When is my next pension?', 'What is a life certificate?', 'Is this message a scam?'],
}

export function AssistantDock() {
  const { assistantOpen, setAssistantOpen, persona, signedIn } = useSession()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiState, setAiState] = useState<'checking' | 'on' | 'off'>('checking')
  const location = useLocation()
  const motionOk = useMotionOk()
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    checkAvailability().then((a) => setAiState(a === 'available' || a === 'downloadable' ? 'on' : 'off'))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: motionOk ? 'smooth' : 'instant' })
  }, [turns, motionOk])

  const ask = async (question: string) => {
    if (!question.trim() || busy) return
    const id = nextId.current
    nextId.current += 2
    setTurns((t) => [...t, { id, role: 'you', text: question }])
    setInput('')
    setBusy(true)

    const grounded = groundedAnswer(question, persona, signedIn)
    let text = grounded.text
    let rephrased = false

    // The on-device model only ever restates facts we already computed.
    if (grounded.allowRephrase) {
      const better = await rephrase(question, grounded.facts)
      if (better) {
        text = better
        rephrased = true
      }
    }

    setTurns((t) => [...t, { id: id + 1, role: 'app', text, link: grounded.link, rephrased }])
    setBusy(false)
  }

  // The assistant never appears on the sign-in screen, where it would only be noise.
  if (location.pathname.startsWith('/signin')) return null

  return (
    <>
      <AnimatePresence>
        {assistantOpen ? (
          <motion.div
            initial={motionOk ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={motionOk ? { opacity: 0, y: 12 } : undefined}
            transition={{ duration: motionOk ? 0.2 : 0, ease: 'easeOut' }}
            className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(32rem,80dvh)] flex-col overflow-hidden rounded-lg border bg-popover shadow-pop sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem]"
            role="dialog"
            aria-label="Help assistant"
          >
            <header className="flex items-center gap-2 border-b px-4 py-3">
              <Sparkles className="size-4 text-ai" aria-hidden />
              <p className="text-sm font-semibold">Ask about this page</p>
              <span
                className={cn(
                  'ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold',
                  aiState === 'on' ? 'bg-ai-soft text-ai' : 'bg-muted text-muted-foreground',
                )}
                title={
                  aiState === 'on'
                    ? 'Chrome’s on-device model is available and is used only to phrase answers.'
                    : 'No on-device model here. Answers come from the built-in engine — the facts are identical either way.'
                }
              >
                <Cpu className="size-3" aria-hidden />
                {aiState === 'on' ? 'On-device AI' : 'Built-in answers'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </header>

            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {turns.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      I answer from your own record. I will not invent an amount, a date or a verdict —
                      if I do not know, I will say so and hand you to a person.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(SUGGESTIONS[persona] ?? []).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => ask(s)}
                          className="!min-h-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:bg-muted"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
                      turn.role === 'you'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted',
                    )}
                  >
                    {turn.text}
                    {turn.link ? (
                      <Link
                        to={turn.link.to}
                        onClick={() => setAssistantOpen(false)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
                      >
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
                  </div>
                ))}
                {busy ? <p className="text-sm text-muted-foreground">Thinking…</p> : null}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(input)
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question"
                className="h-10"
                aria-label="Your question"
              />
              <Button type="submit" size="icon" className="size-10 shrink-0" disabled={busy} aria-label="Send">
                <Send className="size-4" aria-hidden />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!assistantOpen ? (
        <Button
          onClick={() => setAssistantOpen(true)}
          size="lg"
          className="fixed right-4 bottom-20 z-40 gap-2 rounded-full lg:bottom-6"
        >
          <MessageCircle className="size-4" aria-hidden />
          Ask
        </Button>
      ) : null}
    </>
  )
}
