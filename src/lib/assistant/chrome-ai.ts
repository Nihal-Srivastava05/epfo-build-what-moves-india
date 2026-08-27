/**
 * Chrome's built-in on-device model (Gemini Nano), used through the Prompt API.
 * No API key, no network call, and nothing leaves the device.
 *
 * It is never trusted with a number. It only ever rephrases facts this app has
 * already computed — see `guard()` below, which throws the answer away if the
 * model introduces an amount or a date that was not in the facts it was given.
 */

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface LanguageModelSession {
  prompt: (input: string) => Promise<string>
  destroy: () => void
}

interface LanguageModelStatic {
  availability: () => Promise<Availability>
  create: (opts?: {
    initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[]
    monitor?: (m: EventTarget) => void
  }) => Promise<LanguageModelSession>
}

declare global {
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelStatic | undefined
}

const SYSTEM = `You are the help assistant inside an Indian EPFO (provident fund) app.

Rules you must follow exactly:
- You will be given a FACTS block. It is the only source of truth.
- Never state a rupee amount, a date, a reference number or an eligibility verdict
  unless it appears verbatim in FACTS.
- If FACTS does not answer the question, say you do not know and suggest raising a grievance.
- Reply in at most three short sentences, in plain language, second person.
- No markdown, no bullet points, no emoji.
- Match the language of the question: English or Hindi.`

let cached: LanguageModelSession | null = null
let cachedAvailability: Availability | null = null

export function hasChromeAI() {
  return typeof globalThis.LanguageModel !== 'undefined'
}

export async function checkAvailability(): Promise<Availability> {
  if (!hasChromeAI()) return 'unavailable'
  if (cachedAvailability && cachedAvailability !== 'downloading') return cachedAvailability
  try {
    cachedAvailability = await globalThis.LanguageModel!.availability()
  } catch {
    cachedAvailability = 'unavailable'
  }
  return cachedAvailability
}

async function getSession() {
  if (cached) return cached
  if (!hasChromeAI()) return null
  try {
    cached = await globalThis.LanguageModel!.create({
      initialPrompts: [{ role: 'system', content: SYSTEM }],
    })
    return cached
  } catch {
    return null
  }
}

/**
 * The guardrail. Any rupee figure, date or reference number in the model's reply
 * must already appear in the facts it was handed; otherwise the reply is dropped
 * and the caller falls back to the deterministic answer.
 */
export function guard(reply: string, facts: string): boolean {
  const normalise = (s: string) => s.replace(/[,\s]/g, '').toLowerCase()
  const haystack = normalise(facts)

  const amounts = reply.match(/₹\s?[\d,]+/g) ?? []
  for (const a of amounts) if (!haystack.includes(normalise(a))) return false

  const numbers = reply.match(/\b\d[\d,]{2,}\b/g) ?? []
  for (const n of numbers) if (!haystack.includes(normalise(n))) return false

  const dates = reply.match(/\b\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}\b/g) ?? []
  for (const d of dates) if (!haystack.includes(normalise(d))) return false

  const refs = reply.match(/\b[A-Z]{3}-\d{4}-\d{3,4}\b/g) ?? []
  for (const r of refs) if (!haystack.includes(normalise(r))) return false

  return true
}

export async function rephrase(question: string, facts: string): Promise<string | null> {
  const session = await getSession()
  if (!session) return null
  try {
    const reply = await session.prompt(`FACTS:\n${facts}\n\nQUESTION: ${question}`)
    const clean = reply.trim()
    if (!clean) return null
    return guard(clean, facts) ? clean : null
  } catch {
    return null
  }
}
