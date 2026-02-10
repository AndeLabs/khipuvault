// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {BasePoolV3} from "./BasePoolV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";
import {YieldCalculations} from "../../libraries/YieldCalculations.sol";

/**
 * @title IndividualPool V3 - Production Grade with UUPS Proxy
 * @notice Pool de ahorro individual con MUSD - Versión con upgrades y optimizaciones
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing (saves 40k gas)
 *      ✅ Auto-compounding
 *      ✅ Flash loan protection (inherited from BasePoolV3)
 *      ✅ Referral system
 *      ✅ Incremental deposits
 *      ✅ Partial withdrawals
 *      ✅ Emergency mode (inherited from BasePoolV3)
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract IndividualPoolV3 is BasePoolV3 {
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

    mapping(address => UserDeposit) public userDeposits;

    // Referral system
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralRewards;
    mapping(address => uint256) public referralCount;

    uint256 public totalMusdDeposited;
    uint256 public totalYieldsGenerated;
    uint256 public totalReferralRewards;

    // C-01 FIX: Track actual reserved funds for referral rewards
    uint256 public referralRewardsReserve;

    // Configurable limits - Individual pool specific
    uint256 public minDeposit;
    uint256 public maxDeposit;
    uint256 public minWithdrawal;
    uint256 public constant AUTO_COMPOUND_THRESHOLD = 1 ether; // Auto-compound if yield > 1 MUSD

    // Configurable parameters - Individual pool specific
    uint256 public referralBonus; // Basis points (50 = 0.5%)

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     * Size: 50 slots - base pool slots (5) - individual pool slots (11) = 34 slots reserved
     * Note: Added 3 configurable limit variables (minDeposit, maxDeposit, minWithdrawal)
     */
    uint256[34] private __gap;

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

    event ReferralBonusUpdated(uint256 oldBonus, uint256 newBonus);

    event PoolLimitsUpdated(uint256 minDeposit, uint256 maxDeposit, uint256 minWithdrawal);

    // Note: EmergencyModeUpdated, PerformanceFeeUpdated, FeeCollectorUpdated inherited from BasePoolV3

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InsufficientBalance();
    error NoActiveDeposit();
    error MinimumDepositNotMet();
    error MinimumWithdrawalNotMet();
    error MaximumDepositExceeded();
    error InvalidAmount();
    error WithdrawalExceedsBalance();
    error FlashLoanDetected();
    error SelfReferralNotAllowed();
    error NoReferralRewards();
    error InsufficientReferralReserve();

    // Note: InvalidAddress, InvalidFee, ZeroAddress, SameBlockWithdrawal, EmergencyModeActive inherited from BasePoolV3

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the IndividualPoolV3 contract
     * @param _musd Address of MUSD token
     * @param _yieldAggregator Address of yield aggregator
     * @param _feeCollector Address to receive fees
     * @param _performanceFee Initial performance fee in basis points
     * @param _minDeposit Minimum deposit amount
     * @param _maxDeposit Maximum deposit amount
     * @param _minWithdrawal Minimum withdrawal amount
     */
    function initialize(
        address _musd,
        address _yieldAggregator,
        address _feeCollector,
        uint256 _performanceFee,
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _minWithdrawal
    ) public initializer {
        if (_yieldAggregator == address(0)) revert ZeroAddress();
        if (_minDeposit == 0 || _maxDeposit == 0 || _minWithdrawal == 0) revert InvalidAmount();
        if (_minDeposit > _maxDeposit) revert InvalidAmount();

        // Initialize base pool
        __BasePool_init(_musd, _feeCollector, _performanceFee);

        // Initialize individual pool specific state
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        referralBonus = 50;   // 0.5%

        // Initialize configurable limits
        minDeposit = _minDeposit;
        maxDeposit = _maxDeposit;
        minWithdrawal = _minWithdrawal;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    // Note: noFlashLoan modifier inherited from BasePoolV3

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
        if (musdAmount < minDeposit) revert MinimumDepositNotMet();

        UserDeposit storage userDeposit = userDeposits[msg.sender];

        uint256 newTotalDeposit = uint256(userDeposit.musdAmount) + musdAmount;
        if (newTotalDeposit > maxDeposit) revert MaximumDepositExceeded();

        // H-01 FIX: Record deposit block for flash loan protection (from BasePoolV3)
        _recordDeposit();

        // Transfer MUSD from user FIRST (CEI pattern)
        MUSD.safeTransferFrom(msg.sender, address(this), musdAmount);

        // C-01 FIX: Handle referral system with proper reserve funding
        // Referral bonus is funded from the deposit itself, not from thin air
        address actualReferrer = address(0);
        uint256 bonus = 0;
        uint256 netDeposit = musdAmount;

        if (referrer != address(0) && referrer != msg.sender) {
            if (referrers[msg.sender] == address(0)) {
                referrers[msg.sender] = referrer;
                referralCount[referrer]++;
                actualReferrer = referrer;

                // C-01 FIX: Calculate bonus and reserve actual funds using library
                (bonus, netDeposit) = YieldCalculations.calculateReferralBonus(musdAmount, referralBonus);

                referralRewards[referrer] += bonus;
                totalReferralRewards += bonus;
                referralRewardsReserve += bonus; // Track actual reserved funds

                emit ReferralRecorded(msg.sender, referrer, bonus);
            } else {
                actualReferrer = referrers[msg.sender];
            }
        }

        // C-01 FIX: Only deposit the net amount (after referral bonus) to yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), netDeposit);
        YIELD_AGGREGATOR.deposit(netDeposit);

        if (!userDeposit.active) {
            // New deposit - C-01 FIX: Record net deposit amount
            userDeposit.musdAmount = uint128(netDeposit);
            userDeposit.yieldAccrued = 0;
            userDeposit.depositTimestamp = uint64(block.timestamp);
            userDeposit.lastYieldUpdate = uint64(block.timestamp);
            userDeposit.active = true;
            userDeposit.autoCompound = false;
        } else {
            // Incremental deposit - update pending yields first
            uint256 pendingYield = _calculateUserYield(msg.sender);
            if (pendingYield > 0) {
                userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
                totalYieldsGenerated += pendingYield;

                // Auto-compound if enabled
                _maybeAutoCompound(msg.sender);
            }

            // C-01 FIX: Update with net deposit
            userDeposit.musdAmount = uint128(uint256(userDeposit.musdAmount) + netDeposit);
            userDeposit.lastYieldUpdate = uint64(block.timestamp);
        }

        // C-01 FIX: Track net deposited amount
        totalMusdDeposited += netDeposit;

        emit Deposited(msg.sender, netDeposit, userDeposit.musdAmount, actualReferrer, block.timestamp);
    }

    /**
     * @notice Retiro parcial de principal
     * @param musdAmount Cantidad a retirar
     */
    function withdrawPartial(uint256 musdAmount)
        external
        nonReentrant
        noFlashLoan
        returns (uint256)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();
        if (musdAmount == 0) revert InvalidAmount();
        if (musdAmount < minWithdrawal) revert MinimumWithdrawalNotMet();
        if (musdAmount > userDeposit.musdAmount) revert WithdrawalExceedsBalance();

        // Update pending yields
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued = uint128(uint256(userDeposit.yieldAccrued) + pendingYield);
            totalYieldsGenerated += pendingYield;

            // Auto-compound if enabled
            _maybeAutoCompound(msg.sender);
        }

        // H-8 FIX: Capture and verify withdraw return value
        uint256 actualWithdrawn = YIELD_AGGREGATOR.withdraw(musdAmount);
        require(actualWithdrawn >= musdAmount, "Insufficient withdrawn");

        // Update state
        userDeposit.musdAmount = uint128(uint256(userDeposit.musdAmount) - musdAmount);
        userDeposit.lastYieldUpdate = uint64(block.timestamp);
        totalMusdDeposited -= musdAmount;

        // If remaining deposit is less than minDeposit, close position
        if (userDeposit.musdAmount < uint128(minDeposit) && userDeposit.musdAmount > 0) {
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
        noFlashLoan
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

        // Calculate fee using base function (handles emergency mode)
        (uint256 feeAmount, uint256 netYieldCalc) = _calculateFee(totalYield);
        netYield = netYieldCalc;

        // CEI FIX: Reset yield BEFORE external calls
        userDeposit.yieldAccrued = 0;

        // Claim from aggregator if needed
        uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        if (poolYield > 0) {
            YIELD_AGGREGATOR.claimYield();
        }

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
        noFlashLoan
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

        // Calculate fee using base function (handles emergency mode)
        (uint256 feeAmount, uint256 netYieldCalc) = _calculateFee(totalYield);
        netYield = netYieldCalc;

        // Update state before withdrawal
        userDeposit.active = false;
        userDeposit.musdAmount = 0;
        userDeposit.yieldAccrued = 0;
        totalMusdDeposited -= musdAmount;

        // H-8 FIX: Withdraw from aggregator and verify return value
        uint256 totalToWithdraw = musdAmount + totalYield;
        if (totalToWithdraw > 0) {
            uint256 actualWithdrawn = YIELD_AGGREGATOR.withdraw(totalToWithdraw);
            require(actualWithdrawn >= totalToWithdraw, "Insufficient withdrawn");
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
            
            // FIX: Ensure global accounting stays in sync
            totalMusdDeposited += yieldToCompound;

            emit AutoCompounded(user, yieldToCompound, userDeposit.musdAmount, block.timestamp);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        REFERRAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Reclama recompensas de referidos
     * @dev C-01 FIX: Now uses reserved funds that were set aside during deposits
     */
    function claimReferralRewards() external nonReentrant returns (uint256) {
        uint256 rewards = referralRewards[msg.sender];
        if (rewards == 0) revert NoReferralRewards();

        // C-01 FIX: Verify we have sufficient reserves
        if (referralRewardsReserve < rewards) revert InsufficientReferralReserve();

        // Update state before transfer (CEI pattern)
        referralRewards[msg.sender] = 0;
        referralRewardsReserve -= rewards;

        // Transfer from reserved funds (now guaranteed to exist)
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
            uint256 userDeposit_,
            uint256 yields,
            uint256 netYields,
            uint256 daysActive,
            uint256 estimatedAPR,
            bool autoCompoundEnabled
        )
    {
        UserDeposit memory userDeposit = userDeposits[user];

        userDeposit_ = userDeposit.musdAmount;
        yields = uint256(userDeposit.yieldAccrued) + _calculateUserYieldView(user);

        // Use library for fee calculation
        (, netYields) = YieldCalculations.calculatePerformanceFee(yields, performanceFee);

        if (userDeposit.depositTimestamp > 0) {
            // FIX: Calculate durationSeconds directly to avoid divide-before-multiply precision loss
            uint256 durationSeconds = block.timestamp - userDeposit.depositTimestamp;
            daysActive = durationSeconds / 1 days;

            if (durationSeconds > 0 && userDeposit_ > 0) {
                // Use library for APR calculation with exact duration
                estimatedAPR = YieldCalculations.calculateAPR(yields, userDeposit_, durationSeconds);
            }
        }

        autoCompoundEnabled = userDeposit.autoCompound;
    }

    function getUserTotalBalance(address user) external view returns (uint256 total) {
        UserDeposit memory userDeposit = userDeposits[user];
        uint256 yields = uint256(userDeposit.yieldAccrued) + _calculateUserYieldView(user);
        // Use library for fee calculation
        (, uint256 netYield) = YieldCalculations.calculatePerformanceFee(yields, performanceFee);
        total = uint256(userDeposit.musdAmount) + netYield;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // Note: setEmergencyMode, setPerformanceFee, setFeeCollector, pause, unpause inherited from BasePoolV3

    /**
     * @notice Set referral bonus percentage
     * @param newBonus New bonus in basis points (max 500 = 5%)
     */
    function setReferralBonus(uint256 newBonus) external onlyOwner {
        if (newBonus > 500) revert InvalidFee(); // Max 5%
        uint256 oldBonus = referralBonus;
        referralBonus = newBonus;
        emit ReferralBonusUpdated(oldBonus, newBonus);
    }

    /**
     * @notice Set pool limits (admin only)
     * @param _minDeposit New minimum deposit
     * @param _maxDeposit New maximum deposit
     * @param _minWithdrawal New minimum withdrawal
     */
    function setPoolLimits(
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _minWithdrawal
    ) external onlyOwner {
        if (_minDeposit == 0 || _maxDeposit == 0 || _minWithdrawal == 0) revert InvalidAmount();
        if (_minDeposit > _maxDeposit) revert InvalidAmount();

        minDeposit = _minDeposit;
        maxDeposit = _maxDeposit;
        minWithdrawal = _minWithdrawal;

        emit PoolLimitsUpdated(_minDeposit, _maxDeposit, _minWithdrawal);
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

        // Use library for proportional yield calculation
        return YieldCalculations.calculateProportionalYield(
            poolYield,
            uint256(userDeposit.musdAmount),
            totalMusdDeposited
        );
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    // Note: _authorizeUpgrade inherited from BasePoolV3

    /**
     * @notice Returns the current version of the contract
     */
    function version() external pure returns (string memory) {
        return "3.0.0";
    }
}
