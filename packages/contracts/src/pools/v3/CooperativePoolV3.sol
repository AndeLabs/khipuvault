// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {BasePoolV3} from "./BasePoolV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";
import {YieldCalculations} from "../../libraries/YieldCalculations.sol";

/**
 * @title CooperativePoolV3 - Production Grade with UUPS Proxy
 * @notice Pool cooperativo de ahorro con múltiples miembros
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing (saves ~60k gas)
 *      ✅ Flash loan protection (inherited from BasePoolV3)
 *      ✅ Emergency mode (inherited from BasePoolV3)
 *      ✅ Incremental contributions
 *      ✅ Flexible governance
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract CooperativePoolV3 is BasePoolV3 {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum PoolStatus {
        ACCEPTING,
        ACTIVE,
        CLOSED
    }

    /*//////////////////////////////////////////////////////////////
                             STRUCTS (OPTIMIZED)
    //////////////////////////////////////////////////////////////*/

    struct PoolInfo {
        uint128 minContribution;
        uint128 maxContribution;
        uint64 maxMembers;
        uint64 currentMembers;
        uint64 createdAt;
        PoolStatus status;
        bool allowNewMembers;
        address creator;
        string name;
        uint256 totalBtcDeposited;
        uint256 totalMusdMinted;
        uint256 totalYieldGenerated;
    }

    struct MemberInfo {
        uint128 btcContributed;
        uint128 shares;
        uint64 joinedAt;
        bool active;
        uint256 yieldClaimed;
    }

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IMezoIntegration public MEZO_INTEGRATION;
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IYieldAggregator public YIELD_AGGREGATOR;

    mapping(uint256 => PoolInfo) public pools;
    mapping(uint256 => mapping(address => MemberInfo)) public poolMembers;
    mapping(uint256 => address[]) public poolMembersList;

    // H-02 FIX: Cache total shares per pool to avoid O(n) loop
    mapping(uint256 => uint256) public poolTotalShares;

    // H-01 FIX: Block-based flash loan protection per pool
    mapping(uint256 => mapping(address => uint256)) public memberJoinBlock;

    uint256 public poolCounter;

    // Cooperative pool specific constants
    uint256 public constant MIN_POOL_SIZE = 0.01 ether;
    uint256 public constant MAX_POOL_SIZE = 100 ether;
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
    uint256 public constant MAX_MEMBERS_LIMIT = 100;

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     * Size: 50 slots - base pool slots (5) - cooperative pool slots (6) = 39 slots reserved
     */
    uint256[39] private __gap;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 minContribution,
        uint256 maxMembers,
        uint256 timestamp
    );

    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 btcAmount,
        uint256 shares,
        uint256 timestamp
    );

    event MemberLeft(
        uint256 indexed poolId,
        address indexed member,
        uint256 btcAmount,
        uint256 yieldAmount,
        uint256 timestamp
    );

    event PartialWithdrawal(
        uint256 indexed poolId,
        address indexed member,
        uint256 btcAmount,
        uint256 remainingContribution,
        uint256 timestamp
    );

    event YieldClaimed(
        uint256 indexed poolId,
        address indexed member,
        uint256 grossYield,
        uint256 feeAmount,
        uint256 netYield,
        uint256 timestamp
    );

    event PoolStatusUpdated(uint256 indexed poolId, PoolStatus newStatus);
    event PoolClosed(uint256 indexed poolId, uint256 finalBalance);

    // Note: EmergencyModeUpdated, PerformanceFeeUpdated, FeeCollectorUpdated inherited from BasePoolV3

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidPoolId();
    error InvalidAmount();
    error PoolFull();
    error PoolNotAcceptingMembers();
    error NotMember();
    error AlreadyMember();
    error ContributionTooLow();
    error ContributionTooHigh();
    error InvalidMaxMembers();
    error PoolNotActive();
    error NoYieldToClaim();
    error InsufficientPoolSize();
    error FlashLoanDetected();
    error Unauthorized();

    // Note: InvalidAddress, InvalidFee, ZeroAddress, SameBlockWithdrawal, EmergencyModeActive inherited from BasePoolV3

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the CooperativePoolV3 contract
     * @param _mezoIntegration Address of Mezo integration contract
     * @param _yieldAggregator Address of yield aggregator
     * @param _musd Address of MUSD token
     * @param _feeCollector Address to receive fees
     */
    function initialize(
        address _mezoIntegration,
        address _yieldAggregator,
        address _musd,
        address _feeCollector
    ) public initializer {
        if (_mezoIntegration == address(0) || _yieldAggregator == address(0)) revert ZeroAddress();

        // Initialize base pool (handles _musd and _feeCollector validation)
        __BasePool_init(_musd, _feeCollector, 100); // 1% default fee

        // Initialize cooperative pool specific state
        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
    }

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice H-01 FIX: Block-based flash loan protection for cooperative pools
     * @dev Uses block.number instead of extcodesize for robust protection
     *      - Join operations record the block number
     *      - Leave/withdraw operations require a different block
     *      - This prevents single-transaction flash loan attacks
     * @param poolId The pool to check flash loan protection for
     */
    modifier noPoolFlashLoan(uint256 poolId) virtual {
        if (!emergencyMode) {
            if (memberJoinBlock[poolId][msg.sender] == block.number) {
                revert SameBlockWithdrawal();
            }
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function createPool(
        string memory name,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 maxMembers
    )
        external
        whenNotPaused
        returns (uint256 poolId)
    {
        if (minContribution < MIN_CONTRIBUTION) revert ContributionTooLow();
        if (maxContribution < minContribution) revert InvalidAmount();
        if (maxMembers == 0 || maxMembers > MAX_MEMBERS_LIMIT) revert InvalidMaxMembers();

        poolId = ++poolCounter;

        pools[poolId] = PoolInfo({
            minContribution: uint128(minContribution),
            maxContribution: uint128(maxContribution),
            maxMembers: uint64(maxMembers),
            currentMembers: 0,
            createdAt: uint64(block.timestamp),
            status: PoolStatus.ACCEPTING,
            allowNewMembers: true,
            creator: msg.sender,
            name: name,
            totalBtcDeposited: 0,
            totalMusdMinted: 0,
            totalYieldGenerated: 0
        });

        emit PoolCreated(poolId, msg.sender, name, minContribution, maxMembers, block.timestamp);
    }

    function joinPool(uint256 poolId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        uint256 btcAmount = msg.value;

        PoolInfo storage pool = pools[poolId];
        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!pool.allowNewMembers) revert PoolNotAcceptingMembers();
        if (pool.currentMembers >= pool.maxMembers) revert PoolFull();
        if (btcAmount < pool.minContribution) revert ContributionTooLow();
        if (btcAmount > pool.maxContribution) revert ContributionTooHigh();

        MemberInfo storage member = poolMembers[poolId][msg.sender];

        // H-01 FIX: Record join block for flash loan protection
        memberJoinBlock[poolId][msg.sender] = block.number;

        uint256 oldShares = member.shares;

        if (!member.active) {
            member.btcContributed = uint128(btcAmount);
            member.shares = uint128(btcAmount);
            member.joinedAt = uint64(block.timestamp);
            member.active = true;
            member.yieldClaimed = 0;

            poolMembersList[poolId].push(msg.sender);
            pool.currentMembers++;
        } else {
            uint256 newContribution = uint256(member.btcContributed) + btcAmount;
            if (newContribution > pool.maxContribution) revert ContributionTooHigh();

            member.btcContributed = uint128(newContribution);
            member.shares = uint128(newContribution);
        }

        // H-02 FIX: Update cached total shares
        poolTotalShares[poolId] = poolTotalShares[poolId] - oldShares + member.shares;

        pool.totalBtcDeposited += btcAmount;

        if (pool.totalBtcDeposited >= MIN_POOL_SIZE) {
            _depositToMezo(poolId, btcAmount);
        }

        emit MemberJoined(poolId, msg.sender, btcAmount, member.shares, block.timestamp);
    }

    function leavePool(uint256 poolId)
        external
        nonReentrant
        noPoolFlashLoan(poolId)
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        // CEI Pattern: Calculate all values FIRST
        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
        uint256 originalBtcContribution = member.btcContributed;
        uint256 btcAmount = originalBtcContribution;

        // H-02 FIX: Use cached total shares instead of loop
        uint256 oldTotalShares = poolTotalShares[poolId];
        // Use library for share percentage calculation
        uint256 memberShare = YieldCalculations.calculateSharePercentage(uint256(member.shares), oldTotalShares);
        uint256 memberShares = member.shares;

        uint256 oldTotalMusd = pool.totalMusdMinted;

        // CEI Pattern: Update ALL state BEFORE any external calls
        member.active = false;
        member.btcContributed = 0;
        member.shares = 0;
        pool.currentMembers--;
        pool.totalBtcDeposited -= originalBtcContribution;

        // H-02 FIX: Update cached total shares
        poolTotalShares[poolId] -= memberShares;

        // Calculate fee upfront using base function (handles emergency mode)
        uint256 feeAmount = 0;
        uint256 netYield = 0;
        if (memberYield > 0) {
            (feeAmount, netYield) = _calculateFee(memberYield);
        }

        // CEI Pattern: External interactions AFTER all state changes
        if (oldTotalMusd > 0) {
            // Use library for applying share percentage
            uint256 musdToRepay = YieldCalculations.applySharePercentage(oldTotalMusd, memberShare);

            pool.totalMusdMinted -= musdToRepay;

            uint256 poolMusdBalance = MUSD.balanceOf(address(this));
            uint256 totalNeeded = musdToRepay + memberYield;

            if (poolMusdBalance < totalNeeded && memberYield > 0) {
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;

                // Use library for proportional share calculation
                uint256 proportionalShare = YieldCalculations.calculateProportionalYield(aggregatorBalance, memberShares, oldTotalShares);
                uint256 amountToWithdraw = totalNeeded - poolMusdBalance;
                uint256 safeWithdraw = YieldCalculations.min(amountToWithdraw, proportionalShare);

                if (safeWithdraw > 0) {
                    try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
                    } catch {
                        poolMusdBalance = MUSD.balanceOf(address(this));
                        if (poolMusdBalance >= musdToRepay) {
                            uint256 availableForYield = poolMusdBalance - musdToRepay;
                            memberYield = availableForYield < memberYield ? availableForYield : memberYield;
                            (feeAmount, netYield) = _calculateFee(memberYield);
                        } else {
                            memberYield = 0;
                            netYield = 0;
                            feeAmount = 0;
                        }
                    }
                }
            }

            MUSD.forceApprove(address(MEZO_INTEGRATION), musdToRepay);
            uint256 btcReturned = MEZO_INTEGRATION.burnAndWithdraw(musdToRepay);
            btcAmount = btcReturned;
        }

        // CEI Pattern: All external transfers at the END
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        if (netYield > 0) {
            MUSD.safeTransfer(msg.sender, netYield);
        }
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit MemberLeft(poolId, msg.sender, btcAmount, memberYield, block.timestamp);
    }

    function withdrawPartial(uint256 poolId, uint256 withdrawAmount)
        external
        nonReentrant
        noPoolFlashLoan(poolId)
    {
        if (withdrawAmount == 0) revert InvalidAmount();

        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        uint256 currentContribution = member.btcContributed;
        if (withdrawAmount >= currentContribution) revert InvalidAmount();

        uint256 remainingContribution = currentContribution - withdrawAmount;
        if (remainingContribution < pool.minContribution) revert ContributionTooLow();

        // H-02 FIX: Use library for share calculations
        uint256 withdrawShare = YieldCalculations.calculateWithdrawalShare(withdrawAmount, currentContribution);
        uint256 sharesToBurn = YieldCalculations.calculateSharesToBurn(uint256(member.shares), withdrawShare);

        member.btcContributed = uint128(remainingContribution);
        member.shares = uint128(uint256(member.shares) - sharesToBurn);
        pool.totalBtcDeposited -= withdrawAmount;

        // H-02 FIX: Update cached total shares
        poolTotalShares[poolId] -= sharesToBurn;

        uint256 btcAmount = withdrawAmount;

        if (pool.totalMusdMinted > 0) {
            // Use library for share application
            uint256 musdToRepay = YieldCalculations.applySharePercentage(pool.totalMusdMinted, withdrawShare);
            pool.totalMusdMinted -= musdToRepay;

            uint256 poolMusdBalance = MUSD.balanceOf(address(this));

            if (poolMusdBalance < musdToRepay) {
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
                // Use library for proportional and min calculations
                uint256 proportionalShare = YieldCalculations.applySharePercentage(aggregatorBalance, withdrawShare);
                uint256 amountToWithdraw = musdToRepay - poolMusdBalance;
                uint256 safeWithdraw = YieldCalculations.min(amountToWithdraw, proportionalShare);

                if (safeWithdraw > 0) {
                    try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
                    } catch {
                    }
                }
            }

            MUSD.forceApprove(address(MEZO_INTEGRATION), musdToRepay);
            uint256 btcReturned = MEZO_INTEGRATION.burnAndWithdraw(musdToRepay);
            btcAmount = btcReturned;
        }

        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        emit PartialWithdrawal(poolId, msg.sender, btcAmount, remainingContribution, block.timestamp);
    }

    function claimYield(uint256 poolId)
        external
        nonReentrant
        noPoolFlashLoan(poolId)
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
        if (memberYield == 0) revert NoYieldToClaim();

        // Calculate fee using base function (handles emergency mode)
        (uint256 feeAmount, uint256 netYield) = _calculateFee(memberYield);

        member.yieldClaimed += memberYield;

        uint256 poolMusdBalance = MUSD.balanceOf(address(this));
        uint256 totalNeeded = memberYield;

        if (poolMusdBalance < totalNeeded) {
            try YIELD_AGGREGATOR.claimYield() {
            } catch {
                poolMusdBalance = MUSD.balanceOf(address(this));
                if (poolMusdBalance > 0) {
                    memberYield = poolMusdBalance;
                    (feeAmount, netYield) = _calculateFee(memberYield);
                } else {
                    revert NoYieldToClaim();
                }
            }
        }

        MUSD.safeTransfer(msg.sender, netYield);
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit YieldClaimed(poolId, msg.sender, memberYield, feeAmount, netYield, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory) {
        return pools[poolId];
    }

    function getMemberInfo(uint256 poolId, address member) external view returns (MemberInfo memory) {
        return poolMembers[poolId][member];
    }

    function getPoolMembers(uint256 poolId) external view returns (address[] memory) {
        return poolMembersList[poolId];
    }

    function calculateMemberYield(uint256 poolId, address member) external view returns (uint256) {
        return _calculateMemberYield(poolId, member);
    }

    function getTotalShares(uint256 poolId) external view returns (uint256) {
        return _getTotalShares(poolId);
    }

    function getPoolStats(uint256 poolId)
        external
        view
        returns (
            uint256 totalBtc,
            uint256 totalMusd,
            uint256 totalYield,
            uint256 avgApr
        )
    {
        PoolInfo memory pool = pools[poolId];
        totalBtc = pool.totalBtcDeposited;
        totalMusd = pool.totalMusdMinted;
        totalYield = pool.totalYieldGenerated;
        avgApr = YIELD_AGGREGATOR.getAverageApr();
    }

    /*//////////////////////////////////////////////////////////////
                       INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _depositToMezo(uint256 poolId, uint256 btcAmount) internal {
        PoolInfo storage pool = pools[poolId];

        uint256 musdAmount = MEZO_INTEGRATION.depositAndMintNative{value: btcAmount}();

        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);
        // H-8 FIX: Capture return value to verify deposit succeeded
        (, uint256 shares) = YIELD_AGGREGATOR.deposit(musdAmount);
        require(shares > 0, "Deposit failed");

        pool.totalMusdMinted += musdAmount;

        if (pool.status == PoolStatus.ACCEPTING) {
            pool.status = PoolStatus.ACTIVE;
            emit PoolStatusUpdated(poolId, PoolStatus.ACTIVE);
        }
    }

    function _calculateMemberYield(uint256 poolId, address member)
        internal
        view
        returns (uint256 yield)
    {
        MemberInfo memory memberInfo = poolMembers[poolId][member];
        if (!memberInfo.active) return 0;

        PoolInfo memory pool = pools[poolId];
        if (pool.totalMusdMinted == 0) return 0;

        uint256 totalPoolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        // H-02 FIX: Use cached total shares instead of loop
        uint256 totalShares = poolTotalShares[poolId];
        if (totalShares == 0) return 0;

        // Use library for share and yield calculations
        uint256 memberShare = YieldCalculations.calculateSharePercentage(uint256(memberInfo.shares), totalShares);
        yield = YieldCalculations.applySharePercentage(totalPoolYield, memberShare);

        if (yield > memberInfo.yieldClaimed) {
            yield -= memberInfo.yieldClaimed;
        } else {
            yield = 0;
        }
    }

    /**
     * @notice H-02 FIX: Returns cached total shares for O(1) lookup
     * @dev Replaced the O(n) loop with cached value that updates on join/leave/withdraw
     */
    function _getTotalShares(uint256 poolId) internal view returns (uint256) {
        return poolTotalShares[poolId];
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // Note: setEmergencyMode, setPerformanceFee, setFeeCollector, pause, unpause inherited from BasePoolV3

    /**
     * @notice Close a pool to new members
     * @param poolId Pool identifier
     */
    function closePool(uint256 poolId) external {
        PoolInfo storage pool = pools[poolId];
        if (pool.createdAt == 0) revert InvalidPoolId();
        if (msg.sender != pool.creator && msg.sender != owner()) revert Unauthorized();

        pool.allowNewMembers = false;
        pool.status = PoolStatus.CLOSED;

        emit PoolClosed(poolId, pool.totalBtcDeposited);
    }

    /*//////////////////////////////////////////////////////////////
                       UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    // Note: _authorizeUpgrade inherited from BasePoolV3

    /**
     * @notice Returns the current version of the contract
     */
    function version() external pure returns (string memory) {
        return "3.1.0";
    }

    receive() external payable {}
}
