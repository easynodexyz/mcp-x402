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
  'List available VPS and blockchain node products with USDC pricing. Returns product IDs, names, pricing, available regions and add-ons (with their extra monthly price), and availability.';

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatPrice(pricing: ProductPricing): string {
  return `${pricing.period} month(s): ${formatUsd(pricing.totalPeriodCost)} total (${formatUsd(pricing.monthlyCostEquivalent)}/month)`;
}

function formatOptions<T>(
  title: string,
  options: T[] | undefined,
  format: (option: T) => string
): string[] {
  return options?.length
    ? [`  ${title}:`, ...options.map((option) => `    - ${format(option)}`)]
    : [];
}

function formatProduct(product: Product): string {
  const lines: string[] = [
    `**${product.title}** (${product.code})`,
    `  ID: ${product.id}`,
    `  Title: ${product.subtitle.replaceAll('{br}', ' - ')}`,
    `  Description: ${product.description.replaceAll('{br}', ' - ')}`,
    `  Type: ${product.category}`,
    `  Pricing (USDC):`,
    ...product.pricing.map((pricing) => `    - ${formatPrice(pricing)}`),
    ...formatOptions(
      'Regions (extra per month)',
      product.regions,
      ({ code, monthlyPricing }) => `${code}: +${formatUsd(monthlyPricing)}`
    ),
    ...formatOptions(
      'Add-ons (extra per month)',
      product.addOns,
      ({ id, type, name, monthlyPricing }) =>
        `${id} (${type}, ${name}): +${formatUsd(monthlyPricing)}`
    ),
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
