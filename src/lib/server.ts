import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { X402Client } from './client.js';
import { loadConfig } from './config.js';
import {
  listProducts,
  listProductsDescription,
  listProductsSchema,
  createOrder,
  createOrderDescription,
  createOrderSchema,
  getOrder,
  getOrderDescription,
  getOrderSchema,
  listInstances,
  listInstancesDescription,
  listInstancesSchema,
  getInstance,
  getInstanceDescription,
  getInstanceSchema,
  renewInstance,
  renewInstanceDescription,
  renewInstanceSchema,
  updateCustomName,
  updateCustomNameDescription,
  updateCustomNameSchema,
} from './tools/index.js';

export const TOOLS = [
  {
    name: 'list_products',
    description:
      'List available VPS and blockchain node products with USDC pricing. Returns product IDs, names, pricing, and availability.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['vps', 'node'],
          description: 'Filter by product category: "vps" or "node"',
        },
      },
    },
  },
  {
    name: 'create_order',
    description:
      'Purchase a VPS or blockchain node product using USDC on Base. Handles the x402 payment flow automatically. Returns order details with ID and status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to purchase',
        },
        period: {
          type: 'number',
          description: 'Subscription period in months',
        },
        quantity: {
          type: 'number',
          description: 'Number of instances to purchase (default: 1)',
        },
        customName: {
          type: 'string',
          description: 'Custom name for the instance (max 100 characters)',
        },
      },
      required: ['productId', 'period'],
    },
  },
  {
    name: 'get_order',
    description:
      'Get the status and details of an existing order by ID. Returns order status, products, and payment information.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to look up',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'list_instances',
    description:
      'List all VPS and Node instances owned by the wallet. Returns instance IDs, types, statuses, and subscription dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_instance',
    description:
      'Get detailed information about a specific instance including connection details (IP address, SSH port, admin credentials). Secrets are encrypted and decrypted locally.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        instanceId: {
          type: 'string',
          description: 'Instance ID (userNode or userVps ID) to get details for',
        },
        type: {
          type: 'string',
          enum: ['node', 'vps'],
          description: 'Instance type: "node" or "vps"',
        },
      },
      required: ['instanceId', 'type'],
    },
  },
  {
    name: 'renew_instance',
    description:
      'Renew an existing VPS or Node instance subscription using USDC on Base. Extends the subscription period. Handles x402 payment flow automatically.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        instanceId: {
          type: 'string',
          description: 'Instance ID (userNode or userVps ID) to renew',
        },
        period: {
          type: 'number',
          description: 'Renewal period in months',
        },
        type: {
          type: 'string',
          enum: ['node', 'vps'],
          description: 'Instance type: "node" or "vps"',
        },
      },
      required: ['instanceId', 'period', 'type'],
    },
  },
  {
    name: 'update_custom_name',
    description:
      'Set or update the custom name of a VPS or Node instance. Useful for labeling instances with friendly names.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        instanceId: {
          type: 'string',
          description: 'Instance ID (userNode or userVps ID) to update',
        },
        type: {
          type: 'string',
          enum: ['node', 'vps'],
          description: 'Instance type: "node" or "vps"',
        },
        customName: {
          type: 'string',
          description: 'Custom name for the instance (max 100 characters)',
        },
      },
      required: ['instanceId', 'type', 'customName'],
    },
  },
];

export function createMcpServer(client: X402Client): McpServer {
  const mcpServer = new McpServer({
    name: 'easy-node-x402',
    version: '0.1.0',
  });

  mcpServer.registerTool(
    'list_products',
    {
      description: listProductsDescription,
      inputSchema: listProductsSchema.shape,
    },
    async (params) => {
      try {
        const result = await listProducts(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'create_order',
    {
      description: createOrderDescription,
      inputSchema: createOrderSchema.shape,
    },
    async (params) => {
      try {
        const result = await createOrder(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'get_order',
    {
      description: getOrderDescription,
      inputSchema: getOrderSchema.shape,
    },
    async (params) => {
      try {
        const result = await getOrder(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'list_instances',
    {
      description: listInstancesDescription,
      inputSchema: listInstancesSchema.shape,
    },
    async () => {
      try {
        const result = await listInstances(client);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'get_instance',
    {
      description: getInstanceDescription,
      inputSchema: getInstanceSchema.shape,
    },
    async (params) => {
      try {
        const result = await getInstance(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'renew_instance',
    {
      description: renewInstanceDescription,
      inputSchema: renewInstanceSchema.shape,
    },
    async (params) => {
      try {
        const result = await renewInstance(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  mcpServer.registerTool(
    'update_custom_name',
    {
      description: updateCustomNameDescription,
      inputSchema: updateCustomNameSchema.shape,
    },
    async (params) => {
      try {
        const result = await updateCustomName(client, params);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );

  return mcpServer;
}

export async function runServer(): Promise<void> {
  const configResult = loadConfig();

  if (!configResult.valid || !configResult.config) {
    console.error('Configuration errors:');
    configResult.errors.forEach((e) => console.error(`  - ${e}`));
    console.error('\nRun "npx @easynodexyz/mcp-x402 setup" to configure.');
    process.exit(1);
  }

  const client = new X402Client(configResult.config);
  const server = createMcpServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
