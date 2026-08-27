import { useCallback } from 'react'
import { useSession } from '@/store/session'
import { en, hi, type StringKey } from '@/i18n/strings'

export type { StringKey }

export function translate(key: StringKey, lang: 'en' | 'hi', vars?: Record<string, string | number>) {
  const raw = (lang === 'hi' ? (hi[key] ?? en[key]) : en[key]) as string
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

/** True when Hindi was asked for but this string has not been translated yet. */
export function isFallback(key: StringKey, lang: 'en' | 'hi') {
  return lang === 'hi' && hi[key] === undefined
}

export function useT() {
  const lang = useSession((s) => s.lang)
  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(key, lang, vars),
    [lang],
  )
  return { t, lang }
}
