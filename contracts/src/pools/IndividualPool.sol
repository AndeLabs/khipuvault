// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";

/**
 * @title IndividualPool V2
 * @notice Pool de ahorro individual con MUSD - Versión mejorada para producción
 * @dev Mejoras UX:
 *      - Depósitos incrementales
 *      - Retiros parciales
 *      - Emergency withdraw sin fees
 *      - View functions optimizadas para frontend
 *      - Events mejorados con más información
 * 
 * @author KhipuVault Team
 */
contract IndividualPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct UserDeposit {
        uint256 musdAmount;          // MUSD depositado (18 decimals)
        uint256 yieldAccrued;        // Yields acumulados (en MUSD)
        uint256 depositTimestamp;    // Timestamp del primer depósito
        uint256 lastYieldUpdate;     // Última vez que se actualizaron yields
        bool active;                 // Estado del depósito
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IYieldAggregator public immutable YIELD_AGGREGATOR;
    IERC20 public immutable MUSD;

    mapping(address => UserDeposit) public userDeposits;

    uint256 public totalMusdDeposited;
    uint256 public totalYieldsGenerated;

    uint256 public constant MIN_DEPOSIT = 10 ether;
    uint256 public constant MAX_DEPOSIT = 100_000 ether;
    uint256 public constant MIN_WITHDRAWAL = 1 ether;  // Minimum 1 MUSD for partial withdrawals

    uint256 public performanceFee = 100; // 1% in basis points
    address public feeCollector;

    bool public emergencyMode;  // Emergency mode disables fees

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 musdAmount,
        uint256 totalDeposit,  // Total después del depósito
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

    event FullWithdrawal(
        address indexed user,
        uint256 principal,
        uint256 grossYield,
        uint256 feeAmount,
        uint256 netYield,
        uint256 timestamp
    );

    event YieldUpdated(
        address indexed user,
        uint256 newYieldAmount,
        uint256 timestamp
    );

    event EmergencyModeUpdated(bool enabled);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
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

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _yieldAggregator,
        address _musd,
        address _feeCollector
    ) Ownable(msg.sender) {
        if (_yieldAggregator == address(0) ||
            _musd == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposita MUSD (inicial o incremental)
     * @param musdAmount Cantidad de MUSD a depositar
     */
    function deposit(uint256 musdAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (musdAmount < MIN_DEPOSIT) revert MinimumDepositNotMet();
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        
        uint256 newTotalDeposit = userDeposit.musdAmount + musdAmount;
        if (newTotalDeposit > MAX_DEPOSIT) revert MaximumDepositExceeded();

        // Transfer MUSD from user
        MUSD.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Approve and deposit to yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);
        YIELD_AGGREGATOR.deposit(musdAmount);

        if (!userDeposit.active) {
            // New deposit
            userDeposit.musdAmount = musdAmount;
            userDeposit.yieldAccrued = 0;
            userDeposit.depositTimestamp = block.timestamp;
            userDeposit.lastYieldUpdate = block.timestamp;
            userDeposit.active = true;
        } else {
            // Incremental deposit - update pending yields first
            uint256 pendingYield = _calculateUserYield(msg.sender);
            if (pendingYield > 0) {
                userDeposit.yieldAccrued += pendingYield;
                totalYieldsGenerated += pendingYield;
            }
            
            userDeposit.musdAmount += musdAmount;
            userDeposit.lastYieldUpdate = block.timestamp;
        }

        totalMusdDeposited += musdAmount;

        emit Deposited(msg.sender, musdAmount, userDeposit.musdAmount, block.timestamp);
    }

    /**
     * @notice Retiro parcial de principal (mantiene el depósito activo)
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
            userDeposit.yieldAccrued += pendingYield;
            totalYieldsGenerated += pendingYield;
        }

        // Withdraw from aggregator
        YIELD_AGGREGATOR.withdraw(musdAmount);

        // Update state
        userDeposit.musdAmount -= musdAmount;
        userDeposit.lastYieldUpdate = block.timestamp;
        totalMusdDeposited -= musdAmount;

        // If remaining deposit is less than MIN_DEPOSIT, close position
        if (userDeposit.musdAmount < MIN_DEPOSIT && userDeposit.musdAmount > 0) {
            // Withdraw remaining and close
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
     * @return netYield Yields netos después de fees
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
            userDeposit.yieldAccrued += pendingYield;
            userDeposit.lastYieldUpdate = block.timestamp;
            totalYieldsGenerated += pendingYield;
        }

        uint256 totalYield = userDeposit.yieldAccrued;
        if (totalYield == 0) revert InvalidAmount();

        // Calculate fee (skip in emergency mode)
        uint256 feeAmount = emergencyMode ? 0 : (totalYield * performanceFee) / 10000;
        netYield = totalYield - feeAmount;

        // Claim from aggregator
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
     * @return musdAmount Principal retirado
     * @return netYield Yields netos retirados
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
            userDeposit.yieldAccrued += pendingYield;
        }

        uint256 totalYield = userDeposit.yieldAccrued;
        uint256 feeAmount = emergencyMode ? 0 : (totalYield * performanceFee) / 10000;
        netYield = totalYield - feeAmount;

        // Update state before withdrawal
        userDeposit.active = false;
        totalMusdDeposited -= musdAmount;

        // Withdraw from aggregator
        uint256 totalToWithdraw = musdAmount + totalYield;
        YIELD_AGGREGATOR.withdraw(totalToWithdraw);

        // Transfer to user
        MUSD.safeTransfer(msg.sender, musdAmount + netYield);

        // Transfer fee
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit FullWithdrawal(msg.sender, musdAmount, totalYield, feeAmount, netYield, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene información completa del usuario para el frontend
     * @param user Dirección del usuario
     * @return deposit Depósito principal
     * @return yields Yields acumulados (incluyendo pendientes)
     * @return netYields Yields netos después de fees
     * @return daysActive Días desde el primer depósito
     * @return estimatedAPR APR estimado basado en yields
     */
    function getUserInfo(address user) 
        external 
        view 
        returns (
            uint256 deposit,
            uint256 yields,
            uint256 netYields,
            uint256 daysActive,
            uint256 estimatedAPR
        ) 
    {
        UserDeposit memory userDeposit = userDeposits[user];
        
        deposit = userDeposit.musdAmount;
        yields = userDeposit.yieldAccrued + _calculateUserYieldView(user);
        
        uint256 feeAmount = (yields * performanceFee) / 10000;
        netYields = yields - feeAmount;
        
        if (userDeposit.depositTimestamp > 0) {
            daysActive = (block.timestamp - userDeposit.depositTimestamp) / 1 days;
            
            // Calculate APR: (yields / deposit) * (365 / daysActive) * 100
            if (daysActive > 0 && deposit > 0) {
                estimatedAPR = (yields * 365 * 100) / (deposit * daysActive);
            }
        }
    }

    /**
     * @notice Vista rápida del balance total del usuario
     * @param user Dirección del usuario
     * @return total Total (principal + yields netos)
     */
    function getUserTotalBalance(address user) external view returns (uint256 total) {
        UserDeposit memory userDeposit = userDeposits[user];
        uint256 yields = userDeposit.yieldAccrued + _calculateUserYieldView(user);
        uint256 feeAmount = (yields * performanceFee) / 10000;
        total = userDeposit.musdAmount + yields - feeAmount;
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
        // Implementation from original contract
        return _calculateUserYieldView(user);
    }

    function _calculateUserYieldView(address user) internal view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active || totalMusdDeposited == 0) return 0;

        // Get pool's pending yield from aggregator
        uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        
        // Calculate user's proportional share
        uint256 userShare = (poolYield * userDeposit.musdAmount) / totalMusdDeposited;
        
        return userShare;
    }
}
