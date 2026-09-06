import { useEffect, useRef, type RefObject } from 'react'
import { MIC_BANDS } from '@/hooks/use-mic-meter'

interface VoiceWaveProps {
  /** Live amplitudes, 0–1, written by `useMicMeter` every frame. */
  bands: RefObject<Float32Array>
  /** Whether those amplitudes are real. False falls back to a drawn wave. */
  live: RefObject<boolean>
  motionOk: boolean
}

/**
 * The listening waveform. Bars are driven straight from the mic meter inside
 * one animation frame — the heights are written to the DOM by hand, never
 * through state, so this costs no re-renders while it runs.
 *
 * Three tiers, in order of honesty:
 *   • real mic amplitude, when the browser grants it;
 *   • a drawn travelling wave, when it does not, so the control still reads
 *     as alive rather than broken;
 *   • three still bars, when motion is off — the label carries the meaning
 *     in that case, and nothing on screen moves.
 */
export function VoiceWave({ bands, live, motionOk }: VoiceWaveProps) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!motionOk) return
    let raf = 0
    const start = performance.now()

    const draw = (now: number) => {
      const t = (now - start) / 1000
      for (let i = 0; i < MIC_BANDS; i++) {
        const bar = barsRef.current[i]
        if (!bar) continue
        let v: number
        if (live.current) {
          v = bands.current[i]
        } else {
          // A travelling sine, phase-shifted per bar and folded around the
          // centre so the fallback moves centre-out like the real thing.
          const d = Math.abs(i - (MIC_BANDS - 1) / 2) / (MIC_BANDS / 2)
          v = (0.55 + 0.45 * Math.sin(t * 3.4 - d * 2.6)) * (1 - d * 0.45)
        }
        bar.style.transform = `scaleY(${(0.16 + v * 0.84).toFixed(3)})`
        bar.style.opacity = `${(0.45 + v * 0.55).toFixed(3)}`
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [bands, live, motionOk])

  if (!motionOk) {
    return (
      <span className="flex h-6 items-center gap-[3px]" aria-hidden>
        {[0.5, 1, 0.5].map((h, i) => (
          <span key={i} className="w-[3px] rounded-full bg-ai" style={{ height: `${h * 1.25}rem` }} />
        ))}
      </span>
    )
  }

  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: MIC_BANDS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el
          }}
          className="h-6 w-[3px] origin-center rounded-full bg-ai will-change-transform"
          style={{ transform: 'scaleY(0.16)' }}
        />
      ))}
    </span>
  )
}
