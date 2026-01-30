import { z } from 'zod';
export const renewInstanceSchema = z.object({
    instanceId: z.string().describe('Instance ID (userNode or userVps ID) to renew'),
    period: z.number().int().min(1).describe('Renewal period in months'),
    type: z.enum(['node', 'vps']).describe('Instance type: "node" or "vps"'),
});
export const renewInstanceDescription = 'Renew an existing VPS or Node instance subscription using USDC on Base. Extends the subscription period. Handles x402 payment flow automatically.';
function formatRenewalOrder(order) {
    const lines = [
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
export async function renewInstance(client, params) {
    const order = await client.renewInstance(params.instanceId, params.period, params.type);
    return formatRenewalOrder(order);
}
//# sourceMappingURL=renew-instance.js.map