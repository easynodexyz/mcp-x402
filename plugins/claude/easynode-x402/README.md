# EasyNode x402 Plugin for Claude Code

AI agents need to provision infrastructure — servers, blockchain nodes — but purchasing requires wallet signatures, payment flows, and credential management. This plugin handles it all: browse products, pay with USDC on Base via the x402 protocol, and retrieve connection details, without leaving Claude Code.

## What's Included

This plugin provides:

- **MCP Server** — Connects Claude Code to Easy Node's x402 API for purchasing and managing VPS and blockchain node infrastructure

## Installation

### Plugin (recommended)

```bash
claude plugin marketplace add easynodexyz/mcp-x402
claude plugin install easynode-x402-plugin@easynode-marketplace
```

## Available Tools

### list_products

Browse available VPS and blockchain node products with USDC pricing.

```
Input: { category: "vps" }
Output: List of products with IDs, specs, pricing tiers, and remaining supply
```

### create_order

Purchase a product using USDC on Base. The x402 payment flow (EIP-3009 signing) is handled automatically.

```
Input: { productId: "abc123", period: 1, quantity: 1, customName: "my-server" }
Output: Order ID, status, and instance details
```

### get_order

Check the status of an existing order and its provisioning progress.

```
Input: { orderId: "order-xyz" }
Output: Order status (pending/completed/failed), product details, instance status
```

### list_instances

List all VPS and node instances owned by your wallet.

```
Input: {}
Output: Instance IDs, types, statuses, and subscription dates
```

### get_instance

Get connection details for a specific instance. Credentials are encrypted on the server and decrypted locally using your private key.

```
Input: { instanceId: "inst-123", type: "vps" }
Output: IP address, SSH port, admin username/password, and SSH command
```

### renew_instance

Extend an existing instance subscription with automatic USDC payment.

```
Input: { instanceId: "inst-123", period: 1, type: "vps" }
Output: Updated order with extended subscription period
```

### update_custom_name

Set or update a friendly label for an instance.

```
Input: { instanceId: "inst-123", type: "vps", customName: "production-api" }
Output: Confirmation with updated instance name
```

## Usage Examples

The plugin works when you ask Claude to manage infrastructure:

- "What VPS options are available on Easy Node?"
- "Buy the cheapest VPS for 1 month"
- "Check the status of my order"
- "List all my instances"
- "Get the SSH credentials for my VPS"
- "Renew my node subscription for 3 months"
- "Rename my instance to production-validator"

## Setup

The plugin requires `EASYNODE_PRIVATE_KEY` to be set as a **system environment variable**. Claude Code resolves plugin environment variables from your system shell, not from `~/.easy-node/.env`.

### macOS / Linux

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
export EASYNODE_PRIVATE_KEY=0x...
```

Then reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### Windows

```powershell
# PowerShell (persistent for current user)
[Environment]::SetEnvironmentVariable("EASYNODE_PRIVATE_KEY", "0x...", "User")
```

Or set it via **System Properties → Environment Variables**.

<Note>
`~/.easy-node/.env` is only read by the **local stdio server** (`npx @easynodexyz/mcp-x402`). The plugin uses the remote server, which receives the key via HTTP header from Claude Code's environment.
</Note>

## Configuration

The plugin uses the remote MCP server by default. Only `EASYNODE_PRIVATE_KEY` is required.

| Variable               | Required | Mode       | Description                                                               |
| ---------------------- | -------- | ---------- | ------------------------------------------------------------------------- |
| `EASYNODE_PRIVATE_KEY` | Yes      | Both       | Wallet private key (0x...). Sent as header for remote, env var for local. |
| `EASYNODE_API_URL`     | No       | Local only | API base URL (default: `https://api.easy-node.xyz/api`)                   |
| `EASYNODE_MAX_PAYMENT` | No       | Local only | Maximum USDC per transaction (default: `100`)                             |

The private key signs x402 payment authorizations and decrypts instance credentials locally.
