import { useRef, useState } from 'react'

/**
 * A thin wrapper over the browser's own `SpeechRecognition` — no dependency,
 * no network call, no API key. Support varies (Chrome/Edge today, not
 * Firefox), so callers must check `supported` and offer a fallback rather
 * than assume the mic button always works.
 */
export function useSpeechRecognition(lang: string) {
  const [supported] = useState(
    () => typeof window !== 'undefined' && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  )
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  const start = (onResult: (text: string) => void) => {
    if (!supported) return
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!
    const rec = new Ctor()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript
      if (text) onResult(text)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  const stop = () => {
    recRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, start, stop }
}
