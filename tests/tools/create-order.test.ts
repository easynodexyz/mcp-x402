import { describe, it, expect, vi } from 'vitest';
import { createOrder } from '../../src/lib/tools/create-order.js';
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
    createOrder: vi.fn().mockResolvedValue(order),
  } as unknown as X402Client;
}

describe('createOrder tool', () => {
  it('formats order with instance section', async () => {
    const order = makeOrder({
      instance: { id: 'inst-1', type: 'vps', status: 'provisioning' },
    });
    const client = mockClient(order);
    const result = await createOrder(client, { productId: 'p1', period: 1, quantity: 1 });

    expect(result).toContain('Order Created Successfully');
    expect(result).toContain('ord-1');
    expect(result).toContain('pending');
    expect(result).toContain('### Instance:');
    expect(result).toContain('inst-1');
    expect(result).toContain('provisioning');
  });

  it('does not show instance section when null', async () => {
    const order = makeOrder({ instance: null });
    const client = mockClient(order);
    const result = await createOrder(client, { productId: 'p1', period: 1, quantity: 1 });

    expect(result).not.toContain('### Instance:');
  });

  it('contains get_order usage hint', async () => {
    const order = makeOrder();
    const client = mockClient(order);
    const result = await createOrder(client, { productId: 'p1', period: 1, quantity: 1 });

    expect(result).toContain('get_order');
  });
});
