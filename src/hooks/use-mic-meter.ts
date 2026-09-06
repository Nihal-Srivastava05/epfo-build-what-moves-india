import { useRef } from 'react'

/** How many amplitude bands the meter publishes. Mirrored, so keep it even. */
export const MIC_BANDS = 14

/**
 * A live amplitude meter for the microphone, published through refs rather
 * than state — a waveform wants sixty updates a second, and sixty React
 * renders a second is how you make a demo machine stutter. Consumers read
 * `bands.current` inside their own animation frame.
 *
 * This is deliberately separate from `useSpeechRecognition`: the browser's
 * speech API tells you *that* it is listening, never how loud you are. The
 * difference matters on a stage — a bar that moves with your voice is proof
 * the mic is live, where a pulsing dot only ever proves a timer is running.
 *
 * Everything degrades: if `getUserMedia` is unavailable or refused, `live`
 * stays false and the caller draws a synthetic wave instead. The listening
 * state never depends on the meter working.
 */
export function useMicMeter() {
  const bands = useRef(new Float32Array(MIC_BANDS))
  const live = useRef(false)
  const raf = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const wanted = useRef(false)

  const start = async () => {
    if (ctxRef.current || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
    wanted.current = true
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return // Refused or unavailable — the synthetic wave covers it.
    }
    // The permission prompt can outlive the request: if listening stopped
    // while it was open, hand the mic straight back rather than holding it.
    if (!wanted.current) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.6
    ctx.createMediaStreamSource(stream).connect(analyser)

    const spectrum = new Uint8Array(analyser.frequencyBinCount)
    const half = MIC_BANDS / 2
    // Speech energy piles up in the low bins, so the top half of the spectrum
    // would sit flat at zero if the bins were split evenly. The gain curve
    // below buys back the quiet end — it is a display choice, not a measurement.
    const loop = () => {
      analyser.getByteFrequencyData(spectrum)
      for (let i = 0; i < half; i++) {
        const from = Math.floor((i / half) * spectrum.length * 0.7)
        const to = Math.max(from + 1, Math.floor(((i + 1) / half) * spectrum.length * 0.7))
        let sum = 0
        for (let b = from; b < to; b++) sum += spectrum[b]
        const gain = 1 + (i / half) * 1.6
        const target = Math.min(1, Math.sqrt(sum / (to - from) / 255) * gain)
        // Ease toward the target so a hard consonant reads as a lively bar
        // rather than a single-frame spike nobody sees.
        const eased = bands.current[half + i] + (target - bands.current[half + i]) * 0.35
        bands.current[half + i] = eased
        bands.current[half - 1 - i] = eased // mirrored, so the wave runs centre-out
      }
      raf.current = requestAnimationFrame(loop)
    }

    ctxRef.current = ctx
    streamRef.current = stream
    live.current = true
    loop()
  }

  const stop = () => {
    wanted.current = false
    cancelAnimationFrame(raf.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()
    streamRef.current = null
    ctxRef.current = null
    live.current = false
    bands.current.fill(0)
  }

  return { bands, live, start, stop }
}
