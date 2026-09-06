import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * How long a pause has to last before a sentence counts as finished. The
 * browser's own end-of-speech detection fires far sooner than this — it will
 * happily cut you off mid-thought at the first comma — so the sentence is
 * assembled here instead, and only sent once you have actually stopped.
 */
const SILENCE_MS = 1500

/**
 * A thin wrapper over the browser's own `SpeechRecognition` — no dependency,
 * no network call, no API key. Support varies (Chrome/Edge today, not
 * Firefox), so callers must check `supported` and offer a fallback rather
 * than assume the mic button always works.
 *
 * Two things it adds over the raw API:
 *
 *  • **It waits for you to finish.** Recognition runs continuously and every
 *    settled phrase is appended to one transcript. That transcript is handed
 *    over only after `SILENCE_MS` of quiet, so "file a claim for my father"
 *    survives the breath in the middle of it.
 *  • **It shows the sentence as it grows.** `transcript` is the whole thing
 *    so far, settled words plus the phrase still being revised.
 */
export function useSpeechRecognition(lang: string) {
  const [supported] = useState(
    () => typeof window !== 'undefined' && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  )
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  /** True during the quiet window, while the sentence is about to be sent. */
  const [settling, setSettling] = useState(false)
  /** Bumped on every word heard, so a caller can restart a settle animation. */
  const [settleKey, setSettleKey] = useState(0)

  const recRef = useRef<SpeechRecognition | null>(null)
  const settledRef = useRef('')
  const draftRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef<(text: string) => void>(() => {})
  const wantedRef = useRef(false)
  const doneRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const reset = useCallback(() => {
    clearTimer()
    settledRef.current = ''
    draftRef.current = ''
    setTranscript('')
    setSettling(false)
  }, [])

  /** Hand over whatever has been said and close the mic. Runs at most once. */
  const commit = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    wantedRef.current = false
    clearTimer()
    const text = `${settledRef.current} ${draftRef.current}`.trim()
    recRef.current?.stop()
    recRef.current = null
    reset()
    setListening(false)
    if (text) onResultRef.current(text)
  }, [reset])

  const start = useCallback(
    (onResult: (text: string) => void) => {
      if (!supported) return
      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!
      const rec = new Ctor()
      rec.lang = lang
      rec.interimResults = true
      rec.maxAlternatives = 1
      // Continuous, because a one-shot session ends at the first pause — the
      // exact behaviour this hook exists to paper over.
      rec.continuous = true

      onResultRef.current = onResult
      doneRef.current = false
      wantedRef.current = true
      settledRef.current = ''
      draftRef.current = ''

      const armSilence = () => {
        clearTimer()
        setSettling(true)
        setSettleKey((k) => k + 1)
        timerRef.current = setTimeout(commit, SILENCE_MS)
      }

      rec.onresult = (event) => {
        let draft = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0]?.transcript ?? ''
          if (result.isFinal) {
            settledRef.current = `${settledRef.current} ${text}`.trim()
          } else {
            draft += text
          }
        }
        draftRef.current = draft
        setTranscript(`${settledRef.current} ${draft}`.trim())
        // Every word heard pushes the deadline back, so the pause is measured
        // from the last thing said rather than from when the mic opened.
        armSilence()
      }

      rec.onerror = () => {
        if (settledRef.current || draftRef.current) commit()
        else {
          wantedRef.current = false
          reset()
          setListening(false)
        }
      }

      // Chrome ends a continuous session on its own after a long silence. If
      // nothing was said yet, quietly pick the mic back up rather than making
      // someone press the button again mid-thought.
      rec.onend = () => {
        if (!wantedRef.current || doneRef.current) return
        if (settledRef.current || draftRef.current) {
          commit()
          return
        }
        try {
          rec.start()
        } catch {
          setListening(false)
        }
      }

      recRef.current = rec
      rec.start()
      setListening(true)
      setSettling(false)
    },
    [commit, lang, reset, supported],
  )

  /** The stop button means "I'm done talking", so it sends what it has. */
  const stop = useCallback(() => commit(), [commit])

  useEffect(() => clearTimer, [])

  return { supported, listening, transcript, settling, settleKey, silenceMs: SILENCE_MS, start, stop }
}
