import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const renewInstanceSchema: z.ZodObject<{
    instanceId: z.ZodString;
    period: z.ZodNumber;
    type: z.ZodEnum<{
        vps: "vps";
        node: "node";
    }>;
}, z.core.$strip>;
export type RenewInstanceParams = z.infer<typeof renewInstanceSchema>;
export declare const renewInstanceDescription = "Renew an existing VPS or Node instance subscription using USDC on Base. Extends the subscription period. Handles x402 payment flow automatically.";
export declare function renewInstance(client: X402Client, params: RenewInstanceParams): Promise<string>;
//# sourceMappingURL=renew-instance.d.ts.map