import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { resetDemoState } from '../data/state.js'
import { textResult } from './helpers.js'

export function registerAdminTools(server: McpServer) {
  server.registerTool(
    'epfo_reset_demo',
    {
      title: 'Reset demo state',
      description:
        'Reset this server\'s in-memory demo state — currently just clears any grievances raised this session — back to the seed data, mirroring the live app\'s "Reset the demo" action.',
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    async () => {
      resetDemoState()
      return textResult({ reset: true })
    },
  )
}
