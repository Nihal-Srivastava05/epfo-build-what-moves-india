import { Emblem } from '@/components/layout/emblem'

/**
 * The UAN card: the identity card at the top of the profile, cut loose from the
 * page so it can be carried.
 *
 * A member is asked for their UAN by an employer, a bank and every EPFO office,
 * and today the answer is a screenshot. So the same card — same type ramp, same
 * two-column identifier grid — is offered as a preview and printed to PDF, with
 * nothing on it that is not already on the record.
 */

export interface UanCardData {
  name: string
  initials: string
  personaLabel: string
  /** "UAN" for members and employers, "PPO number" for a pensioner. */
  idLabel: string
  idValue: string
  mobile: string
  dob: string
  /** Masked, exactly as it is everywhere else in this prototype. */
  aadhaar: string
  /** What the record is anchored to: the employer, or the pension office. */
  footLabel: string
  footValue: string
}

/** The card as it appears on screen — the profile's own identity card, boxed. */
export function UanCard({ data }: { data: UanCardData }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2.5 border-b bg-brand-tint px-5 py-3">
        <Emblem className="size-7 text-[0.9rem]" />
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-bold tracking-[-0.01em] text-primary">
            Employees’ Provident Fund Organisation
          </p>
          <p className="eyebrow text-primary/70">{data.idLabel} card</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
            aria-hidden
          >
            {data.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[1.25rem] font-bold tracking-[-0.02em]">{data.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{data.personaLabel}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <div>
            <dt className="eyebrow mb-1.5">{data.idLabel}</dt>
            <dd className="ident text-[1.375rem] font-bold tracking-[-0.01em]">{data.idValue}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1.5">Registered mobile</dt>
            <dd className="ident text-[1.375rem] font-bold tracking-[-0.01em]">{data.mobile}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1.5">Date of birth</dt>
            <dd className="ident text-[0.9375rem] font-semibold">{data.dob}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1.5">Aadhaar</dt>
            <dd className="ident text-[0.9375rem] font-semibold">{data.aadhaar}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {data.footLabel}: <span className="font-semibold text-foreground">{data.footValue}</span>
          </p>
          <p className="text-[0.6875rem] text-faint">
            Prototype — synthetic record, not a government document.
          </p>
        </div>
      </div>
    </div>
  )
}

function esc(value: string) {
  return value.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
}

/**
 * Prints the card through a hidden iframe rather than the page itself.
 *
 * The document is self-contained and always in the light palette: printing the
 * live DOM would carry the app's dark mode onto paper, and a print stylesheet
 * over the whole profile would have to hide every other section of it. The
 * browser's own print dialog is where "Save as PDF" lives, which is the one
 * route to a real PDF without shipping a renderer for a single card.
 */
export function printUanCard(data: UanCardData, filename: string) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }

  // The filename the browser offers in the save dialog is the document title.
  doc.open()
  doc.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(filename)}</title>
<style>
  @page { size: auto; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Inter", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif;
    color: #323439;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .card { max-width: 148mm; border: 1px solid #dddfe5; border-radius: 14px; overflow: hidden; }
  .head { display: flex; align-items: center; gap: 10px; background: #e6ecfc; border-bottom: 1px solid #b8c9f5; padding: 12px 20px; }
  .mark { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 6px; background: #0040dd; color: #fff; font-weight: 800; font-size: 13px; }
  .org { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; color: #0040dd; margin: 0; }
  .kind { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.055em; color: #0040dd; opacity: 0.7; margin: 2px 0 0; }
  .body { padding: 20px; }
  .who { display: flex; align-items: center; gap: 16px; }
  .avatar { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: #0040dd; color: #fff; font-size: 18px; font-weight: 700; }
  .name { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
  .persona { font-size: 12px; color: #72757a; margin: 4px 0 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid #dddfe5; margin-top: 20px; padding-top: 20px; }
  .eyebrow { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.055em; color: #72757a; margin: 0 0 6px; }
  .ident { font-family: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; margin: 0; }
  .big { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
  .small { font-size: 15px; font-weight: 600; }
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; border-top: 1px solid #dddfe5; margin-top: 20px; padding-top: 16px; font-size: 12px; color: #72757a; }
  .foot b { color: #323439; }
  .foot .fine { font-size: 11px; color: #9e9fa4; }
</style></head><body>
  <div class="card">
    <div class="head">
      <span class="mark">पf</span>
      <div>
        <p class="org">Employees&rsquo; Provident Fund Organisation</p>
        <p class="kind">${esc(data.idLabel)} card</p>
      </div>
    </div>
    <div class="body">
      <div class="who">
        <span class="avatar">${esc(data.initials)}</span>
        <div>
          <p class="name">${esc(data.name)}</p>
          <p class="persona">${esc(data.personaLabel)}</p>
        </div>
      </div>
      <div class="grid">
        <div><p class="eyebrow">${esc(data.idLabel)}</p><p class="ident big">${esc(data.idValue)}</p></div>
        <div><p class="eyebrow">Registered mobile</p><p class="ident big">${esc(data.mobile)}</p></div>
        <div><p class="eyebrow">Date of birth</p><p class="ident small">${esc(data.dob)}</p></div>
        <div><p class="eyebrow">Aadhaar</p><p class="ident small">${esc(data.aadhaar)}</p></div>
      </div>
      <div class="foot">
        <p>${esc(data.footLabel)}: <b>${esc(data.footValue)}</b></p>
        <p class="fine">Prototype &mdash; synthetic record, not a government document.</p>
      </div>
    </div>
  </div>
</body></html>`)
  doc.close()

  const run = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    // Kept until the dialog is dismissed: removing the frame while the print
    // dialog is open cancels the job in Safari.
    window.setTimeout(() => frame.remove(), 60_000)
  }

  if (frame.contentWindow?.document.readyState === 'complete') run()
  else frame.addEventListener('load', run, { once: true })
}
