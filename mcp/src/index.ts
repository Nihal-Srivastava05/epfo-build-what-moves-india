#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('epfo-demo-mcp: connected over stdio')
}

main().catch((err) => {
  console.error('epfo-demo-mcp: fatal error', err)
  process.exit(1)
})
