# EPFO — one account instead of nine portals

A redesign concept for the Employees' Provident Fund Organisation web estate, built as a working
prototype. Today a single person's provident fund, pension, employer filings and grievances live on
roughly nine separately-built portals, each with its own login and its own vocabulary. This makes
them one account with three views.

**Independent concept. Not affiliated with or endorsed by EPFO or the Government of India.
Every person, amount, date and identifier is synthetic.**

---

## The idea

The research in [`improvements.md`](improvements.md) §8 argues that almost every remaining problem
with EPFO's front end is a **missing link between two things EPFO already knows** — and that the fix
is to model the record as a graph and show the edge on both sides.

So the prototype is built on one relational dataset ([`src/lib/mock/db.ts`](src/lib/mock/db.ts)) that
every persona reads and writes. The clearest demonstration:

> **Priya's missing June and Northline Logistics' unfiled June are the same row.**
> File it as the employer and the gap disappears from the member's home screen, live.
> Approve her claim and her tracker advances a stage. Nothing reloads.

## Try it

Sign in as any of the three. Each is a different person with their own identifier, so seeing both
sides of the same object means signing out and back in. The OTP is printed on screen: **`284116`**.

| View | Sign in with | What to look at |
|---|---|---|
| Employee | UAN `1002 3456 7890` | Balance, missing month, live claim tracker, withdrawal |
| Employer | Establishment `MHBAN0045123000` | Unfiled June, approvals sorted by days waiting |
| Pensioner | PPO `MH/PUN/00123456` | Next credit, life certificate with three routes |

### The 90-second walkthrough

1. **Withdraw money** as the employee. Reasons are named in plain language with the eligibility rule
   and the computed cap on each card; one is correctly locked with the reason why. The pre-submit
   check names the exact stale IFSC and fixes it inline — the rejection that takes 45 days to arrive
   takes 45 seconds to prevent.
2. Sign out and sign in as the **Employer**. The claim you just filed is already in the approval
   queue, top of the list. File the June return, then approve the claim.
3. Sign out and sign back in as the **Employee**. The gap is gone, the balance rose by exactly
   ₹11,230, and the tracker has moved on.

Also worth a look: `Settings → Lite mode` (drops every webfont request, not just the font stack),
the Hindi toggle, the on-device assistant, and `/about` for what is real and what is mocked.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/epfo-build-what-moves-india/
npm run build
```

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`. Routing is hash-based, so a
refresh never 404s on a static host. To host it elsewhere, set `DEPLOY_BASE` at build time.

## How it is built

Vite 8 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · zustand · motion. No backend; state
persists to localStorage, and `Settings → Reset the demo` puts every account back to its start.

### The design language

One saturated blue carries every affordance; the neutrals are cool and near-achromatic; status
colour is quarantined in its own ramp so "pending" never reads as decoration. The whole token set
lives in [`src/index.css`](src/index.css) and everything downstream reads from it.

- **A permanent icon rail, and a bar that names the screen and the person.** Five destinations is
  few enough that an icon with its own caption beats a list, and it gives the working area back the
  200px a text sidebar would have taken. The bar owns the page's `h1`, so a page header below it is
  the *task* inside that section, not a second title.
- **Cards carry a hairline, not a shadow.** Shadow is spent on exactly one thing: the filled blue
  button that commits something. One per screen.
- **Every panel is titled with an eyebrow, not a heading.** Keeping the type ramp flat inside a page
  means the only large text on screen is the number, or the question, the page is actually about.
- **The saturated hero surface is its own token pair.** `--brand` lightens in dark mode and white on
  a light blue fails contrast, so the balance card reads from `--hero` / `--hero-foreground`, which
  stay a deep blue with light text in both themes.
- **The 44px tap floor is scoped to coarse pointers.** Applied everywhere it silently overrode the
  entire control-size scale; on a touch screen, which is the only place it was protecting anyone, it
  still holds.

A few other decisions worth naming:

- **`<ActionCard>` requires a `fix` prop.** A warning that cannot state what resolves it will not
  compile. "No dead ends" is enforced by the type system rather than by discipline.
- **`<OwnerClock>`** renders "Waiting on Northline Logistics · 9 days" from any object's `holder` and
  `since`. Every pending row in the dataset carries both, so the question "who has this and for how
  long" is a property of the data.
- **The arithmetic is real.** The passbook is 91 generated ledger rows with interest accrued on the
  monthly running balance and credited at each financial year end — the way EPFO actually computes
  it. Eligibility caps, contribution splits and challan totals are all derived, never typed in.
- **One glossary** feeds the in-place term definitions, the glossary pages and the assistant, so they
  cannot drift apart.

### The assistant

It runs on **Chrome's built-in on-device model** — no API key, no network call, nothing leaves the
device. It is never trusted with a number: every answer about an amount, a date or an eligibility
verdict is assembled deterministically from the record, and the model is only allowed to rephrase
facts the app already computed. Any reply containing a rupee figure, date or reference number absent
from those facts is discarded and the fixed answer shown instead
([`src/lib/assistant/chrome-ai.ts`](src/lib/assistant/chrome-ai.ts)). Where the built-in model is
unavailable — which includes most browsers — the same grounded answers appear and the badge says so.

## What is mocked

All of it: people, employers, amounts, dates, OTPs, payments, the face scan, and every government
integration. No real Aadhaar, PAN, bank or payment detail appears anywhere. `/about` lists this in
full, alongside what would be needed to run the idea at real scale.
