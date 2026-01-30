import { describe, it, expect, vi, beforeEach } from 'vitest';
import { X402Client } from '../src/client.js';
import type { X402Config } from '../src/config.js';

const TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

function makeConfig(overrides: Partial<X402Config> = {}): X402Config {
  return {
    privateKey: TEST_KEY,
    apiUrl: 'https://api.test.xyz',
    maxPayment: 100,
    ...overrides,
  };
}

function mockFetchResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 402 ? 'Payment Required' : 'Error',
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    headers: new Map(Object.entries(headers ?? {})),
  } as unknown as Response;
}

function make402Headers(amount = '5000000') {
  const paymentRequired = {
    x402Version: 2,
    resource: { url: 'https://api.test.xyz/x402/order', description: 'order', mimeType: 'application/json' },
    accepts: [
      {
        scheme: 'exact',
        network: 'eip155:8453',
        amount,
        payTo: '0x1234567890abcdef1234567890abcdef12345678',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        maxTimeoutSeconds: 300,
        extra: { name: 'USD Coin', version: '2' },
      },
    ],
  };
  return Buffer.from(JSON.stringify(paymentRequired)).toString('base64');
}

describe('X402Client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  describe('getAddress', () => {
    it('returns correct address from private key', () => {
      const client = new X402Client(makeConfig());
      expect(client.getAddress().toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    });
  });

  describe('listProducts', () => {
    it('calls correct URL without category', async () => {
      const products = [{ id: 'p1', code: 'vps-1', title: 'VPS 1' }];
      fetchMock.mockResolvedValueOnce(mockFetchResponse(products));

      const client = new X402Client(makeConfig());
      const result = await client.listProducts();

      expect(fetchMock).toHaveBeenCalledWith('https://api.test.xyz/x402/product');
      expect(result).toEqual(products);
    });

    it('adds category query param', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse([]));

      const client = new X402Client(makeConfig());
      await client.listProducts('vps');

      expect(fetchMock).toHaveBeenCalledWith('https://api.test.xyz/x402/product?category=vps');
    });

    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('', 500));

      const client = new X402Client(makeConfig());
      await expect(client.listProducts()).rejects.toThrow('Failed to list products');
    });
  });

  describe('getOrder', () => {
    it('calls correct URL with auth params', async () => {
      const order = { id: 'o1', status: 'completed' };
      fetchMock.mockResolvedValueOnce(mockFetchResponse(order));

      const client = new X402Client(makeConfig());
      const result = await client.getOrder('o1');

      expect(result).toEqual(order);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/x402/order/o1');
      expect(calledUrl).toContain('userId=');
      expect(calledUrl).toContain('timestamp=');
      expect(calledUrl).toContain('signature=');
    });

    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('', 404));

      const client = new X402Client(makeConfig());
      await expect(client.getOrder('o1')).rejects.toThrow('Failed to get order');
    });
  });

  describe('listInstances', () => {
    it('parses instances from response', async () => {
      const instances = [{ id: 'i1', type: 'vps', status: 'active' }];
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ instances }));

      const client = new X402Client(makeConfig());
      const result = await client.listInstances();

      expect(result).toEqual(instances);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/x402/instance');
      expect(calledUrl).toContain('signature=');
    });

    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('', 500));

      const client = new X402Client(makeConfig());
      await expect(client.listInstances()).rejects.toThrow('Failed to list instances');
    });
  });

  describe('getInstanceDetails', () => {
    it('returns details with secrets null when no encryptedSecrets', async () => {
      const details = {
        id: 'i1',
        type: 'vps',
        status: 'active',
        productCode: 'vps-1',
        customName: null,
        startDate: 1700000000,
        endDate: 1703000000,
        renewable: true,
        encryptedSecrets: null,
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse(details));

      const client = new X402Client(makeConfig());
      const result = await client.getInstanceDetails('i1', 'vps');

      expect(result.secrets).toBeNull();
      expect(result.id).toBe('i1');
    });
  });

  describe('updateCustomName', () => {
    it('sends PATCH with correct body', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(null));

      const client = new X402Client(makeConfig());
      await client.updateCustomName('i1', 'vps', 'My Server');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test.xyz/x402/instance/i1/custom-name',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.customName).toBe('My Server');
      expect(body.type).toBe('vps');
    });

    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('error', 400));

      const client = new X402Client(makeConfig());
      await expect(client.updateCustomName('i1', 'vps', 'x')).rejects.toThrow(
        'Failed to update custom name'
      );
    });
  });

  describe('createOrder', () => {
    it('returns order directly on 200 (free order)', async () => {
      const order = { id: 'o1', status: 'completed' };
      fetchMock.mockResolvedValueOnce(mockFetchResponse(order));

      const client = new X402Client(makeConfig());
      const result = await client.createOrder({
        productId: 'p1',
        period: 1,
        quantity: 1,
      });

      expect(result).toEqual(order);
    });

    it('handles 402 flow — signs and retries', async () => {
      const paymentHeader = make402Headers();
      const resp402 = {
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: vi.fn(),
        text: vi.fn(),
        headers: { get: (name: string) => (name === 'payment-required' ? paymentHeader : null) },
      } as unknown as Response;

      const order = { id: 'o2', status: 'pending' };
      const resp200 = mockFetchResponse(order);

      fetchMock.mockResolvedValueOnce(resp402).mockResolvedValueOnce(resp200);

      const client = new X402Client(makeConfig());
      const result = await client.createOrder({
        productId: 'p1',
        period: 1,
        quantity: 1,
      });

      expect(result).toEqual(order);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      // Second call should have payment-signature header
      const secondCall = fetchMock.mock.calls[1][1];
      expect(secondCall.headers['payment-signature']).toBeDefined();
    });

    it('throws when 402 missing payment-required header', async () => {
      const resp402 = {
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: vi.fn(),
        text: vi.fn(),
        headers: { get: () => null },
      } as unknown as Response;

      fetchMock.mockResolvedValueOnce(resp402);

      const client = new X402Client(makeConfig());
      await expect(
        client.createOrder({ productId: 'p1', period: 1, quantity: 1 })
      ).rejects.toThrow('402 response missing payment-required header');
    });

    it('throws when amount exceeds maxPayment', async () => {
      // 200 USDC = 200_000_000 atomic
      const paymentHeader = make402Headers('200000000');
      const resp402 = {
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: vi.fn(),
        text: vi.fn(),
        headers: { get: (name: string) => (name === 'payment-required' ? paymentHeader : null) },
      } as unknown as Response;

      fetchMock.mockResolvedValueOnce(resp402);

      const client = new X402Client(makeConfig({ maxPayment: 100 }));
      await expect(
        client.createOrder({ productId: 'p1', period: 1, quantity: 1 })
      ).rejects.toThrow('exceeds maximum allowed');
    });

    it('throws on non-402 error response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('server error', 500));

      const client = new X402Client(makeConfig());
      await expect(
        client.createOrder({ productId: 'p1', period: 1, quantity: 1 })
      ).rejects.toThrow('Order failed');
    });
  });

  describe('renewInstance', () => {
    it('handles 402 flow for renewal', async () => {
      const paymentHeader = make402Headers();
      const resp402 = {
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: vi.fn(),
        text: vi.fn(),
        headers: { get: (name: string) => (name === 'payment-required' ? paymentHeader : null) },
      } as unknown as Response;

      const order = { id: 'r1', status: 'pending', kind: 'renewal' };
      const resp200 = mockFetchResponse(order);

      fetchMock.mockResolvedValueOnce(resp402).mockResolvedValueOnce(resp200);

      const client = new X402Client(makeConfig());
      const result = await client.renewInstance('i1', 1, 'vps');

      expect(result).toEqual(order);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('returns order directly on 200', async () => {
      const order = { id: 'r1', status: 'completed' };
      fetchMock.mockResolvedValueOnce(mockFetchResponse(order));

      const client = new X402Client(makeConfig());
      const result = await client.renewInstance('i1', 1, 'vps');

      expect(result).toEqual(order);
    });

    it('throws on non-402 error response', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse('error', 500));

      const client = new X402Client(makeConfig());
      await expect(client.renewInstance('i1', 1, 'vps')).rejects.toThrow('Renewal failed');
    });
  });
});
