import { describe, it, expect, vi } from 'vitest';
import { getOrder } from '../../src/lib/tools/get-order.js';
import type { X402Client, Order } from '../../src/lib/client.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    userId: '0xabc',
    createdAt: 1700000000,
    kind: 'purchase',
    status: 'pending',
    products: [{ productId: 'p1', period: 1, quantity: 1 }],
    instance: null,
    ...overrides,
  };
}

function mockClient(order: Order): X402Client {
  return {
    getOrder: vi.fn().mockResolvedValue(order),
  } as unknown as X402Client;
}

describe('getOrder tool', () => {
  it.each([
    ['pending', '⏳'],
    ['locked', '🔒'],
    ['completed', '✅'],
    ['failed', '❌'],
    ['refunded', '💰'],
  ] as const)('shows correct emoji for %s status', async (status, emoji) => {
    const order = makeOrder({ status });
    const client = mockClient(order);
    const result = await getOrder(client, { orderId: 'ord-1' });

    expect(result).toContain(emoji);
    expect(result).toContain(status);
  });

  it('shows instance section with status emoji', async () => {
    const order = makeOrder({
      instance: { id: 'inst-1', type: 'vps', status: 'active' },
    });
    const client = mockClient(order);
    const result = await getOrder(client, { orderId: 'ord-1' });

    expect(result).toContain('### Instance:');
    expect(result).toContain('inst-1');
    expect(result).toContain('✅ active');
  });

  it('does not show instance section when null', async () => {
    const order = makeOrder({ instance: null });
    const client = mockClient(order);
    const result = await getOrder(client, { orderId: 'ord-1' });

    expect(result).not.toContain('### Instance:');
  });

  it('shows order details', async () => {
    const order = makeOrder();
    const client = mockClient(order);
    const result = await getOrder(client, { orderId: 'ord-1' });

    expect(result).toContain('Order Details');
    expect(result).toContain('ord-1');
    expect(result).toContain('0xabc');
  });
});
