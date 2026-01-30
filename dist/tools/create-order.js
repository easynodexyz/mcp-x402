import { z } from 'zod';
export const createOrderSchema = z.object({
    productId: z.string().describe('Product ID to purchase'),
    period: z.number().describe('Subscription period in months'),
    quantity: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe('Number of instances to purchase (default: 1)'),
    customName: z
        .string()
        .max(100)
        .optional()
        .describe('Custom name for the instance (max 100 characters)'),
});
export const createOrderDescription = 'Purchase a VPS or blockchain node product using USDC on Base. Handles the x402 payment flow automatically. Returns order details with ID and status.';
function formatOrder(order) {
    const lines = [
        '## Order Created Successfully',
        '',
        `**Order ID:** ${order.id}`,
        `**Status:** ${order.status}`,
        `**User:** ${order.userId}`,
        `**Created:** ${new Date(order.createdAt * 1000).toISOString()}`,
        '',
        '### Products:',
    ];
    for (const product of order.products) {
        lines.push(`- Product: ${product.productId}`);
        lines.push(`  Period: ${product.period} month(s)`);
        lines.push(`  Quantity: ${product.quantity}`);
    }
    if (order.instance) {
        lines.push('');
        lines.push('### Instance:');
        lines.push(`- ID: ${order.instance.id}`);
        lines.push(`- Type: ${order.instance.type}`);
        lines.push(`- Status: ${order.instance.status}`);
    }
    lines.push('');
    lines.push('> Use `get_order` with order ID to check provisioning status and get instance details.');
    return lines.join('\n');
}
export async function createOrder(client, params) {
    const order = await client.createOrder({
        productId: params.productId,
        period: params.period,
        quantity: params.quantity,
        customName: params.customName,
    });
    return formatOrder(order);
}
//# sourceMappingURL=create-order.js.map