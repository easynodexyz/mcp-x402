import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { X402Client } from '../src/lib/client.js';
import { createMcpServer } from '../src/lib/server.js';

const SERVER_INFO = { name: 'easy-node-x402', version: '0.0.0-test' };

async function connect(x402Client: X402Client | null) {
  const server = createMcpServer(x402Client, SERVER_INFO);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return { client, close: () => Promise.all([client.close(), server.close()]) };
}

const textOf = (result: Awaited<ReturnType<Client['callTool']>>) =>
  (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n');

describe('createMcpServer', () => {
  let close: (() => Promise<unknown>) | undefined;

  afterEach(async () => {
    await close?.();
  });

  it('lists the seven tools with their input schemas', async () => {
    const session = await connect(null);
    close = session.close;

    const { tools } = await session.client.listTools();

    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        'create_order',
        'get_instance',
        'get_order',
        'list_instances',
        'list_products',
        'renew_instance',
        'update_custom_name',
      ].sort()
    );
    const createOrder = tools.find((t) => t.name === 'create_order');
    expect(Object.keys(createOrder?.inputSchema.properties ?? {})).toEqual(
      expect.arrayContaining(['productId', 'period', 'quantity', 'region', 'addOns'])
    );
  });

  it('calls the x402 client for a tool', async () => {
    const x402Client = { listProducts: vi.fn().mockResolvedValue([]) } as unknown as X402Client;
    const session = await connect(x402Client);
    close = session.close;

    const result = await session.client.callTool({
      name: 'list_products',
      arguments: { category: 'vps' },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toBe('No vps products available.');
    expect(x402Client.listProducts).toHaveBeenCalledWith('vps');
  });

  it('answers an authentication error without a wallet', async () => {
    const session = await connect(null);
    close = session.close;

    const result = await session.client.callTool({ name: 'list_products', arguments: {} });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('Authentication required');
  });

  it('rejects a period outside 1, 3 and 6 before calling the API', async () => {
    const x402Client = { createOrder: vi.fn() } as unknown as X402Client;
    const session = await connect(x402Client);
    close = session.close;

    const result = await session.client.callTool({
      name: 'create_order',
      arguments: { productId: 'p1', period: 12 },
    });

    expect(result.isError).toBe(true);
    expect(x402Client.createOrder).not.toHaveBeenCalled();
  });
});
