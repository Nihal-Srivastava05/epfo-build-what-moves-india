import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { glossary, searchGlossary } from '../data/glossary.js'
import { errorResult, textResult } from './helpers.js'

export function registerGlossaryTools(server: McpServer) {
  server.registerTool(
    'epfo_lookup_term',
    {
      title: 'Look up an EPFO term',
      description:
        'Look up what an EPFO acronym, form number or piece of jargon actually means (e.g. "UAN", "EPS", "Form 19", "KYC", "wage ceiling") — the same authoritative glossary the live app\'s tooltips and glossary page read from. ' +
        'Always call this instead of guessing or recalling a definition from general knowledge: EPFO terms are easy to mix up (EPF vs EPS vs EDLI, Form 19 vs 31 vs 13) and this is the one place answers cannot drift from what the app itself tells users. ' +
        'Matches on the term, its expansion, or common alternate names people actually use (e.g. "pf number" finds UAN).',
      inputSchema: {
        query: z.string().describe('A term, acronym, form number, or phrase to look up, e.g. "UAN", "form 31", "pension cap".'),
        audience: z
          .enum(['member', 'employer', 'pensioner'])
          .optional()
          .describe('Restrict results to terms relevant to this persona. Omit to search everything.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ query, audience }) => {
      const matches = searchGlossary(query, audience)
      if (matches.length === 0) {
        return errorResult(
          `No glossary entry matches "${query}". Call epfo_list_glossary_terms to see every term this server knows, rather than answering from general knowledge.`,
        )
      }
      return textResult({ query, matches })
    },
  )

  server.registerTool(
    'epfo_list_glossary_terms',
    {
      title: 'List all EPFO glossary terms',
      description:
        'List every EPFO term, acronym and form number this server has an authoritative definition for, optionally filtered by persona. ' +
        'Useful to see the full vocabulary available before answering a question that uses EPFO jargon, or to confirm a term genuinely has no entry before falling back to general knowledge.',
      inputSchema: {
        audience: z
          .enum(['member', 'employer', 'pensioner'])
          .optional()
          .describe('Restrict the list to terms relevant to this persona. Omit to list everything.'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ audience }) => {
      const pool = audience ? glossary.filter((g) => g.audience.includes(audience)) : glossary
      return textResult({
        count: pool.length,
        terms: pool.map((g) => ({ id: g.id, term: g.term, expansion: g.expansion, oneLine: g.oneLine })),
      })
    },
  )
}
