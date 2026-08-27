import { useEffect } from 'react'
import { useSession } from '@/store/session'

/**
 * Preferences are applied to the document root in one place. Lite mode and the
 * theme are attributes, not classes, so the CSS can key off them directly.
 */
export function PrefsEffect() {
  const { theme, lite, lang } = useSession()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-lite', lite ? 'on' : 'off')

    // Lite mode does not merely override the font stack — it never requests the
    // webfonts at all, which is most of what a slow connection is waiting for.
    const id = 'epfo-webfonts'
    const existing = document.getElementById(id)
    if (lite) {
      existing?.remove()
      return
    }
    if (existing) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [lite])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return null
}
