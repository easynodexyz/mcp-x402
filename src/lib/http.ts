import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { X402Client } from './client.js';
import { createMcpServer } from './server.js';

const DEFAULT_API_URL = 'https://api.easy-node.xyz/api';
const DEFAULT_MAX_PAYMENT = 100;

function isValidPrivateKey(key: string): key is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(key);
}

export async function runHttpServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  const apiUrl = process.env.EASYNODE_API_URL || DEFAULT_API_URL;
  const maxPayment = Number(process.env.EASYNODE_MAX_PAYMENT) || DEFAULT_MAX_PAYMENT;

  const DISCOVERY_METHODS = ['initialize', 'notifications/initialized', 'tools/list'];

  // Stateless MCP endpoint
  app.post('/mcp', async (req, res) => {
    const method = req.body?.method;
    const isDiscovery = DISCOVERY_METHODS.includes(method);
    const privateKey = (req.headers['X-Easynode-Private-Key'] ??
      req.headers['x-easynode-private-key']) as string;

    let client: X402Client | null = null;

    if (!isDiscovery) {
      if (!privateKey || !isValidPrivateKey(privateKey)) {
        res.status(400).json({ error: 'Missing or invalid X-Easynode-Private-Key header' });
        return;
      }

      client = new X402Client({
        privateKey,
        apiUrl,
        maxPayment,
      });
    } else if (privateKey && isValidPrivateKey(privateKey)) {
      client = new X402Client({
        privateKey,
        apiUrl,
        maxPayment,
      });
    }

    const server = createMcpServer(client);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => undefined as unknown as string,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Stateless: no SSE or session cleanup
  app.get('/mcp', (_req, res) => {
    res.status(405).json({ error: 'SSE not supported in stateless mode' });
  });

  app.delete('/mcp', (_req, res) => {
    res.status(405).json({ error: 'Session management not supported in stateless mode' });
  });

  app.listen(port, () => {
    console.error(`MCP HTTP server listening on port ${port}`);
  });
}
