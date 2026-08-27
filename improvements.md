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

## 7. Making the jargon understandable

- **Plain title first, official term second** — "Your withdrawal (Form 19)", never "Form 19" on its own.
- **Every acronym is tappable** — UAN, EPS, EDLI, PPO, ECR show their meaning right where they appear.
- **Meaning opens in place**, never on a new page — nobody should lose a half-filled form to look up a word.
- **One line first, "explain more" second** — the short answer is usually all anyone wanted.
- **Mark the term only the first time** it appears on a screen, not every time.
- **A searchable glossary page**, A–Z, filtered by member / pensioner / employer.
- **Every term gets its own link** (`/glossary/edli`) so SMS, emails and rejection notices can point straight at it.
- **"Where you'll see this"** on each entry — the actual forms and screens the term shows up on.
- **Common wrong names work too** — "PF number", "account number" and "member ID" all find the same answer.
- **Meanings work offline** — the glossary ships with the app, so it opens on 2G and in lite mode.
- **One dictionary feeds everything** — tooltips, glossary page and chatbot never disagree.

### The chatbot

- **On every screen**, collapsed by default, Hindi and English, with voice input on mobile.
- **"What does this mean?"** — answered instantly from the glossary, no network needed.
- **"How do I do this?"** — answered by taking you to the actual screen, not by explaining it in a paragraph.
- **"Where is my claim?"** — answered from your own record, in a fixed format, never a guessed answer.
- **Never invents an amount, a date or an eligibility verdict** — those come from your record or not at all.
- **Says "I don't know, here's a human"** and opens a grievance with your question already filled in.
- **Not logged in? Meanings and directions only** — nothing about anyone's account.
- **Same bot on WhatsApp**, so the answer is identical wherever it's asked.
- **Chat attaches to a grievance in one tap**, so nobody retypes their problem a third time.

### Why this also fixes the writing

- **Every lookup is a label that failed** — track which words get tapped most on each screen.
- **Weekly "top 20 looked-up terms"** goes to whoever writes the interface text.
- **Success is lookups going down**, not a busier glossary.

---

## 8. Product thinking — build the relations, not the pages

Almost every problem above is a missing link between two things EPFO already knows.
The record is a graph — person, employer, claim, challan, contribution, document, nominee, grievance — and today the interface shows one node at a time. Show the edge and most of the confusion goes away.

| The relation | Today | The product move |
|---|---|---|
| Member ↔ employer | Two portals, neither shows the other | One object, two views — same claim, same month, same truth |
| Member ↔ their own past jobs | A passbook per employer | One continuous money timeline under one UAN |
| Claim ↔ grievance | Different website, retype everything | Grievance is a state on the claim, not a destination |
| Member ↔ nominee/family | Discovered only after a death | Nominees verified while the member is alive |
| Member ↔ EPFO's own messages | SMS you can't verify | Every message EPFO sent is in your inbox — if it isn't there, it's a scam |
| Rejection ↔ next applicant | Same rejection, forever | Each rejection reason becomes tomorrow's inline check |

### One person, many relationships

- **The account is a person, not an employment** — the same human is a member at one employer, an ex-member at three, a nominee for a parent, and a pensioner in 2044.
- **Persona is a switcher, not a separate login** — a top-of-screen "Viewing as: Member · Pensioner · Employer · Nominee" that re-skins navigation, vocabulary and help for the session; only roles you actually hold appear.
- **Every employer relationship on one timeline** — portability is the entire point of UAN, so show it as one continuous money story, not four disconnected passbooks.
- **Delegated access as a real feature** — a CSC operator, an HR executive, an adult child filing for a parent: named delegate, scoped permission, expiry, audit trail, one-tap revoke. Today all of this happens by sharing a password.
- **Passkey / 2FA on the one door** — if we collapse nine logins into one, that login has to be worth more than an OTP that any caller can talk you out of.

### Both sides of the same object

