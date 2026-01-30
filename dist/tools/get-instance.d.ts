import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const getInstanceSchema: z.ZodObject<{
    instanceId: z.ZodString;
    type: z.ZodEnum<{
        vps: "vps";
        node: "node";
    }>;
}, z.core.$strip>;
export type GetInstanceParams = z.infer<typeof getInstanceSchema>;
export declare const getInstanceDescription = "Get detailed information about a specific instance including connection details (IP address, SSH port, admin credentials). Secrets are encrypted and decrypted locally.";
export declare function getInstance(client: X402Client, params: GetInstanceParams): Promise<string>;
//# sourceMappingURL=get-instance.d.ts.map