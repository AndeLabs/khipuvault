# @khipu/web3

Shared Web3 package for KhipuVault monorepo.

## What's Inside

- **ABIs**: Auto-generated from contracts
- **Addresses**: Contract addresses for testnet/mainnet
- **Hooks**: React hooks for contract interactions (wagmi-based)
- **Client**: API client for backend services

## Usage

```typescript
import { TESTNET_ADDRESSES, useIndividualPool, khipuApi } from '@khipu/web3'

// In your React component
const { deposit, userInfo } = useIndividualPool()

// Call backend API
const portfolio = await khipuApi.getUserPortfolio('0x...')
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck
```

## Generate ABIs

Run from contracts package:
```bash
pnpm contracts:generate-abis
```
