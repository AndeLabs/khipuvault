// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {StabilityPoolStrategy} from "../src/strategies/StabilityPoolStrategy.sol";

/**
 * @title DeployStabilityPoolStrategy
 * @notice Deployment script for Mezo Testnet using REAL Mezo contracts
 * @dev Run with: forge script script/DeployStabilityPoolStrategy.s.sol --rpc-url https://rpc.test.mezo.org --broadcast --verify
 */
contract DeployStabilityPoolStrategy is Script {
    
    // ============ MEZO TESTNET ADDRESSES (REAL CONTRACTS FROM @mezo-org/musd-contracts) ============
    address constant STABILITY_POOL = 0x1CCA7E410eE41739792eA0A24e00349Dd247680e;
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    
    // ============ DEPLOYMENT CONFIG ============
    uint256 constant PERFORMANCE_FEE = 100; // 1%
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("===========================================");
        console2.log("Deploying StabilityPoolStrategy to Mezo Testnet");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("Stability Pool:", STABILITY_POOL);
        console2.log("MUSD Token:", MUSD_TOKEN);
        console2.log("Performance Fee:", PERFORMANCE_FEE, "basis points");
        console2.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy StabilityPoolStrategy with REAL Mezo contracts
        StabilityPoolStrategy strategy = new StabilityPoolStrategy(
            STABILITY_POOL,      // Real Mezo Stability Pool
            MUSD_TOKEN,          // Real MUSD token
            deployer,            // Fee collector (deployer for now)
            PERFORMANCE_FEE      // 1% performance fee
        );
        
        vm.stopBroadcast();
        
        console2.log("===========================================");
        console2.log("DEPLOYMENT SUCCESSFUL!");
        console2.log("===========================================");
        console2.log("StabilityPoolStrategy:", address(strategy));
        console2.log("");
        console2.log("NEXT STEPS:");
        console2.log("1. Get MUSD from faucet: https://faucet.test.mezo.org");
        console2.log("2. Approve MUSD to strategy");
        console2.log("3. Deposit MUSD to start earning");
        console2.log("4. Monitor your position");
        console2.log("");
        console2.log("Strategy Address:", address(strategy));
        console2.log("===========================================");
    }
}
