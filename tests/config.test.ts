import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig, getConfigPath, getConfigDir } from '../src/lib/config.js';

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
}));

import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Clear relevant env vars
    delete process.env.EASYNODE_PRIVATE_KEY;
    delete process.env.EASYNODE_API_URL;
    delete process.env.EASYNODE_MAX_PAYMENT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('returns valid config with all env vars set', () => {
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;
      process.env.EASYNODE_API_URL = 'https://custom.api.xyz';
      process.env.EASYNODE_MAX_PAYMENT = '500';

      const result = loadConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.config).toEqual({
        privateKey: TEST_KEY,
        apiUrl: 'https://custom.api.xyz',
        maxPayment: 500,
      });
    });

    it('uses default apiUrl and maxPayment', () => {
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;

      const result = loadConfig();

      expect(result.valid).toBe(true);
      expect(result.config!.apiUrl).toBe('https://api.easy-node.xyz');
      expect(result.config!.maxPayment).toBe(100);
    });

    it('errors when private key is missing', () => {
      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EASYNODE_PRIVATE_KEY is required');
    });

    it('errors when private key has invalid format', () => {
      process.env.EASYNODE_PRIVATE_KEY = 'not-a-valid-key';

      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'EASYNODE_PRIVATE_KEY must be a valid hex string starting with 0x'
      );
    });

    it('errors when private key is too short', () => {
      process.env.EASYNODE_PRIVATE_KEY = '0xabc';

      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'EASYNODE_PRIVATE_KEY must be a valid hex string starting with 0x'
      );
    });

    it('errors when maxPayment is NaN', () => {
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;
      process.env.EASYNODE_MAX_PAYMENT = 'not-a-number';

      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EASYNODE_MAX_PAYMENT must be a positive number');
    });

    it('errors when maxPayment is 0', () => {
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;
      process.env.EASYNODE_MAX_PAYMENT = '0';

      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EASYNODE_MAX_PAYMENT must be a positive number');
    });

    it('errors when maxPayment is negative', () => {
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;
      process.env.EASYNODE_MAX_PAYMENT = '-10';

      const result = loadConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EASYNODE_MAX_PAYMENT must be a positive number');
    });

    it('loads global env file when it exists', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return String(path).includes('.easy-node');
      });
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;

      loadConfig();

      expect(dotenvConfig).toHaveBeenCalledWith({
        path: join(homedir(), '.easy-node', '.env'),
      });
    });

    it('loads local env file with override when it exists', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return String(path) === join(process.cwd(), '.env');
      });
      process.env.EASYNODE_PRIVATE_KEY = TEST_KEY;

      loadConfig();

      expect(dotenvConfig).toHaveBeenCalledWith({
        path: join(process.cwd(), '.env'),
        override: true,
      });
    });
  });

  describe('getConfigPath', () => {
    it('returns ~/.easy-node/.env', () => {
      expect(getConfigPath()).toBe(join(homedir(), '.easy-node', '.env'));
    });
  });

  describe('getConfigDir', () => {
    it('returns ~/.easy-node', () => {
      expect(getConfigDir()).toBe(join(homedir(), '.easy-node'));
    });
  });
});
