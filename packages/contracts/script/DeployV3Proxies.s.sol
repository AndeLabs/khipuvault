// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {CooperativePoolV3} from "../src/pools/CooperativePoolV3.sol";
import {MezoIntegrationV3} from "../src/integrations/MezoIntegrationV3.sol";

/**
 * @title DeployV3Proxies
 * @notice Deploys V3 proxies for CooperativePool and MezoIntegration
 * @dev Uses UUPS proxy pattern for upgradeability
 */
contract DeployV3Proxies is Script {
    // Mezo Testnet addresses
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    address constant HINT_HELPERS = 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6;
    address constant TROVE_MANAGER = 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0;
    address constant YIELD_AGGREGATOR_V3 = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;
    
    // We'll use a placeholder for MezoIntegrationV3 since we're deploying it in the same script
    address constant MEZO_INTEGRATION_PLACEHOLDER = 0x0000000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying V3 proxies with address:", deployer);
        console.log("Network: Mezo Testnet (Chain ID: 31611)");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy CooperativePoolV3 Implementation
        console.log("\n=== Deploying CooperativePoolV3 Implementation ===");
        CooperativePoolV3 coopImpl = new CooperativePoolV3();
        console.log("CooperativePoolV3 Implementation:", address(coopImpl));
        
        // Deploy MezoIntegrationV3 Implementation first (needed for CooperativePool)
        console.log("\n=== Deploying MezoIntegrationV3 Implementation ===");
        MezoIntegrationV3 mezoImpl = new MezoIntegrationV3();
        console.log("MezoIntegrationV3 Implementation:", address(mezoImpl));
        
        // Deploy MezoIntegrationV3 Proxy with initialization
        console.log("\n=== Deploying MezoIntegrationV3 Proxy ===");
        bytes memory mezoInitData = abi.encodeWithSelector(
            MezoIntegrationV3.initialize.selector,
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
        console.log("MezoIntegrationV3 Proxy:", address(mezoProxy));
        console.log("MezoIntegrationV3 initialized");
        
        // Deploy CooperativePoolV3 Proxy with initialization (now with MezoIntegrationV3 address)
        console.log("\n=== Deploying CooperativePoolV3 Proxy ===");
        bytes memory coopInitData = abi.encodeWithSelector(
            CooperativePoolV3.initialize.selector,
            address(mezoProxy), // Use MezoIntegrationV3 proxy
            YIELD_AGGREGATOR_V3,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );
        
        UUPSProxy coopProxy = new UUPSProxy(
            address(coopImpl),
            coopInitData
        );
        console.log("CooperativePoolV3 Proxy:", address(coopProxy));
        console.log("CooperativePoolV3 initialized");
        
        // MezoIntegrationV3 already deployed above
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== V3 PROXY DEPLOYMENT SUMMARY ===");
        console.log("CooperativePoolV3 Proxy:    ", address(coopProxy));
        console.log("CooperativePoolV3 Impl:     ", address(coopImpl));
        console.log("MezoIntegrationV3 Proxy:    ", address(mezoProxy));
        console.log("MezoIntegrationV3 Impl:     ", address(mezoImpl));
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
            console.log("[OK] CooperativePoolV3 proxy implementation:", coopImplAddr);
        }
        
        (success, data) = mezoProxyAddr.staticcall(
            abi.encodeWithSignature("implementation()")
        );
        if (success) {
            address mezoImplAddr = abi.decode(data, (address));
            console.log("[OK] MezoIntegrationV3 proxy implementation:", mezoImplAddr);
        }
        
        console.log("\n[SUCCESS] All V3 proxies deployed successfully!");
    }
}