// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";

/**
 * @title RotatingPool
 * @notice ROSCA (Rotating Savings and Credit Association) implementation with DeFi yields
 * @dev Turn-based distribution system where members take turns receiving pool funds
 *
 * How it works:
 * - Fixed number of members commit to regular contributions
 * - Each period (month), one member receives the total pool
 * - Order is predetermined at pool creation
 * - Meanwhile, funds generate DeFi yields
 * - Extra yields are distributed at the end
 *
 * Benefits:
 * - Traditional ROSCA + DeFi yields
 * - Predictable payout schedule
 * - Community trust + smart contract security
 * - Last members benefit from accumulated yields
 *
 * Example:
 * - 12 members, 0.01 BTC/month contribution
 * - Month 1: Member 1 receives 0.12 BTC
 * - Month 2: Member 2 receives 0.12 BTC
 * - ...plus accumulated yields
 * - Month 12: Member 12 receives 0.12 BTC + all accumulated yields
 */
contract RotatingPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pool status
     */
    enum PoolStatus {
        FORMING, // Accepting members
        ACTIVE, // Pool is running
        COMPLETED, // All payouts done
        CANCELLED // Pool cancelled

    }

    /**
     * @notice Pool information
     */
    struct PoolInfo {
        uint256 poolId;
        string name;
        address creator;
        uint256 memberCount; // Total members
        uint256 contributionAmount; // Contribution per member per period
        uint256 periodDuration; // Duration of each period (in seconds)
        uint256 currentPeriod; // Current payout period (0-indexed)
        uint256 totalPeriods; // Total periods (equals member count)
        uint256 startTime; // Pool start time
        uint256 totalBtcCollected; // Total BTC collected
        uint256 totalMusdMinted; // Total MUSD minted
        uint256 totalYieldGenerated; // Total yields generated
        uint256 yieldDistributed; // Yields already distributed
        PoolStatus status; // Current status
        bool autoAdvance; // Auto-advance to next period
        bool useNativeBtc; // True if pool uses native BTC, false if WBTC
    }

    /**
     * @notice Member information
     */
    struct MemberInfo {
        address memberAddress;
        uint256 memberIndex; // Position in payout order (0-indexed)
        uint256 contributionsMade; // Number of contributions made
        uint256 totalContributed; // Total BTC contributed
        uint256 payoutReceived; // Amount received in their turn
        uint256 yieldReceived; // Extra yield received
        bool hasReceivedPayout; // Whether received main payout
        bool active; // Member is active
    }

    /**
     * @notice Period information
     */
    struct PeriodInfo {
        uint256 periodNumber;
        uint256 startTime;
        uint256 endTime;
        address recipient;
        uint256 payoutAmount;
        uint256 yieldAmount;
        bool completed;
        bool paid;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mezo integration
    IMezoIntegration public immutable MEZO_INTEGRATION;

    /// @notice Yield aggregator
    IYieldAggregator public immutable YIELD_AGGREGATOR;

    /// @notice WBTC token
    IERC20 public immutable WBTC;

    /// @notice MUSD token
    IERC20 public immutable MUSD;

    /// @notice Pool counter
    uint256 public poolCounter;

    /// @notice Pool ID => Pool Info
    mapping(uint256 => PoolInfo) public pools;

    /// @notice Pool ID => Member Address => Member Info
    mapping(uint256 => mapping(address => MemberInfo)) public poolMembers;

    /// @notice Pool ID => Member Index => Member Address
    mapping(uint256 => mapping(uint256 => address)) public poolMemberOrder;

    /// @notice Pool ID => Period Number => Period Info
    mapping(uint256 => mapping(uint256 => PeriodInfo)) public poolPeriods;

    /// @notice Pool ID => Member Addresses array
    mapping(uint256 => address[]) public poolMembersList;

    /// @notice Performance fee (1% = 100 basis points)
    uint256 public performanceFee = 100; // 1%

    /// @notice Fee collector
    address public feeCollector;

    /// @notice H-02 FIX: Block-based flash loan protection
    mapping(address => uint256) public depositBlock;

    /// @notice H-01 FIX: Track refunds for cancelled pools
    mapping(uint256 => mapping(address => bool)) public hasClaimedRefund;

    /// @notice M-04 FIX: Gas optimization - track contributions per period
    /// @dev Pool ID => Period Number => Contribution count
    mapping(uint256 => mapping(uint256 => uint256)) public periodContributions;

    /// @notice M-04 FIX: Gas optimization - track members with payouts
    /// @dev Pool ID => Number of members who received payout
    mapping(uint256 => uint256) public membersWithPayoutCount;

    /// @notice Minimum members per pool
    uint256 public constant MIN_MEMBERS = 3;

    /// @notice Maximum members per pool
    uint256 public constant MAX_MEMBERS = 50;

    /// @notice Minimum contribution (0.001 BTC)
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;

    /// @notice Maximum contribution (10 BTC)
    uint256 public constant MAX_CONTRIBUTION = 10 ether;

    /// @notice Minimum period duration (1 week)
    uint256 public constant MIN_PERIOD_DURATION = 7 days;

    /// @notice Maximum period duration (3 months)
    uint256 public constant MAX_PERIOD_DURATION = 90 days;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 memberCount,
        uint256 contributionAmount,
        uint256 periodDuration
    );

    event PoolStarted(uint256 indexed poolId, uint256 startTime);

    event MemberJoined(uint256 indexed poolId, address indexed member, uint256 memberIndex);

    event ContributionMade(uint256 indexed poolId, address indexed member, uint256 periodNumber, uint256 amount);

    event PayoutDistributed(
        uint256 indexed poolId,
        uint256 periodNumber,
        address indexed recipient,
        uint256 payoutAmount,
        uint256 yieldAmount
    );

    event PeriodAdvanced(uint256 indexed poolId, uint256 newPeriod);

    event PeriodCompleted(uint256 indexed poolId, uint256 period, uint256 totalContributions, uint256 yieldGenerated);

    event PoolCompleted(uint256 indexed poolId, uint256 totalYieldDistributed);

    event PoolCancelled(uint256 indexed poolId, string reason);

    event RefundClaimed(uint256 indexed poolId, address indexed member, uint256 amount);

    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);

    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    event NativeBtcReceived(address indexed sender, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidPoolId();
    error InvalidMemberCount();
    error InvalidContribution();
    error InvalidPeriodDuration();
    error InvalidAddress();
    error PoolNotForming();
    error PoolFull();
    error AlreadyMember();
    error NotMember();
    error PoolNotActive();
    error ContributionAlreadyMade();
    error PeriodNotEnded();
    error PayoutAlreadyDistributed();
    error InvalidPeriod();
    error InsufficientContributions();
    error PoolNotCompleted();
    error InvalidFee();
    error SameBlockWithdrawal();
    error PoolNotCancelled();
    error RefundAlreadyClaimed();
    error NoRefundAvailable();
    error InvalidAmount();
    error WrongContributionMode(); // Pool mode doesn't match contribution type
    error InsufficientNativeBtcBalance(); // Contract lacks native BTC for transfer

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice H-02 FIX: Flash loan protection modifier
     * @dev Prevents withdrawals in the same block as deposits
     */
    modifier noFlashLoan() {
        if (depositBlock[msg.sender] == block.number) {
            revert SameBlockWithdrawal();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _mezoIntegration Mezo integration address
     * @param _yieldAggregator Yield aggregator address
     * @param _wbtc WBTC token address
     * @param _musd MUSD token address
     * @param _feeCollector Fee collector address
     */
    constructor(address _mezoIntegration, address _yieldAggregator, address _wbtc, address _musd, address _feeCollector)
        Ownable(msg.sender)
    {
        if (
            _mezoIntegration == address(0) || _yieldAggregator == address(0) || _wbtc == address(0)
                || _musd == address(0) || _feeCollector == address(0)
        ) revert InvalidAddress();

        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        WBTC = IERC20(_wbtc);
        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                        POOL CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new rotating pool
     * @param name Pool name
     * @param memberCount Number of members
     * @param contributionAmount Contribution per member per period
     * @param periodDuration Duration of each period
     * @param memberAddresses Pre-defined member addresses (can be empty)
     * @return poolId Created pool ID
     */
    function createPool(
        string memory name,
        uint256 memberCount,
        uint256 contributionAmount,
        uint256 periodDuration,
        bool useNativeBtc,
        address[] memory memberAddresses
    ) external whenNotPaused returns (uint256 poolId) {
        if (memberCount < MIN_MEMBERS || memberCount > MAX_MEMBERS) {
            revert InvalidMemberCount();
        }
        if (contributionAmount < MIN_CONTRIBUTION || contributionAmount > MAX_CONTRIBUTION) {
            revert InvalidContribution();
        }
        if (periodDuration < MIN_PERIOD_DURATION || periodDuration > MAX_PERIOD_DURATION) {
            revert InvalidPeriodDuration();
        }

        poolId = ++poolCounter;

        pools[poolId] = PoolInfo({
            poolId: poolId,
            name: name,
            creator: msg.sender,
            memberCount: memberCount,
            contributionAmount: contributionAmount,
            periodDuration: periodDuration,
            currentPeriod: 0,
            totalPeriods: memberCount,
            startTime: 0, // Will be set when pool starts
            totalBtcCollected: 0,
            totalMusdMinted: 0,
            totalYieldGenerated: 0,
            yieldDistributed: 0,
            status: PoolStatus.FORMING,
            autoAdvance: false,
            useNativeBtc: useNativeBtc // Set at creation - immutable
        });

        emit PoolCreated(poolId, msg.sender, name, memberCount, contributionAmount, periodDuration);

        // If member addresses provided, add them automatically
        if (memberAddresses.length > 0) {
            for (uint256 i = 0; i < memberAddresses.length && i < memberCount; i++) {
                if (memberAddresses[i] != address(0)) {
                    _addMember(poolId, memberAddresses[i], i);
                }
            }
        }

        // AUTO-START FIX: If all members were provided at creation, automatically start the pool
        // This improves UX by eliminating the need for an extra transaction
        // Pool creator can still create pools without members and start them manually later
        if (poolMembersList[poolId].length == memberCount) {
            pools[poolId].status = PoolStatus.ACTIVE;
            pools[poolId].startTime = block.timestamp;

            // Initialize first period
            _initializePeriod(poolId, 0);

            emit PoolStarted(poolId, block.timestamp);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        MEMBER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Join a rotating pool
     * @param poolId Pool ID
     */
    function joinPool(uint256 poolId) external nonReentrant whenNotPaused {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.FORMING) revert PoolNotForming();
        if (poolMembersList[poolId].length >= pool.memberCount) revert PoolFull();
        if (poolMembers[poolId][msg.sender].active) revert AlreadyMember();

        uint256 memberIndex = poolMembersList[poolId].length;
        _addMember(poolId, msg.sender, memberIndex);

        // AUTO-START FIX: If this was the last member needed, automatically start the pool
        // This improves UX by eliminating the need for an extra transaction
        if (poolMembersList[poolId].length == pool.memberCount) {
            pool.status = PoolStatus.ACTIVE;
            pool.startTime = block.timestamp;

            // Initialize first period
            _initializePeriod(poolId, 0);

            emit PoolStarted(poolId, block.timestamp);
        }
    }

    /**
     * @notice Make contribution for current period using WBTC
     * @param poolId Pool ID
     * @dev CEI PATTERN: State updates BEFORE external calls where possible
     */
    function makeContribution(uint256 poolId) external nonReentrant whenNotPaused {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.ACTIVE) revert PoolNotActive();
        if (!member.active) revert NotMember();
        if (member.contributionsMade >= pool.totalPeriods) revert ContributionAlreadyMade();

        // H-01 FIX: Validate pool mode matches contribution type
        if (pool.useNativeBtc) revert WrongContributionMode();

        uint256 amount = pool.contributionAmount;

        // H-02 FIX: Record deposit block for flash loan protection
        depositBlock[msg.sender] = block.number;

        // CEI FIX: Update member and pool state BEFORE external calls
        member.contributionsMade++;
        member.totalContributed += amount;
        pool.totalBtcCollected += amount;

        // M-04 FIX: Increment period contribution counter
        periodContributions[poolId][pool.currentPeriod]++;

        // Cache current period for event before potential state changes
        uint256 currentPeriodCache = pool.currentPeriod;

        // External calls AFTER state updates
        // Transfer BTC from member
        WBTC.safeTransferFrom(msg.sender, address(this), amount);

        // Deposit to Mezo and generate yields
        _depositToMezo(poolId, amount);

        emit ContributionMade(poolId, msg.sender, currentPeriodCache, amount);

        // Check if period can be completed
        _checkAndCompletePeriod(poolId);
    }

    /**
     * @notice Make contribution for current period using native BTC
     * @param poolId Pool ID
     * @dev UX IMPROVEMENT: Accepts native BTC for better user experience
     *      No approval needed - just send BTC with the transaction
     */
    function makeContributionNative(uint256 poolId) external payable nonReentrant whenNotPaused {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.ACTIVE) revert PoolNotActive();
        if (!member.active) revert NotMember();
        if (member.contributionsMade >= pool.totalPeriods) revert ContributionAlreadyMade();

        // H-01 FIX: Validate pool mode matches contribution type
        if (!pool.useNativeBtc) revert WrongContributionMode();

        uint256 amount = pool.contributionAmount;

        // Validate native BTC amount
        if (msg.value != amount) revert InvalidAmount();

        // H-02 FIX: Record deposit block for flash loan protection
        depositBlock[msg.sender] = block.number;

        // CEI FIX: Update member and pool state BEFORE external calls
        member.contributionsMade++;
        member.totalContributed += amount;
        pool.totalBtcCollected += amount;

        // M-04 FIX: Increment period contribution counter
        periodContributions[poolId][pool.currentPeriod]++;

        // Cache current period for event before potential state changes
        uint256 currentPeriodCache = pool.currentPeriod;

        // Deposit native BTC to Mezo and generate yields
        _depositNativeBtcToMezo(poolId, amount);

        emit ContributionMade(poolId, msg.sender, currentPeriodCache, amount);

        // Check if period can be completed
        _checkAndCompletePeriod(poolId);
    }

    /**
     * @notice Claim payout for your turn
     * @param poolId Pool ID
     * @dev CEI PATTERN: State updates BEFORE external transfers
     *      H-02 FIX: noFlashLoan prevents same-block deposit+claim
     */
    function claimPayout(uint256 poolId) external nonReentrant noFlashLoan {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();
        if (member.hasReceivedPayout) revert PayoutAlreadyDistributed();

        PeriodInfo storage period = poolPeriods[poolId][member.memberIndex];
        if (!period.completed) revert PeriodNotEnded();
        if (period.paid) revert PayoutAlreadyDistributed();

        uint256 payoutAmount = period.payoutAmount;
        uint256 yieldAmount = period.yieldAmount;

        // Calculate fee on yield
        uint256 feeAmount = (yieldAmount * performanceFee) / 10000;
        uint256 netYield = yieldAmount - feeAmount;

        // CEI FIX: Update ALL state BEFORE any external calls
        member.hasReceivedPayout = true;
        member.payoutReceived = payoutAmount;
        member.yieldReceived = netYield;
        period.paid = true;

        // M-04 FIX: Increment payout counter
        membersWithPayoutCount[poolId]++;

        // Try to claim yields from aggregator if needed (read operation + claim)
        if (yieldAmount > 0) {
            uint256 poolMusdBalance = MUSD.balanceOf(address(this));

            if (poolMusdBalance < yieldAmount) {
                try YIELD_AGGREGATOR.claimYield() {
                    // Claim successful
                } catch {
                    // If fails, adjust yields to available balance
                    poolMusdBalance = MUSD.balanceOf(address(this));
                    if (poolMusdBalance > 0) {
                        yieldAmount = poolMusdBalance;
                        feeAmount = (yieldAmount * performanceFee) / 10000;
                        netYield = yieldAmount - feeAmount;
                    } else {
                        yieldAmount = 0;
                        feeAmount = 0;
                        netYield = 0;
                    }
                }
            }
        }

        // Cache member index for event
        uint256 memberIndex = member.memberIndex;

        emit PayoutDistributed(poolId, memberIndex, msg.sender, payoutAmount, netYield);

        // External transfers AFTER all state updates
        // UX IMPROVEMENT: Support both native BTC and WBTC payouts
        if (pool.useNativeBtc) {
            // H-02 FIX: Verify sufficient native BTC balance before transfer
            if (address(this).balance < payoutAmount) revert InsufficientNativeBtcBalance();

            // Pay out in native BTC for native BTC pools
            (bool success,) = msg.sender.call{value: payoutAmount}("");
            require(success, "Native BTC transfer failed");
        } else {
            // Pay out in WBTC for WBTC pools
            WBTC.safeTransfer(msg.sender, payoutAmount);
        }

        if (netYield > 0) {
            MUSD.safeTransfer(msg.sender, netYield);
        }

        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }
    }

    /**
     * @notice Claim refund for cancelled pool
     * @param poolId Pool ID
     * @dev FIX H-01: Allows members to claim refunds when pool is cancelled
     *      Uses CEI pattern: state updates BEFORE external transfers
     */
    function claimRefund(uint256 poolId) external nonReentrant whenNotPaused {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        // Validations
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.CANCELLED) revert PoolNotCancelled();
        if (!member.active) revert NotMember();
        if (hasClaimedRefund[poolId][msg.sender]) revert RefundAlreadyClaimed();
        if (member.totalContributed == 0) revert NoRefundAvailable();

        uint256 refundAmount = member.totalContributed;

        // CEI: Update state BEFORE external transfer
        hasClaimedRefund[poolId][msg.sender] = true;

        emit RefundClaimed(poolId, msg.sender, refundAmount);

        // External transfer AFTER state update
        // UX IMPROVEMENT: Support both native BTC and WBTC refunds
        if (pool.useNativeBtc) {
            // H-02 FIX: Verify sufficient native BTC balance before transfer
            if (address(this).balance < refundAmount) revert InsufficientNativeBtcBalance();

            // Refund in native BTC for native BTC pools
            (bool success,) = msg.sender.call{value: refundAmount}("");
            require(success, "Native BTC refund failed");
        } else {
            // Refund in WBTC for WBTC pools
            WBTC.safeTransfer(msg.sender, refundAmount);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        PERIOD MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Advance to next period
     * @param poolId Pool ID
     * @dev FIX H-03: Added access control - only pool members or after period elapsed
     */
    function advancePeriod(uint256 poolId) external nonReentrant {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.ACTIVE) revert PoolNotActive();

        // FIX H-03: Validate caller has permission or period has elapsed
        PeriodInfo storage currentPeriod = poolPeriods[poolId][pool.currentPeriod];

        bool isPoolMember = poolMembers[poolId][msg.sender].active;
        bool periodElapsed = block.timestamp >= currentPeriod.startTime + pool.periodDuration;
        bool isOwner = msg.sender == owner();

        if (!isPoolMember && !periodElapsed && !isOwner) {
            revert InvalidAddress();
        }

        _advancePeriod(poolId);
    }

    /**
     * @notice Start the pool (only creator)
     * @param poolId Pool ID
     */
    function startPool(uint256 poolId) external nonReentrant {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.FORMING) revert PoolNotForming();
        if (msg.sender != pool.creator) revert InvalidAddress();
        if (poolMembersList[poolId].length != pool.memberCount) revert InsufficientContributions();

        pool.status = PoolStatus.ACTIVE;
        pool.startTime = block.timestamp;

        // Initialize first period
        _initializePeriod(poolId, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory) {
        return pools[poolId];
    }

    /**
     * @notice Get member information
     */
    function getMemberInfo(uint256 poolId, address member) external view returns (MemberInfo memory) {
        return poolMembers[poolId][member];
    }

    /**
     * @notice Get period information
     */
    function getPeriodInfo(uint256 poolId, uint256 periodNumber) external view returns (PeriodInfo memory) {
        return poolPeriods[poolId][periodNumber];
    }

    /**
     * @notice Get all members of a pool
     */
    function getPoolMembers(uint256 poolId) external view returns (address[] memory) {
        return poolMembersList[poolId];
    }

    /**
     * @notice Get member at specific index in payout order
     */
    function getMemberAtIndex(uint256 poolId, uint256 index) external view returns (address) {
        return poolMemberOrder[poolId][index];
    }

    /**
     * @notice Calculate pending yield for pool
     * @dev poolId is reserved for future per-pool yield tracking
     */
    function getPendingYield(uint256 /* poolId */ ) external view returns (uint256) {
        return YIELD_AGGREGATOR.getPendingYield(address(this));
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats(uint256 poolId)
        external
        view
        returns (
            uint256 totalBtc,
            uint256 totalMusd,
            uint256 totalYield,
            uint256 periodsCompleted,
            uint256 membersWithPayout
        )
    {
        PoolInfo memory pool = pools[poolId];
        totalBtc = pool.totalBtcCollected;
        totalMusd = pool.totalMusdMinted;
        totalYield = pool.totalYieldGenerated;
        periodsCompleted = pool.currentPeriod;

        // M-04 FIX: Use counter instead of O(n) loop
        membersWithPayout = membersWithPayoutCount[poolId];
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add member to pool
     */
    function _addMember(uint256 poolId, address member, uint256 index) internal {
        poolMembers[poolId][member] = MemberInfo({
            memberAddress: member,
            memberIndex: index,
            contributionsMade: 0,
            totalContributed: 0,
            payoutReceived: 0,
            yieldReceived: 0,
            hasReceivedPayout: false,
            active: true
        });

        poolMembersList[poolId].push(member);
        poolMemberOrder[poolId][index] = member;

        emit MemberJoined(poolId, member, index);
    }

    /**
     * @notice Deposit BTC to Mezo and generate yields
     * @dev H-04 FIX: MezoIntegrationV3 now requires native BTC via depositAndMintNative()
     *      For WBTC pools, we deposit directly to YieldAggregator as WBTC backing
     *      until a WBTC→BTC bridge is integrated
     *
     * Production roadmap:
     * 1. Short-term: Use YieldAggregator directly for WBTC yield generation
     * 2. Long-term: Integrate WBTC→native BTC bridge for full Mezo integration
     */
    function _depositToMezo(uint256 poolId, uint256 btcAmount) internal {
        PoolInfo storage pool = pools[poolId];

        // H-04 FIX: WBTC cannot use depositAndMint directly (requires native BTC)
        // For now, we keep WBTC and track value, yield comes from YieldAggregator
        // WBTC stays in contract as collateral

        // Calculate equivalent MUSD value for yield tracking (1:1 for testnet)
        // In production, use price oracle
        uint256 musdEquivalent = btcAmount;

        // If we have MUSD available (from previous operations), use it for yield
        uint256 musdBalance = MUSD.balanceOf(address(this));
        if (musdBalance >= musdEquivalent) {
            // Deposit MUSD to yield aggregator
            MUSD.forceApprove(address(YIELD_AGGREGATOR), musdEquivalent);

            try YIELD_AGGREGATOR.deposit(musdEquivalent) {
                pool.totalMusdMinted += musdEquivalent;
            } catch {
                // Yield deposit failed - continue without yields
                // WBTC is still safely held in contract
            }
        }

        // Note: WBTC remains in contract as backing until claim
        // This is safe because:
        // 1. WBTC is not sent externally until claimPayout
        // 2. Pool tracks totalBtcCollected for proper accounting
        // 3. Members can claim their proportional share
    }

    /**
     * @notice Deposit native BTC to Mezo and generate yields
     * @dev UX IMPROVEMENT: Accepts native BTC and holds it in contract
     *      Native BTC is held safely until payout claims
     *      Future: Integrate with Mezo when MezoIntegration is deployed
     */
    function _depositNativeBtcToMezo(uint256 poolId, uint256 btcAmount) internal {
        PoolInfo storage pool = pools[poolId];

        // Native BTC is already in contract via msg.value
        // We hold it safely until members claim their payouts

        // Note: For testnet without MezoIntegration deployed
        // BTC remains in contract as backing until claim
        // This is safe because:
        // 1. BTC is not sent externally until claimPayout
        // 2. Pool tracks totalBtcCollected for proper accounting
        // 3. Members can claim their proportional share in native BTC

        // Future enhancement: When MezoIntegration is deployed, uncomment:
        // uint256 musdAmount = MEZO_INTEGRATION.depositAndMintNative{value: btcAmount}();
        // MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);
        // (, uint256 shares) = YIELD_AGGREGATOR.deposit(musdAmount);
        // require(shares > 0, "Deposit failed");
        // pool.totalMusdMinted += musdAmount;
    }

    /**
     * @notice Initialize a period
     */
    function _initializePeriod(uint256 poolId, uint256 periodNumber) internal {
        PoolInfo memory pool = pools[poolId];
        address recipient = poolMemberOrder[poolId][periodNumber];

        poolPeriods[poolId][periodNumber] = PeriodInfo({
            periodNumber: periodNumber,
            startTime: block.timestamp,
            endTime: block.timestamp + pool.periodDuration,
            recipient: recipient,
            payoutAmount: 0, // Will be set when period completes
            yieldAmount: 0, // Will be set when period completes
            completed: false,
            paid: false
        });
    }

    /**
     * @notice Check if period can be completed and complete it
     */
    function _checkAndCompletePeriod(uint256 poolId) internal {
        PoolInfo storage pool = pools[poolId];
        uint256 currentPeriod = pool.currentPeriod;

        // M-04 FIX: Use counter instead of O(n) loop
        uint256 contributionsThisPeriod = periodContributions[poolId][currentPeriod];

        // If all contributed, complete period
        if (contributionsThisPeriod == pool.memberCount) {
            _completePeriod(poolId, currentPeriod);
        }
    }

    /**
     * @notice Complete current period
     */
    function _completePeriod(uint256 poolId, uint256 periodNumber) internal {
        PoolInfo storage pool = pools[poolId];
        PeriodInfo storage period = poolPeriods[poolId][periodNumber];

        if (period.completed) revert PayoutAlreadyDistributed();

        // Calculate payout amount (all contributions for this period)
        uint256 payoutAmount = pool.contributionAmount * pool.memberCount;

        // Calculate yield generated - use proportional calculation
        uint256 pendingYield = YIELD_AGGREGATOR.getPendingYield(address(this));

        // Calcular yield proporcional para este período
        // Cada período debería recibir yields proporcionales a su aporte
        uint256 totalPoolContribution = pool.contributionAmount * pool.memberCount * pool.totalPeriods;
        uint256 yieldForPeriod;

        if (totalPoolContribution > 0 && pendingYield > pool.yieldDistributed) {
            uint256 remainingYield = pendingYield - pool.yieldDistributed;

            // FIX C-01: Handle last period separately to avoid division issues
            // and ensure all remaining yield is distributed
            if (periodNumber == pool.totalPeriods - 1) {
                // Last period gets all remaining yield
                yieldForPeriod = remainingYield;
            } else {
                // Distribute yield equally among remaining periods
                uint256 remainingPeriods = pool.totalPeriods - periodNumber;
                if (remainingPeriods > 0) {
                    yieldForPeriod = remainingYield / remainingPeriods;
                } else {
                    yieldForPeriod = 0;
                }
            }
        } else {
            yieldForPeriod = 0;
        }

        // Update period info
        period.payoutAmount = payoutAmount;
        period.yieldAmount = yieldForPeriod;
        period.completed = true;

        // Update pool stats
        pool.totalYieldGenerated += yieldForPeriod;
        pool.yieldDistributed += yieldForPeriod;

        // Emit period completed event
        emit PeriodCompleted(poolId, periodNumber, payoutAmount, yieldForPeriod);

        // AUTO-ADVANCE FIX: Always advance to next period when all members contribute
        // This is better UX - the pool naturally progresses when everyone does their part
        // The autoAdvance flag is kept for potential manual/time-based advancement
        if (pool.currentPeriod < pool.totalPeriods - 1) {
            _advancePeriod(poolId);
        } else {
            // Pool completed - all periods done
            pool.status = PoolStatus.COMPLETED;
            emit PoolCompleted(poolId, pool.totalYieldGenerated);
        }
    }

    /**
     * @notice Advance to next period
     */
    function _advancePeriod(uint256 poolId) internal {
        PoolInfo storage pool = pools[poolId];

        uint256 newPeriod = pool.currentPeriod + 1;
        if (newPeriod >= pool.totalPeriods) revert InvalidPeriod();

        pool.currentPeriod = newPeriod;
        _initializePeriod(poolId, newPeriod);

        emit PeriodAdvanced(poolId, newPeriod);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set performance fee
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert InvalidFee(); // Max 10%

        uint256 oldFee = performanceFee;
        performanceFee = newFee;

        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Set fee collector
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();

        address oldCollector = feeCollector;
        feeCollector = newCollector;

        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Cancel a pool (emergency only)
     */
    function cancelPool(uint256 poolId, string memory reason) external onlyOwner {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();

        pool.status = PoolStatus.CANCELLED;

        emit PoolCancelled(poolId, reason);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Receive function to accept native BTC
     * @dev Required for native BTC contributions and payouts
     *      Emits event for tracking unexpected incoming BTC
     */
    receive() external payable {
        emit NativeBtcReceived(msg.sender, msg.value);
    }
}
