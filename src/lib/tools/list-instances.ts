import { z } from 'zod';
import type { X402Client, InstanceListItem } from '../client.js';

export const listInstancesSchema = z.object({});

export type ListInstancesParams = z.infer<typeof listInstancesSchema>;

export const listInstancesDescription =
  'List all VPS and Node instances owned by the wallet. Returns instance IDs, types, statuses, and subscription dates.';

function formatInstances(instances: InstanceListItem[], walletAddress: string): string {
  if (instances.length === 0) {
    return `No instances found for wallet ${walletAddress}`;
  }

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

  const lines: string[] = [
    `## Instances for ${walletAddress}`,
    '',
    `Found ${instances.length} instance(s):`,
    '',
  ];

  for (const instance of instances) {
    const emoji = statusEmoji[instance.status] || '❓';
    const endDateStr = instance.endDate
      ? new Date(instance.endDate * 1000).toLocaleDateString()
      : 'N/A';

    const nameLabel = instance.customName ? ` (${instance.customName})` : '';
    lines.push(`### ${instance.type.toUpperCase()}: ${instance.productCode}${nameLabel}`);
    lines.push(`- **ID:** ${instance.id}`);
    lines.push(`- **Status:** ${emoji} ${instance.status}`);
    lines.push(`- **Renewable:** ${instance.renewable ? '✅ Yes' : '❌ No'}`);
    lines.push(`- **Start:** ${new Date(instance.startDate * 1000).toLocaleDateString()}`);
    lines.push(`- **End:** ${endDateStr}`);
    lines.push('');
  }

  lines.push(
    '> Use `get_instance` with an instance ID to get connection details (IP, credentials).'
  );

  return lines.join('\n');
}

export async function listInstances(client: X402Client): Promise<string> {
  const instances = await client.listInstances();
  return formatInstances(instances, client.getAddress());
}
