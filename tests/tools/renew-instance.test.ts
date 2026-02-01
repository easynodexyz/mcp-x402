import { describe, it, expect, vi } from 'vitest';
import { renewInstance } from '../../src/lib/tools/renew-instance.js';
import type { X402Client, Order } from '../../src/lib/client.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ren-1',
    userId: '0xabc',
    createdAt: 1700000000,
    kind: 'renewal',
    status: 'pending',
    products: [{ productId: 'p1', period: 3, quantity: 1 }],
    instance: null,
    ...overrides,
  };
}

function mockClient(order: Order): X402Client {
  return {
    renewInstance: vi.fn().mockResolvedValue(order),
  } as unknown as X402Client;
}

describe('renewInstance tool', () => {
  it('shows renewal details with instance', async () => {
    const order = makeOrder({
      instance: { id: 'inst-1', type: 'vps', status: 'active' },
    });
    const client = mockClient(order);
    const result = await renewInstance(client, {
      instanceId: 'inst-1',
      period: 3,
      type: 'vps',
    });

    expect(result).toContain('Instance Renewal Successful');
    expect(result).toContain('ren-1');
    expect(result).toContain('renewal');
    expect(result).toContain('Renewal Details');
    expect(result).toContain('3 month(s)');
    expect(result).toContain('### Instance:');
    expect(result).toContain('inst-1');
  });

  it('does not show instance section when null', async () => {
    const order = makeOrder({ instance: null });
    const client = mockClient(order);
    const result = await renewInstance(client, {
      instanceId: 'inst-1',
      period: 1,
      type: 'vps',
    });

    expect(result).not.toContain('### Instance:');
  });

  it('contains get_instance usage hint', async () => {
    const order = makeOrder();
    const client = mockClient(order);
    const result = await renewInstance(client, {
      instanceId: 'inst-1',
      period: 1,
      type: 'vps',
    });

    expect(result).toContain('get_instance');
  });
});
