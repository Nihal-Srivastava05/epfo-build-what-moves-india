/**
 * Direct port of src/lib/glossary.ts — the same dictionary the live app's
 * tooltips, glossary page and assistant read from, so this server cannot
 * drift from it or invent a different definition for the same term.
 */
import type { Persona } from './types.js'

export interface GlossaryEntry {
  id: string
  term: string
  /** What the letters actually stand for, where that helps. */
  expansion?: string
  /** One line first. It is usually all anyone wanted. */
  oneLine: string
  oneLineHi: string
  /** "Explain more" — opened only if asked for. */
  more?: string
  /** Common wrong names, so searching what people actually say still lands. */
  aliases: string[]
  /** The real screens and papers the term shows up on. */
  whereYouSeeIt: string[]
  audience: Persona[]
}

export const glossary: GlossaryEntry[] = [
  {
    id: 'uan',
    term: 'UAN',
    expansion: 'Universal Account Number',
    oneLine: 'Your one permanent PF number. It stays with you when you change jobs.',
    oneLineHi: 'आपका एक स्थायी पीएफ नंबर। नौकरी बदलने पर भी यही रहता है।',
    more: 'Each employer gives you a member ID, but they all sit under one UAN. That is what makes your balance follow you instead of being left behind.',
    aliases: ['pf number', 'account number', 'member id', 'universal account number', 'pf account'],
    whereYouSeeIt: ['Your payslip', 'Sign-in screen', 'Passbook header'],
    audience: ['member', 'employer'],
  },
  {
    id: 'epf',
    term: 'EPF',
    expansion: 'Employees’ Provident Fund',
    oneLine: 'The savings pot. You put in 12% of your wage, your employer matches it.',
    oneLineHi: 'बचत कोष। आप वेतन का 12% देते हैं, नियोक्ता उतना ही मिलाता है।',
    more: 'Your 12% goes entirely to EPF. Of the employer’s 12%, a slice goes to the pension scheme (EPS) and the rest joins your EPF balance. Interest is credited once a year.',
    aliases: ['provident fund', 'pf', 'epf balance'],
    whereYouSeeIt: ['Passbook', 'Payslip deductions'],
    audience: ['member', 'employer'],
  },
  {
    id: 'eps',
    term: 'EPS',
    expansion: 'Employees’ Pension Scheme',
    oneLine: 'The pension part. A slice of your employer’s contribution buys you a monthly pension after 58.',
    oneLineHi: 'पेंशन वाला हिस्सा। नियोक्ता के अंशदान का एक भाग 58 के बाद मासिक पेंशन देता है।',
    more: 'The share is 8.33% of your wage, counted only up to the statutory wage ceiling. You need 10 years of service to draw a pension.',
    aliases: ['pension scheme', 'pension fund', 'eps 95'],
    whereYouSeeIt: ['Passbook pension column', 'Form 10C'],
    audience: ['member', 'pensioner', 'employer'],
  },
  {
    id: 'edli',
    term: 'EDLI',
    expansion: 'Employees’ Deposit Linked Insurance',
    oneLine: 'Free life cover that comes with your PF. Your family gets a lump sum if you die in service.',
    oneLineHi: 'पीएफ के साथ मिलने वाला मुफ़्त जीवन बीमा। सेवा के दौरान मृत्यु पर परिवार को एकमुश्त राशि।',
    more: 'You pay nothing for it — your employer does. The amount depends on your last 12 months of wages and your balance. This is why keeping a nominee on record matters.',
    aliases: ['insurance', 'life cover', 'death benefit'],
    whereYouSeeIt: ['Challan breakdown', 'Death claim forms'],
    audience: ['member', 'employer'],
  },
  {
    id: 'ecr',
    term: 'ECR',
    expansion: 'Electronic Challan cum Return',
    oneLine: 'The monthly file an employer uploads listing every employee’s wages and contributions.',
    oneLineHi: 'हर महीने नियोक्ता द्वारा अपलोड की जाने वाली फ़ाइल, जिसमें सबका वेतन और अंशदान होता है।',
    more: 'Due by the 15th of the following month. If it is not filed, the money never reaches the employee’s account — which is what a missing month in your passbook means.',
    aliases: ['monthly return', 'challan return', 'monthly filing'],
    whereYouSeeIt: ['Employer dashboard', 'Missing month explanations'],
    audience: ['employer', 'member'],
  },
  {
    id: 'trrn',
    term: 'TRRN',
    expansion: 'Temporary Return Reference Number',
    oneLine: 'The receipt number for a monthly payment. Quote it if a payment has to be traced.',
    oneLineHi: 'मासिक भुगतान की रसीद संख्या। भुगतान खोजने के लिए यही बताएँ।',
    aliases: ['challan number', 'payment reference', 'receipt number'],
    whereYouSeeIt: ['Challan receipts', 'Bank statement narration'],
    audience: ['employer'],
  },
  {
    id: 'ppo',
    term: 'PPO',
    expansion: 'Pension Payment Order',
    oneLine: 'Your pension identity number. Every pension question starts with it.',
    oneLineHi: 'आपकी पेंशन पहचान संख्या। पेंशन से जुड़ा हर काम इसी से शुरू होता है।',
    more: 'It is issued once when your pension is sanctioned and never changes, even if you move city or change bank.',
    aliases: ['pension number', 'pension order', 'ppo number'],
    whereYouSeeIt: ['Pension order letter', 'Bank passbook narration', 'Life certificate'],
    audience: ['pensioner'],
  },
  {
    id: 'ifsc',
    term: 'IFSC',
    expansion: 'Indian Financial System Code',
    oneLine: 'The 11-character code that identifies your bank branch. It changes when branches merge.',
    oneLineHi: 'आपकी बैंक शाखा को पहचानने वाला 11 अंकों का कोड। शाखा विलय पर यह बदल जाता है।',
    more: 'A stale IFSC is one of the commonest reasons a settled claim bounces back weeks later. It is worth checking before you file, not after.',
    aliases: ['bank code', 'branch code', 'neft code'],
    whereYouSeeIt: ['Your cheque book', 'KYC screen', 'Claim confirmation'],
    audience: ['member', 'pensioner'],
  },
  {
    id: 'kyc',
    term: 'KYC',
    expansion: 'Know Your Customer',
    oneLine: 'The check that your Aadhaar, PAN and bank account really belong to you.',
    oneLineHi: 'यह जाँच कि आपका आधार, पैन और बैंक खाता वाकई आपका है।',
    more: 'Until KYC is complete and matching, a claim cannot be settled automatically and has to be handled by hand — which is where the weeks go.',
    aliases: ['verification', 'documents', 'aadhaar seeding'],
    whereYouSeeIt: ['KYC screen', 'Rejection letters'],
    audience: ['member', 'employer', 'pensioner'],
  },
  {
    id: 'form-19',
    term: 'Form 19',
    oneLine: 'The form for closing your PF account and taking the full balance after leaving a job.',
    oneLineHi: 'नौकरी छोड़ने के बाद पीएफ खाता बंद कर पूरी राशि लेने का फ़ॉर्म।',
    aliases: ['final settlement', 'full withdrawal', 'close pf account'],
    whereYouSeeIt: ['Withdrawal confirmation', 'Claim status'],
    audience: ['member'],
  },
  {
    id: 'form-31',
    term: 'Form 31',
    oneLine: 'The form for taking out part of your balance while still employed.',
    oneLineHi: 'नौकरी करते हुए आंशिक राशि निकालने का फ़ॉर्म।',
    more: 'You never have to pick it yourself here — choosing a reason selects the right form for you.',
    aliases: ['advance', 'partial withdrawal', 'loan from pf'],
    whereYouSeeIt: ['Withdrawal confirmation', 'Claim status'],
    audience: ['member'],
  },
  {
    id: 'form-13',
    term: 'Form 13',
    oneLine: 'The form that moves your old employer’s balance into your current account.',
    oneLineHi: 'पुराने नियोक्ता का शेष वर्तमान खाते में लाने का फ़ॉर्म।',
    aliases: ['transfer', 'transfer claim', 'merge pf accounts'],
    whereYouSeeIt: ['Job change flow', 'Past claims'],
    audience: ['member'],
  },
  {
    id: 'form-10c',
    term: 'Form 10C',
    oneLine: 'The form for taking your pension contribution back if you leave before 10 years of service.',
    oneLineHi: '10 वर्ष से कम सेवा पर पेंशन अंशदान वापस लेने का फ़ॉर्म।',
    aliases: ['pension withdrawal', 'scheme certificate'],
    whereYouSeeIt: ['Withdrawal flow', 'Claim status'],
    audience: ['member'],
  },
  {
    id: 'cpps',
    term: 'CPPS',
    expansion: 'Centralised Pension Payment System',
    oneLine: 'The system that pays your pension into any bank, anywhere in India.',
    oneLineHi: 'वह प्रणाली जो आपकी पेंशन देश में कहीं भी, किसी भी बैंक में भेजती है।',
    more: 'Before it, a pension was tied to one regional office and moving city meant transferring your file. Now it does not.',
    aliases: ['pension payment', 'pension transfer'],
    whereYouSeeIt: ['Payment history reference numbers'],
    audience: ['pensioner'],
  },
  {
    id: 'life-certificate',
    term: 'Life certificate',
    oneLine: 'Yearly proof that you are alive, so your pension keeps running.',
    oneLineHi: 'हर साल दिया जाने वाला जीवित होने का प्रमाण, ताकि पेंशन चलती रहे।',
    more: 'Also called Jeevan Pramaan when submitted digitally. It can be done by phone face scan, at a bank or common service centre, or by a postman visiting your home.',
    aliases: ['jeevan pramaan', 'life proof', 'annual certificate', 'digital life certificate'],
    whereYouSeeIt: ['Pensioner home', 'Annual reminder SMS'],
    audience: ['pensioner'],
  },
  {
    id: 'nominee',
    term: 'Nominee',
    oneLine: 'The person who receives your PF and insurance if you die.',
    oneLineHi: 'आपकी मृत्यु पर पीएफ और बीमा पाने वाला व्यक्ति।',
    more: 'Without one on record, your family has to prove their entitlement, which can take months. Adding one takes about a minute.',
    aliases: ['beneficiary', 'nomination', 'family member'],
    whereYouSeeIt: ['KYC and nominee screen', 'Death claim forms'],
    audience: ['member'],
  },
  {
    id: 'exit-date',
    term: 'Exit date',
    oneLine: 'The last working day your employer records. Withdrawal is locked until it is marked.',
    oneLineHi: 'नियोक्ता द्वारा दर्ज अंतिम कार्यदिवस। इसके बिना निकासी संभव नहीं।',
    more: 'If you have left a job and cannot withdraw, an unmarked exit date is the usual reason — and it is the employer who must mark it.',
    aliases: ['date of exit', 'last working day', 'leaving date'],
    whereYouSeeIt: ['KYC screen', 'Withdrawal eligibility'],
    audience: ['member', 'employer'],
  },
  {
    id: 'wage-ceiling',
    term: 'Wage ceiling',
    oneLine: 'The wage limit used to calculate the pension share — currently ₹15,000 a month.',
    oneLineHi: 'पेंशन हिस्से की गणना की वेतन सीमा — फ़िलहाल ₹15,000 मासिक।',
    more: 'Your EPF contribution is on your full wage, but the pension slice is capped at this figure. That is why the pension column in your passbook looks flat.',
    aliases: ['pension cap', 'salary limit', '15000 limit'],
    whereYouSeeIt: ['Contribution breakdown', 'Employer totals'],
    audience: ['member', 'employer'],
  },
]

const index = new Map(glossary.map((g) => [g.id, g]))

export function getTerm(id: string) {
  return index.get(id)
}

/** Searching "pf number" finds UAN. What people call it is what should work. */
export function searchGlossary(query: string, audience?: Persona) {
  const q = query.trim().toLowerCase()
  const pool = audience ? glossary.filter((g) => g.audience.includes(audience)) : glossary
  if (!q) return pool
  return pool.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.expansion?.toLowerCase().includes(q) ||
      g.oneLine.toLowerCase().includes(q) ||
      g.aliases.some((a) => a.includes(q) || q.includes(a)),
  )
}
