# Network Configuration Guide

KhipuVault supports both Mezo Testnet and Mainnet through a centralized, environment-based configuration system.

## Quick Start

### Switch to Mainnet

1. Update your environment file:

   ```bash
   # apps/web/.env.local
   NEXT_PUBLIC_NETWORK=mainnet
   ```

2. Restart the application:
   ```bash
   pnpm dev
   ```

That's it! The application will automatically use mainnet RPC endpoints and contract addresses.

### Switch to Testnet

```bash
# apps/web/.env.local
NEXT_PUBLIC_NETWORK=testnet
```

Or simply omit the variable (testnet is the default).

## Architecture

### Central Configuration Files

#### 1. `/packages/shared/src/constants/chains.ts`

Defines chain specifications for both networks:

```typescript
export const MEZO_TESTNET = {
  id: 31611,
  name: "Mezo Testnet",
  rpcUrls: {
    default: { http: ["https://rpc.test.mezo.org"] },
  },
};

export const MEZO_MAINNET = {
  id: 31612,
  name: "Mezo",
  rpcUrls: {
    default: {
      http: [
        "https://rpc-http.mezo.boar.network",
        "https://mainnet.mezo.public.validationcloud.io",
        "https://rpc.mezo.org",
      ],
    },
  },
};
```

#### 2. `/packages/shared/src/config/network.ts`

Runtime configuration based on environment:

```typescript
import {
  getCurrentNetwork,
  getActiveChain,
  getChainId,
} from "@khipu/shared/config/network";

// Get current network
const network = getCurrentNetwork(); // "testnet" | "mainnet"

// Get active chain config
const chain = getActiveChain(); // MEZO_TESTNET or MEZO_MAINNET

// Get chain ID
const chainId = getChainId(); // 31611 or 31612

// Get RPC URL
const rpcUrl = getRpcUrl(); // Primary RPC for current network
```

#### 3. `/packages/web3/src/addresses/`

Contract addresses by network:

```typescript
// testnet.ts
export const TESTNET_ADDRESSES = {
  INDIVIDUAL_POOL: "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
  COOPERATIVE_POOL: "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88",
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  // ...
};

// mainnet.ts
export const MAINNET_ADDRESSES = {
  INDIVIDUAL_POOL: "0x0000000000000000000000000000000000000000", // Not deployed yet
  COOPERATIVE_POOL: "0x0000000000000000000000000000000000000000",
  MUSD: "0xdD468A1DDc392dcdbEf6db6d34E89AA338F9F186", // Official mainnet
  // ...
};
```

Usage:

```typescript
import { getActiveContractAddress } from "@khipu/web3/addresses";

// Get address for current network (from NEXT_PUBLIC_NETWORK)
const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");

// Or specify network explicitly
import { getContractAddress } from "@khipu/web3/addresses";
const mainnetPool = getContractAddress("mainnet", "INDIVIDUAL_POOL");
```

## Environment Variables

### Frontend (apps/web)

```bash
# .env.local
NEXT_PUBLIC_NETWORK=testnet  # or "mainnet"
```

### Backend (apps/api)

```bash
# .env
NETWORK=testnet  # or "mainnet"
```

### Blockchain Indexer (packages/blockchain)

```bash
# .env
NETWORK=testnet  # or "mainnet"
```

### Root

```bash
# .env
NETWORK=testnet  # or "mainnet"
```

## Network Details

### Mezo Testnet

- **Chain ID**: 31611
- **RPC**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Status**: Fully operational with deployed KhipuVault contracts

### Mezo Mainnet

- **Chain ID**: 31612
- **RPC URLs** (with fallback):
  1. https://rpc-http.mezo.boar.network (Boar)
  2. https://mainnet.mezo.public.validationcloud.io (Validation Cloud)
  3. https://rpc.mezo.org (Official)
- **Explorer**: https://explorer.mezo.org
- **Status**: Official MUSD contract deployed, KhipuVault contracts pending

#### Mainnet Contract Status

| Contract        | Address                                      | Status             |
| --------------- | -------------------------------------------- | ------------------ |
| MUSD            | `0xdD468A1DDc392dcdbEf6db6d34E89AA338F9F186` | Deployed           |
| IndividualPool  | `0x0000...`                                  | Pending deployment |
| CooperativePool | `0x0000...`                                  | Pending deployment |
| YieldAggregator | `0x0000...`                                  | Pending deployment |
| MezoIntegration | `0x0000...`                                  | Pending deployment |

## Usage Examples

### In React Components

