// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/**
 * @title DeployTokens
 * @notice Deploys mock WBTC and MUSD tokens for testnet
 * @dev Only for testnet - mainnet uses real tokens
 * 
 * Usage:
 * forge script script/01_DeployTokens.s.sol:DeployTokens \
 *   --rpc-url $SEPOLIA_RPC_URL \
 *   --broadcast \
 *   --verify \
 *   -vvvv
 */
contract DeployTokens is Script {
    // Testnet addresses will be saved here
    address public wbtc;
    address public musd;

    // Initial supply for testing
    uint256 constant INITIAL_SUPPLY = 1000000 * 1e8; // 1M WBTC (8 decimals)
    uint256 constant MUSD_SUPPLY = 100000000 * 1e18; // 100M MUSD (18 decimals)

    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("===========================================");
        console2.log("Deploying Mock Tokens for Testnet");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("===========================================");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy WBTC (8 decimals like real WBTC)
        console2.log("\nDeploying Mock WBTC...");
        MockERC20 wbtcToken = new MockERC20("Wrapped Bitcoin", "WBTC", 8);
        wbtc = address(wbtcToken);
        console2.log("WBTC deployed at:", wbtc);

        // Mint initial supply to deployer
        wbtcToken.mint(deployer, INITIAL_SUPPLY);
        console2.log("Minted WBTC to deployer:", INITIAL_SUPPLY / 1e8, "WBTC");

        // Deploy MUSD (18 decimals)
        console2.log("\nDeploying Mock MUSD...");
        MockERC20 musdToken = new MockERC20("Mezo USD", "MUSD", 18);
        musd = address(musdToken);
        console2.log("MUSD deployed at:", musd);

        // Mint initial supply to deployer
        musdToken.mint(deployer, MUSD_SUPPLY);
        console2.log("Minted MUSD to deployer:", MUSD_SUPPLY / 1e18, "MUSD");

        vm.stopBroadcast();

        // Save deployment addresses
        _saveDeployment();

        console2.log("\n===========================================");
        console2.log("Deployment Summary");
        console2.log("===========================================");
        console2.log("WBTC:", wbtc);
        console2.log("MUSD:", musd);
        console2.log("===========================================");
        console2.log("\nAdd these to your .env file:");
        console2.log("WBTC_ADDRESS=", wbtc);
        console2.log("MUSD_ADDRESS=", musd);
        console2.log("===========================================");
    }

    function _saveDeployment() internal {
        string memory chainId = vm.toString(block.chainid);
        string memory json = "deployment";
        
        vm.serializeAddress(json, "wbtc", wbtc);
        string memory finalJson = vm.serializeAddress(json, "musd", musd);
        
        string memory filename = string.concat(
            "./deployments/tokens-",
            chainId,
            ".json"
        );
        
        vm.writeJson(finalJson, filename);
        console2.log("\nDeployment saved to:", filename);
    }
}