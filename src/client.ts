import { createWalletClient, getAddress, http, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import type { X402Config } from './config.js';

type PrivateKeyAccount = ReturnType<typeof privateKeyToAccount>;

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

interface PaymentRequirements {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

interface ResourceInfo {
  url: string;
  description: string;
  mimeType: string;
}

interface PaymentRequired {
  x402Version: number;
  resource: ResourceInfo;
  accepts: PaymentRequirements[];
}

/**
 * x402 API Client
 * Handles HTTP 402 payment flow automatically
 */
export class X402Client {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly walletClient: any;
  private readonly account: PrivateKeyAccount;
  private readonly privateKey: `0x${string}`;
  private readonly apiUrl: string;
  private readonly maxPayment: number;

  constructor(config: X402Config) {
    this.privateKey = config.privateKey;
    this.account = privateKeyToAccount(config.privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: base,
      transport: http(),
    });
    this.apiUrl = config.apiUrl;
    this.maxPayment = config.maxPayment;
  }

  /**
   * List available VPS/Node products
   */
  async listProducts(category?: 'vps' | 'node'): Promise<Product[]> {
    const url = new URL(`${this.apiUrl}/x402/product`);
    if (category) {
      url.searchParams.set('category', category);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to list products: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Product[];
  }

  /**
   * Create an order with automatic x402 payment handling
   */
  async createOrder(params: CreateOrderParams): Promise<Order> {
    const url = `${this.apiUrl}/x402/order`;
    const body = JSON.stringify(params);

    // First request without payment to get price quote
    const quoteResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (quoteResponse.status !== 402) {
      if (quoteResponse.ok) {
        // Free order or already paid
        return (await quoteResponse.json()) as Order;
      }
      const error = await quoteResponse.text();
      throw new Error(`Order failed: ${quoteResponse.status} - ${error}`);
    }

    // Parse payment requirements from 402 response
    const paymentHeader = quoteResponse.headers.get('payment-required');
    if (!paymentHeader) {
      throw new Error('402 response missing payment-required header');
    }

    const { requirements, resource } = this.parsePaymentRequirements(paymentHeader);

    // Validate payment amount against max (amount is in atomic units, convert to USD)
    const amountUsd = parseInt(requirements.amount, 10) / 1_000_000;
    if (amountUsd > this.maxPayment) {
      throw new Error(
        `Payment amount ${amountUsd} USDC exceeds maximum allowed ${this.maxPayment} USDC. ` +
          `Set EASYNODE_MAX_PAYMENT to increase the limit.`
      );
    }

    // Sign payment authorization (EIP-3009)
    const paymentSignature = await this.signPayment(requirements, resource);

    // Retry with payment signature
    const paymentResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'payment-signature': paymentSignature,
      },
      body,
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Payment failed: ${paymentResponse.status} - ${error}`);
    }

    return (await paymentResponse.json()) as Order;
  }

  /**
   * Renew an existing instance with automatic x402 payment handling
   */
  async renewInstance(instanceId: string, period: number, type: 'node' | 'vps'): Promise<Order> {
    const timestamp = Date.now().toString();
    const address = this.account.address;
    const message = `renewInstance:${instanceId}:${type}:${address}:${timestamp}`;
    const signature = await this.signRequest(message);

    const url = `${this.apiUrl}/x402/instance/${instanceId}/renew?type=${type}`;
    const body = JSON.stringify({
      period,
      userId: address,
      timestamp,
      signature,
    });

    // First request without payment to get price quote
    const quoteResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (quoteResponse.status !== 402) {
      if (quoteResponse.ok) {
        return (await quoteResponse.json()) as Order;
      }
      const error = await quoteResponse.text();
      throw new Error(`Renewal failed: ${quoteResponse.status} - ${error}`);
    }

    // Parse payment requirements from 402 response
    const paymentHeader = quoteResponse.headers.get('payment-required');
    if (!paymentHeader) {
      throw new Error('402 response missing payment-required header');
    }

    const { requirements, resource } = this.parsePaymentRequirements(paymentHeader);

    // Validate payment amount against max
    const amountUsd = parseInt(requirements.amount, 10) / 1_000_000;
    if (amountUsd > this.maxPayment) {
      throw new Error(
        `Payment amount ${amountUsd} USDC exceeds maximum allowed ${this.maxPayment} USDC. ` +
          `Set EASYNODE_MAX_PAYMENT to increase the limit.`
      );
    }

    // Sign payment authorization (EIP-3009)
    const paymentSignature = await this.signPayment(requirements, resource);

    // Retry with payment signature
    const paymentResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'payment-signature': paymentSignature,
      },
      body,
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Renewal payment failed: ${paymentResponse.status} - ${error}`);
    }

    return (await paymentResponse.json()) as Order;
  }

  /**
   * Get order status by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const timestamp = Date.now().toString();
    const address = this.account.address;
    const message = `getOrder:${orderId}:${address}:${timestamp}`;
    const signature = await this.signRequest(message);

    const url = new URL(`${this.apiUrl}/x402/order/${orderId}`);
    url.searchParams.set('userId', address);
    url.searchParams.set('timestamp', timestamp);
    url.searchParams.set('signature', signature);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Order;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.account.address;
  }

  /**
   * Sign a request message for authentication
   */
  private async signRequest(message: string): Promise<string> {
    return this.walletClient.signMessage({
      account: this.account,
      message,
    });
  }

  /**
   * List all instances for the current wallet
   */
  async listInstances(): Promise<InstanceListItem[]> {
    const timestamp = Date.now().toString();
    const address = this.account.address;
    const message = `listInstances:${address}:${timestamp}`;
    const signature = await this.signRequest(message);

    const url = new URL(`${this.apiUrl}/x402/instance`);
    url.searchParams.set('userId', address);
    url.searchParams.set('timestamp', timestamp);
    url.searchParams.set('signature', signature);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to list instances: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { instances: InstanceListItem[] };
    return data.instances;
  }

  /**
   * Get instance details with decrypted secrets
   */
  async getInstanceDetails(
    instanceId: string,
    type: 'node' | 'vps'
  ): Promise<InstanceDetails & { secrets: InstanceSecrets | null }> {
    const timestamp = Date.now().toString();
    const address = this.account.address;
    const message = `getInstance:${instanceId}:${type}:${address}:${timestamp}`;
    const signature = await this.signRequest(message);

    const url = new URL(`${this.apiUrl}/x402/instance/${instanceId}`);
    url.searchParams.set('type', type);
    url.searchParams.set('userId', address);
    url.searchParams.set('timestamp', timestamp);
    url.searchParams.set('signature', signature);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get instance details: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as InstanceDetails;

    // Decrypt secrets if present
    let secrets: InstanceSecrets | null = null;
    if (data.encryptedSecrets) {
      secrets = await this.decryptSecrets(data.encryptedSecrets);
    }

    return { ...data, secrets };
  }

  /**
   * Update custom name for an instance
   */
  async updateCustomName(
    instanceId: string,
    type: 'node' | 'vps',
    customName: string
  ): Promise<void> {
    const timestamp = Date.now().toString();
    const address = this.account.address;
    const message = `updateCustomName:${instanceId}:${type}:${address}:${timestamp}`;
    const signature = await this.signRequest(message);

    const url = `${this.apiUrl}/x402/instance/${instanceId}/custom-name`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customName,
        type,
        userId: address,
        timestamp,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update custom name: ${response.status} - ${error}`);
    }
  }

  /**
   * Decrypt secrets using the wallet's private key (ECIES with secp256k1)
   */
  private async decryptSecrets(encryptedData: string): Promise<InstanceSecrets> {
    const secp = await import('@noble/secp256k1');
    const { xchacha20poly1305 } = await import('@noble/ciphers/chacha.js');

    const encrypted = JSON.parse(encryptedData);
    const ephemeralPubKeyBytes = Buffer.from(encrypted.ephemeralPublicKey, 'hex');
    const nonce = new Uint8Array(Buffer.from(encrypted.nonce, 'hex'));
    const ciphertext = new Uint8Array(Buffer.from(encrypted.ciphertext, 'hex'));

    // Get private key bytes (remove 0x prefix)
    const privateKeyBytes = Buffer.from(this.privateKey.slice(2), 'hex');

    // Compute shared secret via ECDH using noble/secp256k1
    const sharedSecret = secp
      .getSharedSecret(privateKeyBytes, ephemeralPubKeyBytes, true)
      .slice(1, 33);

    // Decrypt
    const cipher = xchacha20poly1305(new Uint8Array(sharedSecret), nonce);
    const plaintext = cipher.decrypt(ciphertext);

    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  private parsePaymentRequirements(header: string): {
    requirements: PaymentRequirements;
    resource: ResourceInfo;
  } {
    try {
      const decoded = Buffer.from(header, 'base64').toString('utf-8');
      const paymentRequired: PaymentRequired = JSON.parse(decoded);

      if (!paymentRequired.accepts || paymentRequired.accepts.length === 0) {
        throw new Error('No payment options available');
      }

      return {
        requirements: paymentRequired.accepts[0],
        resource: paymentRequired.resource,
      };
    } catch (e) {
      if (e instanceof Error && e.message.includes('No payment options')) {
        throw e;
      }
      throw new Error('Failed to parse payment requirements header');
    }
  }

  private async signPayment(
    requirements: PaymentRequirements,
    resource: ResourceInfo
  ): Promise<string> {
    // Parse chainId from CAIP-2 network format (e.g., "eip155:84532" -> 84532)
    const chainId = parseInt(requirements.network.split(':')[1], 10);
    if (isNaN(chainId)) {
      throw new Error(`Invalid network format: ${requirements.network}`);
    }

    // Get EIP-712 domain name/version from requirements.extra (server provides these)
    const domainName = requirements.extra?.name as string;
    const domainVersion = requirements.extra?.version as string;
    if (!domainName || !domainVersion) {
      throw new Error('EIP-712 domain parameters (name, version) required in payment requirements');
    }

    // Generate nonce (32 random bytes as hex) - matches @x402/evm createNonce()
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const nonce = toHex(randomBytes);

    // Timestamps matching @x402/evm format
    const now = Math.floor(Date.now() / 1000);
    const validAfter = (now - 600).toString(); // 10 min in past
    const validBefore = (now + requirements.maxTimeoutSeconds).toString();

    // Build authorization object (all strings) - matches @x402/evm format
    const authorization = {
      from: getAddress(this.account.address),
      to: getAddress(requirements.payTo),
      value: requirements.amount,
      validAfter,
      validBefore,
      nonce,
    };

    // EIP-712 domain - use requirements.asset as verifyingContract
    const domain = {
      name: domainName,
      version: domainVersion,
      chainId,
      verifyingContract: getAddress(requirements.asset) as `0x${string}`,
    };

    // EIP-3009 types
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    } as const;

    // Message to sign (convert to BigInt where needed)
    const message = {
      from: getAddress(this.account.address),
      to: getAddress(requirements.payTo) as `0x${string}`,
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore),
      nonce: nonce as `0x${string}`,
    };

    // Sign with EIP-712
    const signature = await this.walletClient.signTypedData({
      account: this.account,
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
    });

    // Build x402 v2 PaymentPayload with correct nested structure (matches @x402/evm)
    const paymentPayload = {
      x402Version: 2,
      resource,
      accepted: requirements,
      payload: {
        authorization,
        signature,
      },
    };

    return Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  }
}
