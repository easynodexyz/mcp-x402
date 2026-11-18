import { createServer } from 'node:http';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { X402Client } from './client.js';
import { createMcpServer, type ServerInfo } from './server.js';

const DEFAULT_API_URL = 'https://api.easy-node.xyz/api';
const DEFAULT_MAX_PAYMENT = 100;
const MCP_PATH = '/mcp';

function isValidPrivateKey(key: string | null | undefined): key is `0x${string}` {
  return !!key && /^0x[a-fA-F0-9]{64}$/.test(key);
}

export async function runHttpServer(port: number, serverInfo: ServerInfo): Promise<void> {
  const apiUrl = process.env.EASYNODE_API_URL || DEFAULT_API_URL;
  const maxPayment = Number(process.env.EASYNODE_MAX_PAYMENT) || DEFAULT_MAX_PAYMENT;

  const handler = toNodeHandler(
    createMcpHandler(({ requestInfo }) => {
      const privateKey = requestInfo?.headers.get('x-easynode-private-key');
      const client = isValidPrivateKey(privateKey)
        ? new X402Client({ privateKey, apiUrl, maxPayment })
        : null;
      return createMcpServer(client, serverInfo);
    })
  );

  createServer((req, res) => {
    if (new URL(req.url ?? '/', 'http://localhost').pathname !== MCP_PATH) {
      res
        .writeHead(404, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ error: 'not_found' }));
      return;
    }
    void handler(req, res);
  }).listen(port, () => {
    console.error(`MCP HTTP server listening on port ${port}`);
  });
}
