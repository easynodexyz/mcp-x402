import { z } from 'zod';
import type { X402Client } from '../client.js';

export const updateCustomNameSchema = z.object({
  instanceId: z.string().describe('Instance ID (userNode or userVps ID) to update'),
  type: z.enum(['node', 'vps']).describe('Instance type: "node" or "vps"'),
  customName: z.string().max(100).describe('Custom name for the instance (max 100 characters)'),
});

export type UpdateCustomNameParams = z.infer<typeof updateCustomNameSchema>;

export const updateCustomNameDescription =
  'Set or update the custom name of a VPS or Node instance. Useful for labeling instances with friendly names.';

export async function updateCustomName(
  client: X402Client,
  params: UpdateCustomNameParams
): Promise<string> {
  await client.updateCustomName(params.instanceId, params.type, params.customName);

  return [
    '## Custom Name Updated',
    '',
    `**Instance ID:** ${params.instanceId}`,
    `**Type:** ${params.type}`,
    `**Custom Name:** ${params.customName}`,
  ].join('\n');
}
