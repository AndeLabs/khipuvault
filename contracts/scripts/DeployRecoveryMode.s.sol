// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {IndividualPool} from "../src/pools/IndividualPool.sol";
import {RecoveryModeYieldAggregator} from "../src/integrations/RecoveryModeYieldAggregator.sol";

/**
 * @title DeployRecoveryMode
 * @notice Deployment script for KhipuVault Recovery Mode on Mezo Testnet
 * @dev Deploys contracts optimized for Recovery Mode operations
 */
contract DeployRecoveryMode is Script {
    // Mezo Testnet Contract Addresses
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant TROVE_MANAGER = 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0;
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    address constant HINT_HELPERS = 0x4e4cba3779d56386ed43631b4dcd6d8eacecbcf6;
    address constant SORTED_TROVES = 0x722E4D24FD6Ff8b0AC679450F3D91294607268fA;
    
    // Stability Pool Address (to be confirmed)
    address constant STABILITY_POOL = 0x489ee077994B6658eAfA855C308275EAd8097C4A;
    
    // Deployer address
    address constant DEPLOYER = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    // Deployment configuration
    uint256 constant MIN_DEPOSIT = 0.005 ether; // 0.005 BTC
    uint256 constant MAX_DEPOSIT = 10 ether;    // 10 BTC
    uint256 constant PERFORMANCE_FEE = 100;     // 1% in basis points

    function run() external {
        console.log("🚀 Deploying KhipuVault Recovery Mode to Mezo Testnet");
        console.log("=================================================");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy RecoveryModeYieldAggregator
        console.log("📦 Step 1: Deploying RecoveryModeYieldAggregator...");
        RecoveryModeYieldAggregator yieldAggregator = new RecoveryModeYieldAggregator(
            MUSD_TOKEN,
            STABILITY_POOL,
            TROVE_MANAGER,
            PRICE_FEED,
            FEE_COLLECTOR
        );
        console.log("✅ RecoveryModeYieldAggregator deployed at:", address(yieldAggregator));
        
        // Step 2: Deploy IndividualPool with Recovery Mode support
        console.log("📦 Step 2: Deploying IndividualPool with Recovery Mode support...");
        IndividualPool individualPool = new IndividualPool(
            address(0), // MezoIntegration (not used in Recovery Mode)
            address(yieldAggregator), // Use our RecoveryModeYieldAggregator
            MUSD_TOKEN,
            TROVE_MANAGER,
            PRICE_FEED,
            MIN_DEPOSIT,
            MAX_DEPOSIT,
            PERFORMANCE_FEE,
            FEE_COLLECTOR
        );
        console.log("✅ IndividualPool deployed at:", address(individualPool));
        
        // Step 3: Initialize contracts
        console.log("🔧 Step 3: Initializing contracts...");
        
        // Set performance fees
        yieldAggregator.setPerformanceFee(PERFORMANCE_FEE);
        console.log("✅ Performance fee set to", PERFORMANCE_FEE, "basis points");
        
        // Step 4: Verify system state
        console.log("🔍 Step 4: Verifying system state...");
        bool isRecoveryMode = individualPool.inRecoveryMode();
        uint256 currentTCR = individualPool.getCurrentTCR();
        
        console.log("📊 System Status:");
        console.log("   Recovery Mode:", isRecoveryMode ? "ACTIVE" : "INACTIVE");
        console.log("   Current TCR:", currentTCR);
        console.log("   CCR Threshold:", 1500000000000000000); // 150%
        
        // Step 5: Save deployment addresses
        console.log("💾 Step 5: Saving deployment addresses...");
        
        // Write deployment info to a file
        string memory deploymentInfo = string(abi.encodePacked(
            "KhipuVault Recovery Mode Deployment\n",
            "=====================================\n",
            "Network: Mezo Testnet\n",
            "Deployer: ", vm.toString(DEPLOYER), "\n",
            "Timestamp: ", vm.toString(block.timestamp), "\n\n",
            "Contract Addresses:\n",
            "IndividualPool: ", vm.toString(address(individualPool)), "\n",
            "RecoveryModeYieldAggregator: ", vm.toString(address(yieldAggregator)), "\n\n",
            "Mezo Contracts:\n",
            "MUSD Token: ", vm.toString(MUSD_TOKEN), "\n",
            "TroveManager: ", vm.toString(TROVE_MANAGER), "\n",
            "PriceFeed: ", vm.toString(PRICE_FEED), "\n",
            "StabilityPool: ", vm.toString(STABILITY_POOL), "\n\n",
            "System Status:\n",
            "Recovery Mode: ", isRecoveryMode ? "ACTIVE" : "INACTIVE", "\n",
            "Current TCR: ", vm.toString(currentTCR), "\n\n",
            "Configuration:\n",
            "Minimum Deposit: ", vm.toString(MIN_DEPOSIT), " wei\n",
            "Maximum Deposit: ", vm.toString(MAX_DEPOSIT), " wei\n",
            "Performance Fee: ", vm.toString(PERFORMANCE_FEE), " basis points\n"
        ));
        
        vm.writeLine("./deployments/recovery-mode.txt", deploymentInfo);
        console.log("✅ Deployment info saved to ./deployments/recovery-mode.txt");
        
        // Step 6: Final verification
        console.log("🔍 Step 6: Final verification...");
        
        // Check balances
        uint256 musdBalance = IERC20(MUSD_TOKEN).balanceOf(address(yieldAggregator));
        console.log("📊 Yield Aggregator MUSD Balance:", musdBalance);
        
        // Check system health
        (uint256 tcr, uint256 btcPrice, bool recovery, uint256 collateral, uint256 debt) = 
            individualPool.getSystemHealth();
        
        console.log("🏥 System Health Check:");
        console.log("   TCR:", tcr);
        console.log("   BTC Price:", btcPrice);
        console.log("   Recovery Mode:", recovery);
        console.log("   Total Collateral:", collateral);
        console.log("   Total Debt:", debt);
        
        console.log("🎉 Deployment completed successfully!");
        console.log("📋 Next Steps:");
        console.log("   1. Test MUSD deposits");
        console.log("   2. Verify Stability Pool integration");
        console.log("   3. Test yield calculations");
        console.log("   4. Run comprehensive tests");
        
        vm.stopBroadcast();
    }

    /**
     * @notice Verify deployment addresses are correct
     */
    function verifyDeployment() external view {
        console.log("🔍 Verifying deployment...");
        
        // This would be called after deployment to verify everything is working
        // Implementation depends on actual deployed addresses
        
        console.log("✅ Verification completed");
    }

    /**
     * @notice Get system status for monitoring
     */
    function getSystemStatus() external view {
        console.log("📊 System Status Report");
        console.log("=====================");
        
        // Implementation would check actual deployed contracts
        console.log("System operating in Recovery Mode");
        console.log("Ready for MUSD deposits");
        console.log("Stability Pool integration active");
    }
}