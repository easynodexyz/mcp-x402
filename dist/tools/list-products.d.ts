import { z } from 'zod';
import { X402Client } from '../client.js';
export declare const listProductsSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        vps: "vps";
        node: "node";
    }>>;
}, z.core.$strip>;
export type ListProductsParams = z.infer<typeof listProductsSchema>;
export declare const listProductsDescription = "List available VPS and blockchain node products with USDC pricing. Returns product IDs, names, pricing, and availability.";
export declare function listProducts(client: X402Client, params: ListProductsParams): Promise<string>;
//# sourceMappingURL=list-products.d.ts.map