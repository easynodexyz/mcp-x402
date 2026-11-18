import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const [productId, buy] = process.argv.slice(2);
const privateKey = readFileSync(`${homedir()}/.easynode-test-key`, 'utf8').trim();

const client = new Client({ name: 'e2e-recette', version: '0.0.0' });
await client.connect(
  new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      EASYNODE_PRIVATE_KEY: privateKey,
      EASYNODE_API_URL: 'https://us-central1-easy-node-recette.cloudfunctions.net/webApi/api',
      EASYNODE_MAX_PAYMENT: '50',
    },
  }),
);

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  console.log(`\n### ${name} ${JSON.stringify(args)}${result.isError ? ' (error)' : ''}`);
  console.log(result.content.map((c) => c.text).join('\n'));
};

if (!productId) {
  await call('list_products', { category: 'vps' });
} else {
  await call('create_order', { productId, period: 12 });
  if (buy === 'buy') await call('create_order', { productId, period: 1 });
}

await client.close();
