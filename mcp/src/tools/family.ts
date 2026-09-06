import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { DEMO_OTP, TODAY, employments, establishmentByCode, people } from '../data/seed.js'
import { resolveMember, contributionsForPerson } from '../lib/identity.js'
import { addFamilyLink, listFamilyLinks, removeFamilyLink } from '../data/state.js'
import {
  employeeShareTotal,
  employerShareTotal,
  interestTotal,
  pensionShareTotal,
  serviceYears,
  totalBalance,
} from '../lib/derive.js'
import { fmtTenure, fmtUan } from '../lib/format.js'
import { errorResult, textResult } from './helpers.js'

const RELATIONS = ['father', 'mother', 'spouse', 'other'] as const
const SCOPES = ['view-balance', 'file-claims'] as const

export function registerFamilyTools(server: McpServer) {
  server.registerTool(
    'epfo_list_family_members',
    {
      title: 'List linked family members',
      description:
        "List the family members this member has linked to their account: relation, what's shared (view-balance and/or file-claims), and when. Each entry includes the family member's own UAN, which any other member tool (epfo_get_pf_balance, epfo_get_passbook, epfo_get_employment_history, ...) also accepts directly.",
      inputSchema: {
        uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const owner = resolveMember(uan)
      if (!owner) return errorResult(`No member found for UAN "${uan}".`)
      const links = listFamilyLinks().filter((f) => f.ownerId === owner.id)
      return textResult({
        uan: owner.uan,
        family: links.map((f) => {
          const person = people.find((p) => p.id === f.personId)
          return {
            linkId: f.id,
            relation: f.relation,
            scope: f.scope,
            linkedOn: f.linkedOn,
            person: person
              ? { id: person.id, name: person.name, uan: person.uan, uanFormatted: fmtUan(person.uan) }
              : undefined,
          }
        }),
      })
    },
  )

  server.registerTool(
    'epfo_link_family_member',
    {
      title: 'Link a family member',
      description:
        "Link a family member to this member's account, the same way the live app does. The family member must already be one of this sandbox's demo identities (see epfo_list_demo_accounts) — this doesn't invent a new person — and their own OTP has to be given, so the link is never one-sided. Grants an explicit, revocable scope (view-balance and/or file-claims), never full account access. This does create real (in-memory) state for this server session.",
      inputSchema: {
        ownerUan: z.string().optional().describe("The linking member's own UAN. Defaults to the demo member (Priya Sharma) if omitted."),
        memberUan: z.string().describe('The UAN of the family member to link — must already exist in this demo (e.g. Anil Sharma, "100234500021").'),
        relation: z.enum(RELATIONS).describe('The family member\'s relation to the owner, e.g. "father".'),
        scope: z
          .array(z.enum(SCOPES))
          .min(1)
          .optional()
          .describe('What the owner may do with this link. Defaults to ["view-balance"] if omitted.'),
        otp: z.string().describe("The family member's own 6-digit demo OTP, confirming they consented to the link."),
      },
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async ({ ownerUan, memberUan, relation, scope, otp }) => {
      if (otp !== DEMO_OTP) {
        return errorResult("Incorrect OTP — this has to be the family member's own code confirming the link, not the owner's.")
      }
      const owner = resolveMember(ownerUan)
      if (!owner) return errorResult(`No member found for UAN "${ownerUan}".`)
      const target = resolveMember(memberUan)
      if (!target) {
        return errorResult(`No demo member found for UAN "${memberUan}". Call epfo_list_demo_accounts to see who exists in this sandbox.`)
      }
      if (target.id === owner.id) return errorResult('A member cannot link themselves as their own family.')
      const already = listFamilyLinks().find((f) => f.ownerId === owner.id && f.personId === target.id)
      if (already) return errorResult(`${target.name} is already linked to ${owner.name}'s account (link "${already.id}").`)

      const link = addFamilyLink({ ownerId: owner.id, personId: target.id, relation, scope: scope ?? ['view-balance'] })
      return textResult({ ...link, person: { id: target.id, name: target.name, uan: target.uan } })
    },
  )

  server.registerTool(
    'epfo_revoke_family_member',
    {
      title: 'Revoke a linked family member',
      description:
        'Remove a family link by its ID (from epfo_list_family_members) — the same "Revoke" action the live app exposes on each family card. Immediate, and not reversible within this session.',
      inputSchema: {
        ownerUan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        linkId: z.string().describe('The link ID, e.g. "fam-1234567890" — from epfo_list_family_members.'),
      },
      annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true },
    },
    async ({ ownerUan, linkId }) => {
      const owner = resolveMember(ownerUan)
      if (!owner) return errorResult(`No member found for UAN "${ownerUan}".`)
      const link = listFamilyLinks().find((f) => f.id === linkId && f.ownerId === owner.id)
      if (!link) return errorResult(`No family link "${linkId}" found for this member.`)
      removeFamilyLink(linkId)
      return textResult({ revoked: true, linkId })
    },
  )

  server.registerTool(
    'epfo_get_family_member_details',
    {
      title: "Get a linked family member's details",
      description:
        'Get a consolidated snapshot of a linked family member\'s account — profile, current employment, and (only if actually shared) balance — without needing to already know their UAN. Identify them by relation (e.g. "father") or by their own UAN. Returns only what the link\'s scope actually shares, the same discipline the live app holds: no scope, no data.',
      inputSchema: {
        ownerUan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        relation: z.enum(RELATIONS).optional().describe('Find the linked family member by relation, e.g. "father". Provide this or memberUan.'),
        memberUan: z.string().optional().describe("The family member's own UAN, if already known. Provide this or relation."),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ ownerUan, relation, memberUan }) => {
      const owner = resolveMember(ownerUan)
      if (!owner) return errorResult(`No member found for UAN "${ownerUan}".`)
      if (!relation && !memberUan) return errorResult('Give either a relation (e.g. "father") or a memberUan.')

      const links = listFamilyLinks().filter((f) => f.ownerId === owner.id)
      const link = memberUan
        ? links.find((f) => people.find((p) => p.id === f.personId)?.uan === memberUan.replace(/\s+/g, ''))
        : links.find((f) => f.relation === relation)

      if (!link) {
        return errorResult(
          relation
            ? `No linked family member with relation "${relation}" for this account. Call epfo_list_family_members to see who's linked.`
            : `No linked family member with UAN "${memberUan}" for this account.`,
        )
      }
      const person = people.find((p) => p.id === link.personId)
      if (!person) return errorResult('That linked family member is missing from this demo dataset.')

      const canViewBalance = link.scope.includes('view-balance')
      const canFileClaims = link.scope.includes('file-claims')
      const current = employments.find((e) => e.personId === person.id && e.current)

      const details: Record<string, unknown> = {
        relation: link.relation,
        scope: link.scope,
        person: {
          id: person.id,
          name: person.name,
          uan: person.uan,
          uanFormatted: fmtUan(person.uan),
          dob: person.dob,
        },
        employment: current
          ? {
              establishment: establishmentByCode(current.estCode)?.name ?? current.estCode,
              joined: current.joined,
              tenure: fmtTenure(current.joined, TODAY),
              monthlyWage: current.monthlyWage,
            }
          : undefined,
      }

      if (canViewBalance) {
        const contributions = contributionsForPerson(person.id)
        details.balance = {
          asOf: TODAY,
          totalBalance: totalBalance(contributions),
          employeeShare: employeeShareTotal(contributions),
          employerShare: employerShareTotal(contributions),
          interestAccrued: interestTotal(contributions),
          epsShare: pensionShareTotal(contributions),
          serviceYears: serviceYears(person.id),
        }
      } else {
        details.balance = null
        details.note = `${owner.name} hasn't been granted view-balance for ${person.name} — only what's in scope is shown.`
      }

      if (canFileClaims) {
        details.claimsNote =
          'This link also permits filing claims on their behalf, but claim filing is not supported through this MCP server (see epfo_file_claim) — use the live app for that.'
      }

      return textResult(details)
    },
  )
}
