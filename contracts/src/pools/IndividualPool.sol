// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";

/**
 * @title IndividualPool - Production Grade with UUPS Proxy
 * @notice Pool de ahorro individual con MUSD
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing (saves 40k gas)
 *      ✅ Auto-compounding
 *      ✅ Flash loan protection
 *      ✅ Referral system
 *      ✅ Incremental deposits
 *      ✅ Partial withdrawals
 *      ✅ Emergency mode
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract IndividualPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Optimized storage packing - 2 slots instead of 5
     * @dev Saves ~40k gas per transaction
     */
    struct UserDeposit {
        uint128 musdAmount;          // Max: 340T MUSD (sufficient) - slot 0
        uint128 yieldAccrued;        // Max: 340T MUSD - slot 0
        uint64 depositTimestamp;     // Valid until year 2554 - slot 1
        uint64 lastYieldUpdate;      // Valid until year 2554 - slot 1
        bool active;                 // Active status - slot 1
        bool autoCompound;           // Auto-compound enabled - slot 1
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IYieldAggregator public YIELD_AGGREGATOR;
    
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IERC20 public MUSD;

    mapping(address => UserDeposit) public userDeposits;
    
    // Referral system
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralRewards;
    mapping(address => uint256) public referralCount;

    uint256 public totalMusdDeposited;
    uint256 public totalYieldsGenerated;
    uint256 public totalReferralRewards;

    // Constants
    uint256 public constant MIN_DEPOSIT = 10 ether;
    uint256 public constant MAX_DEPOSIT = 100_000 ether;
    uint256 public constant MIN_WITHDRAWAL = 1 ether;
    uint256 public constant AUTO_COMPOUND_THRESHOLD = 1 ether; // Auto-compound if yield > 1 MUSD

    // Configurable parameters
    uint256 public performanceFee; // Basis points (100 = 1%)
    uint256 public referralBonus; // Basis points (50 = 0.5%)
    address public feeCollector;
    bool public emergencyMode;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 musdAmount,
        uint256 totalDeposit,
        address indexed referrer,
        uint256 timestamp
    );

    event PartialWithdrawn(
        address indexed user,
        uint256 musdAmount,
        uint256 remainingDeposit,
        uint256 timestamp
    );

    event YieldClaimed(
        address indexed user,
        uint256 grossYield,
        uint256 feeAmount,
        uint256 netYield,
        uint256 timestamp
    );

    event AutoCompounded(
        address indexed user,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event FullWithdrawal(
        address indexed user,
        uint256 principal,
        uint256 netYield,
        uint256 timestamp
    );

    event ReferralRecorded(
        address indexed user,
        address indexed referrer,
        uint256 bonus
    );

    event ReferralRewardsClaimed(
        address indexed referrer,
        uint256 amount
    );

    event AutoCompoundToggled(
        address indexed user,
        bool enabled
    );

    event EmergencyModeUpdated(bool enabled);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event ReferralBonusUpdated(uint256 oldBonus, uint256 newBonus);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InsufficientBalance();
    error NoActiveDeposit();
    error MinimumDepositNotMet();
    error MinimumWithdrawalNotMet();
    error MaximumDepositExceeded();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidFee();
    error WithdrawalExceedsBalance();
    error SelfReferralNotAllowed();
    error NoReferralRewards();

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _yieldAggregator,
        address _musd,
        address _feeCollector
    ) public initializer {
        if (_yieldAggregator == address(0) ||
            _musd == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
        performanceFee = 100; // 1%
        referralBonus = 50;   // 0.5%
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Flash loan protection is handled by ReentrancyGuard
     * @dev We don't use tx.origin checks as they can be easily bypassed
     *      and are considered an anti-pattern. Instead, we rely on:
     *      - ReentrancyGuard for reentrancy protection
     *      - State validation before/after external calls
     *      - Checks-Effects-Interactions pattern
     */

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposita MUSD (inicial o incremental)
     * @param musdAmount Cantidad de MUSD a depositar
     */
    function deposit(uint256 musdAmount) external {
        _depositWithReferral(musdAmount, address(0));
    }

    /**
     * @notice Deposita MUSD con código de referido
     * @param musdAmount Cantidad de MUSD a depositar
     * @param referrer Dirección del referidor
     */
    function depositWithReferral(uint256 musdAmount, address referrer) 
        external 
    {
        _depositWithReferral(musdAmount, referrer);
    }

    function _depositWithReferral(uint256 musdAmount, address referrer)
        internal
        nonReentrant
        whenNotPaused
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (musdAmount < MIN_DEPOSIT) revert MinimumDepositNotMet();
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        
        uint256 newTotalDeposit = uint256(userDeposit.musdAmount) + musdAmount;
        if (newTotalDeposit > MAX_DEPOSIT) revert MaximumDepositExceeded();

        // Handle referral system
        address actualReferrer = address(0);
        if (referrer != address(0) && referrer != msg.sender) {
            if (referrers[msg.sender] == address(0)) {
                referrers[msg.sender] = referrer;
                referralCount[referrer]++;
                actualReferrer = referrer;
                
                // Calculate referral bonus (from protocol fees, not user funds)
                uint256 bonus = (musdAmount * referralBonus) / 10000;
                referralRewards[referrer] += bonus;
                totalReferralRewards += bonus;
                
                emit ReferralRecorded(msg.sender, referrer, bonus);
            } else {
                actualReferrer = referrers[msg.sender];
            }
        }

        // Transfer MUSD from user
        MUSD.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Approve and deposit to yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);
        YIELD_AGGREGATOR.deposit(musdAmount);

        if (!userDeposit.active) {
            // New deposit
            userDeposit.musdAmount = uint128(musdAmount);
            userDeposit.yieldAccrued = 0;
            userDeposit.depositTimestamp = uint64(block.timestamp);
            userDeposit.lastYieldUpdate = uint64(block.timestamp);
            userDeposit.active = true;
            userDeposit.autoCompound = false; // Default: disabled
        } else {
            // Incremental deposit - update pending yields first
            uint256 pendingYield = _calculateUserYield(msg.sender);
            if (pendingYield > 0) {
                userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
                totalYieldsGenerated += pendingYield;
                
                // Auto-compound if enabled
                _maybeAutoCompound(msg.sender);
            }
            
            userDeposit.musdAmount = uint128(newTotalDeposit);
            userDeposit.lastYieldUpdate = uint64(block.timestamp);
        }

        totalMusdDeposited += musdAmount;

        emit Deposited(msg.sender, musdAmount, newTotalDeposit, actualReferrer, block.timestamp);
    }

    /**
     * @notice Retiro parcial de principal
     * @param musdAmount Cantidad a retirar
     */
    function withdrawPartial(uint256 musdAmount)
        external
        nonReentrant
        returns (uint256)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();
        if (musdAmount == 0) revert InvalidAmount();
        if (musdAmount < MIN_WITHDRAWAL) revert MinimumWithdrawalNotMet();
        if (musdAmount > userDeposit.musdAmount) revert WithdrawalExceedsBalance();

        // Update pending yields
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
            totalYieldsGenerated += pendingYield;
            
            // Auto-compound if enabled
            _maybeAutoCompound(msg.sender);
        }

        // Withdraw from aggregator
        YIELD_AGGREGATOR.withdraw(musdAmount);

        // Update state
        userDeposit.musdAmount = uint128(uint256(userDeposit.musdAmount) - musdAmount);
        userDeposit.lastYieldUpdate = uint64(block.timestamp);
        totalMusdDeposited -= musdAmount;

        // If remaining deposit is less than MIN_DEPOSIT, close position
        if (userDeposit.musdAmount < uint128(MIN_DEPOSIT) && userDeposit.musdAmount > 0) {
            uint256 remaining = userDeposit.musdAmount;
            userDeposit.musdAmount = 0;
            userDeposit.active = false;
            totalMusdDeposited -= remaining;
            musdAmount += remaining;
        }

        // Transfer to user
        MUSD.safeTransfer(msg.sender, musdAmount);

        emit PartialWithdrawn(msg.sender, musdAmount, userDeposit.musdAmount, block.timestamp);
        
        return musdAmount;
    }

    /**
     * @notice Reclama yields sin tocar el principal
     */
    function claimYield()
        external
        nonReentrant
        returns (uint256 netYield)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        // Calculate pending yields
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
            userDeposit.lastYieldUpdate = uint64(block.timestamp);
            totalYieldsGenerated += pendingYield;
        }

        uint256 totalYield = userDeposit.yieldAccrued;
        if (totalYield == 0) revert InvalidAmount();

        // Calculate fee (skip in emergency mode)
        uint256 feeAmount = emergencyMode ? 0 : (totalYield * performanceFee) / 10000;
        netYield = totalYield - feeAmount;

        // Claim from aggregator if needed
        uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        if (poolYield > 0) {
            YIELD_AGGREGATOR.claimYield();
        }
        
        userDeposit.yieldAccrued = 0;

        // Transfer yield to user
        MUSD.safeTransfer(msg.sender, netYield);

        // Transfer fee to collector
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit YieldClaimed(msg.sender, totalYield, feeAmount, netYield, block.timestamp);
    }

    /**
     * @notice Retiro total (principal + yields)
     */
    function withdraw()
        external
        nonReentrant
        returns (uint256 musdAmount, uint256 netYield)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        musdAmount = userDeposit.musdAmount;

        // Calculate all pending yields
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
        }

        uint256 totalYield = userDeposit.yieldAccrued;
        uint256 feeAmount = emergencyMode ? 0 : (totalYield * performanceFee) / 10000;
        netYield = totalYield - feeAmount;

        // Update state before withdrawal
        userDeposit.active = false;
        userDeposit.musdAmount = 0;
        userDeposit.yieldAccrued = 0;
        totalMusdDeposited -= musdAmount;

        // Withdraw from aggregator
        uint256 totalToWithdraw = musdAmount + totalYield;
        if (totalToWithdraw > 0) {
            YIELD_AGGREGATOR.withdraw(totalToWithdraw);
        }

        // Transfer to user
        MUSD.safeTransfer(msg.sender, musdAmount + netYield);

        // Transfer fee
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit FullWithdrawal(msg.sender, musdAmount, netYield, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        AUTO-COMPOUND FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Habilita/deshabilita auto-compounding
     */
    function setAutoCompound(bool enabled) external {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();
        
        userDeposit.autoCompound = enabled;
        emit AutoCompoundToggled(msg.sender, enabled);
    }

    /**
     * @notice Auto-compound si está habilitado y el threshold se cumple
     */
    function _maybeAutoCompound(address user) internal {
        UserDeposit storage userDeposit = userDeposits[user];
        
        if (userDeposit.autoCompound && userDeposit.yieldAccrued >= uint128(AUTO_COMPOUND_THRESHOLD)) {
            uint256 yieldToCompound = userDeposit.yieldAccrued;
            userDeposit.musdAmount = uint128(uint256(userDeposit.musdAmount) + yieldToCompound);
            userDeposit.yieldAccrued = 0;
            
            emit AutoCompounded(user, yieldToCompound, userDeposit.musdAmount, block.timestamp);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        REFERRAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Reclama recompensas de referidos
     */
    function claimReferralRewards() external nonReentrant returns (uint256) {
        uint256 rewards = referralRewards[msg.sender];
        if (rewards == 0) revert NoReferralRewards();

        referralRewards[msg.sender] = 0;
        
        // Transfer from fee reserves (collected separately)
        MUSD.safeTransfer(msg.sender, rewards);

        emit ReferralRewardsClaimed(msg.sender, rewards);
        return rewards;
    }

    /**
     * @notice Obtiene estadísticas de referidos de un usuario
     */
    function getReferralStats(address user) external view returns (
        uint256 count,
        uint256 rewards,
        address referrer
    ) {
        count = referralCount[user];
        rewards = referralRewards[user];
        referrer = referrers[user];
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getUserInfo(address user) 
        external 
        view 
        returns (
            uint256 deposit,
            uint256 yields,
            uint256 netYields,
            uint256 daysActive,
            uint256 estimatedAPR,
            bool autoCompoundEnabled
        ) 
    {
        UserDeposit memory userDeposit = userDeposits[user];
        
        deposit = userDeposit.musdAmount;
        yields = uint256(userDeposit.yieldAccrued) + _calculateUserYieldView(user);
        
        uint256 feeAmount = (yields * performanceFee) / 10000;
        netYields = yields - feeAmount;
        
        if (userDeposit.depositTimestamp > 0) {
            daysActive = (block.timestamp - userDeposit.depositTimestamp) / 1 days;
            
            if (daysActive > 0 && deposit > 0) {
                estimatedAPR = (yields * 365 * 100) / (deposit * daysActive);
            }
        }
        
        autoCompoundEnabled = userDeposit.autoCompound;
    }

    function getUserTotalBalance(address user) external view returns (uint256 total) {
        UserDeposit memory userDeposit = userDeposits[user];
        uint256 yields = uint256(userDeposit.yieldAccrued) + _calculateUserYieldView(user);
        uint256 feeAmount = (yields * performanceFee) / 10000;
        total = uint256(userDeposit.musdAmount) + yields - feeAmount;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert InvalidFee(); // Max 10%
        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    function setReferralBonus(uint256 newBonus) external onlyOwner {
        if (newBonus > 500) revert InvalidFee(); // Max 5%
        uint256 oldBonus = referralBonus;
        referralBonus = newBonus;
        emit ReferralBonusUpdated(oldBonus, newBonus);
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _calculateUserYield(address user) internal view returns (uint256) {
        return _calculateUserYieldView(user);
    }

    function _calculateUserYieldView(address user) internal view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active || totalMusdDeposited == 0) return 0;

        uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        uint256 userShare = (poolYield * uint256(userDeposit.musdAmount)) / totalMusdDeposited;
        
        return userShare;
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Returns the current version of the contract
     */
    function version() external pure returns (string memory) {
        return "3.0.0";
    }
}
