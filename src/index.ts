#!/usr/bin/env node

import { Command } from 'commander';
import { runServer } from './lib/server.js';
import { runSetup } from './lib/setup.js';

// Library re-exports
export * from './lib.js';

const program = new Command();

program
  .name('mcp-x402')
  .description('MCP server for AI agents to purchase VPS/Node products via x402 with USDC on Base')
  .version('0.0.1');

program
  .command('setup')
  .description('Interactive configuration wizard')
  .action(async () => {
    await runSetup();
  });

program
  .command('serve', { isDefault: true })
  .description('Start the MCP server (default)')
  .option('-t, --transport <type>', 'Transport type: stdio or http', 'stdio')
  .option('-p, --port <number>', 'HTTP server port (http transport only)', '3402')
  .action(async (options: { transport: string; port: string }) => {
    if (options.transport === 'http') {
      const { runHttpServer } = await import('./lib/http.js');
      await runHttpServer(parseInt(options.port, 10));
    } else {
      await runServer();
    }
  });

program.parseAsync(process.argv).catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
