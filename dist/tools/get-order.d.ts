import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const getOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export type GetOrderParams = z.infer<typeof getOrderSchema>;
export declare const getOrderDescription = "Get the status and details of an existing order by ID. Returns order status, products, and payment information.";
export declare function getOrder(client: X402Client, params: GetOrderParams): Promise<string>;
//# sourceMappingURL=get-order.d.ts.map