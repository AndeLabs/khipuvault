---
name: foundry
description: Foundry (Forge) smart contract development - testing, deployment scripts, verification, and gas reporting
---

# Foundry Smart Contract Development

This skill provides expertise in Foundry for Solidity development.

## Project Structure

```
packages/contracts/
├── src/                  # Contract source files
│   ├── pools/
│   ├── integrations/
│   └── interfaces/
├── test/                 # Test files (*.t.sol)
├── script/               # Deployment scripts (*.s.sol)
├── lib/                  # Dependencies (submodules)
├── foundry.toml          # Configuration
└── remappings.txt        # Import remappings
```

## Testing Patterns

### Basic Test Structure

```solidity
// test/IndividualPool.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";

contract IndividualPoolTest is Test {
    IndividualPool public pool;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    uint256 constant INITIAL_BALANCE = 100 ether;

    function setUp() public {
        vm.startPrank(owner);
        pool = new IndividualPool();
        vm.stopPrank();

        // Fund test accounts
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
    }

    function test_Deposit() public {
        uint256 amount = 1 ether;

        vm.prank(user1);
        pool.deposit{value: amount}();

        assertEq(pool.balanceOf(user1), amount);
        assertEq(address(pool).balance, amount);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be > 0");
        pool.deposit{value: 0}();
    }
}
```

### Fuzz Testing

```solidity
function testFuzz_Deposit(uint256 amount) public {
    // Bound input to reasonable range
    amount = bound(amount, 1, 10 ether);

    vm.prank(user1);
    pool.deposit{value: amount}();

    assertEq(pool.balanceOf(user1), amount);
}

function testFuzz_MultipleDeposits(uint256[3] memory amounts) public {
    uint256 total;
    for (uint i = 0; i < amounts.length; i++) {
        amounts[i] = bound(amounts[i], 0.01 ether, 1 ether);
        total += amounts[i];

        vm.prank(user1);
        pool.deposit{value: amounts[i]}();
    }

    assertEq(pool.balanceOf(user1), total);
}
```

### Event Testing

```solidity
function test_EmitDepositEvent() public {
    uint256 amount = 1 ether;

    vm.expectEmit(true, true, false, true);
    emit Deposited(user1, amount);

    vm.prank(user1);
    pool.deposit{value: amount}();
}
```

### Time-Based Testing

```solidity
function test_WithdrawAfterLockPeriod() public {
    uint256 amount = 1 ether;
    uint256 lockPeriod = 30 days;

    vm.prank(user1);
    pool.deposit{value: amount}();

    // Cannot withdraw before lock period
    vm.prank(user1);
    vm.expectRevert("Lock period not ended");
    pool.withdraw(amount);

    // Advance time past lock period
    vm.warp(block.timestamp + lockPeriod + 1);

    // Now withdrawal should succeed
    vm.prank(user1);
    pool.withdraw(amount);

    assertEq(pool.balanceOf(user1), 0);
}
```

## Deployment Scripts

### Basic Deployment

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IndividualPool pool = new IndividualPool();
        console.log("IndividualPool deployed to:", address(pool));

        vm.stopBroadcast();
    }
}
```

### UUPS Proxy Deployment

```solidity
// script/DeployProxy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IndividualPoolV1} from "../src/pools/IndividualPoolV1.sol";

contract DeployProxyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation
        IndividualPoolV1 implementation = new IndividualPoolV1();
        console.log("Implementation:", address(implementation));

        // Encode initializer call
        bytes memory data = abi.encodeCall(
            IndividualPoolV1.initialize,
            (deployer)
        );

        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            data
        );
        console.log("Proxy:", address(proxy));

        vm.stopBroadcast();
    }
}
```

## Commands Reference

```bash
# Build contracts
forge build

# Run all tests
forge test

# Run specific test file
forge test --match-path test/IndividualPool.t.sol

# Run specific test function
forge test --match-test test_Deposit

# Verbose output (-vv, -vvv, -vvvv for more)
forge test -vvv

# Gas report
forge test --gas-report

# Coverage report
forge coverage

# Format code
forge fmt

# Deploy to testnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# Verify existing contract
forge verify-contract \
  --chain-id 31611 \
  --compiler-version v0.8.20 \
  $CONTRACT_ADDRESS \
  src/pools/IndividualPool.sol:IndividualPool
```

## Configuration (foundry.toml)

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200
via_ir = false

[profile.default.fuzz]
runs = 256
max_test_rejects = 65536

[rpc_endpoints]
mezo_testnet = "https://rpc.test.mezo.org"

[etherscan]
mezo_testnet = { key = "${ETHERSCAN_API_KEY}" }
```

## Best Practices

- Use `makeAddr()` for creating test addresses with labels
- Use `bound()` for fuzz test input constraints
- Test both success and revert cases
- Use `vm.expectEmit()` to verify event emission
- Use `vm.warp()` for time-dependent tests
- Use `vm.roll()` for block-dependent tests
- Run gas reports before deployment
- Always verify contracts after deployment