- **A member's missing month is an employer's unfiled ECR** — one fact, two audiences; each side should see the other's state.
- **Name the counterparty on every pending item** — "Waiting on Acme Pvt Ltd, HR verified 12 Aug" beats "under process."
- **Every pending object has an owner and a clock** — who holds it, since when, what happens when the clock runs out.
- **Nudges travel along the relation, not through the citizen** — when a member is blocked by their employer, EPFO chases the employer; the member never becomes the messenger.
- **Give the delay a face on the employer side** — "4 claims waiting · longest 9 days · 1 person has been waiting since you last logged in."
- **Cross-side receipts** — when the employer files, the member gets told; when the member raises a mismatch, the employer sees the exact month and amount in dispute.

### Life events, not modules

- **The entry point is the event, not the form** — new job, job change, marriage, buying a home, illness, going abroad, retirement, death in the family. The system picks the forms.
- **One event fans out to every dependent task** — marriage updates the nominee, a new job offers transfer + KYC carry-over, an exit date unlocks withdrawal and starts the 2-month clock.
- **Age- and stage-aware home** — activate at 22, transfer at 28, the eligibility window for a house at 35, EPS mechanics at 50, pension paperwork at 57. Surface the next thing, not all things.
- **The death claim is the flow that must be perfect** — pre-filled from the member's record, jargon removed, no document the family has to hunt for, a human phone number on the same screen.
- **Retirement as a countdown, not a cliff** — a visible 12-month checklist before 58 so pension paperwork isn't discovered on the last day.

### Health, not forms

- **A standing account-health score with a "Needs action" list** — computed continuously, so nothing fails at submit that could have been known at rest.
- **Eligibility precomputed and shown before the form opens** — the system already knows the balance, service length and reason caps; making the user derive them from a circular is the bug.
- **Every warning carries its consequence and its fix in the same card** — no warning that only announces.
- **The best visit is the one that didn't happen** — auto-transfer on job change, auto-settlement inside the cap, auto-renewed life certificates via face auth. Success is fewer logins, not more engagement.

### Trust as a product surface

- **"Did EPFO really send this?"** — every SMS, email and outbound call logged in the notification centre; anything not listed there is a scam, and we say so in one line.
- **Scam awareness placed where fraud happens** — the withdrawal and bank-change screens, not a circular in a PDF.
- **Login and action history** — device, location, what changed, sign out everywhere.
- **Verifiable documents** — every downloaded passbook, PPO or claim letter carries a code a bank or employer can check.

### Grievance as a state, not a website

- **Raise it from the object it's about** — the claim, the month, the challan. The context is attached automatically.
- **A visible escalation ladder with an SLA at each rung** — office → regional → CPGRAMS, with the date it moves up on its own.
- **Resolution writes back to the object** — the claim shows what was fixed, not just that a ticket closed.

### Loops that make it better every month

- **Rejections feed the pre-submit check** — every new rejection reason becomes an inline validation within a release.
- **Glossary lookups feed the copy** — a looked-up word is a label that failed; the top 20 each week goes to whoever writes the interface.
- **Grievance categories are the roadmap** — the top ten categories each quarter are the next quarter's backlog.
- **Measure outcomes, not sessions** — days to credit, % auto-settled, % rejected, grievances per 10,000 claims, office and CSC visits avoided, tasks finished on a phone in under three minutes. Time-on-site going *down* is a win.

---

## 9. If we only have hackathon hours — build these four

1. **Unified role-aware dashboard** — the single strongest visual before/after.
2. **Claim flow with live mismatch detection** — demos the actual problem being solved.
3. **Live claim tracker** — instantly legible to any judge in five seconds.
4. **Lite mode + language toggle** — proves the inclusion story isn't a slide.

---

## 10. What we are deliberately not doing

- Not rebuilding the backend — CITES 2.01, CPPS and auto-settlement already exist.
- Not absorbing Shram Suvidha — it's jointly owned with the Labour Ministry, so we cross-link instead.
- Not removing assisted/offline paths in the name of "everything is digital now."
- Not pursuing look-alike sites legally — we out-compete them on domain and search.

---

## 11. Demo talking points

- "Nine logins become one."
- "The rejection that takes 45 days now takes 45 seconds to prevent."
- "Built for a mid-range Android on patchy 4G — desktop is the enhancement."
- "The backend is already modern. We're fixing the part citizens actually touch."
- "You shouldn't need to know what EDLI means to use it — but if you ask, we tell you in one line."
