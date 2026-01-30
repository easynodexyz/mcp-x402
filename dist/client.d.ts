import type { X402Config } from './config.js';
export interface Product {
    id: string;
    code: string;
    title: string;
    subtitle: string;
    description: string;
    category: 'vps' | 'node';
    pricing: ProductPricing[];
    specs?: Record<string, number>;
    supply: number | string;
    maxPerOrder: number;
}
export interface ProductPricing {
    description: string;
    period: number;
    totalPeriodCost: number;
    monthlyCostEquivalent: number;
}
export interface OrderInstance {
    id: string;
    type: 'node' | 'vps';
    status: string;
}
export interface InstanceListItem {
    id: string;
    type: 'node' | 'vps';
    status: string;
    productCode: string;
    customName: string | null;
    startDate: number;
    endDate: number | null;
    renewable: boolean;
}
export interface InstanceDetails {
    id: string;
    type: 'node' | 'vps';
    status: string;
    productCode: string;
    customName: string | null;
    startDate: number;
    endDate: number | null;
    renewable: boolean;
    encryptedSecrets: string | null;
}
export interface InstanceSecrets {
    ipv4: string | null;
    ipv4NetmaskCidr: string | null;
    ipv6: string | null;
    ipv6NetmaskCidr: string | null;
    port: string;
    admin: {
        username: string;
        password: string;
    } | null;
}
export interface Order {
    id: string;
    userId: string;
    createdAt: number;
    kind: string;
    status: 'pending' | 'locked' | 'completed' | 'failed' | 'refunded';
    products: Array<{
        productId: string;
        period: number;
        quantity: number;
    }>;
    instance: OrderInstance | null;
}
export interface CreateOrderParams {
    productId: string;
    period: number;
    quantity: number;
    userId?: string;
    imports?: Record<string, unknown>;
    customName?: string;
}
/**
 * x402 API Client
 * Handles HTTP 402 payment flow automatically
 */
export declare class X402Client {
    private readonly walletClient;
    private readonly account;
    private readonly privateKey;
    private readonly apiUrl;
    private readonly maxPayment;
    constructor(config: X402Config);
    /**
     * List available VPS/Node products
     */
    listProducts(category?: 'vps' | 'node'): Promise<Product[]>;
    /**
     * Create an order with automatic x402 payment handling
     */
    createOrder(params: CreateOrderParams): Promise<Order>;
    /**
     * Renew an existing instance with automatic x402 payment handling
     */
    renewInstance(instanceId: string, period: number, type: 'node' | 'vps'): Promise<Order>;
    /**
     * Get order status by ID
     */
    getOrder(orderId: string): Promise<Order>;
    /**
     * Get wallet address
     */
    getAddress(): string;
    /**
     * Sign a request message for authentication
     */
    private signRequest;
    /**
     * List all instances for the current wallet
     */
    listInstances(): Promise<InstanceListItem[]>;
    /**
     * Get instance details with decrypted secrets
     */
    getInstanceDetails(instanceId: string, type: 'node' | 'vps'): Promise<InstanceDetails & {
        secrets: InstanceSecrets | null;
    }>;
    /**
     * Update custom name for an instance
     */
    updateCustomName(instanceId: string, type: 'node' | 'vps', customName: string): Promise<void>;
    /**
     * Decrypt secrets using the wallet's private key (ECIES with secp256k1)
     */
    private decryptSecrets;
    private parsePaymentRequirements;
    private signPayment;
}
//# sourceMappingURL=client.d.ts.map