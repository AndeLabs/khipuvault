// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";

/**
 * @title IndividualPool
 * @notice Permite a usuarios individuales depositar MUSD y ganar yields optimizados
 * @dev Pool simplificado enfocado en yield management, no en collateral management
 * 
 * IMPORTANTE: Solo acepta MUSD (no BTC directo)
 * - Los usuarios deben obtener MUSD primero en mezo.org
 * - MUSD tiene 18 decimales (ERC20 estándar)
 * - Nos enfocamos solo en optimizar yields, no en CDP management
 * 
 * Flujo principal:
 * 1. Usuario obtiene MUSD en mezo.org (deposita BTC allá)
 * 2. Usuario aprueba MUSD a este contrato
 * 3. Usuario deposita MUSD en IndividualPool
 * 4. MUSD se deposita en yield aggregator para ganar rendimientos
 * 5. Yields se acumulan automáticamente
 * 6. Usuario puede retirar en cualquier momento
 */
contract IndividualPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Información del depósito de un usuario
     */
    struct UserDeposit {
        uint256 musdAmount;          // MUSD depositado (18 decimals)
        uint256 yieldAccrued;        // Yields acumulados (en MUSD)
        uint256 depositTimestamp;    // Timestamp del depósito
        uint256 lastYieldUpdate;     // Última vez que se actualizaron yields
        bool active;                 // Estado del depósito
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Yield aggregator contract
    IYieldAggregator public immutable YIELD_AGGREGATOR;

    /// @notice MUSD token (Mezo native stablecoin)
    IERC20 public immutable MUSD;

    /// @notice Depósitos por usuario
    mapping(address => UserDeposit) public userDeposits;

    /// @notice Total MUSD depositado en el pool
    uint256 public totalMusdDeposited;

    /// @notice Total yields generados
    uint256 public totalYieldsGenerated;

    /// @notice Minimum deposit amount (10 MUSD)
    uint256 public constant MIN_DEPOSIT = 10 ether;

    /// @notice Maximum deposit amount (100,000 MUSD)
    uint256 public constant MAX_DEPOSIT = 100_000 ether;

    /// @notice Performance fee (1% = 100 basis points)
    uint256 public performanceFee = 100; // 1%

    /// @notice Fee collector address
    address public feeCollector;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 musdAmount,
        uint256 timestamp
    );

    event YieldClaimed(
        address indexed user,
        uint256 yieldAmount,
        uint256 feeAmount
    );

    event Withdrawn(
        address indexed user,
        uint256 musdAmount,
        uint256 yieldAmount
    );

    event YieldUpdated(
        address indexed user,
        uint256 newYieldAmount
    );

    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);

    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InsufficientBalance();
    error NoActiveDeposit();
    error MinimumDepositNotMet();
    error MaximumDepositExceeded();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidFee();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _yieldAggregator Address of yield aggregator contract
     * @param _musd Address of MUSD token (Mezo native stablecoin)
     * @param _feeCollector Address to collect performance fees
     */
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
     * @notice Deposita MUSD para generar yields optimizados
     * @dev Usuario debe aprobar MUSD antes de llamar esta función
     *      Si el usuario ya tiene un depósito activo, se incrementa el monto
     * @param musdAmount Cantidad de MUSD a depositar (18 decimales)
     */
    function deposit(uint256 musdAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (musdAmount < MIN_DEPOSIT) revert MinimumDepositNotMet();
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        
        // Validar que el depósito total no exceda el máximo
        uint256 newTotalDeposit = userDeposit.musdAmount + musdAmount;
        if (newTotalDeposit > MAX_DEPOSIT) revert MaximumDepositExceeded();

        // 1. Transferir MUSD del usuario al contrato
        MUSD.safeTransferFrom(msg.sender, address(this), musdAmount);

        // 2. Aprobar yield aggregator para usar MUSD
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);

        // 3. Depositar MUSD en yield vault
        YIELD_AGGREGATOR.deposit(musdAmount);

        // 4. Si es un depósito nuevo, inicializar; si es existente, actualizar yields primero
        if (!userDeposit.active) {
            // Depósito inicial
            userDeposit.musdAmount = musdAmount;
            userDeposit.yieldAccrued = 0;
            userDeposit.depositTimestamp = block.timestamp;
            userDeposit.lastYieldUpdate = block.timestamp;
            userDeposit.active = true;
        } else {
            // Depósito incremental - actualizar yields pendientes primero
            uint256 pendingYield = _calculateUserYield(msg.sender);
            if (pendingYield > 0) {
                userDeposit.yieldAccrued += pendingYield;
                totalYieldsGenerated += pendingYield;
            }
            
            // Incrementar el depósito
            userDeposit.musdAmount += musdAmount;
            userDeposit.lastYieldUpdate = block.timestamp;
            // depositTimestamp se mantiene como el original
        }

        // 5. Actualizar totales
        totalMusdDeposited += musdAmount;

        emit Deposited(msg.sender, musdAmount, block.timestamp);
    }

    /**
     * @notice Actualiza los yields acumulados de un usuario
     * @dev Calcula yields basado en el tiempo transcurrido y la posición del pool
     */
    function updateYield() external nonReentrant {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        uint256 pendingYield = _calculateUserYield(msg.sender);
        
        if (pendingYield > 0) {
            userDeposit.yieldAccrued += pendingYield;
            userDeposit.lastYieldUpdate = block.timestamp;
            totalYieldsGenerated += pendingYield;

            emit YieldUpdated(msg.sender, userDeposit.yieldAccrued);
        }
    }

    /**
     * @notice Reclama yields acumulados sin retirar el principal
     * @return yieldAmount Cantidad de yields reclamados (después de fees)
     */
    function claimYield() 
        external 
        nonReentrant 
        returns (uint256 yieldAmount) 
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        // Calcular yields pendientes del usuario
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued += pendingYield;
            userDeposit.lastYieldUpdate = block.timestamp;
        }

        uint256 totalYield = userDeposit.yieldAccrued;
        if (totalYield == 0) revert InvalidAmount();

        // Calcular fee
        uint256 feeAmount = (totalYield * performanceFee) / 10000;
        yieldAmount = totalYield - feeAmount;

        // Reclamar proporción del yield del pool desde el aggregator
        uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        if (poolYield > 0) {
            YIELD_AGGREGATOR.claimYield();
        }
        
        // Reset yield accrued
        userDeposit.yieldAccrued = 0;

        // Transferir yield al usuario
        MUSD.safeTransfer(msg.sender, yieldAmount);

        // Transferir fee al collector
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit YieldClaimed(msg.sender, yieldAmount, feeAmount);
    }

    /**
     * @notice Retira todo (principal + yields)
     * @return musdAmount Cantidad de MUSD principal devuelta
     * @return yieldAmount Cantidad de yields en MUSD
     */
    function withdraw() 
        external 
        nonReentrant 
        returns (uint256 musdAmount, uint256 yieldAmount) 
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        musdAmount = userDeposit.musdAmount;

        // 1. Calcular yields pendientes del usuario
        uint256 pendingYield = _calculateUserYield(msg.sender);
        if (pendingYield > 0) {
            userDeposit.yieldAccrued += pendingYield;
        }

        uint256 totalYield = userDeposit.yieldAccrued;

        // 2. Calcular fee sobre yields
        uint256 feeAmount = (totalYield * performanceFee) / 10000;
        yieldAmount = totalYield - feeAmount;

        // 3. Verificar cuánto MUSD tiene el pool directamente
        uint256 poolMusdBalance = MUSD.balanceOf(address(this));
        
        // 4. Actualizar estado ANTES de retirar del aggregator
        // Esto asegura que el siguiente cálculo de yield para otros usuarios sea correcto
        userDeposit.active = false;
        uint256 oldTotalMusd = totalMusdDeposited;
        totalMusdDeposited -= musdAmount;
        
        // 5. Si el pool no tiene suficiente MUSD para cubrir principal + yields,
        // retirar del aggregator solo lo necesario
        uint256 totalNeeded = musdAmount + totalYield;
        
        if (poolMusdBalance < totalNeeded) {
            uint256 amountToWithdraw = totalNeeded - poolMusdBalance;
            
            // Si este es el último usuario (totalMusdDeposited == 0), retirar todo del aggregator
            if (totalMusdDeposited == 0) {
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
                if (aggregatorBalance > 0) {
                    try YIELD_AGGREGATOR.withdraw(aggregatorBalance) {
                        // Withdraw exitoso - recalcular con balance real
                        poolMusdBalance = MUSD.balanceOf(address(this));
                        if (poolMusdBalance >= musdAmount) {
                            uint256 availableForYield = poolMusdBalance - musdAmount;
                            totalYield = availableForYield;
                            feeAmount = (totalYield * performanceFee) / 10000;
                            yieldAmount = totalYield - feeAmount;
                        }
                    } catch {
                        // Si falla, usar solo lo que hay en el pool
                        if (poolMusdBalance >= musdAmount) {
                            uint256 availableForYield = poolMusdBalance - musdAmount;
                            totalYield = availableForYield;
                            feeAmount = (totalYield * performanceFee) / 10000;
                            yieldAmount = totalYield - feeAmount;
                        } else {
                            yieldAmount = 0;
                            feeAmount = 0;
                        }
                    }
                }
            } else {
                // No es el último usuario - retirar solo lo proporcional
                // Calcular cuánto deberíamos retirar del aggregator de forma proporcional
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
                uint256 proportionalShare = (aggregatorBalance * musdAmount) / oldTotalMusd;
                
                // Retirar el mínimo entre lo que necesitamos y nuestra parte proporcional
                uint256 safeWithdraw = amountToWithdraw < proportionalShare ? amountToWithdraw : proportionalShare;
                
                try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
                    // Recalcular yields con el balance real disponible
                    poolMusdBalance = MUSD.balanceOf(address(this));
                    if (poolMusdBalance >= musdAmount + totalYield) {
                        // Tenemos suficiente para todo
                    } else if (poolMusdBalance >= musdAmount) {
                        // Ajustar yields a lo disponible
                        uint256 availableForYield = poolMusdBalance - musdAmount;
                        totalYield = availableForYield;
                        feeAmount = (totalYield * performanceFee) / 10000;
                        yieldAmount = totalYield - feeAmount;
                    } else {
                        // Caso extremo - no hay suficiente
                        yieldAmount = 0;
                        feeAmount = 0;
                    }
                } catch {
                    // Si falla, ajustar yields a lo que hay disponible
                    if (poolMusdBalance >= musdAmount) {
                        uint256 availableForYield = poolMusdBalance - musdAmount;
                        totalYield = availableForYield;
                        feeAmount = (totalYield * performanceFee) / 10000;
                        yieldAmount = totalYield - feeAmount;
                    } else {
                        yieldAmount = 0;
                        feeAmount = 0;
                    }
                }
            }
        }

        // 6. Transferir MUSD principal al usuario
        MUSD.safeTransfer(msg.sender, musdAmount);

        // 7. Transferir yields al usuario si los hay
        if (yieldAmount > 0) {
            MUSD.safeTransfer(msg.sender, yieldAmount);
        }

        // 8. Transferir fee al collector si hay
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit Withdrawn(msg.sender, musdAmount, yieldAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calcula yields acumulados del usuario (incluyendo pendientes)
     * @param user Dirección del usuario
     * @return totalYield Total de yields (accrued + pending)
     */
    function calculateYield(address user) 
        public 
        view 
        returns (uint256 totalYield) 
    {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active) return 0;

        // Calcular yield proporcional del usuario basado en su share del pool
        uint256 pendingYield = _calculateUserYieldView(user);
        totalYield = userDeposit.yieldAccrued + pendingYield;
    }

    /**
     * @notice Obtiene información completa del depósito del usuario
     * @param user Dirección del usuario
     * @return userDeposit Estructura UserDeposit
     * @return currentYield Yields actuales (incluyendo pendientes)
     * @return netYield Yields netos después de fees
     */
    function getUserInfo(address user) 
        external 
        view 
        returns (
            UserDeposit memory userDeposit,
            uint256 currentYield,
            uint256 netYield
        ) 
    {
        userDeposit = userDeposits[user];
        currentYield = calculateYield(user);
        
        // Calcular yield neto después de fees
        uint256 feeAmount = (currentYield * performanceFee) / 10000;
        netYield = currentYield - feeAmount;
    }

    /**
     * @notice Calcula ROI del usuario
     * @param user Dirección del usuario
     * @return roi ROI en basis points (e.g., 500 = 5%)
     */
    function getUserRoi(address user)
        external 
        view 
        returns (uint256 roi) 
    {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active || userDeposit.musdAmount == 0) return 0;

        uint256 totalYield = calculateYield(user);
        
        // ROI = (yield / principal) * 10000
        roi = (totalYield * 10000) / userDeposit.musdAmount;
    }

    /**
     * @notice Obtiene estadísticas globales del pool
     * @return totalBtc Total BTC depositado
     * @return totalMusd Total MUSD minted
     * @return totalYields Total yields generados
     * @return avgApr APR promedio del yield aggregator
     */
    function getPoolStats() 
        external 
        view 
        returns (
            uint256 totalBtc,
            uint256 totalMusd,
            uint256 totalYields,
            uint256 avgApr
        ) 
    {
        totalBtc = 0; // No manejamos BTC directamente
        totalMusd = totalMusdDeposited;
        totalYields = totalYieldsGenerated;
        avgApr = YIELD_AGGREGATOR.getAverageApr();
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calcula el yield proporcional del usuario (non-view version)
     * @dev Calcula basándose en la proporción del usuario vs el pool total
     * @param user Dirección del usuario
     * @return userYield Yield calculado para el usuario
     */
    function _calculateUserYield(address user) internal view returns (uint256 userYield) {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active || totalMusdDeposited == 0) return 0;

        // Obtener yields totales del pool desde el aggregator
        uint256 poolTotalYield = YIELD_AGGREGATOR.getPendingYield(address(this));
        
        if (poolTotalYield == 0) return 0;

        // Calcular la proporción del usuario en el pool
        // userYield = poolYield * (userMUSD / totalMUSD)
        userYield = (poolTotalYield * userDeposit.musdAmount) / totalMusdDeposited;
    }

    /**
     * @notice Versión view de _calculateUserYield
     * @dev Usada por funciones view para no modificar estado
     * @param user Dirección del usuario
     * @return userYield Yield calculado para el usuario
     */
    function _calculateUserYieldView(address user) internal view returns (uint256 userYield) {
        return _calculateUserYield(user);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Actualiza el performance fee
     * @param newFee Nuevo fee en basis points (max 1000 = 10%)
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert InvalidFee(); // Max 10%
        
        uint256 oldFee = performanceFee;
        performanceFee = newFee;

        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Actualiza el fee collector
     * @param newCollector Nueva dirección del collector
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        
        address oldCollector = feeCollector;
        feeCollector = newCollector;

        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Pausa el contrato (emergencia)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Receive function para aceptar BTC nativo
     * @dev Necesario para recibir BTC de MezoIntegration en withdrawals
     */
    receive() external payable {}
}