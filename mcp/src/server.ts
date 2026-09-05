import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerDiscoveryTools } from './tools/discovery.js'
import { registerGlossaryTools } from './tools/glossary.js'
import { registerBalanceTools } from './tools/balance.js'
import { registerClaimTools } from './tools/claims.js'
import { registerKycTools } from './tools/kyc.js'
import { registerNotificationTools } from './tools/notifications.js'
import { registerGrievanceTools } from './tools/grievances.js'
import { registerPensionerTools } from './tools/pensioner.js'
import { registerAdminTools } from './tools/admin.js'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'epfo-demo-mcp',
    version: '0.1.0',
    title: 'EPFO Demo (Mocked)',
  })

  registerDiscoveryTools(server)
  registerGlossaryTools(server)
  registerBalanceTools(server)
  registerClaimTools(server)
  registerKycTools(server)
  registerNotificationTools(server)
  registerGrievanceTools(server)
  registerPensionerTools(server)
  registerAdminTools(server)

  return server
}
