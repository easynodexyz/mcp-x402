import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface X402Config {
  privateKey: `0x${string}`;
  apiUrl: string;
  maxPayment: number;
}

export interface ConfigValidationResult {
  valid: boolean;
  config?: X402Config;
  errors: string[];
}

const DEFAULT_API_URL = 'https://api.easy-node.xyz';
const DEFAULT_MAX_PAYMENT = 100;

/**
 * Load configuration from multiple sources in order:
 * 1. Environment variables (highest priority)
 * 2. .env file in current working directory
 * 3. ~/.easy-node/.env global config (lowest priority)
 */
export function loadConfig(): ConfigValidationResult {
  const errors: string[] = [];

  // Load from ~/.easy-node/.env (lowest priority)
  const globalEnvPath = join(homedir(), '.easy-node', '.env');
  if (existsSync(globalEnvPath)) {
    dotenvConfig({ path: globalEnvPath });
  }

  // Load from cwd .env (overrides global)
  const localEnvPath = join(process.cwd(), '.env');
  if (existsSync(localEnvPath)) {
    dotenvConfig({ path: localEnvPath, override: true });
  }

  // Environment variables always take precedence (they override dotenv values)

  const privateKey = process.env.EASYNODE_PRIVATE_KEY;
  const apiUrl = process.env.EASYNODE_API_URL || DEFAULT_API_URL;
  const maxPaymentStr = process.env.EASYNODE_MAX_PAYMENT;
  const maxPayment = maxPaymentStr ? parseFloat(maxPaymentStr) : DEFAULT_MAX_PAYMENT;

  // Validate private key
  if (!privateKey) {
    errors.push('EASYNODE_PRIVATE_KEY is required');
  } else if (!isValidPrivateKey(privateKey)) {
    errors.push('EASYNODE_PRIVATE_KEY must be a valid hex string starting with 0x');
  }

  // Validate max payment
  if (isNaN(maxPayment) || maxPayment <= 0) {
    errors.push('EASYNODE_MAX_PAYMENT must be a positive number');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    config: {
      privateKey: privateKey as `0x${string}`,
      apiUrl,
      maxPayment,
    },
    errors: [],
  };
}

function isValidPrivateKey(key: string): key is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(key);
}

export function getConfigPath(): string {
  return join(homedir(), '.easy-node', '.env');
}

export function getConfigDir(): string {
  return join(homedir(), '.easy-node');
}
