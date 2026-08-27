# EPFO Website — What to Fix, What to Build

A plain checklist for the hackathon build. Companion to `epfo-unified-proposal.html`.
Everything here is one line so it can be read in a hurry and cut fast.

---

## 1. The one-sentence pitch

> EPFO already rebuilt the backend (one national database, portable pensions, auto-settlement). We rebuild the front door that sits on top of it — nine portals become one.

---

## 2. Problems we are fixing

- 9+ separately branded portals, each with its own login for the same one person.
- ~70% of users are on phones; the portal is built for a desktop mouse.
- Claims get rejected weeks later for a single-letter name mismatch nobody flagged at entry.
- Sessions die mid-form and silently delete everything typed.
- Every form re-asks for name, DOB, bank details EPFO already stores and already verified.
- Errors say "Invalid data, please try again" and name no field.
- Pensioners do their most important yearly task (life certificate) on a non-EPFO website.
- Grievances live on a separate site, invisible from inside the member portal.
- Scheme jargon (UAN, PPO, EPS, EDLI, ECR) with no plain-language explanation anywhere.
- Fake look-alike sites (eepfo.com, epfoportal.com) rank next to the real one in search.

---

## 3. Structural changes (the big moves)

- **One login** — UAN + Aadhaar, one session, works for member / pensioner / nominee / employer.
- **One domain** — a single canonical address; every legacy domain 301-redirects into it.
- **Role detected after login, not chosen before it** — the dashboard changes, the account doesn't.
- **Merge the grievance portal** into a tab inside every dashboard, auto-linked to the claim it's about.
- **Embed life-certificate verification** into the pensioner home instead of sending them elsewhere.
- **One shared services layer** under all roles: notifications, document vault, grievances, help.
- **Employer + Shram Suvidha status in one workspace**, even if the systems stay legally separate.
- **No new portal per policy change** — extend the platform, never spin up a bespoke site.

---

## 4. Interaction fixes (small, unglamorous, high impact)

| Today | Replace with |
|---|---|
| No progress indicator on long forms | Persistent "step 2 of 4" tracker on every flow |
| Session expires, data gone | Every field autosaves; return to "Resume where you left off" |
| Re-typing stored details | Pre-filled data shown for confirmation, not re-entry |
| "Invalid data, please try again" | Inline field-level errors that name the exact mismatch |
| Rejection letter after 45 days | Live validation before submit, with a fix-it link |
| CAPTCHA + OTP on nearly every page | One verified session per task; re-challenge only for bank changes |
| Passbook as a static PDF | Live searchable ledger in the browser, PDF as an export option |
| SMS / email / inbox all saying different things | One notification centre; SMS and email mirror it |
| Dense desktop tables on mobile | Card layouts, large tap targets, thumb-reachable primary action |

---

## 5. Design improvements

- **Status first, menu second** — home screen leads with "what's happening to your money right now."
- **Passbook as the visual reference**, not generic fintech — ledger rules, tabular figures, a stamped accent.
- **Navy for structure, gold only for what matters** — amounts, due dates, the one CTA per screen.
- **Status colours kept separate from brand colours** so "pending" never reads as decoration.
- **Plain language first, acronym second** — "Your withdrawal — ₹1,84,200" above "Form 19."
- **Tabular monospace for all numbers** so amounts and IDs line up and stay scannable.
- **One primary action per screen.** Everything else is secondary or a link.
- **Empty and error states designed on purpose**, not left as raw framework defaults.
- **Full dark mode**, since a lot of this gets checked at night on a phone.
- **Real WCAG AA contrast, visible focus rings, keyboard-navigable everything.**
- **Skeleton loaders instead of blank white screens** on slow connections.
- **Bigger type than a typical dashboard** — the audience skews older and low-vision.

---

## 6. New features to build

### Trust & money clarity
- **Claim tracker** — live "Filed → Validated → Auto-settling → Credited" bar with an expected date.
- **"Am I eligible?" checker** — tells you what you can withdraw and how much, before you start a form.
- **Retirement projection** — a simple line showing your corpus at 58 at the current contribution rate.
- **Contribution gap alert** — flags the month your employer didn't deposit, instead of you finding it years later.
- **Interest credit explainer** — plain-language breakdown of how this year's interest was calculated on your balance.

### Preventing failure
- **Pre-submit health check** — a one-screen "your KYC is 4/5 complete, this will fail on IFSC" report.
- **Two-stage KYC tracker** — names who is holding it up: "Waiting on your employer" vs "Waiting on EPFO office."
- **Auto-nudge to the employer** so the member isn't the one making phone calls.
- **Document vault** — upload Aadhaar/PAN/cancelled cheque once, reuse across every future claim.

### Access & inclusion
- **Lite mode** — a separate low-bandwidth rendering budget for 2G/3G, not just "responsive."
- **Voice + icon path** for the core four tasks, for members who can't read a dense form.
- **22-language architecture**, Hindi/English at launch, rollout ordered by member population per state.
- **Assisted/helper mode** designed for a CSC operator filing on someone's behalf.
- **WhatsApp status bot** — balance and claim status without opening the portal at all.
- **Offline claim drafting** — fill on patchy signal, submit when the connection returns.

### Life events
- **Guided EDLI death-claim flow** — minimal jargon, pre-filled, with a human phone number on the same screen.
- **Job-change flow** — one tap to transfer, with the old and new employer both visible.
- **New-joiner onboarding** — welcome SMS with one-tap UAN activation before the first payslip.
- **Pensioner doorstep booking** — book an India Post agent for the life certificate from the dashboard.

### Anti-fraud & safety
- **Verification code on every downloadable PDF** so a passbook or PPO can be checked as genuine.
- **"Is this the real EPFO?" checker** — paste a URL, get an official/not-official verdict.
- **Login activity log** — every session, device and location, with one-tap sign-out-everywhere.
- **Scam warning banner** on the withdrawal flow, since that's where fraud calls target people.

### Employer side
- **Pre-upload ECR validation** — bad IFSC or duplicate UAN flagged before the challan is generated.
- **Monthly compliance checklist** — "ECR due in 5 days · 3 KYC approvals pending · 1 exit to process."
- **Bulk KYC approval** in one screen instead of one employee at a time.
- **Filing calendar** with deadline reminders per establishment code.

---

## 7. If we only have hackathon hours — build these four

1. **Unified role-aware dashboard** — the single strongest visual before/after.
2. **Claim flow with live mismatch detection** — demos the actual problem being solved.
3. **Live claim tracker** — instantly legible to any judge in five seconds.
4. **Lite mode + language toggle** — proves the inclusion story isn't a slide.

---

## 8. What we are deliberately not doing

- Not rebuilding the backend — CITES 2.01, CPPS and auto-settlement already exist.
- Not absorbing Shram Suvidha — it's jointly owned with the Labour Ministry, so we cross-link instead.
- Not removing assisted/offline paths in the name of "everything is digital now."
- Not pursuing look-alike sites legally — we out-compete them on domain and search.

---

## 9. Demo talking points

- "Nine logins become one."
- "The rejection that takes 45 days now takes 45 seconds to prevent."
- "Built for a mid-range Android on patchy 4G — desktop is the enhancement."
- "The backend is already modern. We're fixing the part citizens actually touch."
