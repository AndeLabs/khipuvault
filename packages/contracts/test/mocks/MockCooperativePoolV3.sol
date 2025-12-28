// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {CooperativePoolV3} from "../../src/pools/v3/CooperativePoolV3.sol";

/**
 * @title MockCooperativePoolV3
 * @notice Mock contract for testing that disables flash loan protection
 * @dev This contract should ONLY be used for testing purposes
 *      In production, always use the original CooperativePoolV3 with noPoolFlashLoan protection
 */
contract MockCooperativePoolV3 is CooperativePoolV3 {
    /**
     * @notice Override the noPoolFlashLoan modifier to allow testing
     * @dev In tests, we need to allow same-block operations for testing purposes
     *      This mock removes that restriction for testing purposes only
     * @param poolId The pool ID (unused in mock)
     */
    modifier noPoolFlashLoan(uint256 poolId) override {
        // No flash loan check in tests
        _;
    }
}
