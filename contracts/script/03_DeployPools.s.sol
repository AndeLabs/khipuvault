// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";
import {CooperativePool} from "../src/pools/CooperativePool.sol";
import {LotteryPool} from "../src/pools/LotteryPool.sol";
import {RotatingPool} from "../src/pools/RotatingPool.sol";

/**
 * @title DeployPools
 * @notice Deploys all savings pool contracts
 * @dev Requires integrations to be deployed first (script 02)
 * 
 * Usage:
 * forge script script/03_DeployPools.s.sol:DeployPools \
 *   --rpc-url $SEPOLIA_RPC_URL \
 *   --broadcast \
 *   --verify \
 *   -vvvv
 */
contract DeployPools is Script {
    // Deployed pool contracts
    address public individualPool;
    address public cooperativePool;
    address public lotteryPool;
    address public rotatingPool;

    // Dependencies (loaded from previous deployments)
    address public mezoIntegration;
    address public yieldAggregator;
    address public musd;
    address public feeCollector;

    // Chainlink VRF configuration (for LotteryPool)
    address public vrfCoordinator;
    uint64 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;

    function run() external {
        // Load configuration
        _loadConfig();

        // Get deployer
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("===========================================");
        console2.log("Deploying All Savings Pools");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("===========================================");
        console2.log("Dependencies:");
        console2.log("  MezoIntegration:", mezoIntegration);
        console2.log("  YieldAggregator:", yieldAggregator);
        console2.log("  MUSD:", musd);
        console2.log("  Fee Collector:", feeCollector);
        console2.log("  NOTE: BTC is NATIVE on Mezo - no WBTC needed");
        console2.log("===========================================");

        // Validate all dependencies
        _validateConfig();

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IndividualPool (MUSD-only, simplified)
        console2.log("\n[1/4] Deploying IndividualPool...");
        IndividualPool individual = new IndividualPool(
            yieldAggregator,
            musd,
            feeCollector
        );
        individualPool = address(individual);
        console2.log("IndividualPool deployed at:", individualPool);
        console2.log("  - Min Deposit: 10 MUSD");
        console2.log("  - Max Deposit: 100,000 MUSD");
        console2.log("  - Performance Fee: 1%");

        // 2. Deploy CooperativePool (MUSD-only, simplified)
        console2.log("\n[2/4] Deploying CooperativePool...");
        CooperativePool cooperative = new CooperativePool(
            yieldAggregator,
            musd,
            feeCollector
        );
        cooperativePool = address(cooperative);
        console2.log("CooperativePool deployed at:", cooperativePool);
        console2.log("  - Min Contribution: 0.001 BTC");
        console2.log("  - Max Members: 100");
        console2.log("  - Performance Fee: 1%");

        // 3. Deploy LotteryPool (with Chainlink VRF)
        console2.log("\n[3/4] Deploying LotteryPool...");
        
        // Validate VRF configuration
        if (vrfCoordinator == address(0)) {
            console2.log("  WARNING: VRF Coordinator not configured!");
            console2.log("  Using placeholder address. Configure before production use.");
            vrfCoordinator = address(0x1);
        }
        if (vrfSubscriptionId == 0) {
            console2.log("  WARNING: VRF Subscription ID not set!");
            console2.log("  Create subscription at vrf.chain.link");
        }
        if (vrfKeyHash == bytes32(0)) {
            console2.log("  WARNING: VRF Key Hash not set!");
            console2.log("  Using default Sepolia key hash");
            vrfKeyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
        }

        LotteryPool lottery = new LotteryPool(
            mezoIntegration,
            yieldAggregator,
            musd,
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash,
            feeCollector
        );
        lotteryPool = address(lottery);
        console2.log("LotteryPool deployed at:", lotteryPool);
        console2.log("  - Min Ticket: 0.0005 BTC (~$30)");
        console2.log("  - Max Ticket: 0.1 BTC (~$6000)");
        console2.log("  - VRF Coordinator:", vrfCoordinator);
        console2.log("  - VRF Subscription:", vrfSubscriptionId);

        // 4. Deploy RotatingPool
        console2.log("\n[4/4] Deploying RotatingPool...");
        RotatingPool rotating = new RotatingPool(
            mezoIntegration,
            yieldAggregator,
            musd,
            feeCollector
        );
        rotatingPool = address(rotating);
        console2.log("RotatingPool deployed at:", rotatingPool);
        console2.log("  - Min Members: 3");
        console2.log("  - Max Members: 50");
        console2.log("  - Min Contribution: 0.001 BTC");
        console2.log("  - Performance Fee: 1%");

        vm.stopBroadcast();

        // Save deployment
        _saveDeployment();

        // Print summary
        _printSummary();

        // Print post-deployment instructions
        _printPostDeploymentInstructions();
    }

    function _loadConfig() internal {
        // Try loading from environment first
        mezoIntegration = vm.envOr("MEZO_INTEGRATION_ADDRESS", address(0));
        yieldAggregator = vm.envOr("YIELD_AGGREGATOR_ADDRESS", address(0));
        musd = vm.envOr("MUSD_ADDRESS", address(0));
        feeCollector = vm.envOr("FEE_COLLECTOR_ADDRESS", address(0));

        // Try loading from deployment files if not in env
        string memory chainId = vm.toString(block.chainid);
        
        if (mezoIntegration == address(0) || yieldAggregator == address(0)) {
            string memory integrationsFile = string.concat(
                "./deployments/integrations-",
                chainId,
                ".json"
            );
            
            try vm.parseJson(vm.readFile(integrationsFile), ".mezoIntegration") returns (bytes memory data) {
                mezoIntegration = abi.decode(data, (address));
            } catch {
                console2.log("Warning: Could not load MezoIntegration from file");
            }
            
            try vm.parseJson(vm.readFile(integrationsFile), ".yieldAggregator") returns (bytes memory data) {
                yieldAggregator = abi.decode(data, (address));
            } catch {
                console2.log("Warning: Could not load YieldAggregator from file");
            }
        }

        if (musd == address(0)) {
            string memory tokensFile = string.concat(
                "./deployments/tokens-",
                chainId,
                ".json"
            );
            
            try vm.parseJson(vm.readFile(tokensFile), ".musd") returns (bytes memory data) {
                musd = abi.decode(data, (address));
            } catch {}
        }

        // Load Chainlink VRF configuration
        vrfCoordinator = vm.envOr("VRF_COORDINATOR_ADDRESS", address(0));
        vrfSubscriptionId = uint64(vm.envOr("VRF_SUBSCRIPTION_ID", uint256(0)));
        vrfKeyHash = vm.envOr("VRF_KEY_HASH", bytes32(0));

        // Default fee collector to deployer if not set
        if (feeCollector == address(0)) {
            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            feeCollector = vm.addr(deployerPrivateKey);
        }
    }

    function _validateConfig() internal view {
        require(mezoIntegration != address(0), "MezoIntegration not deployed");
        require(yieldAggregator != address(0), "YieldAggregator not deployed");
        require(musd != address(0), "MUSD not deployed");
        require(feeCollector != address(0), "Fee collector not set");
    }

    function _saveDeployment() internal {
        string memory chainId = vm.toString(block.chainid);
        string memory json = "deployment";
        
        vm.serializeAddress(json, "individualPool", individualPool);
        vm.serializeAddress(json, "cooperativePool", cooperativePool);
        vm.serializeAddress(json, "lotteryPool", lotteryPool);
        vm.serializeAddress(json, "rotatingPool", rotatingPool);
        vm.serializeAddress(json, "mezoIntegration", mezoIntegration);
        vm.serializeAddress(json, "yieldAggregator", yieldAggregator);
        vm.serializeAddress(json, "musd", musd);
        string memory finalJson = vm.serializeAddress(json, "feeCollector", feeCollector);
        
        string memory filename = string.concat(
            "./deployments/pools-",
            chainId,
            ".json"
        );
        
        vm.writeJson(finalJson, filename);
        console2.log("\n[SUCCESS] Deployment saved to:", filename);
    }

    function _printSummary() internal view {
        console2.log("\n===========================================");
        console2.log("DEPLOYMENT SUMMARY - ALL POOLS");
        console2.log("===========================================");
        console2.log("Chain ID:", block.chainid);
        console2.log("===========================================");
        console2.log("Savings Pools:");
        console2.log("  IndividualPool:", individualPool);
        console2.log("  CooperativePool:", cooperativePool);
        console2.log("  LotteryPool:", lotteryPool);
        console2.log("  RotatingPool:", rotatingPool);
        console2.log("===========================================");
        console2.log("Integrations:");
        console2.log("  MezoIntegration:", mezoIntegration);
        console2.log("  YieldAggregator:", yieldAggregator);
        console2.log("===========================================");
        console2.log("Tokens:");
        console2.log("  MUSD:", musd);
        console2.log("  NOTE: BTC is NATIVE on Mezo (18 decimals)");
        console2.log("===========================================");
        console2.log("Configuration:");
        console2.log("  Fee Collector:", feeCollector);
        console2.log("  VRF Coordinator:", vrfCoordinator);
        console2.log("  VRF Subscription:", vrfSubscriptionId);
        console2.log("===========================================");
    }

    function _printPostDeploymentInstructions() internal view {
        console2.log("\n===========================================");
        console2.log("POST-DEPLOYMENT INSTRUCTIONS");
        console2.log("===========================================");
        console2.log("\n1. CHAINLINK VRF SETUP (for LotteryPool):");
        console2.log("   - Visit: https://vrf.chain.link");
        console2.log("   - Create subscription if not exists");
        console2.log("   - Add LotteryPool as consumer:");
        console2.log("     ", lotteryPool);
        console2.log("   - Fund subscription with LINK tokens");
        
        console2.log("\n2. FUND CONTRACTS (Testnet):");
        console2.log("   - Send MUSD to MezoIntegration for minting");
        console2.log("   - Send MUSD to YieldAggregator for yield distribution");
        
        console2.log("\n3. VERIFY CONTRACTS:");
        console2.log("   forge verify-contract <address> <contract> --chain <chain-id>");
        
        console2.log("\n4. TEST FUNCTIONALITY:");
        console2.log("   - Test IndividualPool deposit/withdraw");
        console2.log("   - Create test CooperativePool");
        console2.log("   - Create test LotteryPool round");
        console2.log("   - Create test RotatingPool");
        
        console2.log("\n5. SECURITY CHECKLIST:");
        console2.log("   [ ] All contracts verified on Etherscan");
        console2.log("   [ ] All contracts paused initially");
        console2.log("   [ ] Ownership transferred to multisig");
        console2.log("   [ ] Emergency procedures documented");
        console2.log("   [ ] Monitoring setup (Tenderly/Defender)");
        
        console2.log("\n6. FRONTEND INTEGRATION:");
        console2.log("   - Copy deployment addresses to frontend .env");
        console2.log("   - Update ABIs in frontend");
        console2.log("   - Test all pool interactions");
        
        console2.log("\n===========================================");
        console2.log("DEPLOYMENT COMPLETE!");
        console2.log("===========================================");
    }
}