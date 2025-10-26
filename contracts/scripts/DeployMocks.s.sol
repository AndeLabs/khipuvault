// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "forge-std/Script.sol";
import "../test/mocks/MockIndividualPool.sol";
import "../test/mocks/MockMUSD.sol";

/**
 * @title DeployMocks
 * @notice Deploy mock contracts for local testing
 * @dev Run with: forge script scripts/DeployMocks.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract DeployMocks is Script {
    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOYING MOCK CONTRACTS ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockMUSD
        console.log("\n1. Deploying MockMUSD...");
        MockMUSD musd = new MockMUSD();
        console.log("MockMUSD deployed at:", address(musd));

        // 2. Mint some MUSD to deployer for testing
        musd.mintPublic(1000000 * 1e18); // 1M MUSD
        console.log("Minted 1M MUSD to deployer");

        // 3. Deploy MockIndividualPool
        console.log("\n2. Deploying MockIndividualPool...");
        MockIndividualPool pool = new MockIndividualPool(
            address(musd),
            deployer // Fee collector
        );
        console.log("MockIndividualPool deployed at:", address(pool));

        // 4. Transfer some MUSD to pool for yield payouts
        musd.transfer(address(pool), 100000 * 1e18); // 100k MUSD
        console.log("Transferred 100k MUSD to pool for yields");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("\nContract Addresses:");
        console.log("MockMUSD:", address(musd));
        console.log("MockIndividualPool:", address(pool));
        
        console.log("\nUpdate your frontend/src/contracts/addresses.ts:");
        console.log("individualPool: '", address(pool), "' as Address");
        console.log("musdToken: '", address(musd), "' as Address");
    }
}
