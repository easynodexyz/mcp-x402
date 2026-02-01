import { describe, it, expect, vi } from 'vitest';
import { updateCustomName } from '../../src/lib/tools/update-custom-name.js';
import type { X402Client } from '../../src/lib/client.js';

function mockClient(): X402Client {
  return {
    updateCustomName: vi.fn().mockResolvedValue(undefined),
  } as unknown as X402Client;
}

describe('updateCustomName tool', () => {
  it('returns confirmation markdown with all fields', async () => {
    const client = mockClient();
    const result = await updateCustomName(client, {
      instanceId: 'inst-1',
      type: 'node',
      customName: 'My Ethereum Node',
    });

    expect(result).toContain('Custom Name Updated');
    expect(result).toContain('inst-1');
    expect(result).toContain('node');
    expect(result).toContain('My Ethereum Node');
  });

  it('calls client with correct args', async () => {
    const client = mockClient();
    await updateCustomName(client, {
      instanceId: 'inst-2',
      type: 'vps',
      customName: 'Test',
    });

    expect(client.updateCustomName).toHaveBeenCalledWith('inst-2', 'vps', 'Test');
  });
});
