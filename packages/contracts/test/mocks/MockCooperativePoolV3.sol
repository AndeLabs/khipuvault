// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {CooperativePoolV3} from "../../src/pools/v3/CooperativePoolV3.sol";

/**
 * @title MockCooperativePoolV3
 * @notice Mock contract for testing that disables flash loan protection
 * @dev This contract should ONLY be used for testing purposes
 *      In production, always use the original CooperativePoolV3 with noFlashLoan protection
 */
contract MockCooperativePoolV3 is CooperativePoolV3 {
    /**
     * @notice Override the noFlashLoan modifier to allow testing
     * @dev In tests, tx.origin != msg.sender because the test contract calls the pool
     *      This mock removes that restriction for testing purposes only
     */
    modifier noFlashLoan() override {
        // No flash loan check in tests
        _;
    }
}
