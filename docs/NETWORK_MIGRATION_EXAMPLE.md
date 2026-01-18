# Network Configuration Migration Examples

This document shows real-world examples of migrating from hardcoded addresses and RPC URLs to the new centralized configuration system.

## Example 1: Web3 Hook Migration

### Before (Hardcoded)

```typescript
// src/hooks/useIndividualPool.ts
import { useReadContract } from "wagmi";
import { INDIVIDUAL_POOL_ABI } from "@khipu/web3/abis";

const POOL_ADDRESS = "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393"; // Hardcoded testnet

export function usePoolBalance() {
  return useReadContract({
    address: POOL_ADDRESS,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: "getTotalDeposits",
  });
}
```

### After (Dynamic)

```typescript
// src/hooks/useIndividualPool.ts
import { useReadContract } from "wagmi";
import { INDIVIDUAL_POOL_ABI } from "@khipu/web3/abis";
import { getActiveContractAddress } from "@khipu/web3/addresses";

export function usePoolBalance() {
  // Automatically uses testnet or mainnet address based on NEXT_PUBLIC_NETWORK
  const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");

  return useReadContract({
    address: poolAddress as `0x${string}`,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: "getTotalDeposits",
  });
}
```

## Example 2: RPC Provider Configuration

### Before (Hardcoded)

```typescript
// packages/blockchain/src/provider.ts
import { ethers } from "ethers";

const RPC_URL = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;

export const provider = new ethers.JsonRpcProvider(RPC_URL, {
  chainId: CHAIN_ID,
  name: "mezo-testnet",
});
```

### After (Dynamic)

```typescript
// packages/blockchain/src/provider.ts
import { ethers } from "ethers";
import { getRpcUrl, getChainId, getNetworkName } from "@khipu/shared/config/network";

// Automatically selects RPC and chain ID based on NETWORK env var
export const provider = new ethers.JsonRpcProvider(getRpcUrl(), {
  chainId: getChainId(),
  name: getNetworkName().toLowerCase().replace(" ", "-"),
});
```

## Example 3: React Component with Network Display

### Before

```typescript
function NetworkStatus() {
  return (
    <div>
      <p>Chain: Mezo Testnet</p>
      <p>Chain ID: 31611</p>
    </div>
  );
}
```

### After

```typescript
import { getNetworkConfig } from "@khipu/shared/config/network";

function NetworkStatus() {
  const config = getNetworkConfig();

  return (
    <div>
      <p>Chain: {config.chainName}</p>
      <p>Chain ID: {config.chainId}</p>
      <p>Network: {config.network}</p>
      {config.isMainnet && (
        <span className="badge-mainnet">MAINNET</span>
      )}
    </div>
  );
}
```

## Example 4: Conditional Contract Deployment Check

```typescript
import { isContractDeployed, getActiveContractAddress } from "@khipu/web3/addresses";

function PoolInteraction() {
  const poolDeployed = isContractDeployed("INDIVIDUAL_POOL");

  if (!poolDeployed) {
    return (
      <div className="alert alert-warning">
        Individual Pool is not yet deployed on this network.
        Please switch to testnet or wait for mainnet deployment.
      </div>
    );
  }

  const poolAddress = getActiveContractAddress("INDIVIDUAL_POOL");

  return (
    <div>
      <p>Pool Address: {poolAddress}</p>
      {/* Pool interaction UI */}
    </div>
  );
}
```

## Example 5: Block Explorer Links

### Before (Manual URL Construction)

```typescript
function TransactionLink({ txHash }: { txHash: string }) {
  const explorerUrl = `https://explorer.test.mezo.org/tx/${txHash}`;

  return <a href={explorerUrl}>View Transaction</a>;
}
```

### After (Dynamic)

```typescript
import { getExplorerTxUrl } from "@khipu/shared/config/network";

function TransactionLink({ txHash }: { txHash: string }) {
  const explorerUrl = getExplorerTxUrl(txHash);

  return <a href={explorerUrl}>View Transaction</a>;
}
```

## Example 6: Backend API Network Configuration

### Before

```typescript
// apps/api/src/services/blockchain.ts
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc.test.mezo.org");

export async function getBlockNumber() {
  return await provider.getBlockNumber();
}
```

### After

```typescript
// apps/api/src/services/blockchain.ts
import { ethers } from "ethers";
import { getRpcUrl, getChainId } from "@khipu/shared/config/network";

