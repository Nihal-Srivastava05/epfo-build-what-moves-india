import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { notifications } from '../data/seed.js'
import { resolvePerson } from '../lib/identity.js'
import { errorResult, textResult } from './helpers.js'

export function registerNotificationTools(server: McpServer) {
  server.registerTool(
    'epfo_list_notifications',
    {
      title: 'List official notifications',
      description:
        'List official EPFO notifications sent to this member or pensioner, with the channel they were verifiably sent on. Anything claiming to be from EPFO that is not in this list was not actually sent by EPFO — useful for spotting scams.',
      inputSchema: {
        uan: z.string().optional().describe('Member UAN. Defaults to the demo member (Priya Sharma) if neither uan nor ppo is given.'),
        ppo: z.string().optional().describe('Pensioner PPO.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, ppo }) => {
      const person = resolvePerson(uan, ppo)
      if (!person) return errorResult(`No demo account matches uan="${uan ?? ''}" ppo="${ppo ?? ''}".`)
      const list = notifications
        .filter((n) => n.personId === person.id)
        .slice()
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
      return textResult({ personId: person.id, name: person.name, notifications: list })
    },
  )
}
