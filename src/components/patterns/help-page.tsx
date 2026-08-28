import { Link } from 'react-router-dom'
import { BookOpen, MessageSquareWarning, Phone } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionTitle } from '@/components/patterns/page-header'
import { MockBadge } from '@/components/patterns/mock-badge'
import { StatusPill } from '@/components/patterns/status-pill'
import { GrievanceTracker } from '@/components/patterns/grievance-tracker'
import { useData } from '@/store/data'
import { useT } from '@/i18n'
import { openGrievances, grievanceTone } from '@/lib/grievances'
import { fmtDate } from '@/lib/format'
import type { Persona } from '@/lib/types'

const faqs: Record<Persona, { q: string; a: string }[]> = {
  member: [
    {
      q: 'How long does a withdrawal take?',
      a: 'Your employer has 3 days to attest it, and EPFO settles within 7 days after that. The claim tracker on your home screen shows which of those two stages it is in and who is holding it.',
    },
    {
      q: 'A month is missing from my passbook. What do I do?',
      a: 'Nothing — this is your employer’s filing, not yours. Open the missing month from your home screen and EPFO will raise it with them directly. You will be told when it is filed.',
    },
    {
      q: 'Why was my claim rejected before?',
      a: 'Most rejections are a mismatch between your KYC and your bank record — a changed IFSC, or a name spelled differently. Everything that can be checked is now checked before you submit, not weeks after.',
    },
    {
      q: 'Do I need to upload documents?',
      a: 'No. Your Aadhaar, PAN and bank account are already verified against your UAN. If something is not verified, the pre-submit check names it before you file.',
    },
  ],
  employer: [
    {
      q: 'When is the monthly return due?',
      a: 'By the 15th of the following month. Late filing attracts interest and damages, and every day of delay is a day your employees cannot see their money.',
    },
    {
      q: 'What happens if I do not attest a claim?',
      a: 'The claim sits in your queue and the employee waits. The approvals screen sorts by how long each person has been waiting, longest first.',
    },
    {
      q: 'Can I upload a payroll file instead of carrying over wages?',
      a: 'Yes. The system reads the file, lists the joiners, exits and wage revisions it found, and asks you to confirm them rather than re-keying anything.',
    },
  ],
  pensioner: [
    {
      q: 'What happens if I miss the life certificate date?',
      a: 'Your pension stops until it is submitted. It restarts with arrears once you do, but the gap is avoidable — submit any time in the three months before it expires.',
    },
    {
      q: 'Can I submit it without leaving home?',
      a: 'Yes. A face scan on a phone takes about two minutes, or a postman can visit you. Both are free.',
    },
    {
      q: 'Someone called asking for an OTP to release my pension.',
      a: 'That is a scam. EPFO never asks for an OTP, a fee or your password. Every message we actually send you is listed in your notifications.',
    },
  ],
}

export function HelpPage({ persona }: { persona: Persona }) {
  const { grievances } = useData()
  const { lang } = useT()
  const personId = persona === 'pensioner' ? 'p-ram' : 'p-priya'
  const myGrievances = openGrievances(grievances, personId)

  return (
    <div className='space-y-4'>
      <PageHeader
        title='Help'
        sub='The short answers first. A person if you need one.'
      />

      <section aria-labelledby='raise-grievance'>
        <div className='rounded-lg border bg-card p-5'>
          <MessageSquareWarning
            className='mb-3 size-5 text-primary'
            aria-hidden
          />
          <p className='font-medium'>Raise a grievance</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Attached to the claim or month it is about, so nothing is retyped.
          </p>
          <Button asChild variant='outline' size='sm' className='mt-3'>
            <Link to='/grievance/new'>Open a grievance</Link>
          </Button>
        </div>
      </section>

      {myGrievances.length > 0 ? (
        <section aria-labelledby='grievance-status'>
          <SectionTitle>
            <span id='grievance-status'>Track your grievance</span>
          </SectionTitle>
          <div className='space-y-3'>
            {myGrievances.map((g) => (
              <div key={g.id} className='rounded-lg border bg-card p-5'>
                <div className='mb-4 flex flex-wrap items-center gap-2.5'>
                  <p className='font-medium'>{g.subject}</p>
                  <StatusPill tone={grievanceTone(g)}>{g.id}</StatusPill>
                  <span className='num text-xs font-normal text-muted-foreground'>
                    Escalates {fmtDate(g.escalatesOn, lang)}
                  </span>
                </div>
                <GrievanceTracker grievance={g} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby='faq'>
        <SectionTitle>
          <span id='faq'>Common questions</span>
        </SectionTitle>
        <Accordion
          type='single'
          collapsible
          className='rounded-lg border bg-card px-5'
        >
          {faqs[persona].map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className='text-left text-base'>
                {f.q}
              </AccordionTrigger>
              <AccordionContent className='text-[0.95rem] leading-relaxed text-muted-foreground'>
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section aria-labelledby='reach'>
        <SectionTitle>
          <span id='reach'>Reach a person</span>
        </SectionTitle>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border bg-card p-5'>
            <Phone className='mb-3 size-5 text-primary' aria-hidden />
            <p className='font-medium'>Helpline</p>
            <p className='ident mt-1 text-sm'>1800 118 005</p>
            <p className='mt-2 text-xs text-muted-foreground'>
              Free, 9am–5:30pm, Monday to Friday
            </p>
            <MockBadge
              what='Illustrative. Not a live line in this prototype.'
              className='mt-3'
            />
          </div>
          <div className='rounded-lg border bg-card p-5'>
            <MessageSquareWarning
              className='mb-3 size-5 text-primary'
              aria-hidden
            />
            <p className='font-medium'>Email</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              epfo.grievance@gov.in
            </p>
            <MockBadge
              what='Illustrative. Not a live line in this prototype.'
              className='mt-3'
            />
          </div>
          <div className='rounded-lg border bg-card p-5'>
            <BookOpen className='mb-3 size-5 text-primary' aria-hidden />
            <p className='font-medium'>What the words mean</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Every term on this site, in one line each.
            </p>
            <Button asChild variant='outline' size='sm' className='mt-3'>
              <Link to='/glossary'>Open the glossary</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
