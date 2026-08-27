import { useEffect, useState } from 'react'
import { useSession } from '@/store/session'

/**
 * Motion is gated in one place. Lite mode and the OS reduced-motion setting
 * both switch every animation in the app off, rather than each component
 * remembering to check.
 */
export function useMotionOk() {
  const lite = useSession((s) => s.lite)
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return !lite && !reduced
}

export function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [breakpoint])
  return mobile
}
