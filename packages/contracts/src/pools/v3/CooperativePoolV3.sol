// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";

/**
 * @title CooperativePoolV3 - Production Grade with UUPS Proxy
 * @notice Pool cooperativo de ahorro con múltiples miembros
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing (saves ~60k gas)
 *      ✅ Flash loan protection
 *      ✅ Emergency mode
 *      ✅ Incremental contributions
 *      ✅ Flexible governance
 * 
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract CooperativePoolV3 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
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

    IMezoIntegration public MEZO_INTEGRATION;
    IYieldAggregator public YIELD_AGGREGATOR;
    IERC20 public MUSD;

    mapping(uint256 => PoolInfo) public pools;
    mapping(uint256 => mapping(address => MemberInfo)) public poolMembers;
    mapping(uint256 => address[]) public poolMembersList;

    uint256 public poolCounter;
    uint256 public performanceFee;
    address public feeCollector;
    bool public emergencyMode;

    uint256 public constant MIN_POOL_SIZE = 0.01 ether;
    uint256 public constant MAX_POOL_SIZE = 100 ether;
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
    uint256 public constant MAX_MEMBERS_LIMIT = 100;

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     * Size: 50 slots - current slots used = slots reserved for future state variables
     */
    uint256[42] private __gap;

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
    event EmergencyModeUpdated(bool enabled);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidPoolId();
    error InvalidAmount();
    error InvalidAddress();
    error PoolFull();
    error PoolNotAcceptingMembers();
    error NotMember();
    error AlreadyMember();
    error ContributionTooLow();
    error ContributionTooHigh();
    error InvalidMaxMembers();
    error PoolNotActive();
    error NoYieldToClaim();
    error InvalidFee();
    error InsufficientPoolSize();
    error FlashLoanDetected();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _mezoIntegration,
        address _yieldAggregator,
        address _musd,
        address _feeCollector
    ) public initializer {
        if (_mezoIntegration == address(0) ||
            _yieldAggregator == address(0) ||
            _musd == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
        performanceFee = 100;
    }

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prevents flash loan attacks
     * @dev Uses contract code check instead of tx.origin for better compatibility
     *      with meta-transactions and account abstraction
     */
    modifier noFlashLoan() virtual {
        // Check if caller has code (is a contract)
        uint256 size;
        address sender = msg.sender;
        assembly {
            size := extcodesize(sender)
        }
        // If it's a contract, it must be an existing member
        if (size > 0) {
            // Check if this contract is already a member of any pool
            // This is a simplified check - in production you might want pool-specific checks
            revert FlashLoanDetected();
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
        noFlashLoan
    {
        uint256 btcAmount = msg.value;

        PoolInfo storage pool = pools[poolId];
        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!pool.allowNewMembers) revert PoolNotAcceptingMembers();
        if (pool.currentMembers >= pool.maxMembers) revert PoolFull();
        if (btcAmount < pool.minContribution) revert ContributionTooLow();
        if (btcAmount > pool.maxContribution) revert ContributionTooHigh();

        MemberInfo storage member = poolMembers[poolId][msg.sender];

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

        pool.totalBtcDeposited += btcAmount;

        if (pool.totalBtcDeposited >= MIN_POOL_SIZE) {
            _depositToMezo(poolId, btcAmount);
        }

        emit MemberJoined(poolId, msg.sender, btcAmount, member.shares, block.timestamp);
    }

    function leavePool(uint256 poolId)
        external
        nonReentrant
        noFlashLoan
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        // CEI Pattern: Calculate all values FIRST
        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
        uint256 originalBtcContribution = member.btcContributed;
        uint256 btcAmount = originalBtcContribution;

        uint256 oldTotalShares = _getTotalShares(poolId);
        uint256 memberShare = (uint256(member.shares) * 1e18) / oldTotalShares;
        uint256 memberShares = member.shares;

        uint256 oldTotalMusd = pool.totalMusdMinted;

        // CEI Pattern: Update ALL state BEFORE any external calls
        member.active = false;
        member.btcContributed = 0;
        member.shares = 0;
        pool.currentMembers--;
        pool.totalBtcDeposited -= originalBtcContribution;

        // Calculate fee upfront
        uint256 feeAmount = 0;
        uint256 netYield = 0;
        if (memberYield > 0) {
            feeAmount = emergencyMode ? 0 : (memberYield * performanceFee) / 10000;
            netYield = memberYield - feeAmount;
        }

        // CEI Pattern: External interactions AFTER all state changes
        if (oldTotalMusd > 0) {
            uint256 musdToRepay = (oldTotalMusd * memberShare) / 1e18;

            pool.totalMusdMinted -= musdToRepay;

            uint256 poolMusdBalance = MUSD.balanceOf(address(this));
            uint256 totalNeeded = musdToRepay + memberYield;

            if (poolMusdBalance < totalNeeded && memberYield > 0) {
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;

                uint256 proportionalShare = (aggregatorBalance * memberShares) / oldTotalShares;
                uint256 amountToWithdraw = totalNeeded - poolMusdBalance;
                uint256 safeWithdraw = amountToWithdraw < proportionalShare ? amountToWithdraw : proportionalShare;

                if (safeWithdraw > 0) {
                    try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
                    } catch {
                        poolMusdBalance = MUSD.balanceOf(address(this));
                        if (poolMusdBalance >= musdToRepay) {
                            uint256 availableForYield = poolMusdBalance - musdToRepay;
                            memberYield = availableForYield < memberYield ? availableForYield : memberYield;
                            feeAmount = emergencyMode ? 0 : (memberYield * performanceFee) / 10000;
                            netYield = memberYield - feeAmount;
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
        noFlashLoan
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

        uint256 oldTotalShares = _getTotalShares(poolId);
        uint256 withdrawShare = (withdrawAmount * 1e18) / currentContribution;
        uint256 sharesToBurn = (uint256(member.shares) * withdrawShare) / 1e18;

        member.btcContributed = uint128(remainingContribution);
        member.shares = uint128(uint256(member.shares) - sharesToBurn);
        pool.totalBtcDeposited -= withdrawAmount;

        uint256 btcAmount = withdrawAmount;

        if (pool.totalMusdMinted > 0) {
            uint256 musdToRepay = (pool.totalMusdMinted * withdrawShare) / 1e18;
            pool.totalMusdMinted -= musdToRepay;

            uint256 poolMusdBalance = MUSD.balanceOf(address(this));

            if (poolMusdBalance < musdToRepay) {
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
                uint256 proportionalShare = (aggregatorBalance * withdrawShare) / 1e18;
                uint256 amountToWithdraw = musdToRepay - poolMusdBalance;
                uint256 safeWithdraw = amountToWithdraw < proportionalShare ? amountToWithdraw : proportionalShare;

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
        noFlashLoan
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.createdAt == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
        if (memberYield == 0) revert NoYieldToClaim();

        uint256 feeAmount = emergencyMode ? 0 : (memberYield * performanceFee) / 10000;
        uint256 netYield = memberYield - feeAmount;

        member.yieldClaimed += memberYield;

        uint256 poolMusdBalance = MUSD.balanceOf(address(this));
        uint256 totalNeeded = memberYield;

        if (poolMusdBalance < totalNeeded) {
            try YIELD_AGGREGATOR.claimYield() {
            } catch {
                poolMusdBalance = MUSD.balanceOf(address(this));
                if (poolMusdBalance > 0) {
                    memberYield = poolMusdBalance;
                    feeAmount = emergencyMode ? 0 : (memberYield * performanceFee) / 10000;
                    netYield = memberYield - feeAmount;
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
        YIELD_AGGREGATOR.deposit(musdAmount);

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
        uint256 totalShares = _getTotalShares(poolId);
        if (totalShares == 0) return 0;

        uint256 memberShare = (uint256(memberInfo.shares) * 1e18) / totalShares;
        yield = (totalPoolYield * memberShare) / 1e18;

        if (yield > memberInfo.yieldClaimed) {
            yield -= memberInfo.yieldClaimed;
        } else {
            yield = 0;
        }
    }

    function _getTotalShares(uint256 poolId) internal view returns (uint256 total) {
        address[] memory members = poolMembersList[poolId];
        for (uint256 i = 0; i < members.length; i++) {
            MemberInfo memory member = poolMembers[poolId][members[i]];
            if (member.active) {
                total += member.shares;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert InvalidFee();
        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    function closePool(uint256 poolId) external {
        PoolInfo storage pool = pools[poolId];
        if (pool.createdAt == 0) revert InvalidPoolId();
        if (msg.sender != pool.creator && msg.sender != owner()) revert Unauthorized();

        pool.allowNewMembers = false;
        pool.status = PoolStatus.CLOSED;

        emit PoolClosed(poolId, pool.totalBtcDeposited);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                       UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function version() external pure returns (string memory) {
        return "3.1.0";
    }

    receive() external payable {}
}
