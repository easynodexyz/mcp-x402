#!/usr/bin/env node

import { Command } from 'commander';
import { runServer } from './server.js';
import { runSetup } from './setup.js';

// Library re-exports
export { X402Client } from './client.js';
export type { Product, Order, CreateOrderParams } from './client.js';

export { loadConfig, getConfigPath, getConfigDir } from './config.js';
export type { X402Config, ConfigValidationResult } from './config.js';

export { createServer, runServer } from './server.js';

const program = new Command();

program
  .name('mcp-x402')
  .description('MCP server for AI agents to purchase VPS/Node products via x402 with USDC on Base')
  .version('0.1.0');

program
  .command('setup')
  .description('Interactive configuration wizard')
  .action(async () => {
    await runSetup();
  });

program
  .command('serve', { isDefault: true })
  .description('Start the MCP server (default)')
  .action(async () => {
    await runServer();
  });

program.parseAsync(process.argv).catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
