import { lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { PrefsEffect } from '@/components/layout/prefs'
import { PublicShell } from '@/components/layout/public-shell'
import { AppShell } from '@/components/layout/app-shell'
import { RequireSignIn } from '@/components/layout/require-sign-in'
import { AssistantDock } from '@/components/assistant/assistant-dock'
import { ScrollToTop } from '@/components/layout/scroll-to-top'
import { useSession } from '@/store/session'
import { personaMeta } from '@/lib/nav'
import Landing from '@/routes/landing'

const SignIn = lazy(() => import('@/routes/signin'))
const StatusLookup = lazy(() => import('@/routes/status-lookup'))
const DeathClaim = lazy(() => import('@/routes/death-claim'))
const DeathClaimFile = lazy(() => import('@/routes/death-claim-file'))
const Calculators = lazy(() => import('@/routes/calculators'))
const Glossary = lazy(() => import('@/routes/glossary'))
const GlossaryTerm = lazy(() => import('@/routes/glossary-term'))
const About = lazy(() => import('@/routes/about'))
const Settings = lazy(() => import('@/routes/settings'))
const Profile = lazy(() => import('@/routes/profile'))
const Notifications = lazy(() => import('@/routes/notifications'))
const Grievance = lazy(() => import('@/routes/grievance'))

const MemberHome = lazy(() => import('@/routes/member/home'))
const MemberFutureMe = lazy(() => import('@/routes/member/future-me'))
const MemberPassbook = lazy(() => import('@/routes/member/passbook'))
const MemberServiceHistory = lazy(() => import('@/routes/member/service-history'))
const MemberClaims = lazy(() => import('@/routes/member/claims'))
const MemberWithdraw = lazy(() => import('@/routes/member/withdraw'))
const MemberClaimDetail = lazy(() => import('@/routes/member/claim-detail'))
const MemberKyc = lazy(() => import('@/routes/member/kyc'))
const MemberGap = lazy(() => import('@/routes/member/gap'))
const MemberHelp = lazy(() => import('@/routes/member/help'))
const MemberCalculators = lazy(() => import('@/routes/member/calculators'))

const EmployerDashboard = lazy(() => import('@/routes/employer/dashboard'))
const EmployerReturn = lazy(() => import('@/routes/employer/monthly-return'))
const EmployerEmployees = lazy(() => import('@/routes/employer/employees'))
const EmployerApprovals = lazy(() => import('@/routes/employer/approvals'))
const EmployerChallans = lazy(() => import('@/routes/employer/challans'))
const EmployerHelp = lazy(() => import('@/routes/employer/help'))

const PensionerHome = lazy(() => import('@/routes/pensioner/home'))
const PensionerPayments = lazy(() => import('@/routes/pensioner/payments'))
const PensionerLifeCert = lazy(() => import('@/routes/pensioner/life-certificate'))
const PensionerDetails = lazy(() => import('@/routes/pensioner/details'))
const PensionerHelp = lazy(() => import('@/routes/pensioner/help'))

/**
 * Reference pages (glossary, calculators, status lookup, about) are reachable
 * whether or not you've signed in. A signed-in visitor still needs their own
 * nav rail and account menu here — dropping them into the public marketing
 * shell hides all of that and reads as having been signed out, even though
 * `signedIn` never changed.
 */
function ReferenceShell() {
  const signedIn = useSession((s) => s.signedIn)
  return signedIn ? <AppShell /> : <PublicShell />
}

/**
 * The logo in the nav rail links here, so a signed-in visitor can land on "/"
 * without ever signing out. The guest landing page has no way to show that —
 * it always looks logged out — so anything from here that later checks
 * `signedIn` (like the reference pages above) would suddenly look like it
 * "logged them back in". Send signed-in visitors straight to their own home
 * instead of showing them the guest landing at all.
 */
function LandingOrHome() {
  const signedIn = useSession((s) => s.signedIn)
  const persona = useSession((s) => s.persona)
  if (signedIn) return <Navigate to={personaMeta[persona].home} replace />
  return <Landing />
}

export default function App() {
  return (
    <HashRouter>
      <PrefsEffect />
      <ScrollToTop />
      <TooltipProvider delayDuration={200}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <Routes>
          <Route element={<PublicShell />}>
            <Route index element={<LandingOrHome />} />
            <Route path="signin/:persona" element={<SignIn />} />
          </Route>

          <Route element={<ReferenceShell />}>
            <Route path="status" element={<StatusLookup />} />
            <Route path="death-claim" element={<DeathClaim />} />
            <Route path="death-claim/file" element={<DeathClaimFile />} />
            <Route path="calculators" element={<Calculators />} />
            <Route path="glossary" element={<Glossary />} />
            <Route path="glossary/:termId" element={<GlossaryTerm />} />
            <Route path="about" element={<About />} />
          </Route>

          <Route
            element={
              <RequireSignIn>
                <AppShell />
              </RequireSignIn>
            }
          >
            <Route path="member" element={<MemberHome />} />
            <Route path="member/future-me" element={<MemberFutureMe />} />
            <Route path="member/passbook" element={<MemberPassbook />} />
            <Route path="member/service-history" element={<MemberServiceHistory />} />
            <Route path="member/claims" element={<MemberClaims />} />
            <Route path="member/claims/new" element={<MemberWithdraw />} />
            <Route path="member/claims/:claimId" element={<MemberClaimDetail />} />
            <Route path="member/kyc" element={<MemberKyc />} />
            <Route path="member/gap/:month" element={<MemberGap />} />
            <Route path="member/help" element={<MemberHelp />} />
            <Route path="member/calculators" element={<MemberCalculators />} />

            <Route path="employer" element={<EmployerDashboard />} />
            <Route path="employer/return" element={<EmployerReturn />} />
            <Route path="employer/employees" element={<EmployerEmployees />} />
            <Route path="employer/approvals" element={<EmployerApprovals />} />
            <Route path="employer/challans" element={<EmployerChallans />} />
            <Route path="employer/help" element={<EmployerHelp />} />

            <Route path="pensioner" element={<PensionerHome />} />
            <Route path="pensioner/payments" element={<PensionerPayments />} />
            <Route path="pensioner/life-certificate" element={<PensionerLifeCert />} />
            <Route path="pensioner/details" element={<PensionerDetails />} />
            <Route path="pensioner/help" element={<PensionerHelp />} />

            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="grievance/new" element={<Grievance />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AssistantDock />
        <Toaster position="top-center" />
      </TooltipProvider>
    </HashRouter>
  )
}
