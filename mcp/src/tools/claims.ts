import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { claims } from '../data/seed.js'
import { resolveMember, contributionsForPerson } from '../lib/identity.js'
import { activeClaim, claimProgress, currentStage, withdrawalReasons } from '../lib/derive.js'
import { REASON_LABELS, claimTone, whatHappensNext } from '../lib/claims.js'
import { errorResult, textResult } from './helpers.js'

export function registerClaimTools(server: McpServer) {
  server.registerTool(
    'epfo_list_claims',
    {
      title: 'List claims',
      description: "List this member's EPF claims (withdrawals, transfers), newest first, with status and progress.",
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const list = claims
        .filter((c) => c.personId === person.id)
        .slice()
        .sort((a, b) => b.filedOn.localeCompare(a.filedOn))
        .map((c) => ({
          id: c.id,
          kind: c.kind,
          reason: REASON_LABELS[c.reasonKey] ?? c.reasonKey,
          formNumber: c.formNumber,
          amount: c.amount,
          filedOn: c.filedOn,
          expectedBy: c.expectedBy,
          settledOn: c.settledOn,
          progressPct: claimProgress(c),
          tone: claimTone(c),
        }))
      return textResult({ uan: person.uan, claims: list })
    },
  )

  server.registerTool(
    'epfo_get_claim_status',
    {
      title: 'Get claim status',
      description:
        "Get the detailed status of one claim (or the member's currently active claim if no claim ID is given), including a plain-language explanation of what happens next.",
      inputSchema: {
        uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        claimId: z.string().optional().describe('e.g. "CLM-2026-0839". Omit to get the active (unsettled) claim.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, claimId }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const personClaims = claims.filter((c) => c.personId === person.id)
      const claim = claimId ? personClaims.find((c) => c.id === claimId) : activeClaim(personClaims)
      if (!claim) return errorResult(claimId ? `No claim "${claimId}" found for this member.` : 'This member has no active claim.')
      return textResult({
        id: claim.id,
        kind: claim.kind,
        reason: REASON_LABELS[claim.reasonKey] ?? claim.reasonKey,
        formNumber: claim.formNumber,
        amount: claim.amount,
        filedOn: claim.filedOn,
        expectedBy: claim.expectedBy,
        settledOn: claim.settledOn,
        stages: claim.stages,
        currentStage: currentStage(claim),
        progressPct: claimProgress(claim),
        tone: claimTone(claim),
        whatHappensNext: whatHappensNext(claim),
      })
    },
  )

  server.registerTool(
    'epfo_check_withdrawal_eligibility',
    {
      title: 'Check withdrawal eligibility',
      description: 'Check which withdrawal reasons this member currently qualifies for, with the statutory rule and maximum amount for each. Informational only — does not file anything.',
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const contributions = contributionsForPerson(person.id)
      return textResult({ uan: person.uan, reasons: withdrawalReasons(contributions) })
    },
  )

  server.registerTool(
    'epfo_file_claim',
    {
      title: 'File a claim (not supported)',
      description:
        'Attempt to file a new EPF withdrawal or transfer claim. Always declines: filing a real claim is not supported through this MCP server. Use this tool to give the user a clear, correct answer instead of guessing.',
      inputSchema: {
        uan: z.string().optional(),
        reasonKey: z.string().optional().describe('Accepted for context only; ignored.'),
        amount: z.number().optional().describe('Accepted for context only; ignored.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () =>
      textResult({
        filed: false,
        message:
          'Filing a new EPF claim is not supported through this MCP server. This is a read-only demo of the member and pensioner experience. To actually file a claim (Form 19/31/10C/13), use the EPFO Unified Member Portal at unifiedportal-mem.epfindia.gov.in, or the live "Build What Moves India" demo app if you are testing this prototype.',
      }),
  )
}
