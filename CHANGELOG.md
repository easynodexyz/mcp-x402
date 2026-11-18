# @easynodexyz/mcp-x402

## 0.3.0

### Minor Changes

- 8626d55: Requires Node.js 22.12 or later. Upgrades `@modelcontextprotocol/sdk` (1.32.2), `zod` (4.6.7), `express` (5.3.0), `viem` (2.57.20), `dotenv` (18, its load message now goes to stderr instead of stdout) and `commander` (15): no known vulnerability left in runtime dependencies.

## 0.2.0

### Minor Changes

- fbcda73: `create_order` accepts `region` and `addOns`, and `list_products` shows each product's regions and add-ons with their extra monthly price.

## 0.1.4

### Patch Changes

- 3e0b031: Restrict `create_order` period to 1, 3 or 6 months to match the API validation.
- b7bb228: `list_products` shows each period as `N month(s): $X.XX total ($Y.YY/month)` and replaces every `{br}` marker in product texts.

## 0.1.3

### Patch Changes

- 0e6ebc7: Discovery methods (initialize, notifications/initialized, tools/list) no longer require the X-Easynode-Private-Key header

## 0.1.2

### Patch Changes

- 15be50f: Fix default API endpoint

## 0.1.1

### Patch Changes

- 7e8ca94: Fix library export

## 0.1.0

### Minor Changes

- 959a791: Enables AI agents to purchase VPS and blockchain node products via Easy Node's x402 API with USDC on Base.
  Secured with ECIES encryption/decryption.

  Product browsing — list available VPS and node products with USDC pricing
  x402 purchases — automatic HTTP 402 payment flow with EIP-3009 TransferWithAuthorization
  Order tracking — check order status and delivery progress
  Instance management — list, view details, renew, and rename instances
