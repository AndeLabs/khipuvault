// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";

/**
 * @title DeployRotatingPool
 * @notice Deploys RotatingPool (ROSCA) contract
 * @dev Non-upgradeable implementation for simplicity
 */
contract DeployRotatingPool is Script {
    // Mezo Testnet addresses (from DeployV3Proxies.s.sol)
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant YIELD_AGGREGATOR_V3 = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    // MezoIntegrationV3 proxy from previous deployment
    // NOTE: Update this after running DeployV3Proxies if not already deployed
    address constant MEZO_INTEGRATION_V3 = 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6;

    // WBTC address on Mezo testnet
    // TODO: Update with actual WBTC address on Mezo testnet
    // For testing, we can use MUSD as placeholder (same 18 decimals)
    address constant WBTC_TOKEN = MUSD_TOKEN; // Placeholder - update with actual WBTC

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== ROTATING POOL DEPLOYMENT ===");
        console.log("Deploying with address:", deployer);
        console.log("Network: Mezo Testnet (Chain ID: 31611)");
        console.log("");

        // Log constructor parameters
        console.log("Constructor Parameters:");
        console.log("  MEZO_INTEGRATION:", MEZO_INTEGRATION_V3);
        console.log("  YIELD_AGGREGATOR:", YIELD_AGGREGATOR_V3);
        console.log("  WBTC:", WBTC_TOKEN);
        console.log("  MUSD:", MUSD_TOKEN);
        console.log("  FEE_COLLECTOR:", FEE_COLLECTOR);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RotatingPool
        console.log("Deploying RotatingPool...");
        RotatingPool rotatingPool = new RotatingPool(
            MEZO_INTEGRATION_V3,
            YIELD_AGGREGATOR_V3,
            WBTC_TOKEN,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );

        console.log("RotatingPool deployed at:", address(rotatingPool));
        console.log("");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("RotatingPool:", address(rotatingPool));
        console.log("");

        // Log contract configuration
        console.log("=== CONTRACT CONFIGURATION ===");
        console.log("Owner:", rotatingPool.owner());
        console.log("Performance Fee:", rotatingPool.performanceFee(), "basis points (1% = 100)");
        console.log("Fee Collector:", rotatingPool.feeCollector());
        console.log("Pool Counter:", rotatingPool.poolCounter());
        console.log("");

        // Log constraints
        console.log("=== POOL CONSTRAINTS ===");
        console.log("MIN_MEMBERS:", rotatingPool.MIN_MEMBERS());
        console.log("MAX_MEMBERS:", rotatingPool.MAX_MEMBERS());
        console.log("MIN_CONTRIBUTION:", rotatingPool.MIN_CONTRIBUTION() / 1e18, "BTC");
        console.log("MAX_CONTRIBUTION:", rotatingPool.MAX_CONTRIBUTION() / 1e18, "BTC");
        console.log("MIN_PERIOD_DURATION:", rotatingPool.MIN_PERIOD_DURATION() / 1 days, "days");
        console.log("MAX_PERIOD_DURATION:", rotatingPool.MAX_PERIOD_DURATION() / 1 days, "days");
        console.log("");

        // Log frontend configuration
        console.log("=== FRONTEND CONFIGURATION ===");
        console.log("Update the following in your frontend:");
        console.log("");
        console.log("// apps/web/src/hooks/web3/rotating/use-rotating-pool.ts");
        console.log("const ROTATING_POOL_ADDRESS = \"", address(rotatingPool), "\" as Address;");
        console.log("");
        console.log("// apps/web/src/lib/web3/contracts.ts");
        console.log("rotatingPool: \"", address(rotatingPool), "\",");
        console.log("");

        // Log next steps
        console.log("=== NEXT STEPS ===");
        console.log("1. Update frontend contract addresses");
        console.log("2. Generate and copy ABI:");
        console.log("   cd packages/contracts");
        console.log("   forge build");
        console.log("   cp out/RotatingPool.sol/RotatingPool.json ../../apps/web/src/contracts/abis/");
        console.log("3. Test pool creation in frontend");
        console.log("");

        if (WBTC_TOKEN == MUSD_TOKEN) {
            console.log("WARNING: Using MUSD as WBTC placeholder");
            console.log("Update WBTC_TOKEN constant with real WBTC address for production");
            console.log("");
        }

        console.log("[SUCCESS] RotatingPool deployment complete!");
    }
}