```typescript
import { getActiveContractAddress, isContractDeployed } from "@khipu/web3/addresses";
import { getNetworkConfig } from "@khipu/shared/config/network";

function MyComponent() {
  const networkConfig = getNetworkConfig();
  const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");
  const isDeployed = isContractDeployed("INDIVIDUAL_POOL");

  return (
    <div>
      <p>Network: {networkConfig.chainName}</p>
      <p>Chain ID: {networkConfig.chainId}</p>
      {isDeployed ? (
        <p>Pool: {poolAddress}</p>
      ) : (
        <p>Pool not yet deployed on this network</p>
      )}
    </div>
  );
}
```

### In Web3 Hooks

```typescript
import { useReadContract } from "wagmi";
import { getActiveContractAddress } from "@khipu/web3/addresses";
import { INDIVIDUAL_POOL_ABI } from "@khipu/web3/abis";

function usePoolData() {
  const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");

  return useReadContract({
    address: poolAddress as `0x${string}`,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: "getTotalDeposits",
  });
}
```

### In Backend Services

```typescript
import { getRpcUrl, getChainId } from "@khipu/shared/config/network";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(getRpcUrl(), {
  chainId: getChainId(),
});
```

### In Blockchain Indexer

```typescript
import { getActiveContractAddress } from "@khipu/web3/addresses";
import { getProvider } from "./provider";

const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");
const contract = new ethers.Contract(
  poolAddress,
  INDIVIDUAL_POOL_ABI,
  getProvider(),
);
```

## Migration Guide

### From Legacy Environment Variables

**Before:**

```bash
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
```

**After:**

```bash
NEXT_PUBLIC_NETWORK=testnet
# All other values are derived automatically
```

### From Hardcoded Addresses

**Before:**

```typescript
const POOL_ADDRESS = "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393";
```

**After:**

```typescript
import { getActiveContractAddress } from "@khipu/web3/addresses";
const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");
```

## Deployment Checklist

### When Deploying to Mainnet

1. Deploy contracts to Mezo Mainnet
2. Update `/packages/web3/src/addresses/mainnet.ts`:
   ```typescript
   export const MAINNET_ADDRESSES = {
     INDIVIDUAL_POOL: "0xYourDeployedAddress",
     COOPERATIVE_POOL: "0xYourDeployedAddress",
     // ...
   };
   ```
3. Set environment variable:
   ```bash
   NEXT_PUBLIC_NETWORK=mainnet
   ```
4. Rebuild and deploy frontend:
   ```bash
   pnpm build
   ```

## Troubleshooting

### Contract Address Shows 0x0000...

This means the contract hasn't been deployed to the current network yet. Check:

1. Correct network is set in environment
2. Contract is actually deployed on that network
3. Address is updated in `/packages/web3/src/addresses/{network}.ts`

### RPC Connection Fails

Mainnet has multiple RPC endpoints with automatic fallback:

```typescript
import { getAllRpcUrls } from "@khipu/shared/config/network";

const rpcUrls = getAllRpcUrls();
// Try each URL in sequence
```

### Wrong Network Detected

Check environment variables are properly set and application restarted:

```bash
pnpm dev  # Restart development server
```

## API Reference

### @khipu/shared/config/network

- `getCurrentNetwork()` - Get active network ("testnet" | "mainnet")
- `getActiveChain()` - Get chain configuration
- `getChainId()` - Get chain ID (31611 | 31612)
- `getRpcUrl()` - Get primary RPC URL
- `getAllRpcUrls()` - Get all RPC URLs (for fallback)
- `getBlockExplorerUrl()` - Get block explorer URL
- `getExplorerAddressUrl(address)` - Get explorer URL for address
- `getExplorerTxUrl(txHash)` - Get explorer URL for transaction
- `isMainnet()` - Check if on mainnet
- `isTestnet()` - Check if on testnet
- `getNetworkConfig()` - Get complete configuration object

### @khipu/web3/addresses

- `getActiveContractAddress(contractName)` - Get address for current network
- `getContractAddress(network, contractName)` - Get address for specific network
- `getActiveAddresses()` - Get all addresses for current network
- `getNetworkAddresses(network)` - Get all addresses for specific network
- `isContractDeployed(contractName)` - Check if contract is deployed
- `getDeployedAddresses()` - Get only deployed contracts on current network

## Best Practices

1. **Always use helper functions** - Never hardcode addresses or RPC URLs
2. **Check deployment status** - Use `isContractDeployed()` before interacting with contracts
3. **Default to testnet** - Safer default for development
4. **Document mainnet deployments** - Update addresses immediately after deployment
5. **Test network switching** - Verify functionality on both networks before release

## Security Notes

- Environment variables are read at build time for frontend (Next.js)
- Defaults to testnet if `NEXT_PUBLIC_NETWORK` is not set or invalid
- Zero address (`0x0000...`) indicates contract not deployed
- Always verify contract addresses match official documentation before mainnet use
