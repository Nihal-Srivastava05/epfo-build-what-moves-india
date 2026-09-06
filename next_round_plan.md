# Stage 2 plan — 250 → 10

Resubmission due **7 Sep 2026** (5 days from today, 2 Sep). Same rubric as before:
Problem · Working build · Usability · Product thinking · End-to-end thinking · Honesty.
A finalist build has to win on "most improved" as much as "best" — mentors will diff this
version against the one they read for the shortlist, so every item below either closes a
gap the docs already admit to (`about.tsx`, `advantages_in_others.md`) or answers the rubric
line most builds will still be weak on.

Two people, ~5 days. Ordered P0 → P2. Do not start P1 until P0 is done — P0 items are risks
to the submission itself, not features.

---

## P0 — fix before anything else (day 1)

### 1. The build doesn't satisfy the Codex/OpenAI requirement
The brief: *"your prototype should be built with Codex or powered by an OpenAI model...
a meaningful part of how you build it, not something added only for the submission."*
Right now the on-device assistant runs on Chrome's built-in Gemini Nano
(`src/lib/assistant/chrome-ai.ts`) — nothing in the product or the repo touches OpenAI or Codex.
This is a rubric-zero risk, independent of build quality.

**Fix — add one real, load-bearing OpenAI feature**, not a bolt-on badge:

- **Keep the on-device model as the offline/lite-mode path** (it's a genuinely good story:
  "works with zero network on a 2G phone") and **add OpenAI as the online-enhanced path**.
  Since this is a static GitHub Pages site, calling the OpenAI API straight from the browser
  would ship your API key to every visitor — put a thin serverless proxy in front of it
  (Cloudflare Worker or Vercel Edge Function, both free-tier, both a few hours of work) that
  holds the key and forwards a constrained prompt.
