export { X402Client } from './lib/client.js';
export type {
  Product,
  ProductPricing,
  Order,
  CreateOrderParams,
  OrderInstance,
  InstanceListItem,
  InstanceDetails,
  InstanceSecrets,
} from './lib/client.js';

export { loadConfig, getConfigPath, getConfigDir } from './lib/config.js';
export type { X402Config, ConfigValidationResult } from './lib/config.js';

export { createMcpServer, runServer, TOOLS } from './lib/server.js';
export type { ServerInfo } from './lib/server.js';

export * from './lib/tools/index.js';
