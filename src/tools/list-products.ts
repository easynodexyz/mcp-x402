import { z } from 'zod';
import { type Product, type ProductPricing, X402Client } from '../client.js';

export const listProductsSchema = z.object({
  category: z
    .enum(['vps', 'node'])
    .optional()
    .describe('Filter by product category: "vps" or "node"'),
});

export type ListProductsParams = z.infer<typeof listProductsSchema>;

export const listProductsDescription =
  'List available VPS and blockchain node products with USDC pricing. Returns product IDs, names, pricing, and availability.';

function formatPrice(pricing: ProductPricing): string {
  const parts: string[] = [];

  parts.push(`Description: $${pricing.description}`);
  parts.push(`Period (in month) : $${pricing.period}`);
  parts.push(`Total period cost: $${pricing.totalPeriodCost}`);
  parts.push(`Cost for 1 month: $${pricing.monthlyCostEquivalent}`);

  return parts.join(', ') || 'Contact for pricing';
}

function formatProduct(product: Product): string {
  const lines: string[] = [
    `**${product.title}** (${product.code})`,
    `  ID: ${product.id}`,
    `  Title: ${product.subtitle}`,
    `  Description: ${product.description}`,
    `  Type: ${product.category}`,
    `  Pricing (USDC):`,
    ...product.pricing.map((pricing) => `    - ${formatPrice(pricing)}`),
    `  Remaining Supply: ${product.supply}`,
  ];

  if (product.specs) {
    const specs = Object.entries(product.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (specs) {
      lines.push(`  Specs: ${specs}`);
    }
  }

  return lines.join('\n');
}

export async function listProducts(
  client: X402Client,
  params: ListProductsParams
): Promise<string> {
  const products = await client.listProducts(params.category);

  if (products.length === 0) {
    return params.category ? `No ${params.category} products available.` : 'No products available.';
  }

  const header = params.category
    ? `## Available ${params.category.toUpperCase()} Products (${products.length})\n`
    : `## Available Products (${products.length})\n`;

  const formatted = products.map(formatProduct).join('\n\n');

  return header + '\n' + formatted;
}
