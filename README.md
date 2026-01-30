[![npm](https://img.shields.io/npm/v/@easynodexyz/mcp-x402)](https://www.npmjs.com/package/@easynodexyz/mcp-x402)
[![Node](https://img.shields.io/node/v/@easynodexyz/mcp-x402)](https://nodejs.org)
[![Docs](https://img.shields.io/badge/docs-mintlify-blue)](https://docs.easy-node.xyz)

# @easynodexyz/mcp-x402

MCP server for AI agents to purchase VPS and blockchain node products via Easy Node's x402 API with USDC on Base.

## Overview

This package provides a Model Context Protocol (MCP) server that enables AI assistants to:

- List available VPS and blockchain node products
- Purchase products using USDC on Base network
- Check order status
- Manage running instances (list, view details, renew, rename)

The x402 payment flow is handled automatically - the agent simply calls the tools and payments are processed seamlessly.

## Quick Start

### 1. Install & Setup

```bash
npx @easynodexyz/mcp-x402 setup
```

This interactive wizard will:

- Prompt for your wallet private key
- Save configuration to `~/.easy-node/.env`
- Output the IDE config to copy

### 2. Configure Your IDE

Choose your IDE and add the MCP server configuration.

---

## Install as Claude Code Plugin

```bash
/plugin add easynodexyz/mcp-x402
```

## Documentation

Full documentation available at [docs.easy-node.xyz](https://docs.easy-node.xyz).

---

## IDE Configurations

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "@easynodexyz/mcp-x402": {
      "command": "npx",
      "args": ["@easynodexyz/mcp-x402"]
    }
  }
}
```

**Config file locations:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

---

### Claude Code (CLI)

Add MCP server using the `/mcp` command:

```bash
claude /mcp add @easynodexyz/mcp-x402 -- npx @easynodexyz/mcp-x402
```

Or manually add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "easy-node": {
      "command": "npx",
      "args": ["@easynodexyz/mcp-x402"]
    }
  }
}
```

**Config file locations:**

- **macOS/Linux**: `~/.claude/settings.json`
- **Windows**: `%USERPROFILE%\.claude\settings.json`

---

### Cursor

Add to your Cursor settings (`.cursor/mcp.json` in your project or global config):

```json
{
  "mcpServers": {
    "@easynodexyz/mcp-x402": {
      "command": "npx",
      "args": ["@easynodexyz/mcp-x402"]
    }
  }
}
```

**Config file locations:**

- **Project**: `.cursor/mcp.json` in project root
- **Global macOS**: `~/.cursor/mcp.json`
- **Global Windows**: `%USERPROFILE%\.cursor\mcp.json`

---

### VS Code + Continue

Add to your Continue configuration (`~/.continue/config.json`):

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["@easynodexyz/mcp-x402"]
        }
      }
    ]
  }
}
```

---

### Other MCP-Compatible Tools

For any MCP-compatible tool, use this stdio transport configuration:

| Field     | Value                       |
| --------- | --------------------------- |
| Command   | `npx`                       |
| Args      | `["@easynodexyz/mcp-x402"]` |
| Transport | `stdio`                     |

With environment variables:

```json
{
  "command": "npx",
  "args": ["@easynodexyz/mcp-x402"],
  "env": {
    "EASYNODE_PRIVATE_KEY": "0x...",
    "EASYNODE_API_URL": "..."
  }
}
```

---

### 3. Restart Your IDE

Restart to load the MCP server.

### 4. Use It

Ask your AI assistant:

- "List available VPS products"
- "Purchase 1 month of the VPS-XS product"
- "Check the status of order abc123"
- "List my instances"
- "Get connection details for instance xyz"
- "Renew instance xyz for 3 months"

## Configuration

### Environment Variables

| Variable                | Required | Default                  | Description                |
| ----------------------- | -------- | ------------------------ | -------------------------- |
| `EASYNODE_PRIVATE_KEY` | Yes      | -                        | Wallet private key (0x...) |
| `EASYNODE_API_URL`     | No       | https://api.easy-node.xyz | API base URL               |
| `EASYNODE_MAX_PAYMENT` | No       | 100                      | Max USDC per transaction   |

### Config Resolution Order

Configuration is loaded from multiple sources (later overrides earlier):

1. `~/.easy-node/.env` - Global config
2. `./.env` - Project-level config
3. Environment variables - Highest priority

### Alternative: Manual Configuration

Instead of running setup, you can configure manually:

**Option A: Pass env vars in MCP config**

```json
{
  "mcpServers": {
    "easy-node": {
      "command": "npx",
      "args": ["@easynodexyz/mcp-x402"],
      "env": {
        "EASYNODE_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

**Option B: Create config file manually**

Create `~/.easy-node/.env`:

```
EASYNODE_PRIVATE_KEY=0x...
EASYNODE_API_URL=https://api.easy-node.xyz
EASYNODE_MAX_PAYMENT=1000
```

## MCP Tools

### list_products

List available VPS and blockchain node products with USDC pricing.

**Parameters:**

- `category` (optional): Filter by `"vps"` or `"node"`

**Example:**

```
List all VPS products available for purchase
```

### create_order

Purchase a product using USDC on Base. Handles x402 payment automatically.

**Parameters:**

- `productId` (required): Product ID to purchase
- `period` (required): Subscription period in months
- `quantity` (optional): Number of instances (default: 1)
- `customName` (optional): Custom name for the instance (max 100 characters)

**Example:**

```
Purchase 3 months of product abc123
```

### get_order

Check the status of an existing order.

**Parameters:**

- `orderId` (required): Order ID to look up

**Example:**

```
Check status of order xyz789
```

### list_instances

List all instances owned by the wallet.

**Example:**

```
List all my instances
```

### get_instance

Get detailed instance information including connection details.

**Parameters:**

- `instanceId` (required): Instance ID to look up
- `type` (required): Instance type (`"node"` or `"vps"`)

**Example:**

```
Get connection details for VPS instance abc123
```

### renew_instance

Renew an existing instance subscription.

**Parameters:**

- `instanceId` (required): Instance ID to renew
- `period` (required): Renewal period in months
- `type` (required): Instance type (`"node"` or `"vps"`)

**Example:**

```
Renew my VPS instance abc123 for 3 months
```

### update_custom_name

Set or update the custom name of an instance.

**Parameters:**

- `instanceId` (required): Instance ID to update
- `type` (required): Instance type (`"node"` or `"vps"`)
- `customName` (required): Custom name (max 100 characters)

**Example:**

```
Rename instance abc123 to "my-validator"
```

## Security

- **Private keys** are stored with 600 permissions (owner read/write only)
- **Max payment limit** prevents accidental large transactions
- Wallet only signs EIP-3009 TransferWithAuthorization for USDC

## How x402 Works

1. Agent calls `create_order` with product details
2. First request returns HTTP 402 with payment requirements
3. Client signs USDC transfer authorization (EIP-3009)
4. Retry with payment signature
5. Server verifies, settles on-chain, creates order
6. Order returned to agent

## Troubleshooting

### "EASYNODE_PRIVATE_KEY is required"

Run `npx @easynodexyz/mcp-x402 setup` or set the environment variable.

### "Payment amount exceeds maximum"

Increase `EASYNODE_MAX_PAYMENT` in your config or env vars.

### "402 response missing payment-required header"

The API endpoint may not support x402. Check you're using the correct API URL.

### MCP server not appearing in IDE

1. Verify the config file location is correct for your OS
2. Check JSON syntax is valid
3. Restart the IDE completely (not just reload)
4. Check IDE logs for MCP connection errors

## Contributing

Found a bug or have a feature request? Please open an issue at [github.com/easynodexyz/mcp-x402/issues](https://github.com/easynodexyz/mcp-x402/issues).

## Links

- [Easy Node](https://easy-node.xyz)
- [x402 Protocol](https://www.x402.org/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Base Network](https://base.org/)

## License

BUSL-1.1
