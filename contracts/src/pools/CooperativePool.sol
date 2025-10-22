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
 * @title CooperativePool
 * @notice Permite a múltiples usuarios crear y unirse a pools cooperativos de ahorro
 * @dev Pool comunitario donde rendimientos se distribuyen equitativamente entre miembros
 * 
 * Características:
 * - Múltiples usuarios aportan pequeñas cantidades
 * - Pool alcanza tamaño óptimo para DeFi yields
 * - Rendimientos se reparten equitativamente
 * - Permite entrada/salida flexible
 * - Governanza simple por votación
 */
contract CooperativePool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estado de un pool cooperativo
     */
    enum PoolStatus {
        ACCEPTING,    // Accepting members
        ACTIVE,       // Pool is active and earning yields
        CLOSED        // Pool is closed, no new members
    }

    /**
     * @notice Información de un pool cooperativo
     */
    struct PoolInfo {
        uint256 poolId;
        string name;
        address creator;
        uint256 minContribution;        // Contribución mínima por miembro
        uint256 maxContribution;        // Contribución máxima por miembro
        uint256 maxMembers;             // Máximo de miembros permitidos
        uint256 currentMembers;         // Miembros actuales
        uint256 totalBtcDeposited;      // Total BTC depositado en el pool
        uint256 totalMusdMinted;        // Total MUSD minted
        uint256 totalYieldGenerated;    // Total yields generados
        uint256 createdAt;              // Timestamp de creación
        PoolStatus status;              // Estado del pool
        bool allowNewMembers;           // Permite nuevos miembros
    }

    /**
     * @notice Información de un miembro en un pool
     */
    struct MemberInfo {
        uint256 btcContributed;         // BTC contribuido por el miembro
        uint256 shares;                 // Shares del miembro en el pool
        uint256 yieldClaimed;           // Yields ya reclamados
        uint256 joinedAt;               // Timestamp cuando se unió
        bool active;                    // Estado del miembro
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mezo integration contract
    IMezoIntegration public immutable MEZO_INTEGRATION;

    /// @notice Yield aggregator contract
    IYieldAggregator public immutable YIELD_AGGREGATOR;

    /// @notice WBTC token
    IERC20 public immutable WBTC;

    /// @notice MUSD token
    IERC20 public immutable MUSD;

    /// @notice Counter para pool IDs
    uint256 public poolCounter;

    /// @notice Mapping de pool ID a pool info
    mapping(uint256 => PoolInfo) public pools;

    /// @notice Mapping de pool ID => miembro => info
    mapping(uint256 => mapping(address => MemberInfo)) public poolMembers;

    /// @notice Mapping de pool ID => array de direcciones de miembros
    mapping(uint256 => address[]) public poolMembersList;

    /// @notice Performance fee del protocolo (1% = 100 basis points)
    uint256 public performanceFee = 100; // 1%

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Minimum pool size (0.01 BTC)
    uint256 public constant MIN_POOL_SIZE = 0.01 ether;

    /// @notice Maximum pool size (100 BTC)
    uint256 public constant MAX_POOL_SIZE = 100 ether;

    /// @notice Minimum contribution per member (0.001 BTC)
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;

    /// @notice Maximum members per pool
    uint256 public constant MAX_MEMBERS_LIMIT = 100;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 minContribution,
        uint256 maxMembers
    );

    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 btcAmount,
        uint256 shares
    );

    event MemberLeft(
        uint256 indexed poolId,
        address indexed member,
        uint256 btcAmount,
        uint256 yieldAmount
    );

    event YieldDistributed(
        uint256 indexed poolId,
        uint256 totalYield,
        uint256 membersCount
    );

    event YieldClaimed(
        uint256 indexed poolId,
        address indexed member,
        uint256 yieldAmount
    );

    event PoolStatusUpdated(
        uint256 indexed poolId,
        PoolStatus newStatus
    );

    event PoolClosed(
        uint256 indexed poolId,
        uint256 finalBalance
    );

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

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _mezoIntegration Mezo integration contract address
     * @param _yieldAggregator Yield aggregator contract address
     * @param _wbtc WBTC token address
     * @param _musd MUSD token address
     * @param _feeCollector Fee collector address
     */
    constructor(
        address _mezoIntegration,
        address _yieldAggregator,
        address _wbtc,
        address _musd,
        address _feeCollector
    ) Ownable(msg.sender) {
        if (_mezoIntegration == address(0) ||
            _yieldAggregator == address(0) ||
            _wbtc == address(0) ||
            _musd == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        WBTC = IERC20(_wbtc);
        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                        POOL CREATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Crea un nuevo pool cooperativo
     * @param name Nombre del pool
     * @param minContribution Contribución mínima por miembro
     * @param maxContribution Contribución máxima por miembro
     * @param maxMembers Máximo de miembros
     * @return poolId ID del pool creado
     */
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
            poolId: poolId,
            name: name,
            creator: msg.sender,
            minContribution: minContribution,
            maxContribution: maxContribution,
            maxMembers: maxMembers,
            currentMembers: 0,
            totalBtcDeposited: 0,
            totalMusdMinted: 0,
            totalYieldGenerated: 0,
            createdAt: block.timestamp,
            status: PoolStatus.ACCEPTING,
            allowNewMembers: true
        });

        emit PoolCreated(
            poolId,
            msg.sender,
            name,
            minContribution,
            maxMembers
        );
    }

    /*//////////////////////////////////////////////////////////////
                        MEMBER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Unirse a un pool cooperativo
     * @param poolId ID del pool
     * @param btcAmount Cantidad de BTC a contribuir
     */
    function joinPool(uint256 poolId, uint256 btcAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (!pool.allowNewMembers) revert PoolNotAcceptingMembers();
        if (pool.currentMembers >= pool.maxMembers) revert PoolFull();
        if (poolMembers[poolId][msg.sender].active) revert AlreadyMember();
        if (btcAmount < pool.minContribution) revert ContributionTooLow();
        if (btcAmount > pool.maxContribution) revert ContributionTooHigh();

        // Transferir WBTC del usuario
        WBTC.safeTransferFrom(msg.sender, address(this), btcAmount);

        // Calcular shares (proporcional a contribución)
        uint256 shares = btcAmount;

        // Actualizar member info
        poolMembers[poolId][msg.sender] = MemberInfo({
            btcContributed: btcAmount,
            shares: shares,
            yieldClaimed: 0,
            joinedAt: block.timestamp,
            active: true
        });

        // Agregar a lista de miembros
        poolMembersList[poolId].push(msg.sender);

        // Actualizar pool info
        pool.currentMembers++;
        pool.totalBtcDeposited += btcAmount;

        // Si es el primer depósito o pool está activo, depositar en Mezo
        if (pool.totalBtcDeposited >= MIN_POOL_SIZE) {
            _depositToMezo(poolId, btcAmount);
        }

        emit MemberJoined(poolId, msg.sender, btcAmount, shares);
    }

    /**
     * @notice Salir de un pool cooperativo
     * @param poolId ID del pool
     */
    function leavePool(uint256 poolId) 
        external 
        nonReentrant 
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        // Calcular yields pendientes del miembro
        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);

        // Obtener BTC del miembro
        uint256 btcAmount = member.btcContributed;

        // Calcular proporción del miembro en el pool
        uint256 oldTotalShares = _getTotalShares(poolId);
        uint256 memberShare = (member.shares * 1e18) / oldTotalShares;

        // IMPORTANTE: Actualizar estado ANTES de retirar del aggregator
        // Esto asegura cálculos correctos para el siguiente usuario
        uint256 oldTotalMusd = pool.totalMusdMinted;
        member.active = false;
        pool.currentMembers--;
        pool.totalBtcDeposited -= member.btcContributed;

        // Si el pool tiene fondos en Mezo, retirar proporcionalmente
        if (oldTotalMusd > 0) {
            uint256 musdToRepay = (oldTotalMusd * memberShare) / 1e18;
            
            // Actualizar stats del pool
            pool.totalMusdMinted -= musdToRepay;
            
            // Retirar yields del yield aggregator si es necesario
            uint256 poolMusdBalance = MUSD.balanceOf(address(this));
            uint256 totalNeeded = musdToRepay + memberYield;
            
            if (poolMusdBalance < totalNeeded && memberYield > 0) {
                // Calcular cuánto retirar proporcionalmente del aggregator
                (uint256 aggregatorPrincipal, uint256 aggregatorYields) = YIELD_AGGREGATOR.getUserPosition(address(this));
                uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
                
                // Retirar solo la proporción del miembro
                uint256 proportionalShare = (aggregatorBalance * member.shares) / oldTotalShares;
                uint256 amountToWithdraw = totalNeeded - poolMusdBalance;
                uint256 safeWithdraw = amountToWithdraw < proportionalShare ? amountToWithdraw : proportionalShare;
                
                if (safeWithdraw > 0) {
                    try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
                        // Withdraw exitoso
                    } catch {
                        // Si falla, ajustar yields a lo disponible
                        poolMusdBalance = MUSD.balanceOf(address(this));
                        if (poolMusdBalance >= musdToRepay) {
                            uint256 availableForYield = poolMusdBalance - musdToRepay;
                            memberYield = availableForYield < memberYield ? availableForYield : memberYield;
                        } else {
                            memberYield = 0;
                        }
                    }
                }
            }

            // Aprobar y quemar MUSD en Mezo
            MUSD.forceApprove(address(MEZO_INTEGRATION), musdToRepay);
            uint256 btcReturned = MEZO_INTEGRATION.burnAndWithdraw(musdToRepay);
            btcAmount = btcReturned;
        }

        // Transferir BTC de vuelta al miembro
        WBTC.safeTransfer(msg.sender, btcAmount);

        // Transferir yields si existen
        if (memberYield > 0) {
            uint256 feeAmount = (memberYield * performanceFee) / 10000;
            uint256 netYield = memberYield - feeAmount;

            MUSD.safeTransfer(msg.sender, netYield);
            if (feeAmount > 0) {
                MUSD.safeTransfer(feeCollector, feeAmount);
            }
        }

        emit MemberLeft(poolId, msg.sender, btcAmount, memberYield);
    }

    /**
     * @notice Reclamar yields acumulados sin salir del pool
     * @param poolId ID del pool
     */
    function claimYield(uint256 poolId) 
        external 
        nonReentrant 
    {
        PoolInfo storage pool = pools[poolId];
        MemberInfo storage member = poolMembers[poolId][msg.sender];

        if (pool.poolId == 0) revert InvalidPoolId();
        if (!member.active) revert NotMember();

        uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
        if (memberYield == 0) revert NoYieldToClaim();

        // Calcular fee
        uint256 feeAmount = (memberYield * performanceFee) / 10000;
        uint256 netYield = memberYield - feeAmount;

        // Actualizar yields reclamados
        member.yieldClaimed += memberYield;

        // Retirar yields del aggregator si es necesario
        uint256 poolMusdBalance = MUSD.balanceOf(address(this));
        uint256 totalNeeded = memberYield;
        
        if (poolMusdBalance < totalNeeded) {
            uint256 amountToWithdraw = totalNeeded - poolMusdBalance;
            try YIELD_AGGREGATOR.claimYield() {
                // Claim exitoso
            } catch {
                // Si falla, ajustar yields a lo disponible
                poolMusdBalance = MUSD.balanceOf(address(this));
                if (poolMusdBalance > 0) {
                    memberYield = poolMusdBalance;
                    feeAmount = (memberYield * performanceFee) / 10000;
                    netYield = memberYield - feeAmount;
                } else {
                    revert NoYieldToClaim();
                }
            }
        }

        // Transferir yields
        MUSD.safeTransfer(msg.sender, netYield);
        if (feeAmount > 0) {
            MUSD.safeTransfer(feeCollector, feeAmount);
        }

        emit YieldClaimed(poolId, msg.sender, netYield);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene información de un pool
     * @param poolId ID del pool
     * @return info Información del pool
     */
    function getPoolInfo(uint256 poolId) 
        external 
        view 
        returns (PoolInfo memory info) 
    {
        return pools[poolId];
    }

    /**
     * @notice Obtiene información de un miembro en un pool
     * @param poolId ID del pool
     * @param member Dirección del miembro
     * @return info Información del miembro
     */
    function getMemberInfo(uint256 poolId, address member) 
        external 
        view 
        returns (MemberInfo memory info) 
    {
        return poolMembers[poolId][member];
    }

    /**
     * @notice Obtiene lista de miembros de un pool
     * @param poolId ID del pool
     * @return members Array de direcciones de miembros
     */
    function getPoolMembers(uint256 poolId) 
        external 
        view 
        returns (address[] memory members) 
    {
        return poolMembersList[poolId];
    }

    /**
     * @notice Calcula yields pendientes de un miembro
     * @param poolId ID del pool
     * @param member Dirección del miembro
     * @return pendingYield Yields pendientes
     */
    function calculateMemberYield(uint256 poolId, address member) 
        external 
        view 
        returns (uint256 pendingYield) 
    {
        return _calculateMemberYield(poolId, member);
    }

    /**
     * @notice Obtiene total de shares en un pool
     * @param poolId ID del pool
     * @return totalShares Total de shares
     */
    function getTotalShares(uint256 poolId) 
        external 
        view 
        returns (uint256 totalShares) 
    {
        return _getTotalShares(poolId);
    }

    /**
     * @notice Obtiene estadísticas del pool
     * @param poolId ID del pool
     * @return totalBtc Total BTC depositado
     * @return totalMusd Total MUSD minted
     * @return totalYield Total yields generados
     * @return avgApr APR promedio
     */
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

    /**
     * @notice Deposita BTC en Mezo y genera yields
     * @param poolId ID del pool
     * @param btcAmount Cantidad de BTC a depositar
     */
    function _depositToMezo(uint256 poolId, uint256 btcAmount) internal {
        PoolInfo storage pool = pools[poolId];

        // Aprobar Mezo
        WBTC.forceApprove(address(MEZO_INTEGRATION), btcAmount);

        // Depositar y mint MUSD
        uint256 musdAmount = MEZO_INTEGRATION.depositAndMint(btcAmount);

        // Aprobar yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);

        // Depositar en yield vault
        YIELD_AGGREGATOR.deposit(musdAmount);

        // Actualizar pool stats
        pool.totalMusdMinted += musdAmount;

        // Activar pool si estaba en ACCEPTING
        if (pool.status == PoolStatus.ACCEPTING) {
            pool.status = PoolStatus.ACTIVE;
            emit PoolStatusUpdated(poolId, PoolStatus.ACTIVE);
        }
    }

    /**
     * @notice Calcula yields de un miembro
     * @param poolId ID del pool
     * @param member Dirección del miembro
     * @return yield Yields del miembro
     */
    function _calculateMemberYield(uint256 poolId, address member) 
        internal 
        view 
        returns (uint256 yield) 
    {
        MemberInfo memory memberInfo = poolMembers[poolId][member];
        if (!memberInfo.active) return 0;

        PoolInfo memory pool = pools[poolId];
        if (pool.totalMusdMinted == 0) return 0;

        // Obtener total de yields del pool
        uint256 totalPoolYield = YIELD_AGGREGATOR.getPendingYield(address(this));

        // Calcular proporción del miembro
        uint256 totalShares = _getTotalShares(poolId);
        if (totalShares == 0) return 0;

        uint256 memberShare = (memberInfo.shares * 1e18) / totalShares;
        yield = (totalPoolYield * memberShare) / 1e18;

        // Restar yields ya reclamados
        if (yield > memberInfo.yieldClaimed) {
            yield -= memberInfo.yieldClaimed;
        } else {
            yield = 0;
        }
    }

    /**
     * @notice Obtiene total de shares en un pool
     * @param poolId ID del pool
     * @return total Total de shares
     */
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

    /**
     * @notice Actualiza el performance fee
     * @param newFee Nuevo fee en basis points
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert InvalidFee(); // Max 10%
        performanceFee = newFee;
    }

    /**
     * @notice Actualiza el fee collector
     * @param newCollector Nueva dirección
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }

    /**
     * @notice Cierra un pool (solo creador o owner)
     * @param poolId ID del pool
     */
    function closePool(uint256 poolId) external {
        PoolInfo storage pool = pools[poolId];
        if (pool.poolId == 0) revert InvalidPoolId();
        if (msg.sender != pool.creator && msg.sender != owner()) {
            revert InvalidAddress();
        }

        pool.allowNewMembers = false;
        pool.status = PoolStatus.CLOSED;

        emit PoolClosed(poolId, pool.totalBtcDeposited);
    }

    /**
     * @notice Pausa el contrato
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
}