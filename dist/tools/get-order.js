import { z } from 'zod';
export const getOrderSchema = z.object({
    orderId: z.string().describe('Order ID to look up'),
});
export const getOrderDescription = 'Get the status and details of an existing order by ID. Returns order status, products, and payment information.';
function formatOrderStatus(order) {
    const statusEmoji = {
        pending: '⏳',
        locked: '🔒',
        completed: '✅',
        failed: '❌',
        refunded: '💰',
    };
    const instanceStatusEmoji = {
        ordered: '📝',
        unprovisioned: '📝',
        provisioning: '🔄',
        'error-provisioning': '❌',
        provisioned: '✅',
        'ready-to-deploy': '🚀',
        'to-deploy': '🚀',
        'setting-up': '⚙️',
        'error-setup': '❌',
        active: '✅',
        canceled: '🚫',
        expired: '⏰',
    };
    const lines = [
        '## Order Details',
        '',
        `**Order ID:** ${order.id}`,
        `**Status:** ${statusEmoji[order.status] || ''} ${order.status}`,
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
        lines.push(`- Status: ${instanceStatusEmoji[order.instance.status] || ''} ${order.instance.status}`);
    }
    return lines.join('\n');
}
export async function getOrder(client, params) {
    const order = await client.getOrder(params.orderId);
    return formatOrderStatus(order);
}
//# sourceMappingURL=get-order.js.map