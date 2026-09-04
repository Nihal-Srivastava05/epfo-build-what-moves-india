import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { INTEREST_RATE, RETIREMENT_AGE, TODAY, employments } from '../data/seed.js'
import { resolveMember, contributionsForPerson } from '../lib/identity.js'
import {
  buildLedger,
  employeeShareTotal,
  employerShareTotal,
  groupLedgerByFy,
  interestBreakdown,
  interestTotal,
  pensionShareTotal,
  serviceYears,
  totalBalance,
} from '../lib/derive.js'
import { epfGrowthProjection } from '../lib/calculators.js'
import { daysBetween } from '../lib/format.js'
import { errorResult, textResult } from './helpers.js'

export function registerBalanceTools(server: McpServer) {
  server.registerTool(
    'epfo_get_pf_balance',
    {
      title: 'Get PF balance',
      description: "Get the member's current EPF balance: employee share, employer share, accrued interest, EPS share, and years of service.",
      inputSchema: { uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.') },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const contributions = contributionsForPerson(person.id)
      return textResult({
        uan: person.uan,
        asOf: TODAY,
        totalBalance: totalBalance(contributions),
        employeeShare: employeeShareTotal(contributions),
        employerShare: employerShareTotal(contributions),
        interestAccrued: interestTotal(contributions),
        epsShare: pensionShareTotal(contributions),
        serviceYears: serviceYears(),
      })
    },
  )

  server.registerTool(
    'epfo_get_passbook',
    {
      title: 'Get passbook',
      description: "Get the member's full contribution and interest ledger (passbook), optionally grouped by financial year.",
      inputSchema: {
        uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        groupByFy: z.boolean().optional().default(true).describe('Group rows by financial year (default true) instead of one flat list.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, groupByFy }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const contributions = contributionsForPerson(person.id)
      const ledger = buildLedger(contributions)
      if (groupByFy === false) return textResult({ uan: person.uan, rows: ledger })
      return textResult({ uan: person.uan, years: groupLedgerByFy(ledger) })
    },
  )

  server.registerTool(
    'epfo_calculate_interest',
    {
      title: 'Calculate interest',
      description:
        'Show the month-by-month working behind the interest EPFO credited, for one financial year (e.g. "2025-26") or every closed year if none is given.',
      inputSchema: {
        uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        fy: z.string().optional().describe('A financial year like "2025-26". Omit to get every closed year.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, fy }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const contributions = contributionsForPerson(person.id)
      const breakdown = interestBreakdown(contributions)
      const years = Array.from(breakdown.values())
      if (fy) {
        const match = years.find((y) => y.fy === fy)
        if (!match) return errorResult(`No closed financial year "${fy}" found for this member. Rate declared: ${(INTEREST_RATE * 100).toFixed(2)}%.`)
        return textResult({ uan: person.uan, year: match })
      }
      return textResult({
        uan: person.uan,
        note: 'Only closed financial years have a declared credit — the year in progress has no rate yet.',
        years,
      })
    },
  )

  server.registerTool(
    'epfo_estimate_growth',
    {
      title: 'Estimate EPF growth to retirement',
      description: "Project this member's EPF corpus forward to retirement (age 58), compounding contributions and interest year by year.",
      inputSchema: {
        uan: z.string().optional().describe('Defaults to the demo member (Priya Sharma) if omitted.'),
        annualIncrementPct: z.number().min(0).max(50).optional().default(8).describe('Assumed yearly wage increment percentage.'),
        years: z.number().int().min(1).max(45).optional().describe('Years to project. Defaults to years remaining until age 58.'),
        interestRate: z.number().min(0).max(1).optional().describe('Override the EPF interest rate (defaults to the current declared rate).'),
        missedMonths: z.number().int().min(0).optional().default(0).describe('Simulate this many upcoming months with no contribution credited.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ uan, annualIncrementPct, years, interestRate, missedMonths }) => {
      const person = resolveMember(uan)
      if (!person) return errorResult(`No member found for UAN "${uan}".`)
      const contributions = contributionsForPerson(person.id)
      const current = employments.find((e) => e.personId === person.id && e.current)
      if (!current) return errorResult('This member has no current employment on record to project a wage from.')

      const ageNow = Math.floor(daysBetween(person.dob, TODAY) / 365.25)
      const defaultYears = Math.max(1, RETIREMENT_AGE - ageNow)

      const projection = epfGrowthProjection({
        currentBalance: totalBalance(contributions),
        monthlyWage: current.monthlyWage,
        annualIncrementPct: annualIncrementPct ?? 8,
        years: years ?? defaultYears,
        startAge: ageNow,
        interestRate,
        missedMonths: missedMonths ?? 0,
      })
      return textResult({ uan: person.uan, ageNow, retirementAge: RETIREMENT_AGE, projection })
    },
  )
}
