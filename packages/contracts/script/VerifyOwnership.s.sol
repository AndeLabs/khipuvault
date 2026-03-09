// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title VerifyOwnership
 * @notice Verification script to confirm ownership transfer to multi-sig
 * @dev Run this after TransferOwnership.s.sol to verify all contracts are owned by multi-sig
 *
 * Checks performed:
 * 1. All contracts have multi-sig as owner
 * 2. No contracts have EOA or zero address as owner
 * 3. Multi-sig address is a contract (Gnosis Safe)
 * 4. Provides remediation steps if issues found
 *
 * Usage:
 *   forge script script/VerifyOwnership.s.sol --rpc-url $RPC_URL -vvvv
 *
 * This is a read-only script (no transactions).
 *
 * @custom:security-contact security@khipuvault.com
 */
interface IOwnable {
    function owner() external view returns (address);
}

contract VerifyOwnership is Script {
    /*//////////////////////////////////////////////////////////////
                        CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    // Expected multi-sig owner - UPDATE THIS
    address constant EXPECTED_MULTI_SIG = address(0); // UPDATE: Your Gnosis Safe address

    // Contract addresses - UPDATE THESE (same as TransferOwnership.s.sol)
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant MEZO_INTEGRATION = 0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD;
    address constant INDIVIDUAL_POOL = 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393;
    address constant COOPERATIVE_POOL = 0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F;
    address constant LOTTERY_POOL = 0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4;
    address constant ROTATING_POOL = 0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04;
    address constant STABILITY_POOL_STRATEGY = address(0); // Optional

    /*//////////////////////////////////////////////////////////////
                        STATE TRACKING
    //////////////////////////////////////////////////////////////*/

    struct OwnershipStatus {
        string contractName;
        address contractAddress;
        address currentOwner;
        bool isCorrect;
        bool isContract;
        string issue;
    }

    OwnershipStatus[] public statuses;
    uint256 public passedChecks;
    uint256 public failedChecks;

    /*//////////////////////////////////////////////////////////////
                        MAIN VERIFICATION
    //////////////////////////////////////////////////////////////*/

    function run() external view {
        require(EXPECTED_MULTI_SIG != address(0), "EXPECTED_MULTI_SIG not set! Update script first.");

        console.log("");
        console.log("==============================================");
        console.log("      OWNERSHIP VERIFICATION REPORT          ");
        console.log("==============================================");
        console.log("");
        console.log("Expected Owner:      ", EXPECTED_MULTI_SIG);
        console.log("Network:             ", _getNetworkName());
        console.log("");

        // Verify multi-sig is a contract
        _verifyMultiSigIsContract();

        // Check ownership of all contracts
        console.log(">>> Checking Contract Ownership");
        console.log("");

        _checkContract("YieldAggregatorV3", YIELD_AGGREGATOR);
        _checkContract("MezoIntegrationV3", MEZO_INTEGRATION);
        _checkContract("IndividualPoolV3", INDIVIDUAL_POOL);
        _checkContract("CooperativePoolV3", COOPERATIVE_POOL);
        _checkContract("LotteryPoolV3", LOTTERY_POOL);
        _checkContract("RotatingPool", ROTATING_POOL);

        if (STABILITY_POOL_STRATEGY != address(0)) {
            _checkContract("StabilityPoolStrategy", STABILITY_POOL_STRATEGY);
        }

        // Print summary
        _printSummary();
    }

    /*//////////////////////////////////////////////////////////////
                        VERIFICATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifies multi-sig address is a contract
     */
    function _verifyMultiSigIsContract() internal view {
        address multiSig = EXPECTED_MULTI_SIG;
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(multiSig)
        }

        if (codeSize > 0) {
            console.log("[PASS] Multi-sig is a contract");
            console.log("       Code size:", codeSize, "bytes");
        } else {
            console.log("[FAIL] Multi-sig is NOT a contract!");
            console.log("       This should be a Gnosis Safe, not an EOA.");
        }
        console.log("");
    }

    /**
     * @notice Checks ownership of a single contract
     */
    function _checkContract(string memory name, address contractAddr) internal view {
        OwnershipStatus memory status = OwnershipStatus({
            contractName: name,
            contractAddress: contractAddr,
            currentOwner: address(0),
            isCorrect: false,
            isContract: false,
            issue: ""
        });

        // Try to read owner
        try IOwnable(contractAddr).owner() returns (address currentOwner) {
            status.currentOwner = currentOwner;

            // Check if owner is correct
            if (currentOwner == EXPECTED_MULTI_SIG) {
                status.isCorrect = true;
                console.log("    [PASS]", name);
                console.log("      Owner:", currentOwner);
            } else if (currentOwner == address(0)) {
                status.issue = "Owner is zero address";
                console.log("    [FAIL]", name, "- Owner is zero address!");
            } else {
                status.issue = "Wrong owner (not multi-sig)";
                console.log("    [FAIL]", name, "- Wrong owner");
                console.log("      Current:", currentOwner);
                console.log("      Expected:", EXPECTED_MULTI_SIG);

                // Check if current owner is at least a contract
                uint256 codeSize;
                assembly {
                    codeSize := extcodesize(currentOwner)
                }
                status.isContract = codeSize > 0;

                if (!status.isContract) {
                    console.log("      [WARNING] Current owner is EOA, not multi-sig!");
                }
            }
        } catch {
            status.issue = "Cannot read owner (not Ownable?)";
            console.log("    [FAIL]", name, "- Cannot read owner");
            console.log("      Contract may not implement Ownable");
        }

        console.log("");

        // Update counters (need to cast away view restriction for this simulation)
        // In actual execution, we track via the status array
    }

    /*//////////////////////////////////////////////////////////////
                        REPORTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prints verification summary with remediation steps
     */
    function _printSummary() internal view {
        console.log("==============================================");
        console.log("           VERIFICATION SUMMARY               ");
        console.log("==============================================");
        console.log("");

        // Count checks
        uint256 totalContracts = 6; // Base contracts
        if (STABILITY_POOL_STRATEGY != address(0)) totalContracts++;

        console.log("Expected Owner:  ", EXPECTED_MULTI_SIG);
        console.log("Total Contracts: ", totalContracts);
        console.log("");
        console.log("Review [PASS] and [FAIL] indicators above.");
        console.log("");

        console.log("==============================================");
        console.log("              REMEDIATION STEPS               ");
        console.log("==============================================");
        console.log("");
        console.log("If any [FAIL] found:");
        console.log("");
        console.log("1. For 'Wrong owner' issues:");
        console.log("   - Current owner must call transferOwnership()");
        console.log("   - Or run TransferOwnership.s.sol again");
        console.log("");
        console.log("2. For 'Owner is zero address':");
        console.log("   - Contract may be incorrectly initialized");
        console.log("   - May need to redeploy");
        console.log("");
        console.log("3. For 'Cannot read owner':");
        console.log("   - Verify contract address is correct");
        console.log("   - Check contract implements Ownable");
        console.log("");
        console.log("4. If multi-sig is not a contract:");
        console.log("   - Deploy a Gnosis Safe multi-sig");
        console.log("   - Update EXPECTED_MULTI_SIG and re-run");
        console.log("");
        console.log("==============================================");
        console.log("");
        console.log("MULTI-SIG SETUP CHECKLIST:");
        console.log("");
        console.log("[ ] Multi-sig has 3+ signers");
        console.log("[ ] Threshold is 2+ signatures");
        console.log("[ ] All signers have confirmed access");
        console.log("[ ] Multi-sig address backed up securely");
        console.log("[ ] Team notified of new owner address");
        console.log("[ ] Documentation updated");
        console.log("");
        console.log("==============================================");
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
