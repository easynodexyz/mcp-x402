import { describe, it, expect, vi } from 'vitest';
import { createOrder, createOrderSchema } from '../../src/lib/tools/create-order.js';
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

describe('createOrderSchema', () => {
  it.each([1, 3, 6])('accepts period %i', (period) => {
    expect(createOrderSchema.safeParse({ productId: 'p1', period }).success).toBe(true);
  });

  it.each([0, 2, 12, 0.25])('rejects period %s', (period) => {
    expect(createOrderSchema.safeParse({ productId: 'p1', period }).success).toBe(false);
  });
});

describe('createOrder region and add-ons', () => {
  it('sends the region and add-ons to the API', async () => {
    const client = mockClient(makeOrder());

    await createOrder(client, {
      productId: 'p1',
      period: 1,
      quantity: 1,
      region: 'US-EAST',
      addOns: ['openclaw'],
    });

    expect(client.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'US-EAST', addOns: ['openclaw'] })
    );
  });

  it('accepts a known region and an add-on list', () => {
    expect(
      createOrderSchema.safeParse({
        productId: 'p1',
        period: 1,
        region: 'JPN',
        addOns: ['openclaw'],
      }).success
    ).toBe(true);
  });

  it('rejects an unknown region', () => {
    expect(
      createOrderSchema.safeParse({ productId: 'p1', period: 1, region: 'MARS' }).success
    ).toBe(false);
  });

  it('rejects more than 10 add-ons', () => {
    const addOns = Array.from({ length: 11 }, (_, i) => `addon-${i}`);
    expect(createOrderSchema.safeParse({ productId: 'p1', period: 1, addOns }).success).toBe(false);
  });
});
