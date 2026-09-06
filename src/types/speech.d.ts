/**
 * Minimal ambient types for the Web Speech API's `SpeechRecognition`.
 * Not in the standard DOM lib and no `@types` package is installed for it —
 * this is deliberately small (only what `use-speech-recognition.ts` calls)
 * rather than a full spec surface.
 */
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  /** False while the engine is still revising this phrase. */
  isFinal: boolean
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultLike[]
  /** First result changed by this event; earlier ones are already settled. */
  resultIndex: number
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}