- Best feature to hang it on: **freeform grievance intake**. Today `Grievance` (`src/routes/grievance.tsx`)
  requires picking from a fixed list of what the complaint is about. Add a "describe it in your
  own words" box; send that text (plus the person's own claim/contribution facts, already in
  `useData()`) through the proxy to have the model (a) pick the right `about` attachment,
  (b) draft the `detail` field, (c) suggest the category. The person reviews and edits before
  submitting — the model drafts, it never decides or invents a number. This is a genuinely
  better citizen experience *and* a real backend/process story ("EPFO could triage 10,000
  grievances a day this way") which also feeds **End-to-end thinking**.
- Second candidate if time allows: a "explain this in plain language" pass over government
  notices or rejection reasons — same guardrail as the existing assistant (`chrome-ai.ts`):
  the model only rephrases facts the app already computed; any output containing an amount,
  date or reference number absent from those facts is discarded, exactly like today's check.
- Update `about.tsx`'s "what actually works" / "how this would work at scale" sections and the
  README to say plainly which parts are OpenAI-powered, which are on-device, and why both exist.
  That split *is* the honesty story — better than one model doing everything.
- Say it out loud in the video's second half ("built with Codex" / "powered by GPT for X") —
  mentors are explicitly told to check this, don't make them infer it.

**If Codex was in fact used to build this codebase in another session/tool**, document that
in the writeup instead of, or alongside, the above — but verify it's true and specific
(which parts, how) before claiming it. Don't retrofit a claim to fit the rubric.

### 2. Persona switch requires signing out — undercuts the core pitch
The README's own script says seeing both sides of one object "means signing out and back
in." The whole pitch is *"nine portals become one account."* Forcing a logout to change hats
is the single biggest visible gap between the pitch and the build, and it's exactly the kind
of thing a mentor will notice on the second run-through.

`improvements.md` §8 already specifies the fix: **persona is a switcher, not a separate
login** — a top-of-screen "Viewing as: Member · Pensioner · Employer" that only lists roles
the signed-in identity actually holds, re-skins nav/vocabulary, and never re-prompts for
credentials. Concretely: extend `useSession`/`useIdentity` so one identity can hold multiple
personas (most demo users plausibly are just a member; make at least one demo identity hold
member + employer, to be that person's proof-of-concept), add the switcher to `app-shell.tsx`.
This is the item already sitting in `advantages_in_others.md` line 2 — do it first, it's the
highest ratio of story-impact to engineering effort on this whole list.

### 3. Fix the mobile-only regression the demo script itself flags
`demo_script.md` notes the top-bar search "is hidden below the `sm` breakpoint" — i.e. a
close beat in your own walkthrough doesn't work on the exact device class (~70% of users,
per your own `improvements.md` §2) the brief asks you to design for. Reviewers use a phone.
Do a full mobile pass on every flow (sign-in, withdraw, monthly return, life certificate,
grievance) before touching new features — a broken primary journey on mobile is a **Working
build** rubric failure, not a polish nit.

---

## P1 — highest-leverage additions (days 2–4)

Each maps to a specific rubric line and a gap your own docs already flagged
(`advantages_in_others.md`, `improvements.md` §8). Pick from this list in order; stop when
you're 1 day from the deadline and switch to the P0 submission checklist below.

### Account health score + "needs action" list — *Product thinking, Usability*
`improvements.md` §8: *"a standing account-health score with a Needs action list — computed
continuously, so nothing fails at submit that could have been known at rest."* Right now
health-flavored logic only exists inline on `member/kyc.tsx`. Pull it into one derived score
(reuse the shape you already have: KYC completeness, bank verification, nominee set, pending
mismatches) surfaced as a card on member home, employer dashboard, and pensioner home — same
component, three data shapes. This is the item at the top of your own `advantages_in_others.md`
notes and it's mostly composition of data you already compute in `derive.ts`.

### Life events surfaced by age/stage — *Product thinking*
Your own note: *"show points based on age, see US website for ideas"* (referring to ssa.gov's
age-based life-event prompts). `improvements.md` §8 spells out the exact stages: activate at
22, transfer at 28, house-withdrawal window at 35, EPS mechanics at 50, retirement countdown
at 57. Add a small "what's next for you" card on member home driven off the mock person's age
in `mock/db.ts` — cheap to build (it's a lookup table keyed on age band), high demo value
("the app knows what matters to me at my age, not a static menu").

### Verifiable exports — close a gap the app currently admits to out loud
`about.tsx` literally says: *"a genuine [export] would carry a verification code, and the
numbers in these are invented."* That's a listed gap, not a hypothetical — closing it turns an
honesty disclosure into a shipped feature. Add a short verification code to each CSV export
(`export.ts`), store the code against the export in the mock store, and add a `/verify` page
where anyone can paste a code and see "issued to [masked UAN] on [date], for [document type]"
or "not found." This single feature also answers `improvements.md` §6's "Verification code on
every downloadable PDF" and the "Is this the real EPFO?" anti-fraud line — two checklist items
for one build.

### Scam awareness, made a real surface — *Trust, Usability*
Partial coverage exists (withdraw, life-certificate). Make it a first-class surface per
`improvements.md` §6:
- A **login/session activity page** — device, approximate location, "sign out everywhere"
  (mock data is fine, it's demonstrating the pattern) — this is also called out directly in
  `improvements.md` §8 ("Login and action history").
- A one-line **scam banner** on withdrawal and bank-change screens ("EPFO never calls asking
  for your OTP").
- Tie it together with the `/verify` page above under one "Trust & security" destination —
  gives judges one place to see the whole anti-fraud story instead of three scattered lines.

### Easier auth — passkey/2FA affordance
Your own note flags this. Full WebAuthn is more than 5 days justifies; a **mocked passkey
option on the sign-in screen** ("Use a passkey instead" alongside OTP) plus the session log
from above gets the story across — "we thought about the one door being worth protecting
better than an OTP" — without a real WebAuthn implementation eating a day.

---

## Why youth barely open this — and what would close the gap

Worth a dedicated pass because it's a real angle a mentor will respect: the brief asks for
*real Indian users*, and the biggest segment EPFO structurally under-serves isn't the
low-digital-literacy user this project already designs well for (lite mode, glossary, plain
language) — it's the 22–35 salaried earner who has every digital habit *except* this one.
That's also exactly your own demo persona, Priya Sharma (dob 1994, i.e. 32) — so this isn't a
side quest, it's about making the app's own protagonist want to open it more than once a year.

**Why they don't come back, concretely:**

- **PF doesn't feel like "my money" yet.** It's a payroll deduction line, not an account they
  chose to open — contrast with a UPI app or a broking app, which they open because *they* put
  money in and want to watch it. There's no equivalent moment of agency in the current flow.
- **Nothing pushes them back in.** Banking and broking apps run on push notifications and
  transaction alerts; EPFO is pull-only — you have to remember it exists and go look. The one
  event that would justify a visit (interest credit) happens once a year, silently.
- **Job-hopping is this generation's default, and every hop is currently a chore, not a
  reassurance.** The strongest EPFO touches this age group with are UAN activation and
  transfer requests — both framed as paperwork, never as "your money followed you."
- **No place PF shows up next to the numbers they already track.** They check a net-worth or
  investing app; PF is invisible there, so mentally it doesn't compound into "my wealth" at all.
- **Retirement at 58 reads as fiction at 25.** Finance content aimed at this age group (much of
  it social-media-driven) is about stocks, mutual funds and crypto — instruments with visible,
  frequent movement — precisely because PF's once-a-year, no-decisions-to-make nature generates
  no content and no habit.
- **Dormant balances are invisible, not urgent.** Someone who's changed jobs twice by 28 often
  has an old UAN with a forgotten balance sitting idle — today nothing surfaces that as *their*
  money waiting to be claimed.

**What to build for it** (each tagged with where it fits given the 5-day budget):

- **"PF Wrapped" — an annual recap card.** *(P1 if the account-health/life-events work leaves a
  half day; otherwise the single best P2 add.)* Reuse the passbook's already-real arithmetic
  (`interest-working.tsx`, `derive.ts`) to generate one shareable card per financial year:
  "Your employer put in ₹X, you put in ₹Y, interest alone earned you ₹Z, your corpus grew N%."
  This is the Spotify-Wrapped/bank-year-in-review pattern this age group already engages with
  every December/January — and it costs you nothing new to compute, only to compose and export
  as an image (reuse `html2canvas`, already a dependency). Directly answers "why would I open
  this in a year I'm not filing a claim."
- **Dormant/forgotten-balance finder.** *(P1 candidate — cheap, high demo payoff.)* Add a mock
  second UAN from an earlier employer to the sample data with an unclaimed balance, and surface
  it as a notification/card: *"You may have ₹18,400 in an account from [old employer] — link it
  in two minutes."* This mirrors the "found money" hook that makes Groww/CRED-style dormant-asset
  discovery features effective, and it's a real, common EPFO failure mode (multiple UANs per
  person from job changes before Aadhaar-seeding), so it's honest, not gimmicky.
- **Positive-event notifications, not just warnings.** The `notifications.tsx` surface already
  exists — right now it reads as compliance-flavored ("KYC pending"). Add the good news too:
  "₹4,320 credited by Acme Pvt Ltd for August" the same week payroll would run, and a one-line
  milestone ping the day a balance crosses a round number ("Your PF crossed ₹5,00,000"). This is
  the Pavlovian "check the app" trigger a debit/credit SMS gives a bank account; PF has none of it
  today.
- **A first-UAN "day one" moment, not a form.** `improvements.md` already lists "new-joiner
  onboarding" as a checklist line; make it a real first-run screen for a first-time UAN holder —
  30 seconds framing PF as "the first long-term saving instrument you didn't have to choose,"
  showing the `future-me` projection immediately rather than waiting for the person to find that
  page on their own. The first login is currently the only guaranteed high-attention moment this
  age group gives EPFO — spend it on something other than a KYC checklist.
- **Reframe account health as a checkable score, not a to-do list.** This age group already has
  the habit of checking a *score* — CIBIL, a credit-app "score," a fitness ring — precisely
  because a single number is more re-visitable than a list of chores. When you build the account
  health item from P1, present it primarily as a score with the needs-action list underneath it,
  not the other way round; same computation, more reason to come back and see if it moved.
- **Don't do:** leaderboards, peer comparison ("people your age have saved ₹X"), or reward/perk
  gimmicks bolted onto a retirement fund. All three read as a private fintech growth trick applied
  to a government trust product, which cuts against the trust story the rest of this build is
  making. Mention this restraint explicitly in the writeup if a mentor asks "why no gamification" —
  it's a deliberate choice, not an oversight.

---

## More ideas (grab-bag — pull from here if a P1 item finishes early)

- **"Download all my data"** on the settings page — one export bundling passbook, claims, KYC
  and notifications. Cheap (you already have `export.ts` and every underlying dataset), and it's
  a live, current-events answer to **End-to-end thinking**: India's DPDP Act 2023 gives citizens
  a real right to data portability/erasure, and almost no government portal implements it visibly
  yet. Naming it in the writeup as "we built the DPDP right to portability, not just GDPR-flavored
  best practice" is a specific, checkable claim a mentor can verify in one click.
- **Turn the README's accessibility claims into evidence.** "Real WCAG AA contrast, visible focus
  rings, keyboard-navigable everything" is currently an assertion. Run `axe-core` (or the Chrome
  DevTools Lighthouse accessibility audit) against the built site, screenshot or paste the score
  into `about.tsx`, and fix whatever it flags. Converts a claim into proof — strengthens
  **Honesty** for near-zero cost if the score is already good, and finds real bugs if it isn't.
- **Web push notifications, demoed for real.** The browser Notification API works today, no
  backend needed for a demo: let a user opt in on the notifications page and fire one real
  browser notification when a mock event happens (contribution credited, claim stage advances).
  This is a genuine feature, not a mock — worth calling out as such, and it's the mechanism the
  "positive-event notifications" idea above would actually ride on.
- **A short "what changed since the shortlist" panel**, visible somewhere in the app (or just in
  the video/summary) — mentors reviewing 250→10 are explicitly comparing this version to the last
  one; make the diff impossible to miss instead of hoping they notice the persona switcher or the
  new grievance flow on their own.

---

## P2 — only if P0 and P1 are done with time to spare

- **Delegated access** (`improvements.md` §8): named delegate, scoped permission, expiry,
  one-tap revoke — for a CSC operator or adult child filing for a parent. High product-thinking
  value but touches session/permission model broadly; don't start this with under 2 days left.
- **Document vault** — upload once, reuse across claims. Nice-to-have; the withdrawal flow
  already claims "no documents needed," so this mainly matters for flows you haven't built yet
  (death claim attachments). Lower priority than it looks.
- **Voice input path**, **WhatsApp status bot mock**, **22-language architecture beyond hi/en**
  — real ideas in `improvements.md` §6/§7 but each is a demo-video line at best inside 5 days;
  don't let any of them displace P0/P1.
- **Eligibility pre-checker as a standalone page** — most of its value is already inside the
  withdrawal flow (computed caps shown per-reason); a separate page is redundant unless you
  finish everything else early.

---

## Submission mechanics — don't lose points on process

- **Live link**: confirm the GitHub Pages deploy works in a private/incognito window with no
  prior login — reviewers open a fresh browser.
- **Mock credentials**: README already lists UAN/establishment/PPO + OTP `284116` — keep this
  current if the multi-persona identity from P0.2 changes any of them.
- **Video, ≤2 min, both teammates present**: first 60s = citizen journey (use `demo_script.md`
  as the base, but insert the persona-switch fix and, if built, the grievance/OpenAI moment —
  it's new and a mentor will be looking for what changed since Stage 1). Second 60s = how it
  was built and why (name Codex/OpenAI explicitly here per P0.1), split between both of you.
- **Project summary, <250 words**: rewrite to lead with what changed since the shortlist round,
  since these mentors/reviewers likely read the last version — "most improved" is a real
  category even if not named as one.
- **Honesty section**: update `about.tsx`'s "what works" / "what's mocked" lists the moment
  any P0/P1 item ships — an export that now has real verification codes should move from the
  "mocked" list to the "works" list the same day it's built, not at the end.

---

## Suggested split across two people, 5 days

This assumes both of you can code; adjust if one of you is design/content-lead.

| Day | Person A | Person B |
|---|---|---|
| 1 | OpenAI proxy (Worker/Edge fn) + wire into grievance intake | Persona switcher (P0.2) + mobile pass (P0.3) |
| 2 | Finish grievance-intake feature end to end | Account health score + life-events-by-age card |
| 3 | Verifiable exports + `/verify` page | Scam surface: session log + banners |
| 4 | Passkey affordance on sign-in; polish OpenAI feature; update `about.tsx` honesty lists | Full regression pass on all flows, mobile + desktop, both languages |
| 5 | Record video (both present), write 250-word summary | Final deploy check in incognito, submit |

---

## What not to change

Per `improvements.md` §10 and the strength of what's already built — don't touch these, they're
working and re-litigating them burns days you don't have:
- The relational data model (`mock/db.ts`) and the "same object, two views" architecture — this
  is the strongest idea in the build, extend it, don't replace it.
- The passbook interest arithmetic — already real, already the "money shot" of the demo.
- The design system / token set in `index.css` — it's coherent; new features should read from
  it, not introduce new patterns.
- The on-device assistant's "never invents a number" guardrail — carry the exact same
  discipline into the new OpenAI-powered feature rather than loosening it for convenience.
