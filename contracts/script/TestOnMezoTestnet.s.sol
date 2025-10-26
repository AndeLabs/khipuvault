// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {StabilityPoolStrategy} from "../src/strategies/StabilityPoolStrategy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMezoStabilityPool} from "../src/interfaces/IMezoStabilityPool.sol";

/**
 * @title TestOnMezoTestnet
 * @notice Manual testing script for interacting with REAL Mezo contracts
 * @dev This validates our integration works with actual Mezo Stability Pool
 */
contract TestOnMezoTestnet is Script {
    
    // REAL Mezo Testnet contracts (from @mezo-org/musd-contracts deployments)
    address constant STABILITY_POOL = 0x1CCA7E410eE41739792eA0A24e00349Dd247680e;
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    
    function run() external view {
        console2.log("===========================================");
        console2.log("MEZO TESTNET - CONTRACT VALIDATION");
        console2.log("===========================================");
        console2.log("");
        
        // Validate Stability Pool exists
        console2.log("Checking Mezo Stability Pool...");
        IMezoStabilityPool sp = IMezoStabilityPool(STABILITY_POOL);
        
        try sp.getTotalMUSDDeposits() returns (uint256 total) {
            console2.log("  Total MUSD in Stability Pool:", total);
            console2.log("  Status: WORKING [OK]");
        } catch {
            console2.log("  Status: ERROR - Cannot connect to Stability Pool");
        }
        
        console2.log("");
        
        // Validate MUSD token exists
        console2.log("Checking MUSD Token...");
        IERC20 musd = IERC20(MUSD_TOKEN);
        
        try musd.totalSupply() returns (uint256 supply) {
            console2.log("  Total MUSD Supply:", supply);
            console2.log("  Status: WORKING [OK]");
        } catch {
            console2.log("  Status: ERROR - Cannot connect to MUSD token");
        }
        
        console2.log("");
        console2.log("===========================================");
        console2.log("VALIDATION COMPLETE");
        console2.log("===========================================");
        console2.log("");
        console2.log("To deploy StabilityPoolStrategy:");
        console2.log("  forge script script/DeployStabilityPoolStrategy.s.sol \\");
        console2.log("    --rpc-url https://rpc.test.mezo.org \\");
        console2.log("    --broadcast \\");
        console2.log("    --private-key $PRIVATE_KEY");
        console2.log("");
    }
}
