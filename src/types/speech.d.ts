/**
 * Minimal ambient types for the Web Speech API's `SpeechRecognition`.
 * Not in the standard DOM lib and no `@types` package is installed for it —
 * this is deliberately small (only what `use-speech-recognition.ts` calls)
 * rather than a full spec surface.
 */
interface SpeechRecognitionResultLike {
  0: { transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultLike[]
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
