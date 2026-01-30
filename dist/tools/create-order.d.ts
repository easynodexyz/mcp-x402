import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const createOrderSchema: z.ZodObject<{
    productId: z.ZodString;
    period: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
    customName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateOrderParams = z.infer<typeof createOrderSchema>;
export declare const createOrderDescription = "Purchase a VPS or blockchain node product using USDC on Base. Handles the x402 payment flow automatically. Returns order details with ID and status.";
export declare function createOrder(client: X402Client, params: CreateOrderParams): Promise<string>;
//# sourceMappingURL=create-order.d.ts.map