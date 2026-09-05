# EPFO Demo MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the **member** and
**pensioner** experience from the "Build What Moves India" EPFO redesign to any MCP-compatible AI
tool — check PF balance, browse the passbook, see how interest was calculated, check claim status,
check KYC, read official notifications, look up EPFO jargon, and raise a grievance.

This is a **mocked demo**, not a connection to the real EPFO. It reuses the exact same seed data and
arithmetic (contribution splits, interest accrual, growth projections) as the live Vite app in this
repo, so the numbers you get here match what you'd see signed into the app. No claim filing —
`epfo_file_claim` exists but always declines, on purpose. No employer/HR tools.

## Setup

```bash
cd mcp
npm install
npm run build
```

Requires Node ≥ 18.

## Try it locally (MCP Inspector)

```bash
npm run inspect
```

Opens the MCP Inspector web UI against `dist/index.js` so you can list and call tools by hand before
wiring it into a real client.

## Connect an AI tool

The server speaks MCP over stdio — point your client at the built entrypoint.

**Claude Code** (from the repo root):

```bash
claude mcp add epfo-demo -- node "$(pwd)/mcp/dist/index.js"
```

**Claude Desktop** — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "epfo-demo": {
      "command": "node",
      "args": ["/absolute/path/to/epfo-build-what-moves-india/mcp/dist/index.js"]
    }
  }
}
```

**Cursor** — add the same shape to `.cursor/mcp.json`.

Then ask your assistant something like *"What's Priya's PF balance?"* or *"Raise a grievance about my
missing June contribution"* and it should call the matching tool.

## Demo identities

No real sign-in — tools default to these if you don't pass an identifier:

| Persona | Name | UAN / PPO | OTP |
|---|---|---|---|
| Member | Priya Sharma | `100234567890` | `284116` |
| Pensioner | Ram Prasad Verma | `MH/PUN/00123456` | `284116` |

Call `epfo_list_demo_accounts` to get this from the server itself.

## Tools

**Discovery**
- `epfo_list_demo_accounts` — the demo identities and OTP.
- `epfo_login` — validate a UAN/PPO + OTP (optional; nothing else requires it).
- `epfo_get_profile` — member's personal details.
- `epfo_get_employment_history` — every employer on record, with tenure and wage.

**Glossary**
- `epfo_lookup_term` — look up what an EPFO acronym, form number, or piece of jargon (UAN, EPS, Form 19, KYC, wage ceiling, …) actually means, matching on the term, its expansion, or common alternate names. Reads from the same glossary that backs the live app's tooltips and glossary page, so the answer can't drift or get hallucinated.
- `epfo_list_glossary_terms` — list every term this server has a definition for, optionally filtered by persona.

**Balance & interest**
- `epfo_get_pf_balance` — current balance broken into employee/employer/interest/EPS shares.
- `epfo_get_passbook` — the full contribution + interest ledger, grouped by financial year.
- `epfo_calculate_interest` — the month-by-month working behind one FY's interest credit.
- `epfo_estimate_growth` — project the corpus forward to retirement (age 58).

**Claims (view-only)**
- `epfo_list_claims` — all claims, newest first.
- `epfo_get_claim_status` — one claim's stage tracker and plain-language "what happens next".
- `epfo_check_withdrawal_eligibility` — which withdrawal reasons the member currently qualifies for.
- `epfo_file_claim` — **always declines.** Filing a real claim isn't supported here.

**KYC**
- `epfo_get_kyc_status` — Aadhaar/PAN/bank/mobile/nominee status and any pre-claim blockers.

**Notifications**
- `epfo_list_notifications` — the official-message verification log ("if it's not here, EPFO didn't send it").

**Grievances**
- `epfo_list_grievances` / `epfo_get_grievance_status` — read grievances and their escalation rung.
- `epfo_raise_grievance` — actually creates one (in-memory), starting at the PF-office rung with a
  15-day escalation clock — same as the live app.

**Pensioner**
- `epfo_get_pension_details`, `epfo_list_pension_payments`, `epfo_get_life_certificate_status`.

**Admin**
- `epfo_reset_demo` — clears any grievances raised this session.

## State & limitations

- State is **in-memory per server process** — restarting the server resets everything. Only
  grievances you raise are ever written; nothing else mutates.
- No employer/HR tools (roster, approvals, challans) — out of scope.
- No claim filing — `epfo_file_claim` is a deliberate, explicit decline, not a missing capability.
- Every date is anchored to the app's fixed demo "today", `2026-08-28`, so relative figures ("9 days
  left") match the live site exactly.

## Source layout

```
src/
  index.ts        entrypoint — connects the stdio transport
  server.ts        registers all tool groups on one McpServer
  data/            ported + trimmed seed dataset, types, and in-memory grievance state
  lib/              ported pure computation (interest, ledger, growth, grievance ladder) + identity glue
  tools/            one file per tool group, matching the list above
```

The `data/` and `lib/` files are direct ports of `src/lib/mock/db.ts`, `derive.ts`, `claims.ts`,
`grievances.ts`, `calculators.ts`, and `format.ts` in the main app — trimmed to member/pensioner rows,
with import paths adjusted and the i18n layer dropped. See the root `README.md` for the concept behind
the dataset itself.
