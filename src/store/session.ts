import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Persona } from '@/lib/types'

export type Lang = 'en' | 'hi'
export type ThemePref = 'system' | 'light' | 'dark'

interface SessionState {
  /**
   * One account, not one account per portal. Signing in gives you every role
   * you actually hold; the persona switcher changes the view, not the identity.
   */
  signedIn: boolean
  persona: Persona
  lang: Lang
  lite: boolean
  theme: ThemePref
  assistantOpen: boolean
  signIn: (persona: Persona) => void
  signOut: () => void
  setPersona: (persona: Persona) => void
  setLang: (lang: Lang) => void
  toggleLang: () => void
  setLite: (lite: boolean) => void
  setTheme: (theme: ThemePref) => void
  setAssistantOpen: (open: boolean) => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      persona: 'member',
      lang: 'en',
      lite: false,
      theme: 'system',
      assistantOpen: false,
      signIn: (persona) => set({ signedIn: true, persona }),
      signOut: () => set({ signedIn: false, assistantOpen: false }),
      setPersona: (persona) => set({ persona }),
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'hi' : 'en' })),
      setLite: (lite) => set({ lite }),
      setTheme: (theme) => set({ theme }),
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
    }),
    {
      name: 'epfo-session',
      version: 1,
      partialize: (s) => ({ lang: s.lang, lite: s.lite, theme: s.theme, signedIn: s.signedIn, persona: s.persona }),
    },
  ),
)
