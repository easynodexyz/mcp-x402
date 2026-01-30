import { z } from 'zod';
import type { Order, X402Client } from '../client.js';

export const renewInstanceSchema = z.object({
  instanceId: z.string().describe('Instance ID (userNode or userVps ID) to renew'),
  period: z.number().int().min(1).describe('Renewal period in months'),
  type: z.enum(['node', 'vps']).describe('Instance type: "node" or "vps"'),
});

export type RenewInstanceParams = z.infer<typeof renewInstanceSchema>;

export const renewInstanceDescription =
  'Renew an existing VPS or Node instance subscription using USDC on Base. Extends the subscription period. Handles x402 payment flow automatically.';

function formatRenewalOrder(order: Order): string {
  const lines: string[] = [
    '## Instance Renewal Successful',
    '',
    `**Order ID:** ${order.id}`,
    `**Kind:** ${order.kind}`,
    `**Status:** ${order.status}`,
    `**User:** ${order.userId}`,
    `**Created:** ${new Date(order.createdAt * 1000).toISOString()}`,
    '',
    '### Renewal Details:',
  ];

  for (const product of order.products) {
    lines.push(`- Product: ${product.productId}`);
    lines.push(`  Period: ${product.period} month(s)`);
  }

  if (order.instance) {
    lines.push('');
    lines.push('### Instance:');
    lines.push(`- ID: ${order.instance.id}`);
    lines.push(`- Type: ${order.instance.type}`);
    lines.push(`- Status: ${order.instance.status}`);
  }

  lines.push('');
  lines.push('> Subscription has been extended. Use `get_instance` to check updated details.');

  return lines.join('\n');
}

export async function renewInstance(
  client: X402Client,
  params: RenewInstanceParams
): Promise<string> {
  const order = await client.renewInstance(params.instanceId, params.period, params.type);
  return formatRenewalOrder(order);
}
