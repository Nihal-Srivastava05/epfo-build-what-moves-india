import type { GrowthProjection } from '@/lib/calculators'

/** Today's balance as year 0, so the line starts where the reader actually is. */
export function projectionPoints(currentBalance: number, projection: GrowthProjection) {
  return [{ year: 0, balance: Math.round(currentBalance) }, ...projection.years.map((y) => ({ year: y.year, balance: y.balance }))]
}