const provider = new ethers.JsonRpcProvider(getRpcUrl(), {
  chainId: getChainId(),
});

export async function getBlockNumber() {
  return await provider.getBlockNumber();
}
```

## Example 7: Multi-Network Support in Tests

```typescript
// __tests__/network-switching.test.ts
import { getCurrentNetwork, getChainId, getRpcUrl } from "@khipu/shared/config/network";

describe("Network Configuration", () => {
  it("should use testnet by default", () => {
    expect(getCurrentNetwork()).toBe("testnet");
    expect(getChainId()).toBe(31611);
  });

  it("should switch to mainnet when env is set", () => {
    process.env.NETWORK = "mainnet";

    // Re-import to get fresh config
    jest.resetModules();
    const { getCurrentNetwork, getChainId } = require("@khipu/shared/config/network");

    expect(getCurrentNetwork()).toBe("mainnet");
    expect(getChainId()).toBe(31612);
  });
});
```

## Example 8: Environment-specific Configuration

### Development (.env.local)

```bash
NEXT_PUBLIC_NETWORK=testnet
```

### Staging (.env.staging)

```bash
NEXT_PUBLIC_NETWORK=mainnet
```

### Production (.env.production)

```bash
NEXT_PUBLIC_NETWORK=mainnet
```

## Example 9: Fallback RPC Configuration

```typescript
import { getAllRpcUrls, getRpcUrl } from "@khipu/shared/config/network";
import { ethers } from "ethers";

// Try primary RPC, fallback to alternatives
async function createProviderWithFallback() {
  const rpcUrls = getAllRpcUrls();

  for (const url of rpcUrls) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test connection
      console.log(`✓ Connected to RPC: ${url}`);
      return provider;
    } catch (error) {
      console.warn(`✗ Failed to connect to ${url}:`, error);
    }
  }

  throw new Error("All RPC endpoints failed");
}
```

## Example 10: Network-aware API Client

```typescript
// packages/web3/src/client/api.ts
import { getNetworkConfig } from "@khipu/shared/config/network";
import { getActiveContractAddress } from "@khipu/web3/addresses";

export class KhipuVaultAPI {
  private config = getNetworkConfig();

  async getPoolInfo(poolType: "INDIVIDUAL" | "COOPERATIVE") {
    const address = getActiveContractAddress(
      poolType === "INDIVIDUAL" ? "INDIVIDUAL_POOL" : "COOPERATIVE_POOL"
    );

    return {
      network: this.config.network,
      chainId: this.config.chainId,
      address,
      explorerUrl: `${this.config.explorerUrl}/address/${address}`,
    };
  }

  isMainnet() {
    return this.config.isMainnet;
  }
}

export const api = new KhipuVaultAPI();
```

## Quick Reference: Common Patterns

### Get Contract Address

```typescript
import { getActiveContractAddress } from "@khipu/web3/addresses";
const address = getActiveContractAddress("INDIVIDUAL_POOL");
```

### Get Network Info

```typescript
import { getNetworkConfig } from "@khipu/shared/config/network";
const config = getNetworkConfig();
```

### Check Network Type

```typescript
import { isMainnet, isTestnet } from "@khipu/shared/config/network";
if (isMainnet()) {
  // Mainnet-specific logic
}
```

### Get RPC URL

```typescript
import { getRpcUrl } from "@khipu/shared/config/network";
const rpc = getRpcUrl();
```

### Get Explorer URL

```typescript
import { getExplorerTxUrl, getExplorerAddressUrl } from "@khipu/shared/config/network";
const txUrl = getExplorerTxUrl(txHash);
const addrUrl = getExplorerAddressUrl(address);
```

## Testing Network Switching

1. **Switch to Testnet**

   ```bash
   # .env.local
   NEXT_PUBLIC_NETWORK=testnet
   pnpm dev
   ```

2. **Switch to Mainnet**

   ```bash
   # .env.local
   NEXT_PUBLIC_NETWORK=mainnet
   pnpm dev
   ```

3. **Verify in Browser Console**
   ```javascript
   import { getNetworkConfig } from "@khipu/shared/config/network";
   console.log(getNetworkConfig());
   ```
