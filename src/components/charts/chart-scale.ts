import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * The measuring and colour half of the chart kit: one palette, one grid weight,
 * one set of mark specs, so the three charts on the passbook cannot drift apart.
 */

export const SERIES = {
  you: { label: 'Your share', color: 'var(--series-you)' },
  employer: { label: 'Employer share', color: 'var(--series-employer)' },
  interest: { label: 'Interest', color: 'var(--series-interest)' },
} as const

/** Gridlines and axis rules: one step off the surface, hairline, never dashed. */
export const GRID = 'var(--border)'
export const AXIS_INK = 'var(--muted-foreground)'
/** White doing the separating — a 2px gap between touching fills. */
export const GAP = 2

/**
 * Charts are drawn at real pixel sizes rather than scaled through a viewBox,
 * because a viewBox scales the type with the box and this audience cannot
 * afford 8px axis labels on a phone.
 */
export function useMeasure<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width]
}

/** Round axis values — 0 / 2L / 4L, never 0 / 187,432 / 374,864. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const ticks: number[] = []
  for (let v = 0; v <= max + step / 1000; v += step) ticks.push(Math.round(v))
  return ticks
}

/** A bar with a rounded data-end and a square foot on the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x},${y + h}L${x},${y + rr}Q${x},${y} ${x + rr},${y}L${x + w - rr},${y}Q${x + w},${y} ${x + w},${y + rr}L${x + w},${y + h}Z`
}
