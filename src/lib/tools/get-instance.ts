import { z } from 'zod';
import type { InstanceDetails, InstanceSecrets, X402Client } from '../client.js';

export const getInstanceSchema = z.object({
  instanceId: z.string().describe('Instance ID (userNode or userVps ID) to get details for'),
  type: z.enum(['node', 'vps']).describe('Instance type: "node" or "vps"'),
});

export type GetInstanceParams = z.infer<typeof getInstanceSchema>;

export const getInstanceDescription =
  'Get detailed information about a specific instance including connection details (IP address, SSH port, admin credentials). Secrets are encrypted and decrypted locally.';

function formatInstanceDetails(
  details: InstanceDetails & { secrets: InstanceSecrets | null }
): string {
  const statusEmoji: Record<string, string> = {
    ordered: '📝',
    unprovisioned: '📝',
    provisioning: '🔄',
    'error-provisioning': '❌',
    provisioned: '✅',
    'ready-to-deploy': '🚀',
    'setting-up': '⚙️',
    active: '✅',
    canceled: '🚫',
    expired: '⏰',
  };

  const emoji = statusEmoji[details.status] || '❓';

  const lines: string[] = [
    `## Instance Details`,
    '',
    `**ID:** ${details.id}`,
    `**Type:** ${details.type}`,
    `**Product:** ${details.productCode}`,
    `**Custom Name:** ${details.customName ?? 'Not set'}`,
    `**Status:** ${emoji} ${details.status}`,
    `**Renewable:** ${details.renewable ? '✅ Yes' : '❌ No'}`,
    `**Start Date:** ${new Date(details.startDate * 1000).toUTCString()}`,
    `**End Date:** ${details.endDate ? new Date(details.endDate * 1000).toUTCString() : 'No expiration'}`,
    '',
  ];

  if (details.secrets) {
    lines.push('### Connection Details');
    lines.push('');

    if (details.secrets.ipv4) {
      lines.push(`**IPv4 Address:** ${details.secrets.ipv4}`);
      if (details.secrets.ipv4NetmaskCidr) {
        lines.push(`**IPv4 Netmask:** ${details.secrets.ipv4NetmaskCidr}`);
      }
    }

    if (details.secrets.ipv6) {
      lines.push(`**IPv6 Address:** ${details.secrets.ipv6}`);
      if (details.secrets.ipv6NetmaskCidr) {
        lines.push(`**IPv6 Netmask:** ${details.secrets.ipv6NetmaskCidr}`);
      }
    }

    lines.push(`**SSH Port:** ${details.secrets.port}`);
    lines.push('');

    if (details.secrets.admin) {
      lines.push('### Admin Credentials');
      lines.push('');
      lines.push(`**Username:** ${details.secrets.admin.username}`);
      lines.push(`**Password:** ${details.secrets.admin.password}`);
      lines.push('');
      lines.push('```bash');
      lines.push(
        `ssh ${details.secrets.admin.username}@${details.secrets.ipv4} -p ${details.secrets.port}`
      );
      lines.push('```');
    }
  } else {
    lines.push('### Connection Details');
    lines.push('');
    lines.push(
      '*Instance not yet provisioned. Connection details will be available once provisioning completes. Please retry in a few minutes*'
    );
  }

  return lines.join('\n');
}

export async function getInstance(client: X402Client, params: GetInstanceParams): Promise<string> {
  const details = await client.getInstanceDetails(params.instanceId, params.type);
  return formatInstanceDetails(details);
}
