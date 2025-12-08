---
description: Analyze and optimize smart contract gas usage
argument-hint: contract (IndividualPool|CooperativePool|YieldAggregator|all)
---

# Gas Optimization Analysis

Analyze KhipuVault smart contracts for gas optimization opportunities.

## Analysis Steps

1. Run gas report:

   ```bash
   cd packages/contracts && forge test --gas-report
   ```

2. Identify expensive operations:
   - Storage reads/writes (SLOAD/SSTORE)
   - External calls
   - Loop iterations
   - Memory allocations

3. Check for common optimizations:
   - Use `calldata` instead of `memory` for read-only arrays
   - Pack struct variables (uint256 vs uint128)
   - Use `unchecked` for safe arithmetic
   - Cache storage variables in memory
   - Use `++i` instead of `i++`
   - Short-circuit conditions
   - Use events instead of storage for historical data

4. Review function visibility:
   - `external` vs `public` for external-only functions
   - `view` and `pure` modifiers

Report current gas costs and provide specific optimization recommendations with estimated savings.
