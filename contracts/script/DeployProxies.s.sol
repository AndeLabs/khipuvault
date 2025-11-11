// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {CooperativePool} from "../src/pools/CooperativePool.sol";
import {MezoIntegration} from "../src/integrations/MezoIntegration.sol";

/**
 * @title DeployProxies
 * @notice Deploys proxies for CooperativePool and MezoIntegration
 * @dev Uses UUPS proxy pattern for upgradeability
 */
contract DeployProxies is Script {
    // Mezo Testnet addresses
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    address constant HINT_HELPERS = 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6;
    address constant TROVE_MANAGER = 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0;
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    // We'll use a placeholder for MezoIntegration since we're deploying it in the same script
    address constant MEZO_INTEGRATION_PLACEHOLDER = 0x0000000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying proxies with address:", deployer);
        console.log("Network: Mezo Testnet (Chain ID: 31611)");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CooperativePool Implementation
        console.log("\n=== Deploying CooperativePool Implementation ===");
        CooperativePool coopImpl = new CooperativePool();
        console.log("CooperativePool Implementation:", address(coopImpl));

        // Deploy MezoIntegration Implementation first (needed for CooperativePool)
        console.log("\n=== Deploying MezoIntegration Implementation ===");
        MezoIntegration mezoImpl = new MezoIntegration();
        console.log("MezoIntegration Implementation:", address(mezoImpl));

        // Deploy MezoIntegration Proxy with initialization
        console.log("\n=== Deploying MezoIntegration Proxy ===");
        bytes memory mezoInitData = abi.encodeWithSelector(
            MezoIntegration.initialize.selector,
            MUSD_TOKEN,
            BORROWER_OPERATIONS,
            PRICE_FEED,
            HINT_HELPERS,
            TROVE_MANAGER
        );
        
        UUPSProxy mezoProxy = new UUPSProxy(
            address(mezoImpl),
            mezoInitData
        );
        console.log("MezoIntegration Proxy:", address(mezoProxy));
        console.log("MezoIntegration initialized");

        // Deploy CooperativePool Proxy with initialization (now with MezoIntegration address)
        console.log("\n=== Deploying CooperativePool Proxy ===");
        bytes memory coopInitData = abi.encodeWithSelector(
            CooperativePool.initialize.selector,
            address(mezoProxy), // Use MezoIntegration proxy
            YIELD_AGGREGATOR,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );
        
        UUPSProxy coopProxy = new UUPSProxy(
            address(coopImpl),
            coopInitData
        );
        console.log("CooperativePool Proxy:", address(coopProxy));
        console.log("CooperativePool initialized");

        // MezoIntegration already deployed above

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== PROXY DEPLOYMENT SUMMARY ===");
        console.log("CooperativePool Proxy:    ", address(coopProxy));
        console.log("CooperativePool Impl:     ", address(coopImpl));
        console.log("MezoIntegration Proxy:    ", address(mezoProxy));
        console.log("MezoIntegration Impl:     ", address(mezoImpl));
        console.log("\n=== FRONTEND CONFIGURATION ===");
        console.log("NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=", address(coopProxy));
        console.log("NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS=", address(mezoProxy));
        
        // Verify implementations
        console.log("\n=== VERIFICATION ===");
        address coopProxyAddr = address(coopProxy);
        address mezoProxyAddr = address(mezoProxy);
        
        // Check if proxies point to correct implementations
        (bool success, bytes memory data) = coopProxyAddr.staticcall(
            abi.encodeWithSignature("implementation()")
        );
        if (success) {
            address coopImplAddr = abi.decode(data, (address));
            console.log("[OK] CooperativePool proxy implementation:", coopImplAddr);
        }

        (success, data) = mezoProxyAddr.staticcall(
            abi.encodeWithSignature("implementation()")
        );
        if (success) {
            address mezoImplAddr = abi.decode(data, (address));
            console.log("[OK] MezoIntegration proxy implementation:", mezoImplAddr);
        }

        console.log("\n[SUCCESS] All proxies deployed successfully!");
    }
}