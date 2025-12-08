---
name: mezo-blockchain
description: Mezo blockchain expertise - testnet RPC, contract addresses, chain configuration, and Mezo-specific patterns for Bitcoin DeFi
---

# Mezo Blockchain Knowledge

This skill provides specialized knowledge about the Mezo blockchain ecosystem for Bitcoin DeFi applications.

## Network Configuration

### Mezo Testnet

- **Chain ID**: 31611
- **RPC URL**: https://rpc.test.mezo.org
- **Block Explorer**: https://explorer.test.mezo.org
- **Native Token**: BTC (wrapped)

### Contract Addresses (KhipuVault)

| Contract        | Address                                    |
| --------------- | ------------------------------------------ |
| IndividualPool  | 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 |
| CooperativePool | 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88 |
| MezoIntegration | 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |
| MUSD            | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |

## Mezo-Specific Patterns

### Transaction Handling

- Mezo uses Bitcoin as base layer
- Gas is paid in wrapped BTC
- Block times: ~10 seconds
- Finality: 6 confirmations recommended

### Staking Integration

The MezoIntegration contract interfaces with Mezo's native staking system for yield generation.

### MUSD Stablecoin

- Mezo's native stablecoin
- Used for stable savings options
- Backed by Bitcoin collateral

## Code Examples

### Viem Client Configuration

```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";

export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.test.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" },
  },
});

export const publicClient = createPublicClient({
  chain: mezoTestnet,
  transport: http(),
});
```

### Wagmi Configuration

```typescript
import { http, createConfig } from "wagmi";
import { mezoTestnet } from "./chains";

export const config = createConfig({
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http("https://rpc.test.mezo.org"),
  },
});
```

### Contract Read (Viem)

```typescript
import { INDIVIDUAL_POOL_ABI, INDIVIDUAL_POOL_ADDRESS } from "@khipu/web3";

const userDeposit = await publicClient.readContract({
  address: INDIVIDUAL_POOL_ADDRESS,
  abi: INDIVIDUAL_POOL_ABI,
  functionName: "getUserDeposit",
  args: [userAddress],
});
```

### Contract Write (Wagmi)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

export function useDeposit() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const deposit = (amount: string) => {
    writeContract({
      address: INDIVIDUAL_POOL_ADDRESS,
      abi: INDIVIDUAL_POOL_ABI,
      functionName: "deposit",
      value: parseEther(amount),
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 6, // Mezo recommended confirmations
  });

  return { deposit, isPending, isConfirming, isSuccess };
}
```

### ethers.js Provider (Indexer)

```typescript
import { JsonRpcProvider, Contract } from "ethers";
import { INDIVIDUAL_POOL_ABI, INDIVIDUAL_POOL_ADDRESS } from "@khipu/web3";

const provider = new JsonRpcProvider("https://rpc.test.mezo.org", {
  chainId: 31611,
  name: "mezo-testnet",
});

const contract = new Contract(
  INDIVIDUAL_POOL_ADDRESS,
  INDIVIDUAL_POOL_ABI,
  provider,
);

// Listen for events
contract.on("Deposit", (user, amount, event) => {
  console.log(`Deposit: ${user} deposited ${amount}`);
});
```

### RPC Direct Call (curl)

```bash
# Get current block number
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get contract balance
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393","latest"],"id":1}'
```

### Foundry Deployment Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";

contract DeployMezo is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IndividualPool pool = new IndividualPool();

        vm.stopBroadcast();
    }
}
```

```bash
# Deploy to Mezo Testnet
forge script script/DeployMezo.s.sol:DeployMezo \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  --verify
```

## Best Practices

### Transaction Confirmation

- Wait for 6+ confirmations for finality
- Monitor for chain reorgs
- Use event-based confirmation tracking

### Gas Handling

- Mezo uses BTC for gas (wrapped)
- Gas prices typically lower than Ethereum mainnet
- Always estimate gas before transactions

### Error Handling

```typescript
try {
  await contract.deposit({ value: parseEther("0.1") });
} catch (error) {
  if (error.code === "INSUFFICIENT_FUNDS") {
    // Handle insufficient BTC for gas
  } else if (error.code === "NETWORK_ERROR") {
    // Handle RPC connectivity issues
  }
}
```
