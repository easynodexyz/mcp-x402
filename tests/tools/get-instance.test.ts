import { describe, it, expect, vi } from 'vitest';
import { getInstance } from '../../src/tools/get-instance.js';
import type { X402Client, InstanceDetails, InstanceSecrets } from '../../src/client.js';

function makeDetails(
  overrides: Partial<InstanceDetails & { secrets: InstanceSecrets | null }> = {}
): InstanceDetails & { secrets: InstanceSecrets | null } {
  return {
    id: 'inst-1',
    type: 'vps',
    status: 'active',
    productCode: 'vps-basic',
    customName: null,
    startDate: 1700000000,
    endDate: 1703000000,
    renewable: true,
    encryptedSecrets: null,
    secrets: null,
    ...overrides,
  };
}

function mockClient(details: InstanceDetails & { secrets: InstanceSecrets | null }): X402Client {
  return {
    getInstanceDetails: vi.fn().mockResolvedValue(details),
  } as unknown as X402Client;
}

describe('getInstance tool', () => {
  it('shows full connection details with secrets', async () => {
    const details = makeDetails({
      secrets: {
        ipv4: '1.2.3.4',
        ipv4NetmaskCidr: '/24',
        ipv6: '::1',
        ipv6NetmaskCidr: '/64',
        port: '22',
        admin: { username: 'root', password: 's3cret' },
      },
    });
    const client = mockClient(details);
    const result = await getInstance(client, { instanceId: 'inst-1', type: 'vps' });

    expect(result).toContain('Connection Details');
    expect(result).toContain('1.2.3.4');
    expect(result).toContain('/24');
    expect(result).toContain('::1');
    expect(result).toContain('/64');
    expect(result).toContain('SSH Port');
    expect(result).toContain('22');
    expect(result).toContain('Admin Credentials');
    expect(result).toContain('root');
    expect(result).toContain('s3cret');
    expect(result).toContain('ssh root@1.2.3.4 -p 22');
  });

  it('shows "not yet provisioned" when secrets are null', async () => {
    const details = makeDetails({ secrets: null });
    const client = mockClient(details);
    const result = await getInstance(client, { instanceId: 'inst-1', type: 'vps' });

    expect(result).toContain('not yet provisioned');
    expect(result).not.toContain('Admin Credentials');
  });

  it('does not show admin section when admin is null', async () => {
    const details = makeDetails({
      secrets: {
        ipv4: '1.2.3.4',
        ipv4NetmaskCidr: null,
        ipv6: null,
        ipv6NetmaskCidr: null,
        port: '22',
        admin: null,
      },
    });
    const client = mockClient(details);
    const result = await getInstance(client, { instanceId: 'inst-1', type: 'vps' });

    expect(result).toContain('Connection Details');
    expect(result).toContain('1.2.3.4');
    expect(result).not.toContain('Admin Credentials');
    expect(result).not.toContain('ssh ');
  });

  it('shows instance metadata', async () => {
    const details = makeDetails({
      customName: 'My Node',
      status: 'provisioning',
    });
    const client = mockClient(details);
    const result = await getInstance(client, { instanceId: 'inst-1', type: 'vps' });

    expect(result).toContain('Instance Details');
    expect(result).toContain('My Node');
    expect(result).toContain('🔄 provisioning');
    expect(result).toContain('vps-basic');
  });
});
