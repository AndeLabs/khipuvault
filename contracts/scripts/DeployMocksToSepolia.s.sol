// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "forge-std/Script.sol";
import "../test/mocks/MockIndividualPool.sol";
import "../test/mocks/MockMUSD.sol";

/**
 * @title DeployMocksToSepolia
 * @notice Deploy mock contracts to Sepolia testnet for public testing
 * @dev Run with: forge script scripts/DeployMocksToSepolia.s.sol --rpc-url $SEPOLIA_RPC --broadcast --verify
 */
contract DeployMocksToSepolia is Script {
    function run() external {
        // Get deployer from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOYING MOCK CONTRACTS TO SEPOLIA ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockMUSD
        console.log("\n1. Deploying MockMUSD...");
        MockMUSD musd = new MockMUSD();
        console.log("MockMUSD deployed at:", address(musd));

        // 2. Mint MUSD to deployer for testing
        musd.mintPublic(10000000 * 1e18); // 10M MUSD
        console.log("Minted 10M MUSD to deployer");

        // 3. Deploy MockIndividualPool
        console.log("\n2. Deploying MockIndividualPool...");
        MockIndividualPool pool = new MockIndividualPool(
            address(musd),
            deployer // Fee collector
        );
        console.log("MockIndividualPool deployed at:", address(pool));

        // 4. Transfer MUSD to pool for yield payouts
        musd.transfer(address(pool), 1000000 * 1e18); // 1M MUSD
        console.log("Transferred 1M MUSD to pool for yields");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("\n🔥 UPDATE YOUR FRONTEND:");
        console.log("\nIn frontend/src/contracts/addresses.ts, add a SEPOLIA configuration:");
        console.log("\nconst SEPOLIA_ADDRESSES: ContractAddresses = {");
        console.log("  individualPool: '", address(pool), "' as Address,");
        console.log("  mezoContracts: {");
        console.log("    musdToken: '", address(musd), "' as Address,");
        console.log("  }");
        console.log("};");
        
        console.log("\n🌐 Users can now test with ANY wallet on Sepolia!");
        console.log("No need for localhost or specific private keys.");
    }
}
