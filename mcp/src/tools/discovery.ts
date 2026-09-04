import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { DEMO_OTP, DEMO_PPO, DEMO_UAN, TODAY, employments, establishmentByCode } from '../data/seed.js'
import { resolveMember, resolvePensionerPerson } from '../lib/identity.js'
import { fmtMemberId, fmtTenure, fmtUan } from '../lib/format.js'
import { errorResult, textResult } from './helpers.js'

export function registerDiscoveryTools(server: McpServer) {
  server.registerTool(
    'epfo_list_demo_accounts',
    {
      title: 'List demo accounts',
      description:
        'List the demo member and pensioner identities available in this mocked EPFO sandbox, with the credentials to use them. Call this first if you are not sure which UAN or PPO to use.',
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () =>
      textResult({
        note: 'This is a mocked demo server. No real EPFO data is accessed.',
        otp: DEMO_OTP,
        accounts: [
          { persona: 'member', name: 'Priya Sharma', uan: DEMO_UAN, uanFormatted: fmtUan(DEMO_UAN) },
          { persona: 'pensioner', name: 'Ram Prasad Verma', ppo: DEMO_PPO },
        ],
      }),
  )

  server.registerTool(
    'epfo_login',
    {
      title: 'Sign in',
      description:
        'Validate a demo UAN or PPO plus the on-screen OTP and return the signed-in profile. Optional — every other tool works without calling this first, using its default demo identity.',
      inputSchema: {
        identifier: z.string().describe('A demo UAN (e.g. "100234567890") or PPO (e.g. "MH/PUN/00123456").'),
        otp: z.string().describe('The 6-digit demo OTP.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ identifier, otp }) => {
      if (otp !== DEMO_OTP) return errorResult('Incorrect OTP for this demo sandbox.')
      const member = resolveMember(identifier)
      if (member) return textResult({ signedIn: true, persona: 'member', profile: member })
      const pensionerPerson = resolvePensionerPerson(identifier)
      if (pensionerPerson) return textResult({ signedIn: true, persona: 'pensioner', profile: pensionerPerson })
      return errorResult(`No demo account matches "${identifier}". Call epfo_list_demo_accounts to see the options.`)
    },
  )

  server.registerTool(
    'epfo_get_profile',
    {
      title: 'Get member profile',
      description: "Get the member's personal details: name, DOB, masked Aadhaar/PAN/mobile, and the relation on record.",
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      return textResult({ ...person, uanFormatted: fmtUan(person.uan) })
    },
  )

  server.registerTool(
    'epfo_get_employment_history',
    {
      title: 'Get employment history',
      description: 'List every employer this member has worked under, with dates, tenure, monthly EPF wage, and which one is current.',
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const history = employments
        .filter((e) => e.personId === person.id)
        .map((e) => ({
          establishment: establishmentByCode(e.estCode)?.name ?? e.estCode,
          estCode: e.estCode,
          memberId: fmtMemberId(e.memberId),
          joined: e.joined,
          exited: e.exited,
          current: e.current,
          monthlyWage: e.monthlyWage,
          tenure: fmtTenure(e.joined, e.exited ?? TODAY),
        }))
        .sort((a, b) => a.joined.localeCompare(b.joined))
      return textResult({ uan: person.uan, employments: history })
    },
  )
}
