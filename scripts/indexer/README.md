# WAGDIE Transfer Indexer

Real-time WebSocket-based indexer that listens for ERC721 Transfer events on the WAGDIE contract and updates `owner_address` in the `wagdie_characters` database table.

## Features

- **WebSocket subscription** for real-time Transfer events
- **Backfill** from last indexed block on startup
- **State persistence** to resume after restarts
- **Exponential backoff** reconnection (1s → 60s max)
- **Graceful shutdown** on SIGINT/SIGTERM

## Prerequisites

- Node.js 18+
- WebSocket RPC endpoint (Alchemy, Infura, or self-hosted)
- Database access (Supabase credentials in `.env`)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WS_RPC_URL` | Yes | - | WebSocket RPC endpoint (e.g., `wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`) |
| `HTTP_RPC_URL` | No | Uses WS | HTTP RPC endpoint for backfill (recommended for reliability) |
| `START_BLOCK` | No | `0` | Block to start from if no state file exists |
| `STATE_FILE` | No | `scripts/indexer/state.json` | Path to state persistence file |
| `CHAIN_ID` | No | `1` | Ethereum chain ID (1 = mainnet, 11155111 = sepolia) |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key (bypasses RLS) |

## Usage

### Development (with tsx)

```bash
# Set environment variables
export WS_RPC_URL="wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run directly with tsx
npx tsx scripts/indexer/transfer-indexer.ts
```

### Production (compiled)

```bash
# Build the project
npm run build

# Run compiled version
node dist/scripts/indexer/transfer-indexer.js
```

### With PM2 (recommended for servers)

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'wagdie-indexer',
    script: 'npx',
    args: 'tsx scripts/indexer/transfer-indexer.ts',
    env: {
      WS_RPC_URL: 'wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
      HTTP_RPC_URL: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
      START_BLOCK: '15000000',
      SUPABASE_URL: 'https://your-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
    },
  }],
}

# Start with PM2
pm2 start ecosystem.config.js
```

## Recommended START_BLOCK

For a fresh start, use the WAGDIE contract deployment block to avoid processing unnecessary blocks:

- **Mainnet**: `15422334` (Aug 2022)
- **Sepolia**: Check contract deployment

## State File Format

The indexer persists its progress in a JSON file:

```json
{
  "chainId": 1,
  "contract": "0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a",
  "lastIndexedBlock": "21500000"
}
```

Delete this file to force a full re-index from `START_BLOCK`.

## One-Time Batch Sync

For the initial sync or catch-up, you can also use the existing batch sync endpoint:

```bash
# Trigger via API (requires SYNC_SECRET_KEY)
curl -X POST "https://your-domain.com/api/sync/ownership" \
  -H "Authorization: Bearer YOUR_SYNC_SECRET_KEY"
```

This uses multicall for efficient batch `ownerOf()` queries and is faster for large catch-ups.

## Logs

The indexer outputs timestamped logs:

```
[2024-01-15T10:30:00.000Z] Loaded state at block 21500000
[2024-01-15T10:30:01.000Z] No backfill needed (from 21500001 > latest 21500000)
[2024-01-15T10:30:01.000Z] Live Transfer watch started
[2024-01-15T10:30:01.000Z] Transfer indexer running
[2024-01-15T10:30:15.000Z] Processed 1 live transfers
```

## Troubleshooting

### WebSocket disconnects frequently

- Use a reliable RPC provider with WebSocket support
- Set `HTTP_RPC_URL` for backfill to avoid WS timeouts on large ranges
- Check your provider's rate limits

### Missing transfers after restart

- Ensure the state file is persisted (not on ephemeral storage)
- The indexer backfills from `lastIndexedBlock + 1` on startup

### Database updates failing

- Verify `SUPABASE_SERVICE_ROLE_KEY` has write access
- Check that `wagdie_characters` table exists with `owner_address` column
