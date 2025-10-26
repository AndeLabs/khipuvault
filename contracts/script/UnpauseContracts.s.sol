// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";
import {CooperativePool} from "../src/pools/CooperativePool.sol";
import {YieldAggregator} from "../src/integrations/YieldAggregator.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title UnpauseContracts
 * @notice Unpauses contracts that were paused during deployment or for maintenance
 * @dev Owner only - allows deposits and yields to resume
 * 
 * Usage:
 * forge script script/UnpauseContracts.s.sol:UnpauseContracts \
 *   --rpc-url $MEZO_TESTNET_RPC \
 *   --broadcast \
 *   -vvv
 */
contract UnpauseContracts is Script {
    /*//////////////////////////////////////////////////////////////
                            CONTRACT ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public constant INDIVIDUAL_POOL = 0xC2c7c8E1325Ec049302F225c8A0151E561F446Ed;
    address public constant COOPERATIVE_POOL = 0xDDe8c75271E454075BD2f348213A66B142BB8906;
    address public constant YIELD_AGGREGATOR = 0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c;

    /*//////////////////////////////////////////////////////////////
                                RUN
    //////////////////////////////////////////////////////////////*/

    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("===========================================");
        console2.log("Unpausing Contracts");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("===========================================");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Unpause IndividualPool
        console2.log("\n[1/3] Unpausing IndividualPool...");
        _unPauseContract(INDIVIDUAL_POOL, "IndividualPool");

        // 2. Unpause CooperativePool
        console2.log("\n[2/3] Unpausing CooperativePool...");
        _unPauseContract(COOPERATIVE_POOL, "CooperativePool");

        // 3. Unpause YieldAggregator
        console2.log("\n[3/3] Unpausing YieldAggregator...");
        _unPauseContract(YIELD_AGGREGATOR, "YieldAggregator");

        vm.stopBroadcast();

        console2.log("\n===========================================");
        console2.log("✅ All contracts unpaused successfully!");
        console2.log("===========================================");
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Helper to unpause any Pausable contract
     */
    function _unPauseContract(address contractAddress, string memory contractName) internal {
        // Call unpause() function
        (bool success, bytes memory result) = contractAddress.call(
            abi.encodeWithSignature("unpause()")
        );

        if (success) {
            console2.log(string.concat(contractName, " unpaused successfully"));
            _logContractState(contractAddress, contractName);
        } else {
            console2.log(string.concat("⚠️  Error unpausing ", contractName));
            console2.logBytes(result);
        }
    }

    /**
     * @notice Log contract pause state
     */
    function _logContractState(address contractAddress, string memory contractName) internal view {
        // Try to read paused() state
        (bool success, bytes memory result) = contractAddress.staticcall(
            abi.encodeWithSignature("paused()")
        );

        if (success && result.length > 0) {
            bool isPaused = abi.decode(result, (bool));
            if (isPaused) {
                console2.log(string.concat(contractName, " state: STILL PAUSED ⚠️"));
            } else {
                console2.log(string.concat(contractName, " state: ACTIVE ✓"));
            }
        }
    }
}
