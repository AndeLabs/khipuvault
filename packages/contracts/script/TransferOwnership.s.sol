// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title TransferOwnership
 * @notice Script to transfer ownership of all KhipuVault contracts to a multi-sig (Gnosis Safe)
 * @dev This script transfers ownership from an EOA to a multi-sig wallet for production security
 *
 * Security Features:
 * - Verifies new owner is a contract (not EOA)
 * - Prevents transfer to zero address
 * - Confirms current ownership before transfer
 * - Emits events for tracking
 * - Generates verification report
 *
 * Contracts to transfer:
 * 1. YieldAggregatorV3
 * 2. MezoIntegrationV3
 * 3. IndividualPoolV3
 * 4. CooperativePoolV3
 * 5. LotteryPoolV3
 * 6. RotatingPool
 * 7. StabilityPoolStrategy (if deployed)
 *
 * Usage:
 *   1. Update MULTI_SIG_ADDRESS with your Gnosis Safe address
 *   2. Update contract addresses for your deployment
 *   3. Dry run: forge script script/TransferOwnership.s.sol --rpc-url $RPC_URL -vvvv
 *   4. Execute: forge script script/TransferOwnership.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 *   5. Verify: forge script script/VerifyOwnership.s.sol --rpc-url $RPC_URL -vvvv
 *
 * IMPORTANT:
 * - Ensure multi-sig is properly configured before running
 * - Test on testnet first
 * - Keep a copy of all addresses
 * - Coordinate with multi-sig signers
 *
 * @custom:security-contact security@khipuvault.com
 */
interface IOwnable {
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
}

