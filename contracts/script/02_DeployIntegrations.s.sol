// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {MezoIntegration} from "../src/integrations/MezoIntegration.sol";
import {YieldAggregator} from "../src/integrations/YieldAggregator.sol";
import {IYieldAggregator} from "../src/interfaces/IYieldAggregator.sol";

/**
 * @title DeployIntegrations
 * @notice Deploys core integration contracts (Mezo MUSD & YieldAggregator)
 * @dev Integrates with real Mezo MUSD protocol contracts on Matsnet/Mainnet
 * 
 * Usage:
 * Matsnet (Mezo Testnet):
 * forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
 *   --rpc-url $MATSNET_RPC_URL \
 *   --broadcast \
 *   --verify \
 *   --etherscan-api-key $ETHERSCAN_API_KEY \
 *   -vvvv
 * 
 * Requirements:
 * - MUSD protocol must be deployed on target network
 * - All MUSD contract addresses must be in .env
 * - Deployer wallet must have ETH for gas
 */
contract DeployIntegrations is Script {
    /*//////////////////////////////////////////////////////////////
                            DEPLOYED CONTRACTS
    //////////////////////////////////////////////////////////////*/

    address public mezoIntegration;
    address public yieldAggregator;

    /*//////////////////////////////////////////////////////////////
                            CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    // Token addresses
    address public wbtc;
    address public musd;
    
    // Mezo protocol contracts
    address public borrowerOperations;
    address public priceFeed;
    address public hintHelpers;
    address public troveManager;
    
    // Configuration parameters
    address public feeCollector;
    uint256 public targetLtv;
    uint256 public maxFeePercentage;
    uint256 public vaultApr;

    function run() external {
        // Load configuration from environment
        _loadConfig();

        // Get deployer info
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=======================================================");
        console2.log("    Deploying KhipuVault - Mezo MUSD Integration");
        console2.log("=======================================================");
        console2.log("Network:", _getNetworkName());
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Balance:", deployer.balance / 1e18, "ETH");
        console2.log("=======================================================");

        // Validate configuration
        _validateConfig();

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MezoIntegration with real MUSD contracts
        console2.log("\n[1/2] Deploying MezoIntegration...");
        console2.log("  Using Mezo MUSD Protocol Contracts:");
        console2.log("    WBTC:", wbtc);
        console2.log("    MUSD:", musd);
        console2.log("    BorrowerOperations:", borrowerOperations);
        console2.log("    PriceFeed:", priceFeed);
        console2.log("    HintHelpers:", hintHelpers);
        console2.log("    TroveManager:", troveManager);

        MezoIntegration mezo = new MezoIntegration(
            wbtc,
            musd,
            borrowerOperations,
            priceFeed,
            hintHelpers,
            troveManager
        );
        mezoIntegration = address(mezo);
        console2.log("[SUCCESS] MezoIntegration deployed at:", mezoIntegration);

        // Configure MezoIntegration
        if (targetLtv > 0 && targetLtv <= 8000) {
            mezo.setTargetLtv(targetLtv);
            console2.log("  [CONFIG] Target LTV set to:", targetLtv / 100);
        }
        
        if (maxFeePercentage > 0 && maxFeePercentage <= 1000) {
            mezo.setMaxFeePercentage(maxFeePercentage);
            console2.log("  [CONFIG] Max Fee set to:", maxFeePercentage / 100);
        }

        // 2. Deploy YieldAggregator
        console2.log("\n[2/2] Deploying YieldAggregator...");
        console2.log("  Base token:", musd);
        
        YieldAggregator yieldAgg = new YieldAggregator(musd);
        yieldAggregator = address(yieldAgg);
        console2.log("[SUCCESS] YieldAggregator deployed at:", yieldAggregator);

        // Add initial yield strategies for testing (not on mainnet)
        if (block.chainid != 1) {
            console2.log("  [CONFIG] Adding test yield strategies...");
            
            // Add mock AAVE vault
            yieldAgg.addVault(
                address(0x1111111111111111111111111111111111111111), // Mock AAVE vault
                IYieldAggregator.YieldStrategy.AAVE,
                vaultApr > 0 ? vaultApr : 600 // Default 6% APR
            );
            console2.log("    [OK] Mock AAVE vault (6% APR)");
            
            // Add mock Compound vault
            yieldAgg.addVault(
                address(0x2222222222222222222222222222222222222222), // Mock Compound vault
                IYieldAggregator.YieldStrategy.COMPOUND,
                550 // 5.5% APR
            );
            console2.log("    [OK] Mock Compound vault (5.5% APR)");

            // Fund YieldAggregator with MUSD for testing
            console2.log("  [NOTE] Fund YieldAggregator with MUSD manually for testing");
        }

        vm.stopBroadcast();

        // Save deployment info
        _saveDeployment();

        // Print final summary
        _printDeploymentSummary();
    }

    /*//////////////////////////////////////////////////////////////
                        CONFIGURATION LOADING
    //////////////////////////////////////////////////////////////*/

    function _loadConfig() internal {
        console2.log("[LOAD] Loading configuration...");

        // Load token addresses (try env first, then deployment file)
        wbtc = vm.envOr("WBTC_ADDRESS", address(0));
        musd = vm.envOr("MUSD_ADDRESS", address(0));

        // For Matsnet, try to load from previous token deployment
        if (wbtc == address(0) || musd == address(0)) {
            string memory chainId = vm.toString(block.chainid);
            string memory filename = string.concat("./deployments/tokens-", chainId, ".json");
            
            try vm.parseJson(vm.readFile(filename), ".wbtc") returns (bytes memory data) {
                wbtc = abi.decode(data, (address));
                console2.log("  [OK] WBTC loaded from deployment file");
            } catch {
                console2.log("  [WARNING] Could not load WBTC from deployment file");
            }
            
            try vm.parseJson(vm.readFile(filename), ".musd") returns (bytes memory data) {
                musd = abi.decode(data, (address));
                console2.log("  [OK] MUSD loaded from deployment file");
            } catch {
                console2.log("  [WARNING] Could not load MUSD from deployment file");
            }
        }

        // Load Mezo protocol contract addresses
        borrowerOperations = vm.envAddress("MATSNET_BORROWER_OPERATIONS");
        priceFeed = vm.envAddress("MATSNET_PRICE_FEED");
        hintHelpers = vm.envAddress("MATSNET_HINT_HELPERS");
        troveManager = vm.envAddress("MATSNET_TROVE_MANAGER");

        // Load configuration parameters
        feeCollector = vm.envOr("FEE_COLLECTOR_ADDRESS", address(0));
        targetLtv = vm.envOr("TARGET_LTV", uint256(5000)); // 50% default
        maxFeePercentage = vm.envOr("MAX_FEE_PERCENTAGE", uint256(500)); // 5% default
        vaultApr = vm.envOr("INITIAL_VAULT_APR", uint256(600)); // 6% default

        // Use deployer as fee collector if not set
        if (feeCollector == address(0)) {
            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            feeCollector = vm.addr(deployerPrivateKey);
            console2.log("  [WARNING] Using deployer as fee collector");
        }
    }

    /*//////////////////////////////////////////////////////////////
                            VALIDATION
    //////////////////////////////////////////////////////////////*/

    function _validateConfig() internal view {
        console2.log("[VALIDATE] Validating configuration...");

        // Validate token addresses
        require(wbtc != address(0), "WBTC address not set");
        require(musd != address(0), "MUSD address not set");
        
        // Validate Mezo contract addresses
        require(borrowerOperations != address(0), "BorrowerOperations address not set");
        require(priceFeed != address(0), "PriceFeed address not set");
        require(hintHelpers != address(0), "HintHelpers address not set");
        require(troveManager != address(0), "TroveManager address not set");
        
        // Validate parameters
        require(feeCollector != address(0), "Fee collector not set");
        require(targetLtv > 0 && targetLtv <= 8000, "Invalid target LTV");
        require(maxFeePercentage <= 1000, "Max fee too high");

        console2.log("  [SUCCESS] All validation checks passed");
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT PERSISTENCE
    //////////////////////////////////////////////////////////////*/

    function _saveDeployment() internal {
        string memory chainId = vm.toString(block.chainid);
        string memory json = "deployment";
        
        // Core contracts
        vm.serializeAddress(json, "mezoIntegration", mezoIntegration);
        vm.serializeAddress(json, "yieldAggregator", yieldAggregator);
        
        // Dependencies
        vm.serializeAddress(json, "wbtc", wbtc);
        vm.serializeAddress(json, "musd", musd);
        vm.serializeAddress(json, "borrowerOperations", borrowerOperations);
        vm.serializeAddress(json, "priceFeed", priceFeed);
        vm.serializeAddress(json, "hintHelpers", hintHelpers);
        vm.serializeAddress(json, "troveManager", troveManager);
        
        // Configuration
        vm.serializeAddress(json, "feeCollector", feeCollector);
        vm.serializeUint(json, "targetLtv", targetLtv);
        vm.serializeUint(json, "maxFeePercentage", maxFeePercentage);
        string memory finalJson = vm.serializeUint(json, "vaultApr", vaultApr);
        
        string memory filename = string.concat(
            "./deployments/integrations-",
            chainId,
            ".json"
        );
        
        vm.writeJson(finalJson, filename);
        console2.log("\n[SAVE] Deployment saved to:", filename);
    }

    /*//////////////////////////////////////////////////////////////
                            UTILITIES
    //////////////////////////////////////////////////////////////*/

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 1) return "Ethereum Mainnet";
        if (block.chainid == 11155111) return "Sepolia Testnet (Matsnet)";
        if (block.chainid == 31337) return "Anvil Local";
        return string.concat("Chain ID ", vm.toString(block.chainid));
    }

    function _printDeploymentSummary() internal view {
        console2.log("\n=======================================================");
        console2.log("    [SUCCESS] DEPLOYMENT COMPLETE - INTEGRATIONS");
        console2.log("=======================================================");
        console2.log("Network:", _getNetworkName());
        console2.log("");
        console2.log("[CONTRACTS] DEPLOYED CONTRACTS:");
        console2.log("  MezoIntegration:", mezoIntegration);
        console2.log("  YieldAggregator:", yieldAggregator);
        console2.log("");
        console2.log("[MEZO] MEZO PROTOCOL INTEGRATION:");
        console2.log("  WBTC Token:", wbtc);
        console2.log("  MUSD Token:", musd);
        console2.log("  BorrowerOperations:", borrowerOperations);
        console2.log("  PriceFeed:", priceFeed);
        console2.log("  HintHelpers:", hintHelpers);
        console2.log("  TroveManager:", troveManager);
        console2.log("");
        console2.log("[CONFIG] CONFIGURATION:");
        console2.log("  Target LTV (%):", targetLtv / 100);
        console2.log("  Max Fee (%):", maxFeePercentage / 100);
        console2.log("  Vault APR (%):", vaultApr / 100);
        console2.log("  Fee Collector:", feeCollector);
        console2.log("=======================================================");
        
        if (block.chainid != 1) {
            console2.log("");
            console2.log("[TODO] NEXT STEPS:");
            console2.log("1. Verify contracts on Etherscan");
            console2.log("2. Test MUSD integration:");
            console2.log("   - Get testnet WBTC from faucet");
            console2.log("   - Call depositAndMint() on MezoIntegration");
            console2.log("   - Verify Trove creation in MUSD protocol");
            console2.log("3. Fund YieldAggregator with MUSD");
            console2.log("4. Run: make deploy-matsnet-pools");
            console2.log("=======================================================");
        }
        
        console2.log("\n[ENV] ADD TO .env FILE:");
        console2.log("MEZO_INTEGRATION_ADDRESS=", mezoIntegration);
        console2.log("YIELD_AGGREGATOR_ADDRESS=", yieldAggregator);
        console2.log("=======================================================");
    }
}