import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/store/session'

export function RequireSignIn({ children }: { children: ReactNode }) {
  const signedIn = useSession((s) => s.signedIn)
  const persona = useSession((s) => s.persona)
  const location = useLocation()
  if (!signedIn) return <Navigate to={`/signin/${persona}`} state={{ from: location.pathname }} replace />
  return <>{children}</>
}