contract TransferOwnership is Script {
    /*//////////////////////////////////////////////////////////////
                        CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    // TODO: Update these addresses for your deployment
    address constant MULTI_SIG_ADDRESS = address(0); // UPDATE: Your Gnosis Safe address

    // Contract addresses - UPDATE THESE
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant MEZO_INTEGRATION = 0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD;
    address constant INDIVIDUAL_POOL = 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393;
    address constant COOPERATIVE_POOL = 0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F;
    address constant LOTTERY_POOL = 0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4;
    address constant ROTATING_POOL = 0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04;
    address constant STABILITY_POOL_STRATEGY = address(0); // Optional: Update if deployed

    /*//////////////////////////////////////////////////////////////
                        STATE TRACKING
    //////////////////////////////////////////////////////////////*/

    struct TransferResult {
        string contractName;
        address contractAddress;
        address oldOwner;
        address newOwner;
        bool success;
        string error;
    }

    TransferResult[] public results;

    /*//////////////////////////////////////////////////////////////
                        MAIN SCRIPT
    //////////////////////////////////////////////////////////////*/

    function run() external {
        // Validate configuration
        require(MULTI_SIG_ADDRESS != address(0), "MULTI_SIG_ADDRESS not set! Update script first.");
        _validateMultiSig();

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("");
        console.log("==============================================");
        console.log("    TRANSFER OWNERSHIP TO MULTI-SIG          ");
        console.log("==============================================");
        console.log("");
        console.log("Current Owner (EOA): ", deployer);
        console.log("New Owner (Multi-sig):", MULTI_SIG_ADDRESS);
        console.log("Network:             ", _getNetworkName());
        console.log("");

        // Verify deployer is current owner of all contracts
        console.log(">>> Pre-flight checks...");
        _verifyCurrentOwnership(deployer);
        console.log("[OK] All ownership checks passed");
        console.log("");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Transfer ownership of each contract
        _transferContract("YieldAggregatorV3", YIELD_AGGREGATOR);
        _transferContract("MezoIntegrationV3", MEZO_INTEGRATION);
        _transferContract("IndividualPoolV3", INDIVIDUAL_POOL);
        _transferContract("CooperativePoolV3", COOPERATIVE_POOL);
        _transferContract("LotteryPoolV3", LOTTERY_POOL);
        _transferContract("RotatingPool", ROTATING_POOL);

        // Optional: Transfer StabilityPoolStrategy if deployed
        if (STABILITY_POOL_STRATEGY != address(0)) {
            _transferContract("StabilityPoolStrategy", STABILITY_POOL_STRATEGY);
        }

        vm.stopBroadcast();

        // Print results
        _printSummary();
    }

    /*//////////////////////////////////////////////////////////////
                        VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validates that the multi-sig address is a contract
     * @dev Prevents accidental transfer to EOA or zero address
     */
    function _validateMultiSig() internal view {
        require(MULTI_SIG_ADDRESS != address(0), "Multi-sig address is zero!");

        address multiSig = MULTI_SIG_ADDRESS;
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(multiSig)
        }

        require(codeSize > 0, "Multi-sig address is not a contract! Use a Gnosis Safe.");

        console.log("[OK] Multi-sig address validated (is contract)");
    }

    /**
     * @notice Verifies deployer owns all contracts before transfer
     * @param expectedOwner The address that should be the current owner
     */
    function _verifyCurrentOwnership(address expectedOwner) internal view {
        _checkOwnership("YieldAggregatorV3", YIELD_AGGREGATOR, expectedOwner);
        _checkOwnership("MezoIntegrationV3", MEZO_INTEGRATION, expectedOwner);
        _checkOwnership("IndividualPoolV3", INDIVIDUAL_POOL, expectedOwner);
        _checkOwnership("CooperativePoolV3", COOPERATIVE_POOL, expectedOwner);
        _checkOwnership("LotteryPoolV3", LOTTERY_POOL, expectedOwner);
        _checkOwnership("RotatingPool", ROTATING_POOL, expectedOwner);

        if (STABILITY_POOL_STRATEGY != address(0)) {
            _checkOwnership("StabilityPoolStrategy", STABILITY_POOL_STRATEGY, expectedOwner);
        }
    }

    /**
     * @notice Checks if contract has expected owner
     */
    function _checkOwnership(string memory name, address contractAddr, address expectedOwner) internal view {
        IOwnable ownable = IOwnable(contractAddr);
        address currentOwner = ownable.owner();

        require(currentOwner == expectedOwner, string(abi.encodePacked(name, ": unexpected owner")));

        console.log("    [OK]", name, "- owner:", currentOwner);
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Transfers ownership of a single contract
     * @param name Human-readable contract name
     * @param contractAddr Address of the contract
     */
    function _transferContract(string memory name, address contractAddr) internal {
        console.log(">>> Transferring", name, "...");

        TransferResult memory result = TransferResult({
            contractName: name,
            contractAddress: contractAddr,
            oldOwner: address(0),
            newOwner: MULTI_SIG_ADDRESS,
            success: false,
            error: ""
        });

        try IOwnable(contractAddr).owner() returns (address currentOwner) {
            result.oldOwner = currentOwner;

            // Transfer ownership
            try IOwnable(contractAddr).transferOwnership(MULTI_SIG_ADDRESS) {
                result.success = true;
                console.log("    [SUCCESS] Ownership transferred");
                console.log("      From:", currentOwner);
                console.log("      To:  ", MULTI_SIG_ADDRESS);
            } catch Error(string memory reason) {
                result.error = reason;
                console.log("    [FAILED] Transfer failed:", reason);
            } catch {
                result.error = "Unknown error";
                console.log("    [FAILED] Transfer failed: Unknown error");
            }
        } catch {
            result.error = "Cannot read owner";
            console.log("    [FAILED] Cannot read owner (not Ownable?)");
        }

        results.push(result);
        console.log("");
    }

    /*//////////////////////////////////////////////////////////////
                        REPORTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prints transfer summary
     */
    function _printSummary() internal view {
        console.log("==============================================");
        console.log("           TRANSFER SUMMARY                   ");
        console.log("==============================================");
        console.log("");

        uint256 successCount = 0;
        uint256 failCount = 0;

        for (uint256 i = 0; i < results.length; i++) {
            TransferResult memory result = results[i];

            if (result.success) {
                successCount++;
                console.log("[SUCCESS]", result.contractName);
                console.log("  Address:", result.contractAddress);
                console.log("  Old Owner:", result.oldOwner);
                console.log("  New Owner:", result.newOwner);
            } else {
                failCount++;
                console.log("[FAILED]", result.contractName);
                console.log("  Address:", result.contractAddress);
                console.log("  Error:", result.error);
            }
            console.log("");
        }

        console.log("==============================================");
        console.log("Results:");
        console.log("  Successful:", successCount);
        console.log("  Failed:", failCount);
        console.log("==============================================");
        console.log("");

        if (failCount > 0) {
            console.log("[WARNING] Some transfers failed!");
            console.log("Review errors above and retry failed contracts.");
            console.log("");
        } else {
            console.log("[SUCCESS] All ownership transfers completed!");
            console.log("");
            console.log("NEXT STEPS:");
            console.log("1. Run VerifyOwnership.s.sol to confirm");
            console.log("2. Test multi-sig can execute admin functions");
            console.log("3. Update documentation with multi-sig address");
            console.log("4. Notify team of ownership transfer");
            console.log("");
        }
    }

    /**
     * @notice Get human-readable network name
     */
    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 31611) return "Mezo Testnet";
        if (block.chainid == 31612) return "Mezo Mainnet";
        if (block.chainid == 1) return "Ethereum Mainnet";
        return string(abi.encodePacked("Chain ID: ", vm.toString(block.chainid)));
    }
}
