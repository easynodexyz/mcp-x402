---
'@easynodexyz/mcp-x402': minor
---

Moves to MCP TypeScript SDK v2 (`@modelcontextprotocol/server` 2.4.0). stdio uses `serveStdio` and the HTTP transport uses `createMcpHandler` on `node:http`, so both serve 2025-era and 2026-07-28 clients; express is no longer a dependency.

Library changes: `createMcpServer(client, serverInfo)` now takes the server name and version and returns an SDK v2 `McpServer`; `runServer(serverInfo)` likewise; `runHttpServer` is no longer exported from the package entry (the CLI still serves `--transport http`).
