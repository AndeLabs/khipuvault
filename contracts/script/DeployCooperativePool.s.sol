// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {CooperativePool} from "../src/pools/CooperativePool.sol";

contract DeployCooperativePool is Script {
    // Mezo Testnet addresses
    address constant MEZO_INTEGRATION_V3 = 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6;
    address constant YIELD_AGGREGATOR_V3 = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        console.log("===========================================");
        console.log("Deploying CooperativePool to Mezo Testnet");
        console.log("===========================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Implementation
        console.log("\n=== Deploying CooperativePool Implementation ===");
        CooperativePool impl = new CooperativePool();
        console.log("Implementation:", address(impl));
        
        // Deploy Proxy with initialization
        console.log("\n=== Deploying UUPS Proxy ===");
        bytes memory initData = abi.encodeWithSelector(
            CooperativePool.initialize.selector,
            MEZO_INTEGRATION_V3,
            YIELD_AGGREGATOR_V3,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );
        
        UUPSProxy proxy = new UUPSProxy(
            address(impl),
            initData
        );
        
        vm.stopBroadcast();
        
        console.log("===========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("===========================================");
        console.log("CooperativePool Implementation:", address(impl));
        console.log("CooperativePool Proxy:", address(proxy));
        console.log("");
        console.log("FRONTEND CONFIGURATION:");
        console.log("NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=", address(proxy));
        console.log("===========================================");
    }
}
