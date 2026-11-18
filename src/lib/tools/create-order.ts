import { z } from 'zod';
import type { Order, X402Client } from '../client.js';

export const createOrderSchema = z.object({
  productId: z.string().describe('Product ID to purchase'),
  period: z
    .union([z.literal(1), z.literal(3), z.literal(6)])
    .describe('Subscription period in months: 1, 3 or 6'),
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
  region: z
    .enum(['EU', 'US-CENTRAL', 'US-EAST', 'US-WEST', 'UK', 'JPN', 'IND', 'AUS'])
    .optional()
    .describe('Region code from the product regions in list_products (default: EU)'),
  addOns: z
    .array(z.string())
    .max(10)
    .optional()
    .describe(
      'VPS only: add-on ids from the product addOns in list_products, at most one per type'
    ),
});

export type CreateOrderParams = z.infer<typeof createOrderSchema>;

export const createOrderDescription =
  'Purchase a VPS or blockchain node product using USDC on Base, optionally in a given region and with add-ons from list_products. Handles the x402 payment flow automatically. Returns order details with ID and status.';

function formatOrder(order: Order): string {
  const lines: string[] = [
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
  lines.push(
    '> Use `get_order` with order ID to check provisioning status and get instance details.'
  );

  return lines.join('\n');
}

export async function createOrder(client: X402Client, params: CreateOrderParams): Promise<string> {
  const order = await client.createOrder({
    productId: params.productId,
    period: params.period,
    quantity: params.quantity,
    customName: params.customName,
    region: params.region,
    addOns: params.addOns,
  });

  return formatOrder(order);
}
