// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {NetworkConfig} from "./config/NetworkConfig.s.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {YieldAggregatorV3} from "../src/integrations/v3/YieldAggregatorV3.sol";
import {MezoIntegrationV3} from "../src/integrations/v3/MezoIntegrationV3.sol";
import {IndividualPoolV3} from "../src/pools/v3/IndividualPoolV3.sol";
import {CooperativePoolV3} from "../src/pools/v3/CooperativePoolV3.sol";
import {LotteryPoolV3} from "../src/pools/v3/LotteryPoolV3.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";

/**
 * @title Deploy
 * @notice Main deployment script for all KhipuVault V3 contracts
 * @dev Deploys in correct order with proper initialization
 *      Uses NetworkConfig for network-aware configuration
 *
 * Deployment Order:
 * 1. YieldAggregatorV3 (proxy + implementation)
 * 2. MezoIntegrationV3 (proxy + implementation)
 * 3. IndividualPoolV3 (proxy + implementation)
 * 4. CooperativePoolV3 (proxy + implementation)
 * 5. LotteryPoolV3 (proxy + implementation)
 * 6. RotatingPool (proxy + implementation)
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
 *
 * Dry Run:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --dry-run
 */
contract Deploy is NetworkConfig {
    // Fee configuration
    uint256 constant PERFORMANCE_FEE = 1000; // 10% performance fee

    // Deployed contract addresses (will be set during deployment)
    address public yieldAggregatorProxy;
    address public mezoIntegrationProxy;
    address public individualPoolProxy;
    address public cooperativePoolProxy;
    address public lotteryPoolProxy;
    address public rotatingPoolProxy;

    // Implementation addresses
    address public yieldAggregatorImpl;
    address public mezoIntegrationImpl;
    address public individualPoolImpl;
    address public cooperativePoolImpl;
    address public lotteryPoolImpl;
    address public rotatingPoolImpl;

    // Network config (set during run)
    PoolLimits internal limits;
    NetworkAddresses internal addresses;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get network configuration
        (limits, addresses) = getNetworkConfig();

        string memory networkName = isTestnet() ? "Mezo Testnet" : isMainnet() ? "Mezo Mainnet" : "Local/Unknown";

        console.log("");
        console.log("==============================================");
        console.log("      KHIPUVAULT V3 DEPLOYMENT SCRIPT         ");
        console.log("==============================================");
        console.log("");
        console.log("Deployer:        ", deployer);
        console.log("Network:         ", networkName);
        console.log("Chain ID:        ", block.chainid);
        console.log("MUSD Token:      ", addresses.musdToken);
        console.log("Fee Collector:   ", addresses.feeCollector);
        console.log("");
        console.log("Pool Limits:");
        console.log("  Min Deposit:    ", limits.minDeposit);
        console.log("  Max Deposit:    ", limits.maxDeposit);
        console.log("  Min Withdrawal: ", limits.minWithdrawal);
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

        // 6. Deploy RotatingPool (not upgradeable)
        _deployRotatingPool();

        // 7. Post-deployment configuration
        _configureAuthorizations();

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
            addresses.musdToken,
            addresses.feeCollector
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
            addresses.musdToken,
            addresses.borrowerOperations,
            addresses.priceFeed,
            addresses.hintHelpers,
            addresses.troveManager
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
        // IndividualPoolV3.initialize(musd, yieldAggregator, feeCollector, performanceFee, minDeposit, maxDeposit, minWithdrawal)
        bytes memory initData = abi.encodeWithSelector(
            IndividualPoolV3.initialize.selector,
            addresses.musdToken,
            yieldAggregatorProxy,
            addresses.feeCollector,
            PERFORMANCE_FEE,
            limits.minDeposit,
            limits.maxDeposit,
            limits.minWithdrawal
        );

        UUPSProxy proxy = new UUPSProxy(individualPoolImpl, initData);
        individualPoolProxy = address(proxy);
        console.log("    Proxy:         ", individualPoolProxy);
        console.log("    Min Deposit:   ", limits.minDeposit);
        console.log("[OK] IndividualPoolV3 deployed\n");
    }

    function _deployCooperativePool() internal {
        console.log(">>> Deploying CooperativePoolV3...");

        // Deploy implementation
        CooperativePoolV3 impl = new CooperativePoolV3();
        cooperativePoolImpl = address(impl);
        console.log("    Implementation:", cooperativePoolImpl);

        // Deploy proxy with initialization
        // CooperativePoolV3.initialize(mezoIntegration, yieldAggregator, musd, feeCollector)
        bytes memory initData = abi.encodeWithSelector(
            CooperativePoolV3.initialize.selector,
            mezoIntegrationProxy,     // 1. MezoIntegration address
            yieldAggregatorProxy,     // 2. YieldAggregator address
            addresses.musdToken,      // 3. MUSD token address
            addresses.feeCollector    // 4. Fee collector address
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
            addresses.musdToken,
            yieldAggregatorProxy,
            addresses.feeCollector,
            msg.sender // operator
        );

        UUPSProxy proxy = new UUPSProxy(lotteryPoolImpl, initData);
        lotteryPoolProxy = address(proxy);
        console.log("    Proxy:         ", lotteryPoolProxy);
        console.log("[OK] LotteryPoolV3 deployed\n");
    }

    function _deployRotatingPool() internal {
        console.log(">>> Deploying RotatingPool...");

        // Deploy implementation
        RotatingPool impl = new RotatingPool();
        rotatingPoolImpl = address(impl);
        console.log("    Implementation:", rotatingPoolImpl);

        // Deploy proxy with initialization
        // Note: We use MUSD for both wbtc and musd since testnet doesn't have WBTC
        bytes memory initData = abi.encodeWithSelector(
            RotatingPool.initialize.selector,
            mezoIntegrationProxy,
            yieldAggregatorProxy,
            addresses.musdToken, // WBTC placeholder (uses MUSD on testnet)
            addresses.musdToken,
            addresses.feeCollector
        );

        UUPSProxy proxy = new UUPSProxy(rotatingPoolImpl, initData);
        rotatingPoolProxy = address(proxy);
        console.log("    Proxy:         ", rotatingPoolProxy);
        console.log("[OK] RotatingPool deployed\n");
    }

    /**
     * @notice Configure post-deployment authorizations
     * @dev Authorizes all pools in YieldAggregator so they can deposit/withdraw
     *      This is CRITICAL - without this, pools cannot interact with the yield system
     */
    function _configureAuthorizations() internal {
        console.log(">>> Configuring Authorizations...");

        YieldAggregatorV3 yieldAggregator = YieldAggregatorV3(yieldAggregatorProxy);

        // Authorize IndividualPoolV3
        yieldAggregator.setAuthorizedCaller(individualPoolProxy, true);
        console.log("    [OK] IndividualPoolV3 authorized in YieldAggregator");

        // Authorize LotteryPoolV3 (CRITICAL - was missing before)
        yieldAggregator.setAuthorizedCaller(lotteryPoolProxy, true);
        console.log("    [OK] LotteryPoolV3 authorized in YieldAggregator");

        // Authorize RotatingPool (for future yield integration)
        yieldAggregator.setAuthorizedCaller(rotatingPoolProxy, true);
        console.log("    [OK] RotatingPool authorized in YieldAggregator");

        // Note: CooperativePoolV3 uses MezoIntegration directly, not YieldAggregator

        console.log("[OK] All authorizations configured\n");
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
        console.log("  LotteryPoolV3:      ", lotteryPoolProxy);
        console.log("  RotatingPool:       ", rotatingPoolProxy);
        console.log("");
        console.log("IMPLEMENTATIONS:");
        console.log("  YieldAggregatorV3:  ", yieldAggregatorImpl);
        console.log("  MezoIntegrationV3:  ", mezoIntegrationImpl);
        console.log("  IndividualPoolV3:   ", individualPoolImpl);
        console.log("  CooperativePoolV3:  ", cooperativePoolImpl);
        console.log("  LotteryPoolV3:      ", lotteryPoolImpl);
        console.log("  RotatingPool:       ", rotatingPoolImpl);
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
        console.log("NEXT_PUBLIC_LOTTERY_POOL_ADDRESS=", lotteryPoolProxy);
        console.log("NEXT_PUBLIC_ROTATING_POOL_ADDRESS=", rotatingPoolProxy);
        console.log("");
        console.log("==============================================");
        console.log("         POST-DEPLOYMENT STEPS                ");
        console.log("==============================================");
        console.log("");
        console.log("AUTOMATED (Done during deployment):");
        console.log("  [x] Pool authorizations in YieldAggregator");
        console.log("");
        console.log("MANUAL STEPS:");
        console.log("  1. Verify contracts on block explorer");
        console.log("  2. Transfer ownership to multi-sig (production)");
        console.log("  3. Update frontend addresses");
        console.log("  4. Start indexer with new addresses");
        console.log("  5. Run PostDeployVerify.s.sol to verify setup");
        console.log("");
        console.log("[SUCCESS] All contracts deployed and configured!");
    }
}
