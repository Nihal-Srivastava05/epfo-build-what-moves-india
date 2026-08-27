import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/store/session'
import { personaMeta } from '@/lib/nav'
import type { Persona } from '@/lib/types'

const personas: Persona[] = ['member', 'employer', 'pensioner']

/**
 * Signing in as an employee gets you an employee's screens and nothing else.
 * A URL belonging to another persona sends you back to your own home rather
 * than rendering someone else's account under your session.
 */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const signedIn = useSession((s) => s.signedIn)
  const persona = useSession((s) => s.persona)
  const location = useLocation()

  // Signed out means back to the front door, where you choose who you are.
  // This is the only destination, so nothing races with it.
  if (!signedIn) return <Navigate to="/" replace />

  const segment = location.pathname.split('/')[1] as Persona
  if (personas.includes(segment) && segment !== persona) {
    return <Navigate to={personaMeta[persona].home} replace />
  }

  return <>{children}</>
}
