import { describe, it, expect, vi } from 'vitest';
import { listProducts } from '../../src/lib/tools/list-products.js';
import type { X402Client, Product } from '../../src/lib/client.js';

function mockClient(products: Product[]): X402Client {
  return {
    listProducts: vi.fn().mockResolvedValue(products),
  } as unknown as X402Client;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    code: 'vps-basic',
    title: 'Basic VPS',
    subtitle: 'A basic VPS',
    description: 'Entry level VPS',
    category: 'vps',
    pricing: [
      {
        description: '1 Month',
        period: 1,
        totalPeriodCost: 10,
        monthlyCostEquivalent: 10,
      },
    ],
    supply: 50,
    maxPerOrder: 5,
    ...overrides,
  };
}

describe('listProducts tool', () => {
  it('returns "No products available." when empty without category', async () => {
    const client = mockClient([]);
    const result = await listProducts(client, {});
    expect(result).toBe('No products available.');
  });

  it('returns "No vps products available." when empty with category', async () => {
    const client = mockClient([]);
    const result = await listProducts(client, { category: 'vps' });
    expect(result).toBe('No vps products available.');
  });

  it('formats products with pricing and specs', async () => {
    const product = makeProduct({
      specs: { cpu: 4, ram: 8, disk: 100 },
    });
    const client = mockClient([product]);
    const result = await listProducts(client, {});

    expect(result).toContain('Basic VPS');
    expect(result).toContain('vps-basic');
    expect(result).toContain('prod-1');
    expect(result).toContain('Pricing (USDC)');
    expect(result).toContain('cpu: 4');
    expect(result).toContain('ram: 8');
    expect(result).toContain('Remaining Supply: 50');
  });

  it('does not show specs line when product has no specs', async () => {
    const product = makeProduct({ specs: undefined });
    const client = mockClient([product]);
    const result = await listProducts(client, {});

    expect(result).not.toContain('Specs:');
  });

  it('shows header with count', async () => {
    const client = mockClient([makeProduct(), makeProduct({ id: 'prod-2', code: 'vps-pro' })]);
    const result = await listProducts(client, {});

    expect(result).toContain('Available Products (2)');
  });

  it('shows category header when category is specified', async () => {
    const client = mockClient([makeProduct()]);
    const result = await listProducts(client, { category: 'vps' });

    expect(result).toContain('Available VPS Products (1)');
  });
});
