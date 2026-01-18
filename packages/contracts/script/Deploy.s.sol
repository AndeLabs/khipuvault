// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {YieldAggregatorV3} from "../src/integrations/v3/YieldAggregatorV3.sol";
import {MezoIntegrationV3} from "../src/integrations/v3/MezoIntegrationV3.sol";
import {IndividualPoolV3} from "../src/pools/v3/IndividualPoolV3.sol";
import {CooperativePoolV3} from "../src/pools/v3/CooperativePoolV3.sol";
import {LotteryPoolV3} from "../src/pools/v3/LotteryPoolV3.sol";

/**
 * @title Deploy
 * @notice Main deployment script for all KhipuVault V3 contracts
 * @dev Deploys in correct order with proper initialization
 *
 * Deployment Order:
 * 1. YieldAggregatorV3 (proxy + implementation)
 * 2. MezoIntegrationV3 (proxy + implementation)
 * 3. IndividualPoolV3 (proxy + implementation)
 * 4. CooperativePoolV3 (proxy + implementation)
 * 5. LotteryPoolV3 (proxy + implementation)
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
 *
 * Dry Run:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --dry-run
 */
contract Deploy is Script {
    // ===== MEZO TESTNET CONFIGURATION =====
    // Chain ID: 31611

    // Token addresses
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    // Mezo protocol addresses
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    address constant HINT_HELPERS = 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6;
    address constant TROVE_MANAGER = 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0;
    address constant STABILITY_POOL = 0x3dE27A95C5f2f636D11c9c6AF8d4F61aa55cc9E1;

    // Fee configuration
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    // Deployed contract addresses (will be set during deployment)
    address public yieldAggregatorProxy;
    address public mezoIntegrationProxy;
    address public individualPoolProxy;
    address public cooperativePoolProxy;
    address public lotteryPool;

    // Implementation addresses
    address public yieldAggregatorImpl;
    address public mezoIntegrationImpl;
    address public individualPoolImpl;
    address public cooperativePoolImpl;
    address public lotteryPoolImpl;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("");
        console.log("==============================================");
        console.log("      KHIPUVAULT V3 DEPLOYMENT SCRIPT         ");
        console.log("==============================================");
        console.log("");
        console.log("Deployer:        ", deployer);
        console.log("Network:          Mezo Testnet (Chain ID: 31611)");
        console.log("MUSD Token:      ", MUSD_TOKEN);
        console.log("Fee Collector:   ", FEE_COLLECTOR);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy YieldAggregatorV3
        _deployYieldAggregator();

        // 2. Deploy MezoIntegrationV3
        _deployMezoIntegration();

        // 3. Deploy IndividualPoolV3
        _deployIndividualPool();

        // 4. Deploy CooperativePoolV3
        _deployCooperativePool();

        // 5. Deploy LotteryPoolV3 (proxy + implementation)
        _deployLotteryPool();

        vm.stopBroadcast();

        // Print deployment summary
        _printSummary();
    }

    function _deployYieldAggregator() internal {
        console.log(">>> Deploying YieldAggregatorV3...");

        // Deploy implementation
        YieldAggregatorV3 impl = new YieldAggregatorV3();
        yieldAggregatorImpl = address(impl);
        console.log("    Implementation:", yieldAggregatorImpl);

        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            YieldAggregatorV3.initialize.selector,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );

        UUPSProxy proxy = new UUPSProxy(yieldAggregatorImpl, initData);
        yieldAggregatorProxy = address(proxy);
        console.log("    Proxy:         ", yieldAggregatorProxy);
        console.log("[OK] YieldAggregatorV3 deployed\n");
    }

    function _deployMezoIntegration() internal {
        console.log(">>> Deploying MezoIntegrationV3...");

        // Deploy implementation
        MezoIntegrationV3 impl = new MezoIntegrationV3();
        mezoIntegrationImpl = address(impl);
        console.log("    Implementation:", mezoIntegrationImpl);

        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            MezoIntegrationV3.initialize.selector,
            MUSD_TOKEN,
            BORROWER_OPERATIONS,
            PRICE_FEED,
            HINT_HELPERS,
            TROVE_MANAGER
        );

        UUPSProxy proxy = new UUPSProxy(mezoIntegrationImpl, initData);
        mezoIntegrationProxy = address(proxy);
        console.log("    Proxy:         ", mezoIntegrationProxy);
        console.log("[OK] MezoIntegrationV3 deployed\n");
    }

    function _deployIndividualPool() internal {
        console.log(">>> Deploying IndividualPoolV3...");

        // Deploy implementation
        IndividualPoolV3 impl = new IndividualPoolV3();
        individualPoolImpl = address(impl);
        console.log("    Implementation:", individualPoolImpl);

        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            IndividualPoolV3.initialize.selector,
            mezoIntegrationProxy,
            yieldAggregatorProxy,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );

        UUPSProxy proxy = new UUPSProxy(individualPoolImpl, initData);
        individualPoolProxy = address(proxy);
        console.log("    Proxy:         ", individualPoolProxy);
        console.log("[OK] IndividualPoolV3 deployed\n");
    }

    function _deployCooperativePool() internal {
        console.log(">>> Deploying CooperativePoolV3...");

        // Deploy implementation
        CooperativePoolV3 impl = new CooperativePoolV3();
        cooperativePoolImpl = address(impl);
        console.log("    Implementation:", cooperativePoolImpl);

        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            CooperativePoolV3.initialize.selector,
            mezoIntegrationProxy,
            yieldAggregatorProxy,
            MUSD_TOKEN,
            FEE_COLLECTOR
        );

        UUPSProxy proxy = new UUPSProxy(cooperativePoolImpl, initData);
        cooperativePoolProxy = address(proxy);
        console.log("    Proxy:         ", cooperativePoolProxy);
        console.log("[OK] CooperativePoolV3 deployed\n");
    }

    function _deployLotteryPool() internal {
        console.log(">>> Deploying LotteryPoolV3...");

        // Deploy implementation
        LotteryPoolV3 impl = new LotteryPoolV3();
        lotteryPoolImpl = address(impl);
        console.log("    Implementation:", lotteryPoolImpl);

        // Deploy proxy with initialization
        // Operator is set to deployer (can be changed later)
        bytes memory initData = abi.encodeWithSelector(
            LotteryPoolV3.initialize.selector,
            MUSD_TOKEN,
            yieldAggregatorProxy,
            FEE_COLLECTOR,
            msg.sender // operator
        );

        UUPSProxy proxy = new UUPSProxy(lotteryPoolImpl, initData);
        lotteryPool = address(proxy);
        console.log("    Proxy:         ", lotteryPool);
        console.log("[OK] LotteryPoolV3 deployed\n");
    }

    function _printSummary() internal view {
        console.log("");
        console.log("==============================================");
        console.log("          DEPLOYMENT SUMMARY                  ");
        console.log("==============================================");
        console.log("");
        console.log("PROXIES (Use these in frontend):");
        console.log("  YieldAggregatorV3:  ", yieldAggregatorProxy);
        console.log("  MezoIntegrationV3:  ", mezoIntegrationProxy);
        console.log("  IndividualPoolV3:   ", individualPoolProxy);
        console.log("  CooperativePoolV3:  ", cooperativePoolProxy);
        console.log("  LotteryPoolV3:      ", lotteryPool);
        console.log("");
        console.log("IMPLEMENTATIONS:");
        console.log("  YieldAggregatorV3:  ", yieldAggregatorImpl);
        console.log("  MezoIntegrationV3:  ", mezoIntegrationImpl);
        console.log("  IndividualPoolV3:   ", individualPoolImpl);
        console.log("  CooperativePoolV3:  ", cooperativePoolImpl);
        console.log("  LotteryPoolV3:      ", lotteryPoolImpl);
        console.log("");
        console.log("==============================================");
        console.log("         FRONTEND CONFIGURATION               ");
        console.log("==============================================");
        console.log("");
        console.log("Add to apps/web/.env.local:");
        console.log("");
        console.log("NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS=", yieldAggregatorProxy);
        console.log("NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS=", mezoIntegrationProxy);
        console.log("NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=", individualPoolProxy);
        console.log("NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=", cooperativePoolProxy);
        console.log("NEXT_PUBLIC_LOTTERY_POOL_ADDRESS=", lotteryPool);
        console.log("");
        console.log("==============================================");
        console.log("         POST-DEPLOYMENT STEPS                ");
        console.log("==============================================");
        console.log("");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Transfer ownership to multi-sig");
        console.log("3. Configure fee collectors");
        console.log("4. Add vaults to YieldAggregator");
        console.log("5. Update frontend addresses");
        console.log("6. Start indexer with new addresses");
        console.log("");
        console.log("[SUCCESS] All contracts deployed!");
    }
}
