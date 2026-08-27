# EPFO — redesign spec

Redesign of the Employees' Provident Fund Organisation web presence (epfindia.gov.in and the member/employer/pensioner portals) as one product with three audiences.

Prototype: EPFO Member Portal.dc.html
Design system: Spring (RingCentral) — tokens at _ds/spring-design-system-.../colors_and_type.css, icons mirrored into icons/.

 

## 1. Problem

The current EPFO estate is not one website. It is a directory of ~30 separately-built portals (Member Passbook, Unified Member Portal, Pensioners' Portal, Employer e-Sewa, Shram Suvidha, EPFiGMS, Jeevan Pramaan…), each with its own login, navigation and visual language.

Four failures drive everything in this redesign:

| Failure | What the user experiences |
|---|---|
| Impossible navigation | Cannot tell which of 30 portals holds the thing they need. Search does not cross portals. |
| Jargon-first language | Tasks are named by form number (19, 31, 10C, 13, 5, 10) and scheme acronym (EPS, EDLI, ECR, TRRN, PPO), not by intent. |
| Too many portals | Same identity, many logins. Sessions do not carry across. |
| Dated visuals | Table-based layouts, inconsistent type, low contrast, no mobile consideration, no visible status anywhere. |

## 2. Principles

Name the task, not the form. "Withdraw money" first; "Form 31" is a footnote. Form numbers appear only where a user must quote them to a third party.
One destination per intent. Every task on the public site resolves to exactly one screen. No hub pages that only link onward.
Status is the product. For a claim, a return or a pension, the answer to "where is it and when does it land" is on the first screen, not behind a lookup.
The system does the arithmetic. Eligibility caps, contribution splits, prorated wages and deadlines are computed and shown, never left to the user to derive from a circular.
No dead ends. Every warning carries the action that resolves it, in the same card.
Government where it earns trust, product everywhere else. Emblem and ministry attribution in the footer; the working surface is a product.

## 3. Audiences

| Audience | Signs in with | Primary job |
|---|---|---|
| Member (salaried) | UAN | Check balance, withdraw, track a claim, fix KYC |
| Employer / HR | Establishment code | File the monthly return, pay the challan, approve claims |
| Pensioner | PPO number | Confirm payment, submit the annual life certificate |

Persona is chosen on the public site and determines navigation, sign-in field, terminology and help content for the whole session.

## 4. Information architecture

### Public site
Single page per persona. Hero with the persona's primary action, an unauthenticated status lookup (claim / challan / last payment), and a 6-card task grid. Each card names the task in plain language and carries a grey Was: … line mapping it to the old portal or form number, so returning users can find their footing.

The 30-portal directory collapses to: three persona entry points + one unauthenticated lookup.

### Member (5 destinations)
- Home — balance, live claim tracker, recent activity, account health
- Passbook — full ledger per employer, per financial year, exportable
- Claims — 3-step withdrawal, plus past claims
- KYC & nominee — Aadhaar / PAN / bank / mobile / exit date, and nomination
- Help — FAQs, helpline, grievance, home office

### Employer (6 destinations)
- Dashboard — filing deadline, four compliance metrics, approvals waiting, recent filings
- Monthly return — 3-step: wages → totals → pay
- Employees — roster with UAN, joining date, wage, KYC/exit status
- Approvals — claim queue sorted by days waiting
- Challans — TRRN history with receipts
- Help

### Pensioner (5 destinations)
- Home — monthly amount, next credit date, life-certificate expiry, recent payments, pension facts
- Payments — full credit history
- Life certificate — current validity plus three submission routes
- My details — bank, Aadhaar, mobile, address, PPO, family pension
- Help

## 5. Key flows

### Withdrawal (member) — 3 steps
Reason — four plain-language reasons (home, medical, education/marriage, left the job), each with its eligibility rule and cap stated on the card. Choosing a reason selects the form silently.
Amount & bank — computed cap shown above the field; the verified bank account is displayed, not re-entered; a note states the SLA (3 days employer, 7 days EPFO) and that no documents are needed.
Confirm — read-back table, one checkbox, one OTP.

Success state gives the reference number and says who has it next.

### Monthly return (employer) — 3 steps
Wages — carry over last month (default) or upload any payroll export; the system lists the diffs it found (joiners, exits, salary revisions) as reviewable items.
Totals — EPF / EPS / EDLI / admin charges computed with the rule shown beside each line; validation result stated explicitly.
Pay — challan summary and payment method; payment generates the TRRN and closes the return in one action.

### Life certificate (pensioner)
Current validity and expiry stated first. Three equally-valid routes — phone face scan, bank/CSC walk-in, postman visit — each with an honest time cost. Closes with an anti-fraud line (EPFO never asks for an OTP).

## 6. Content rules

- Sentence case everywhere. Uppercase only for eyebrow labels.
- Second person. Imperative for actions: "Withdraw money", "File and pay", "Submit life certificate".
- Amounts in Indian digit grouping with tabular figures. Dates as 14 Aug 2026; relative only inside 48 hours.
- Every deadline states the consequence of missing it ("late filing attracts interest from 16 Sep", "or your pension stops").
- Legacy vocabulary is allowed only as a secondary line or where the user must quote it (TRRN, PPO, UAN, IFSC).
- No emoji in chrome.