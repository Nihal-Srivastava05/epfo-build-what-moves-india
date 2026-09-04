import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { resolvePerson } from '../lib/identity.js'
import { activeGrievance, grievanceStages, grievanceTone } from '../lib/grievances.js'
import { addGrievance, listGrievances } from '../data/state.js'
import { errorResult, textResult } from './helpers.js'

export function registerGrievanceTools(server: McpServer) {
  server.registerTool(
    'epfo_list_grievances',
    {
      title: 'List grievances',
      description: "List this person's grievances (open and resolved) with their current rung on the escalation ladder (PF office → regional office → CPGRAMS).",
      inputSchema: {
        uan: z.string().optional().describe('Member UAN. Defaults to the demo member (Priya Sharma) if neither uan nor ppo is given.'),
        ppo: z.string().optional().describe('Pensioner PPO.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, ppo }) => {
      const person = resolvePerson(uan, ppo)
      if (!person) return errorResult(`No demo account matches uan="${uan ?? ''}" ppo="${ppo ?? ''}".`)
      const all = listGrievances().filter((g) => g.personId === person.id)
      return textResult({
        personId: person.id,
        name: person.name,
        grievances: all.map((g) => ({ ...g, stages: grievanceStages(g), tone: grievanceTone(g) })),
      })
    },
  )

  server.registerTool(
    'epfo_get_grievance_status',
    {
      title: 'Get grievance status',
      description: "Get one grievance's status, or the person's currently open grievance if no grievance ID is given.",
      inputSchema: {
        uan: z.string().optional().describe('Member UAN. Defaults to the demo member (Priya Sharma) if neither uan nor ppo is given.'),
        ppo: z.string().optional().describe('Pensioner PPO.'),
        grievanceId: z.string().optional().describe('e.g. "GRV-2026-123". Omit to get the active open grievance.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, ppo, grievanceId }) => {
      const person = resolvePerson(uan, ppo)
      if (!person) return errorResult(`No demo account matches uan="${uan ?? ''}" ppo="${ppo ?? ''}".`)
      const personGrievances = listGrievances().filter((g) => g.personId === person.id)
      const g = grievanceId ? personGrievances.find((x) => x.id === grievanceId) : activeGrievance(personGrievances, person.id)
      if (!g) {
        return errorResult(
          grievanceId ? `No grievance "${grievanceId}" found for this person.` : `${person.name} has no open grievance right now.`,
        )
      }
      return textResult({ ...g, stages: grievanceStages(g), tone: grievanceTone(g) })
    },
  )

  server.registerTool(
    'epfo_raise_grievance',
    {
      title: 'Raise a grievance',
      description:
        "File a new grievance for this person, starting at the PF office rung with a 15-day escalation clock — matches the live app's flow exactly. This does create real (in-memory) state for this server session.",
      inputSchema: {
        uan: z.string().optional().describe('Member UAN. Defaults to the demo member (Priya Sharma) if neither uan nor ppo is given.'),
        ppo: z.string().optional().describe('Pensioner PPO.'),
        subject: z.string().min(1).describe('Short subject line, e.g. "June 2026 contribution not credited".'),
        detail: z.string().min(1).describe('The full grievance text in the member\'s own words.'),
        aboutType: z.enum(['claim', 'contribution', 'kyc', 'return', 'pension']).optional().describe('What this grievance is about, if applicable.'),
        aboutId: z.string().optional().describe('The ID of the claim/contribution/etc. this grievance is about, if applicable.'),
      },
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async ({ uan, ppo, subject, detail, aboutType, aboutId }) => {
      const person = resolvePerson(uan, ppo)
      if (!person) return errorResult(`No demo account matches uan="${uan ?? ''}" ppo="${ppo ?? ''}".`)
      const g = addGrievance({ personId: person.id, subject, detail, aboutType, aboutId })
      return textResult({ ...g, stages: grievanceStages(g), tone: grievanceTone(g) })
    },
  )
}
