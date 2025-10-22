// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IYieldAggregator
 * @notice Interface for DeFi yield aggregation and management
 * @dev Handles deposits to various yield vaults (Aave, Compound, etc.) and yield distribution
 */
interface IYieldAggregator {
    /**
     * @notice Supported yield strategies
     */
    enum YieldStrategy {
        AAVE,           // Aave lending
        COMPOUND,       // Compound lending
        CURVE,          // Curve stable pools
        YEARN,          // Yearn vaults
        CONVEX          // Convex pools
    }

    /**
     * @notice Yield vault information
     */
    struct VaultInfo {
        address vaultAddress;
        YieldStrategy strategy;
        uint256 apr;                // Annual Percentage Rate in basis points
        uint256 totalDeposited;     // Total MUSD deposited
        uint256 totalYield;         // Total yield generated
        bool active;                // Vault status
        uint256 minDeposit;         // Minimum deposit amount
        uint256 maxDeposit;         // Maximum deposit amount (0 = no limit)
    }

    /**
     * @notice User position in yield vaults
     */
    struct UserPosition {
        uint256 principal;          // Original deposit amount
        uint256 yieldAccrued;       // Yield accrued but not claimed
        uint256 lastUpdateTime;     // Last time yields were calculated
        uint256 shares;             // Vault shares owned
    }

    /**
     * @notice Emitted when MUSD is deposited to a yield vault
     */
    event YieldDeposited(
        address indexed user,
        address indexed vault,
        uint256 amount,
        uint256 shares
    );

    /**
     * @notice Emitted when MUSD is withdrawn from a yield vault
     */
    event YieldWithdrawn(
        address indexed user,
        address indexed vault,
        uint256 amount,
        uint256 yield
    );

    /**
     * @notice Emitted when yields are claimed
     */
    event YieldClaimed(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when yields are auto-compounded
     */
    event YieldCompounded(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when a new vault is added
     */
    event VaultAdded(
        address indexed vault,
        YieldStrategy strategy,
        uint256 apr
    );

    /**
     * @notice Emitted when a vault is updated
     */
    event VaultUpdated(
        address indexed vault,
        uint256 newApr,
        bool active
    );

    /**
     * @notice Deposits MUSD to the optimal yield vault
     * @param amount Amount of MUSD to deposit
     * @return vaultAddress Address of the vault where funds were deposited
     * @return shares Amount of vault shares received
     */
    function deposit(uint256 amount) 
        external 
        returns (address vaultAddress, uint256 shares);

    /**
     * @notice Deposits MUSD to a specific yield vault
     * @param vaultAddress Address of the target vault
     * @param amount Amount of MUSD to deposit
     * @return shares Amount of vault shares received
     */
    function depositToVault(address vaultAddress, uint256 amount) 
        external 
        returns (uint256 shares);

    /**
     * @notice Withdraws MUSD and accrued yields from all vaults
     * @param amount Amount of MUSD to withdraw (0 = withdraw all)
     * @return totalWithdrawn Total MUSD withdrawn (principal + yield)
     */
    function withdraw(uint256 amount) 
        external 
        returns (uint256 totalWithdrawn);

    /**
     * @notice Withdraws from a specific vault
     * @param vaultAddress Address of the vault
     * @param shares Amount of shares to redeem (0 = all shares)
     * @return amount Total MUSD withdrawn
     */
    function withdrawFromVault(address vaultAddress, uint256 shares) 
        external 
        returns (uint256 amount);

    /**
     * @notice Claims accrued yields without withdrawing principal
     * @return yieldAmount Amount of yield claimed
     */
    function claimYield() 
        external 
        returns (uint256 yieldAmount);

    /**
     * @notice Auto-compounds yields by reinvesting them
     * @return compoundedAmount Amount that was compounded
     */
    function compoundYields() 
        external 
        returns (uint256 compoundedAmount);

    /**
     * @notice Gets pending yield for a user across all vaults
     * @param user Address of the user
     * @return pendingYield Total pending yield in MUSD
     */
    function getPendingYield(address user) 
        external 
        view 
        returns (uint256 pendingYield);

    /**
     * @notice Gets pending yield for a user in a specific vault
     * @param user Address of the user
     * @param vaultAddress Address of the vault
     * @return pendingYield Pending yield in MUSD
     */
    function getPendingYieldInVault(address user, address vaultAddress) 
        external 
        view 
        returns (uint256 pendingYield);

    /**
     * @notice Gets user's total position across all vaults
     * @param user Address of the user
     * @return principal Total principal deposited
     * @return yields Total yields accrued
     */
    function getUserPosition(address user) 
        external 
        view 
        returns (uint256 principal, uint256 yields);

    /**
     * @notice Gets user's position in a specific vault
     * @param user Address of the user
     * @param vaultAddress Address of the vault
     * @return position User's position details
     */
    function getUserPositionInVault(address user, address vaultAddress) 
        external 
        view 
        returns (UserPosition memory position);

    /**
     * @notice Gets information about a vault
     * @param vaultAddress Address of the vault
     * @return info Vault information
     */
    function getVaultInfo(address vaultAddress) 
        external 
        view 
        returns (VaultInfo memory info);

    /**
     * @notice Gets all active vaults
     * @return vaults Array of active vault addresses
     */
    function getActiveVaults() 
        external 
        view 
        returns (address[] memory vaults);

    /**
     * @notice Gets the vault with highest APR
     * @return vaultAddress Address of the best vault
     * @return apr Current APR of the vault
     */
    function getBestVault() 
        external 
        view 
        returns (address vaultAddress, uint256 apr);

    /**
     * @notice Calculates expected yield over a time period
     * @param amount Principal amount
     * @param vaultAddress Address of the vault
     * @param timeInSeconds Time period in seconds
     * @return expectedYield Projected yield amount
     */
    function calculateExpectedYield(
        uint256 amount,
        address vaultAddress,
        uint256 timeInSeconds
    ) external view returns (uint256 expectedYield);

    /**
     * @notice Gets total value locked across all vaults
     * @return tvl Total value locked in MUSD
     */
    function getTotalValueLocked() 
        external 
        view 
        returns (uint256 tvl);

    /**
     * @notice Gets weighted average APR across all active vaults
     * @return avgApr Weighted average APR in basis points
     */
    function getAverageApr()
        external 
        view 
        returns (uint256 avgApr);

    /**
     * @notice Emergency withdraw all funds from a vault (admin only)
     * @param vaultAddress Address of the vault
     */
    function emergencyWithdrawFromVault(address vaultAddress) external;

    /**
     * @notice Pauses deposits to all vaults (admin only)
     */
    function pauseDeposits() external;

    /**
     * @notice Resumes deposits to all vaults (admin only)
     */
    function resumeDeposits() external;
}