---
name: solidity-gas
description: Solidity gas optimization techniques - storage patterns, memory vs calldata, assembly tricks, and EVM cost analysis
---

# Solidity Gas Optimization

This skill provides expertise in optimizing Solidity smart contracts for minimal gas consumption.

## Storage Optimization

### Pack Variables

```solidity
// Bad: 3 storage slots (96 bytes)
uint256 a;  // slot 0
uint128 b;  // slot 1
uint128 c;  // slot 2

// Good: 2 storage slots (64 bytes)
uint256 a;  // slot 0
uint128 b;  // slot 1 (first half)
uint128 c;  // slot 1 (second half)
```

### Use Mappings vs Arrays

```solidity
// Mapping: O(1) access, can't iterate
mapping(address => uint256) balances;

// Array: O(n) search, can iterate
// Use when you need to enumerate all items
address[] users;
```

## Memory vs Calldata

```solidity
// Calldata: Read-only, cheapest (for external functions)
function process(uint256[] calldata data) external {
    // data cannot be modified
}

// Memory: Mutable, more expensive
function transform(uint256[] memory data) public returns (uint256[] memory) {
    data[0] = 0; // Can modify
    return data;
}
```

## Loop Optimizations

```solidity
// Bad
for (uint256 i = 0; i < array.length; i++) {
    // array.length read every iteration
}

// Good
uint256 len = array.length;
for (uint256 i = 0; i < len; ) {
    // ...
    unchecked { ++i; } // Safe, can't overflow
}
```

## Common Patterns

### Cache Storage Reads

```solidity
// Bad: 2 SLOADs
if (balance[msg.sender] > 0) {
    transfer(balance[msg.sender]);
}

// Good: 1 SLOAD
uint256 bal = balance[msg.sender];
if (bal > 0) {
    transfer(bal);
}
```

### Short-Circuit Conditions

```solidity
// Put cheap checks first
require(amount > 0 && balanceOf(msg.sender) >= amount);
//       ^cheap           ^expensive SLOAD
```

### Use Events for Historical Data

```solidity
// Don't store history on-chain
// Instead, emit events and index off-chain
event Transfer(address indexed from, address indexed to, uint256 amount);
```

## Gas Costs Reference

| Operation            | Gas Cost                  |
| -------------------- | ------------------------- |
| SSTORE (0→non-0)     | 20,000                    |
| SSTORE (non-0→non-0) | 5,000                     |
| SSTORE (non-0→0)     | Refund 15,000             |
| SLOAD                | 2,100 (cold) / 100 (warm) |
| MLOAD/MSTORE         | 3                         |
| ADD/SUB              | 3                         |
| MUL/DIV              | 5                         |
| External call        | 2,600+                    |

## Analysis Commands

```bash
forge test --gas-report
forge snapshot
forge snapshot --diff
```
