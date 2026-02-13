# KhipuVault Auto-Applied Knowledge

> This knowledge is automatically applied by Claude when working on relevant tasks.
> No need to invoke skills manually - Claude will use this context as needed.

---

## Wagmi & Viem (Web3 Frontend)

### Reading Contract Data

```typescript
import { useReadContract, useReadContracts } from "wagmi";

// Single read with conditional fetching
const { data, isLoading, error } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "balanceOf",
  args: [userAddress],
  query: {
    enabled: !!userAddress,
    refetchInterval: 10000,
  },
});

// Multiple reads
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
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: bigint) => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
    });
  };

  return { deposit, isPending, isConfirming, isSuccess };
}
```

### Viem Utilities

```typescript
import { formatEther, parseEther, formatUnits, parseUnits, isAddress, getAddress } from "viem";

formatEther(1000000000000000000n); // "1"
parseEther("1"); // 1000000000000000000n
formatUnits(1000000n, 6); // "1" (USDC)
isAddress("0x..."); // Validate
getAddress("0x..."); // Checksum
```

---

## Prisma Database Patterns

### Blockchain Data Types

```prisma
model Transaction {
  id          String   @id @default(cuid())
  txHash      String   @unique
  blockNumber Int
  from        String
  to          String
  value       Decimal  @db.Decimal(78, 0)  // uint256 max
  gasUsed     BigInt
  timestamp   DateTime

  @@index([blockNumber])
  @@index([from])
  @@index([to])
}
```

### Idempotent Upserts

```typescript
await prisma.deposit.upsert({
  where: { txHash },
  create: { txHash, userId, amount, blockNumber },
  update: {}, // No update on duplicate
});
```

### Efficient Pagination

```typescript
// Cursor-based (recommended)
const items = await prisma.deposit.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { createdAt: "desc" },
});
```

### Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  await tx.deposit.create({ data: depositData });
  await tx.user.update({
    where: { id: user.id },
    data: { balance: { increment: amount } },
  });
});
```

---

## Solidity Gas Optimization

### Storage Packing

```solidity
// Good: 2 slots
uint256 a;   // slot 0
uint128 b;   // slot 1 (first half)
uint128 c;   // slot 1 (second half)
```

### Loop Optimization

```solidity
uint256 len = array.length;
for (uint256 i = 0; i < len; ) {
    // ...
    unchecked { ++i; }
}
```

### Cache Storage Reads

```solidity
uint256 bal = balance[msg.sender];  // 1 SLOAD
if (bal > 0) {
    transfer(bal);
}
```

### Gas Costs

| Operation               | Gas Cost                  |
| ----------------------- | ------------------------- |
| SSTORE (0 to non-0)     | 20,000                    |
| SSTORE (non-0 to non-0) | 5,000                     |
| SLOAD                   | 2,100 (cold) / 100 (warm) |
| External call           | 2,600+                    |

---

## OpenZeppelin Security Patterns

### Access Control

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Simple ownership
contract MyContract is Ownable {
    constructor() Ownable(msg.sender) {}
    function adminFunction() external onlyOwner { }
}

// Role-based
contract MyContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    function adminFunction() external onlyRole(ADMIN_ROLE) { }
}
```

### Reentrancy Protection

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // CEI Pattern: Checks-Effects-Interactions
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;  // Effect FIRST
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
    }
}
```

### Safe ERC20

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyContract {
    using SafeERC20 for IERC20;

    function deposit(IERC20 token, uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
    }
}
```

---

## Foundry Testing

### Test Structure

```solidity
import {Test, console} from "forge-std/Test.sol";

contract MyTest is Test {
    address public user1 = makeAddr("user1");

    function setUp() public {
        vm.deal(user1, 100 ether);
    }

    function test_Deposit() public {
        vm.prank(user1);
        pool.deposit{value: 1 ether}();
        assertEq(pool.balanceOf(user1), 1 ether);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be > 0");
        pool.deposit{value: 0}();
    }

    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, 1, 10 ether);
        vm.prank(user1);
        pool.deposit{value: amount}();
        assertEq(pool.balanceOf(user1), amount);
    }
}
```

### Commands

```bash
forge test                              # Run all tests
forge test -vvv                         # Verbose
forge test --match-test test_Deposit    # Specific test
forge test --gas-report                 # Gas report
forge coverage                          # Coverage
```

---

## Express.js API Patterns

### Route Structure

```typescript
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";

const router = Router();

const DepositSchema = z.object({
  amount: z.string().regex(/^\d+$/),
  poolType: z.enum(["INDIVIDUAL", "COOPERATIVE"]),
});

router.post("/deposit", authenticate, async (req, res, next) => {
  try {
    const data = DepositSchema.parse(req.body);
    const result = await PoolService.recordDeposit({
      ...data,
      userAddress: req.user.address,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
```

### Error Handling

```typescript
if (err instanceof ZodError) {
  return res.status(400).json({
    error: "Validation error",
    details: err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  });
}

if (err instanceof Prisma.PrismaClientKnownRequestError) {
  if (err.code === "P2002") return res.status(409).json({ error: "Already exists" });
  if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
}
```

---

## Mezo Blockchain

### Network Config

- **Chain ID**: 31611
- **RPC URL**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Native Token**: BTC (wrapped)

### Contract Addresses

| Contract        | Address                                    |
| --------------- | ------------------------------------------ |
| IndividualPool  | 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 |
| CooperativePool | 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88 |
| MezoIntegration | 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |
| MUSD            | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |

### Viem Chain Definition

```typescript
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
```

---

## React Query 5 Patterns

### Query Keys Factory

```typescript
export const queryKeys = {
  all: ["khipuvault"] as const,
  pools: () => [...queryKeys.all, "pools"] as const,
  pool: (address: string) => [...queryKeys.pools(), address] as const,
  userDeposits: (address: string) => [...queryKeys.all, "deposits", address] as const,
};
```

### Wagmi + React Query Integration

```typescript
export function useDeposit() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pools() });
    },
  });

  return { writeContract, isPending, isConfirming, isSuccess };
}
```

---

## Zod Validation

### Blockchain Schemas

```typescript
const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address")
  .transform((addr) => addr.toLowerCase() as `0x${string}`);

const TxHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

const BigIntStringSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((val) => BigInt(val));
```

### Pagination Schema

```typescript
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "amount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

### Type Inference

```typescript
type DepositRequest = z.infer<typeof DepositRequestSchema>;
```

---

## Security Checklist

- [ ] Use `Ownable` or `AccessControl` for admin functions
- [ ] Apply `nonReentrant` to external functions with transfers
- [ ] Use `SafeERC20` for token interactions
- [ ] Implement `Pausable` for emergencies
- [ ] Follow CEI pattern (Checks-Effects-Interactions)
- [ ] Emit events for all state changes
- [ ] Validate all inputs with Zod
- [ ] Never convert BigInt to Number for wei values
