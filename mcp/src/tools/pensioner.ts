import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { LIFE_CERTIFICATE_ROUTES, TODAY, pensionPayments, pensioner } from '../data/seed.js'
import { resolvePensionerPerson } from '../lib/identity.js'
import { daysBetween, fmtDate } from '../lib/format.js'
import { errorResult, textResult } from './helpers.js'

export function registerPensionerTools(server: McpServer) {
  server.registerTool(
    'epfo_get_pension_details',
    {
      title: 'Get pension details',
      description: "Get this pensioner's EPS pension details: monthly amount, scheme, next credit date, bank, and life-certificate validity.",
      inputSchema: { ppo: z.string().optional().describe('Defaults to the demo pensioner (Ram Prasad Verma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ ppo }) => {
      const person = resolvePensionerPerson(ppo)
      if (!person) return errorResult(`No pensioner found for PPO "${ppo}".`)
      return textResult({ ...pensioner, name: person.name, lifeCertificateValidTillFormatted: fmtDate(pensioner.lifeCertificateValidTill) })
    },
  )

  server.registerTool(
    'epfo_list_pension_payments',
    {
      title: 'List pension payments',
      description: "List this pensioner's recent monthly pension credits with amount, date, mode, and reference.",
      inputSchema: { ppo: z.string().optional().describe('Defaults to the demo pensioner (Ram Prasad Verma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ ppo }) => {
      const person = resolvePensionerPerson(ppo)
      if (!person) return errorResult(`No pensioner found for PPO "${ppo}".`)
      return textResult({ ppo: pensioner.ppo, name: person.name, payments: pensionPayments })
    },
  )

  server.registerTool(
    'epfo_get_life_certificate_status',
    {
      title: 'Get life certificate status',
      description: "Check whether this pensioner's life certificate (Jeevan Pramaan) is due, and list the three free ways to submit it.",
      inputSchema: { ppo: z.string().optional().describe('Defaults to the demo pensioner (Ram Prasad Verma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ ppo }) => {
      const person = resolvePensionerPerson(ppo)
      if (!person) return errorResult(`No pensioner found for PPO "${ppo}".`)
      const daysLeft = daysBetween(TODAY, pensioner.lifeCertificateValidTill)
      return textResult({
        name: person.name,
        validUntil: pensioner.lifeCertificateValidTill,
        validUntilFormatted: fmtDate(pensioner.lifeCertificateValidTill),
        lastSubmittedOn: pensioner.lastSubmittedOn,
        daysLeft,
        status: daysLeft <= 30 ? 'due-soon' : daysLeft <= 120 ? 'due-later' : 'ok',
        submissionRoutes: LIFE_CERTIFICATE_ROUTES,
        warning: 'EPFO never asks for an OTP or a fee to submit a life certificate. If someone calls offering to do it for money, it is a scam.',
      })
    },
  )
}
