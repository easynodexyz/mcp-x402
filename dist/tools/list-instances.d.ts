import { z } from 'zod';
import type { X402Client } from '../client.js';
export declare const listInstancesSchema: z.ZodObject<{}, z.core.$strip>;
export type ListInstancesParams = z.infer<typeof listInstancesSchema>;
export declare const listInstancesDescription = "List all VPS and Node instances owned by the wallet. Returns instance IDs, types, statuses, and subscription dates.";
export declare function listInstances(client: X402Client): Promise<string>;
//# sourceMappingURL=list-instances.d.ts.map