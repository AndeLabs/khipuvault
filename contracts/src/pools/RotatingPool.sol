// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoIntegration} from "../interfaces/IMezoIntegration.sol";
import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";

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
        FORMING,        // Accepting members
        ACTIVE,         // Pool is running
        COMPLETED,      // All payouts done
        CANCELLED       // Pool cancelled
    }

    /**
     * @notice Pool information
     */
    struct PoolInfo {
        uint256 poolId;
        string name;
        address creator;
        uint256 memberCount;            // Total members
        uint256 contributionAmount;     // Contribution per member per period
        uint256 periodDuration;         // Duration of each period (in seconds)
        uint256 currentPeriod;          // Current payout period (0-indexed)
        uint256 totalPeriods;           // Total periods (equals member count)
        uint256 startTime;              // Pool start time
        uint256 totalBtcCollected;      // Total BTC collected
        uint256 totalMusdMinted;        // Total MUSD minted
        uint256 totalYieldGenerated;    // Total yields generated
        uint256 yieldDistributed;       // Yields already distributed
        PoolStatus status;              // Current status
        bool autoAdvance;               // Auto-advance to next period
    }

    /**
     * @notice Member information
     */
    struct MemberInfo {
        address memberAddress;
        uint256 memberIndex;            // Position in payout order (0-indexed)
        uint256 contributionsMade;      // Number of contributions made
        uint256 totalContributed;       // Total BTC contributed
        uint256 payoutReceived;         // Amount received in their turn
        uint256 yieldReceived;          // Extra yield received
        bool hasReceivedPayout;         // Whether received main payout
        bool active;                    // Member is active
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

    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 memberIndex
    );

    event ContributionMade(
        uint256 indexed poolId,
        address indexed member,
        uint256 periodNumber,
        uint256 amount
    );

    event PayoutDistributed(
        uint256 indexed poolId,
        uint256 periodNumber,
        address indexed recipient,
        uint256 payoutAmount,
        uint256 yieldAmount
    );

    event PeriodAdvanced(
        uint256 indexed poolId,
        uint256 newPeriod
    );

    event PoolCompleted(
        uint256 indexed poolId,
        uint256 totalYieldDistributed
    );

    event PoolCancelled(
        uint256 indexed poolId,
        string reason
    );

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

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _mezoIntegration Mezo integration address
     * @param _yieldAggregator Yield aggregator address
     * @param _musd MUSD token address
     * @param _feeCollector Fee collector address
     */
    constructor(
        address _mezoIntegration,
        address _yieldAggregator,
        address _musd,
        address _feeCollector
    ) Ownable(msg.sender) {
        if (_mezoIntegration == address(0) ||
            _yieldAggregator == address(0) ||
            _musd == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
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
        address[] memory memberAddresses
    ) 
        external 
        whenNotPaused 
        returns (uint256 poolId) 
    {
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
            autoAdvance: false
        });

        emit PoolCreated(
            poolId,
            msg.sender,
            name,
            memberCount,
            contributionAmount,
            periodDuration
        );

        // If member addresses provided, add them automatically
        if (memberAddresses.length > 0) {
            for (uint256 i = 0; i < memberAddresses.length && i < memberCount; i++) {
                if (memberAddresses[i] != address(0)) {
                    _addMember(poolId, memberAddresses[i], i);
                }
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        MEMBER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Join a rotating pool
     * @param poolId Pool ID
     */
    function joinPool(uint256 poolId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.FORMING) revert PoolNotForming();
        if (poolMembersList[poolId].length >= pool.memberCount) revert PoolFull();
        if (poolMembers[poolId][msg.sender].active) revert AlreadyMember();

        uint256 memberIndex = poolMembersList[poolId].length;
        _addMember(poolId, msg.sender, memberIndex);
    }

    /**
     * @notice Make contribution for current period
     * @param poolId Pool ID
     */
    function makeContribution(uint256 poolId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.ACTIVE) revert PoolNotActive();
        if (!member.active) revert NotMember();
        if (member.contributionsMade >= pool.totalPeriods) revert ContributionAlreadyMade();

        uint256 amount = pool.contributionAmount;
        if (msg.value != amount) revert InvalidContribution();

        // Update member info
        member.contributionsMade++;
        member.totalContributed += amount;

        // Update pool info
        pool.totalBtcCollected += amount;

        // Deposit to Mezo and generate yields
        _depositToMezo(poolId, amount);

        emit ContributionMade(poolId, msg.sender, pool.currentPeriod, amount);

        // Check if period can be completed
        _checkAndCompletePeriod(poolId);
    }

    /**
     * @notice Claim payout for your turn
     * @param poolId Pool ID
     */
    function claimPayout(uint256 poolId) 
        external 
        nonReentrant 
    {
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

        // Retirar yields del aggregator si es necesario
        if (yieldAmount > 0) {
            uint256 poolMusdBalance = MUSD.balanceOf(address(this));
            
            if (poolMusdBalance < yieldAmount) {
                // Intentar retirar del aggregator
                uint256 amountToWithdraw = yieldAmount - poolMusdBalance;
                try YIELD_AGGREGATOR.claimYield() {
                    // Claim exitoso
                } catch {
                    // Si falla, ajustar yields a lo disponible
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

        // Update member info
        member.hasReceivedPayout = true;
        member.payoutReceived = payoutAmount;
        member.yieldReceived = netYield;

        // Update period info
        period.paid = true;

        // Transfer payout (in native BTC)
        (bool success, ) = msg.sender.call{value: payoutAmount}("");
        if (!success) revert InvalidAddress();

        // Transfer yield (in MUSD)
        if (netYield > 0) {
            MUSD.safeTransfer(msg.sender, netYield);
        }

        // Transfer fee
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit PayoutDistributed(poolId, member.memberIndex, msg.sender, payoutAmount, netYield);
    }

    /*//////////////////////////////////////////////////////////////
                        PERIOD MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Advance to next period
     * @param poolId Pool ID
     */
    function advancePeriod(uint256 poolId) 
        external 
        nonReentrant 
    {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (pool.status != PoolStatus.ACTIVE) revert PoolNotActive();

        _advancePeriod(poolId);
    }

    /**
     * @notice Start the pool (only creator)
     * @param poolId Pool ID
     */
    function startPool(uint256 poolId) 
        external 
        nonReentrant 
    {
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
    function getPoolInfo(uint256 poolId) 
        external 
        view 
        returns (PoolInfo memory) 
    {
        return pools[poolId];
    }

    /**
     * @notice Get member information
     */
    function getMemberInfo(uint256 poolId, address member) 
        external 
        view 
        returns (MemberInfo memory) 
    {
        return poolMembers[poolId][member];
    }

    /**
     * @notice Get period information
     */
    function getPeriodInfo(uint256 poolId, uint256 periodNumber) 
        external 
        view 
        returns (PeriodInfo memory) 
    {
        return poolPeriods[poolId][periodNumber];
    }

    /**
     * @notice Get all members of a pool
     */
    function getPoolMembers(uint256 poolId) 
        external 
        view 
        returns (address[] memory) 
    {
        return poolMembersList[poolId];
    }

    /**
     * @notice Get member at specific index in payout order
     */
    function getMemberAtIndex(uint256 poolId, uint256 index) 
        external 
        view 
        returns (address) 
    {
        return poolMemberOrder[poolId][index];
    }

    /**
     * @notice Calculate pending yield for pool
     */
    function getPendingYield(uint256 poolId) 
        external 
        view 
        returns (uint256) 
    {
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

        // Count members who received payout
        address[] memory members = poolMembersList[poolId];
        for (uint256 i = 0; i < members.length; i++) {
            if (poolMembers[poolId][members[i]].hasReceivedPayout) {
                membersWithPayout++;
            }
        }
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
     */
    function _depositToMezo(uint256 poolId, uint256 btcAmount) internal {
        PoolInfo storage pool = pools[poolId];

        // Deposit native BTC and mint MUSD
        uint256 musdAmount = MEZO_INTEGRATION.depositAndMint{value: btcAmount}(btcAmount);

        // Approve yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);

        // Deposit to yield vault
        YIELD_AGGREGATOR.deposit(musdAmount);

        // Update pool stats
        pool.totalMusdMinted += musdAmount;
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
            yieldAmount: 0,  // Will be set when period completes
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

        // Check if all members have contributed for this period
        uint256 contributionsThisPeriod = 0;
        address[] memory members = poolMembersList[poolId];
        
        for (uint256 i = 0; i < members.length; i++) {
            if (poolMembers[poolId][members[i]].contributionsMade > currentPeriod) {
                contributionsThisPeriod++;
            }
        }

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
        uint256 periodContribution = pool.contributionAmount * pool.memberCount;
        uint256 totalPoolContribution = pool.contributionAmount * pool.memberCount * pool.totalPeriods;
        uint256 yieldForPeriod;
        
        if (totalPoolContribution > 0 && pendingYield > pool.yieldDistributed) {
            uint256 remainingYield = pendingYield - pool.yieldDistributed;
            yieldForPeriod = (remainingYield * periodContribution) / (totalPoolContribution - (periodNumber * periodContribution));
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

        // Advance to next period if not last
        if (pool.currentPeriod < pool.totalPeriods - 1) {
            if (pool.autoAdvance) {
                _advancePeriod(poolId);
            }
        } else {
            // Pool completed
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
        performanceFee = newFee;
    }

    /**
     * @notice Set fee collector
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }

    /**
     * @notice Cancel a pool (emergency only)
     */
    function cancelPool(uint256 poolId, string memory reason) 
        external 
        onlyOwner 
    {
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
     * @notice Allow contract to receive native BTC
     */
    receive() external payable {}
}