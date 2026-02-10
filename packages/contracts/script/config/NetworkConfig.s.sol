// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";

/**
 * @title NetworkConfig
 * @notice Network-specific configuration for KhipuVault deployments
 * @dev Provides separate configs for testnet (lower limits for testing) and mainnet (Mezo-aligned limits)
 *
 * Mezo Protocol Limits (source: https://mezo.org/docs/users/musd):
 * - Minimum Trove Collateral: $1800 USD worth of BTC
 * - Minimum MUSD Debt: 1,800 MUSD
 * - Collateral Ratio: 110% minimum (150% during stress)
 * - Redemption Fee: 0.75%
 */
abstract contract NetworkConfig is Script {
    /*//////////////////////////////////////////////////////////////
                            CHAIN IDS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MEZO_TESTNET_CHAIN_ID = 31611;
    uint256 public constant MEZO_MAINNET_CHAIN_ID = 31612;

    /*//////////////////////////////////////////////////////////////
                            POOL LIMITS
    //////////////////////////////////////////////////////////////*/

    struct PoolLimits {
        uint256 minDeposit;        // IndividualPool minimum deposit
        uint256 maxDeposit;        // IndividualPool maximum deposit
        uint256 minWithdrawal;     // IndividualPool minimum withdrawal
        uint256 minPoolSize;       // CooperativePool minimum total size
        uint256 minContribution;   // RotatingPool minimum contribution
        uint256 maxContribution;   // RotatingPool maximum contribution
        uint256 minPeriodDuration; // RotatingPool minimum period
        uint256 maxPeriodDuration; // RotatingPool maximum period
    }

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    struct NetworkAddresses {
        // Mezo Protocol
        address musdToken;
        address borrowerOperations;
        address priceFeed;
        address hintHelpers;
        address troveManager;
        address stabilityPool;
        // KhipuVault
        address feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                        TESTNET CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Get testnet pool limits (lower for easy testing)
    function getTestnetLimits() internal pure returns (PoolLimits memory) {
        return PoolLimits({
            minDeposit: 0.001 ether,        // 0.001 MUSD - very low for testing
            maxDeposit: 100_000 ether,      // 100k MUSD
            minWithdrawal: 0.001 ether,     // 0.001 MUSD
            minPoolSize: 10 ether,          // 10 MUSD - below Mezo's 1800 for testing
            minContribution: 0.001 ether,   // 0.001 BTC
            maxContribution: 10 ether,      // 10 BTC
            minPeriodDuration: 1 hours,     // 1 hour - quick cycles for testing
            maxPeriodDuration: 90 days      // 90 days
        });
    }

    /// @notice Get testnet addresses
    function getTestnetAddresses() internal pure returns (NetworkAddresses memory) {
        return NetworkAddresses({
            musdToken: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503,
            borrowerOperations: 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5,
            priceFeed: 0x86bCF0841622a5dAC14A313a15f96A95421b9366,
            hintHelpers: 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6,
            troveManager: 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0,
            stabilityPool: 0x3dE27A95C5f2f636D11c9c6AF8d4F61aa55cc9E1,
            feeCollector: 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
        });
    }

    /*//////////////////////////////////////////////////////////////
                        MAINNET CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Get mainnet pool limits (aligned with Mezo protocol)
    function getMainnetLimits() internal pure returns (PoolLimits memory) {
        return PoolLimits({
            minDeposit: 1 ether,            // 1 MUSD minimum
            maxDeposit: 1_000_000 ether,    // 1M MUSD
            minWithdrawal: 1 ether,         // 1 MUSD
            minPoolSize: 1800 ether,        // 1800 MUSD - Mezo minimum trove size
            minContribution: 0.001 ether,   // 0.001 BTC
            maxContribution: 100 ether,     // 100 BTC
            minPeriodDuration: 7 days,      // 7 days - realistic cycles
            maxPeriodDuration: 90 days      // 90 days
        });
    }

    /// @notice Get mainnet addresses (to be updated before mainnet launch)
    function getMainnetAddresses() internal pure returns (NetworkAddresses memory) {
        return NetworkAddresses({
            musdToken: address(0), // TODO: Update with mainnet MUSD
            borrowerOperations: address(0),
            priceFeed: address(0),
            hintHelpers: address(0),
            troveManager: address(0),
            stabilityPool: address(0),
            feeCollector: address(0) // TODO: Update with multisig
        });
    }

    /*//////////////////////////////////////////////////////////////
                        NETWORK DETECTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Get current network configuration
    function getNetworkConfig() internal view returns (PoolLimits memory limits, NetworkAddresses memory addresses) {
        if (block.chainid == MEZO_TESTNET_CHAIN_ID) {
            return (getTestnetLimits(), getTestnetAddresses());
        } else if (block.chainid == MEZO_MAINNET_CHAIN_ID) {
            return (getMainnetLimits(), getMainnetAddresses());
        } else {
            // Default to testnet config for local testing
            return (getTestnetLimits(), getTestnetAddresses());
        }
    }

    /// @notice Check if current network is testnet
    function isTestnet() internal view returns (bool) {
        return block.chainid == MEZO_TESTNET_CHAIN_ID;
    }

    /// @notice Check if current network is mainnet
    function isMainnet() internal view returns (bool) {
        return block.chainid == MEZO_MAINNET_CHAIN_ID;
    }
}
