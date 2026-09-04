import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { kycItems } from '../data/seed.js'
import { resolveMember } from '../lib/identity.js'
import { preflight } from '../lib/derive.js'
import { errorResult, textResult } from './helpers.js'

export function registerKycTools(server: McpServer) {
  server.registerTool(
    'epfo_get_kyc_status',
    {
      title: 'Get KYC status',
      description: "Get this member's KYC items (Aadhaar, PAN, bank, mobile, nominee, exit dates) and any blockers or warnings a claim would hit today.",
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      return textResult({ uan: person.uan, items: kycItems, preflightIssues: preflight(kycItems) })
    },
  )
}
