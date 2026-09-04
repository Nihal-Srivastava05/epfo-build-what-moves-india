/** Shared response shaping for tool handlers. */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export function textResult(payload: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] }
}

export function errorResult(message: string): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }, null, 2) }], isError: true }
}
