import { describe, it, expect, vi } from 'vitest';
import { listInstances } from '../../src/lib/tools/list-instances.js';
import type { X402Client, InstanceListItem } from '../../src/lib/client.js';

function makeInstance(overrides: Partial<InstanceListItem> = {}): InstanceListItem {
  return {
    id: 'inst-1',
    type: 'vps',
    status: 'active',
    productCode: 'vps-basic',
    customName: null,
    startDate: 1700000000,
    endDate: 1703000000,
    renewable: true,
    ...overrides,
  };
}

function mockClient(instances: InstanceListItem[]): X402Client {
  return {
    listInstances: vi.fn().mockResolvedValue(instances),
    getAddress: vi.fn().mockReturnValue('0xTestWallet'),
  } as unknown as X402Client;
}

describe('listInstances tool', () => {
  it('returns "No instances found" when empty', async () => {
    const client = mockClient([]);
    const result = await listInstances(client);

    expect(result).toContain('No instances found');
    expect(result).toContain('0xTestWallet');
  });

  it.each([
    ['active', '✅'],
    ['provisioning', '🔄'],
    ['canceled', '🚫'],
    ['expired', '⏰'],
    ['ordered', '📝'],
  ] as const)('shows correct emoji for %s status', async (status, emoji) => {
    const client = mockClient([makeInstance({ status })]);
    const result = await listInstances(client);

    expect(result).toContain(emoji);
    expect(result).toContain(status);
  });

  it('shows custom name in parentheses', async () => {
    const client = mockClient([makeInstance({ customName: 'My Server' })]);
    const result = await listInstances(client);

    expect(result).toContain('(My Server)');
  });

  it('shows N/A when endDate is null', async () => {
    const client = mockClient([makeInstance({ endDate: null })]);
    const result = await listInstances(client);

    expect(result).toContain('N/A');
  });

  it('shows instance count', async () => {
    const client = mockClient([makeInstance(), makeInstance({ id: 'inst-2' })]);
    const result = await listInstances(client);

    expect(result).toContain('2 instance(s)');
  });

  it('shows renewable status', async () => {
    const client = mockClient([makeInstance({ renewable: true })]);
    const result = await listInstances(client);

    expect(result).toContain('✅ Yes');
  });
});
