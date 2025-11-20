// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title Errors
 * @notice Centralized custom errors for KhipuVault
 * @dev Using custom errors saves gas compared to revert strings
 * @author KhipuVault Team
 */
library Errors {
    // ============================================
    // GENERAL ERRORS
    // ============================================

    /// @notice Thrown when an address parameter is zero
    error ZeroAddress();

    /// @notice Thrown when an amount parameter is zero or invalid
    error InvalidAmount();

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    /// @notice Thrown when contract is paused
    error ContractPaused();

    /// @notice Thrown when array lengths don't match
    error LengthMismatch();

    // ============================================
    // DEPOSIT/WITHDRAWAL ERRORS
    // ============================================

    /// @notice Thrown when deposit amount is below minimum
    error BelowMinimumDeposit();

    /// @notice Thrown when deposit amount exceeds maximum
    error ExceedsMaximumDeposit();

    /// @notice Thrown when withdrawal amount exceeds balance
    error InsufficientBalance();

    /// @notice Thrown when no active deposit exists
    error NoActiveDeposit();

    /// @notice Thrown when withdrawal amount is below minimum
    error BelowMinimumWithdrawal();

    // ============================================
    // FLASH LOAN PROTECTION
    // ============================================

    /// @notice Thrown when flash loan attack detected
    error FlashLoanDetected();

    /// @notice Thrown when same-block interaction detected
    error SameBlockInteraction();

    /// @notice Thrown when contract caller is not whitelisted
    error ContractNotWhitelisted();

    // ============================================
    // ORACLE ERRORS
    // ============================================

    /// @notice Thrown when price feed returns zero
    error InvalidPriceData();

    /// @notice Thrown when price data is stale
    error StalePriceData();

    /// @notice Thrown when price deviation exceeds threshold
    error ExcessivePriceDeviation();

    /// @notice Thrown when price feed call fails
    error PriceFeedFailure();

    // ============================================
    // POOL ERRORS
    // ============================================

    /// @notice Thrown when pool doesn't exist
    error PoolNotFound();

    /// @notice Thrown when pool is full
    error PoolFull();

    /// @notice Thrown when pool is not accepting members
    error PoolNotAccepting();

    /// @notice Thrown when user is already a member
    error AlreadyMember();

    /// @notice Thrown when user is not a member
    error NotMember();

    /// @notice Thrown when contribution is too low
    error ContributionTooLow();

    /// @notice Thrown when contribution is too high
    error ContributionTooHigh();

    // ============================================
    // YIELD ERRORS
    // ============================================

    /// @notice Thrown when no yield available to claim
    error NoYieldAvailable();

    /// @notice Thrown when vault is inactive
    error VaultInactive();

    /// @notice Thrown when vault doesn't exist
    error VaultNotFound();

    /// @notice Thrown when vault already exists
    error VaultAlreadyExists();

    /// @notice Thrown when too many vaults
    error TooManyVaults();

    // ============================================
    // MEZO INTEGRATION ERRORS
    // ============================================

    /// @notice Thrown when collateral ratio too low
    error UnhealthyPosition();

    /// @notice Thrown when insufficient collateral
    error InsufficientCollateral();

    /// @notice Thrown when trove doesn't exist
    error TroveNotExists();

    // ============================================
    // ADMIN ERRORS
    // ============================================

    /// @notice Thrown when fee exceeds maximum allowed
    error ExcessiveFee();

    /// @notice Thrown when parameter is invalid
    error InvalidParameter();

    /// @notice Thrown when operation not allowed in current state
    error InvalidState();

    // ============================================
    // REFERRAL ERRORS
    // ============================================

    /// @notice Thrown when trying to refer yourself
    error SelfReferralNotAllowed();

    /// @notice Thrown when no referral rewards to claim
    error NoReferralRewards();

    /// @notice Thrown when referral code invalid
    error InvalidReferralCode();
}
