// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title Events
 * @notice Centralized events for KhipuVault
 * @dev Organized by category for easy tracking and indexing
 * @author KhipuVault Team
 */
library Events {
    // ============================================
    // DEPOSIT/WITHDRAWAL EVENTS
    // ============================================

    /**
     * @notice Emitted when user deposits funds
     * @param user Address of the depositor
     * @param amount Amount deposited
     * @param totalDeposit User's total deposit after this action
     * @param referrer Address of referrer (address(0) if none)
     * @param timestamp Block timestamp
     */
    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 totalDeposit,
        address indexed referrer,
        uint256 timestamp
    );

    /**
     * @notice Emitted when user makes partial withdrawal
     * @param user Address of the user
     * @param amount Amount withdrawn
     * @param remainingDeposit Remaining deposit after withdrawal
     * @param timestamp Block timestamp
     */
    event PartialWithdrawn(
        address indexed user,
        uint256 amount,
        uint256 remainingDeposit,
        uint256 timestamp
    );

    /**
     * @notice Emitted when user makes full withdrawal
     * @param user Address of the user
     * @param principal Principal amount withdrawn
     * @param netYield Net yield amount withdrawn
     * @param timestamp Block timestamp
     */
    event FullWithdrawn(
        address indexed user,
        uint256 principal,
        uint256 netYield,
        uint256 timestamp
    );

    // ============================================
    // YIELD EVENTS
    // ============================================

    /**
     * @notice Emitted when user claims yields
     * @param user Address of the user
     * @param grossYield Gross yield amount before fees
     * @param feeAmount Fee deducted
     * @param netYield Net yield received by user
     * @param timestamp Block timestamp
     */
    event YieldClaimed(
        address indexed user,
        uint256 grossYield,
        uint256 feeAmount,
        uint256 netYield,
        uint256 timestamp
    );

    /**
     * @notice Emitted when yields are auto-compounded
     * @param user Address of the user
     * @param amount Amount compounded
     * @param newTotal New total deposit after compounding
     * @param timestamp Block timestamp
     */
    event AutoCompounded(
        address indexed user,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    /**
     * @notice Emitted when auto-compound setting is toggled
     * @param user Address of the user
     * @param enabled Whether auto-compound is enabled
     */
    event AutoCompoundToggled(
        address indexed user,
        bool enabled
    );

    /**
     * @notice Emitted when yield deposited to aggregator
     * @param user Address of depositor
     * @param vault Vault address
     * @param amount Amount deposited
     * @param shares Shares received
     */
    event YieldDeposited(
        address indexed user,
        address indexed vault,
        uint256 amount,
        uint256 shares
    );

    /**
     * @notice Emitted when yield withdrawn from aggregator
     * @param user Address of user
     * @param vault Vault address
     * @param principal Principal withdrawn
     * @param yieldAmount Yield withdrawn
     */
    event YieldWithdrawn(
        address indexed user,
        address indexed vault,
        uint256 principal,
        uint256 yieldAmount
    );

    /**
     * @notice Emitted when yields are compounded
     * @param user Address of user
     * @param amount Amount compounded
     */
    event YieldCompounded(
        address indexed user,
        uint256 amount
    );

    // ============================================
    // POOL EVENTS
    // ============================================

    /**
     * @notice Emitted when cooperative pool is created
     * @param poolId Pool identifier
     * @param creator Address of creator
     * @param name Pool name
     * @param minContribution Minimum contribution
     * @param maxMembers Maximum number of members
     * @param timestamp Block timestamp
     */
    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 minContribution,
        uint256 maxMembers,
        uint256 timestamp
    );

    /**
     * @notice Emitted when member joins pool
     * @param poolId Pool identifier
     * @param member Address of member
     * @param amount Amount contributed
     * @param shares Shares received
     * @param timestamp Block timestamp
     */
    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    /**
     * @notice Emitted when member leaves pool
     * @param poolId Pool identifier
     * @param member Address of member
     * @param principal Principal returned
     * @param yieldAmount Yield returned
     * @param timestamp Block timestamp
     */
    event MemberLeft(
        uint256 indexed poolId,
        address indexed member,
        uint256 principal,
        uint256 yieldAmount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when pool status changes
     * @param poolId Pool identifier
     * @param newStatus New status (0=ACCEPTING, 1=ACTIVE, 2=CLOSED)
     */
    event PoolStatusUpdated(
        uint256 indexed poolId,
        uint8 newStatus
    );

    /**
     * @notice Emitted when pool is closed
     * @param poolId Pool identifier
     * @param finalBalance Final balance at closure
     */
    event PoolClosed(
        uint256 indexed poolId,
        uint256 finalBalance
    );

    // ============================================
    // VAULT EVENTS
    // ============================================

    /**
     * @notice Emitted when vault is added
     * @param vaultAddress Vault address
     * @param strategy Strategy type
     * @param apr Annual percentage rate (in basis points)
     */
    event VaultAdded(
        address indexed vaultAddress,
        uint8 strategy,
        uint256 apr
    );

    /**
     * @notice Emitted when vault is updated
     * @param vaultAddress Vault address
     * @param apr New APR
     * @param active Whether vault is active
     */
    event VaultUpdated(
        address indexed vaultAddress,
        uint256 apr,
        bool active
    );

    // ============================================
    // MEZO INTEGRATION EVENTS
    // ============================================

    /**
     * @notice Emitted when BTC is deposited to Mezo
     * @param user Address of user
     * @param btcAmount BTC amount deposited
     * @param musdAmount MUSD amount minted
     */
    event BTCDeposited(
        address indexed user,
        uint256 btcAmount,
        uint256 musdAmount
    );

    /**
     * @notice Emitted when BTC is withdrawn from Mezo
     * @param user Address of user
     * @param btcAmount BTC amount withdrawn
     * @param musdAmount MUSD amount burned
     */
    event BTCWithdrawn(
        address indexed user,
        uint256 btcAmount,
        uint256 musdAmount
    );

    // ============================================
    // REFERRAL EVENTS
    // ============================================

    /**
     * @notice Emitted when referral is recorded
     * @param user Address of referred user
     * @param referrer Address of referrer
     * @param bonus Bonus amount allocated to referrer
     */
    event ReferralRecorded(
        address indexed user,
        address indexed referrer,
        uint256 bonus
    );

    /**
     * @notice Emitted when referral rewards are claimed
     * @param referrer Address of referrer
     * @param amount Amount claimed
     */
    event ReferralRewardsClaimed(
        address indexed referrer,
        uint256 amount
    );

    // ============================================
    // ADMIN EVENTS
    // ============================================

    /**
     * @notice Emitted when emergency mode is updated
     * @param enabled Whether emergency mode is enabled
     */
    event EmergencyModeUpdated(bool enabled);

    /**
     * @notice Emitted when performance fee is updated
     * @param oldFee Old fee (basis points)
     * @param newFee New fee (basis points)
     */
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Emitted when referral bonus is updated
     * @param oldBonus Old bonus (basis points)
     * @param newBonus New bonus (basis points)
     */
    event ReferralBonusUpdated(uint256 oldBonus, uint256 newBonus);

    /**
     * @notice Emitted when fee collector is updated
     * @param oldCollector Old collector address
     * @param newCollector New collector address
     */
    event FeeCollectorUpdated(
        address indexed oldCollector,
        address indexed newCollector
    );

    /**
     * @notice Emitted when target LTV is updated
     * @param oldLtv Old LTV (basis points)
     * @param newLtv New LTV (basis points)
     */
    event TargetLtvUpdated(uint256 oldLtv, uint256 newLtv);

    /**
     * @notice Emitted when max fee percentage is updated
     * @param oldFee Old fee
     * @param newFee New fee
     */
    event MaxFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Emitted when payment is allocated (Pull Payment)
     * @param dest Destination address
     * @param amount Amount allocated
     */
    event PaymentAllocated(
        address indexed dest,
        uint256 amount
    );

    /**
     * @notice Emitted when payment is withdrawn (Pull Payment)
     * @param dest Destination address
     * @param amount Amount withdrawn
     */
    event PaymentWithdrawn(
        address indexed dest,
        uint256 amount
    );
}
