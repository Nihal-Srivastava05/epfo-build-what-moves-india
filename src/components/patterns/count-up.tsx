import { useEffect, useState } from 'react'
import { Money } from '@/components/patterns/money'
import { useMotionOk } from '@/hooks/use-motion-ok'

/** The balance counts up once on arrival. It never re-runs on a re-render. */
export function CountUpMoney({ value, size = 'hero' }: { value: number; size?: 'xl' | 'hero' }) {
  const motionOk = useMotionOk()
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    if (!motionOk) return
    const start = performance.now()
    const duration = 600
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimated(Math.round(value * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, motionOk])

  // With motion off the real value renders immediately, with no animation state
  // in the way — lite mode and reduced motion never see an intermediate number.
  return <Money value={motionOk ? animated : value} size={size} />
}
