import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const updateCustomNameSchema: z.ZodObject<{
    instanceId: z.ZodString;
    type: z.ZodEnum<{
        vps: "vps";
        node: "node";
    }>;
    customName: z.ZodString;
}, z.core.$strip>;
export type UpdateCustomNameParams = z.infer<typeof updateCustomNameSchema>;
export declare const updateCustomNameDescription = "Set or update the custom name of a VPS or Node instance. Useful for labeling instances with friendly names.";
export declare function updateCustomName(client: X402Client, params: UpdateCustomNameParams): Promise<string>;
//# sourceMappingURL=update-custom-name.d.ts.map