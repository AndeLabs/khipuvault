---
name: wagmi-viem
description: Wagmi 2.x and Viem 2.x expertise for React Web3 development - hooks, contract interactions, wallet connections, and transaction handling
---

# Wagmi & Viem Web3 Development

This skill provides expertise in building Web3 applications with Wagmi 2.x and Viem 2.x.

## Wagmi Hooks

### Reading Contract Data

```typescript
import { useReadContract } from "wagmi";

// Single read
const { data, isLoading, error } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "balanceOf",
  args: [userAddress],
  query: {
    enabled: !!userAddress, // Only fetch when address exists
    refetchInterval: 10000, // Auto-refresh every 10s
  },
});

// Multiple reads
import { useReadContracts } from "wagmi";

const { data } = useReadContracts({
  contracts: [
    { address, abi, functionName: "totalSupply" },
    { address, abi, functionName: "balanceOf", args: [user] },
  ],
});
```

### Writing to Contracts

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: bigint) => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
    });
  };

  return { deposit, isPending, isConfirming, isSuccess, error };
}
```

### Account & Connection

```typescript
import { useAccount, useConnect, useDisconnect } from "wagmi";

const { address, isConnected, isConnecting } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
```

## Viem Utilities

### Formatting

```typescript
import { formatEther, parseEther, formatUnits, parseUnits } from "viem";

formatEther(1000000000000000000n); // "1"
parseEther("1"); // 1000000000000000000n
formatUnits(1000000n, 6); // "1" (USDC)
parseUnits("1", 6); // 1000000n
```

### Address Handling

```typescript
import { isAddress, getAddress, isAddressEqual } from "viem";

isAddress("0x123..."); // Validate
getAddress("0x123..."); // Checksum
isAddressEqual(addr1, addr2); // Compare
```

## Best Practices

- Always handle loading and error states
- Use `enabled` option for conditional fetching
- Wait for transaction receipts before showing success
- Use Viem for pure functions (no React needed)
- Invalidate queries after successful transactions
