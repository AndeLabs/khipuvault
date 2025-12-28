// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {VRFCoordinatorV2Interface} from "chainlink-brownie-contracts/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "chainlink-brownie-contracts/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";

/**
 * @title LotteryPool
 * @notice Sistema de lotería donde los participantes nunca pierden su capital
 * @dev Integra Chainlink VRF para sorteos verificables y justos
 * 
 * Innovación clave:
 * - Los participantes aportan BTC
 * - Se genera yield sobre el pool total
 * - El ganador recibe su principal + % de yields
 * - Los demás recuperan su capital + yields proporcionales
 * - Sorteos semanales/mensuales usando Chainlink VRF
 * 
 * Flujo:
 * 1. Usuarios compran tickets con BTC
 * 2. BTC se deposita en Mezo → mint MUSD
 * 3. MUSD genera yields en DeFi
 * 4. Cada período hay sorteo (Chainlink VRF)
 * 5. Ganador recibe principal + 90% de yields
 * 6. 10% de yields van a treasury
 * 7. Perdedores mantienen capital para próximo sorteo
 */
contract LotteryPool is VRFConsumerBaseV2, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estado de una ronda de lotería
     */
    enum LotteryStatus {
        OPEN,           // Aceptando participantes
        DRAWING,        // Sorteo en progreso (esperando VRF)
        COMPLETED,      // Sorteo completado
        CANCELLED       // Cancelada
    }

    /**
     * @notice Tipo de lotería
     */
    enum LotteryType {
        WEEKLY,         // Sorteo semanal
        MONTHLY,        // Sorteo mensual
        CUSTOM          // Período personalizado
    }

    /**
     * @notice Información de una ronda de lotería
     */
    struct LotteryRound {
        uint256 roundId;
        LotteryType lotteryType;
        uint256 ticketPrice;            // Precio del ticket en BTC
        uint256 maxParticipants;        // Máximo de participantes
        uint256 currentParticipants;    // Participantes actuales
        uint256 totalBtcCollected;      // Total BTC recolectado
        uint256 totalMusdMinted;        // Total MUSD minted
        uint256 totalYield;             // Total yield generado
        uint256 startTime;              // Inicio de la ronda
        uint256 endTime;                // Fin de la ronda
        uint256 drawTime;               // Timestamp del sorteo
        address winner;                 // Ganador del sorteo
        uint256 winnerPrize;            // Premio del ganador
        LotteryStatus status;           // Estado de la ronda
        uint256 vrfRequestId;           // ID de request de Chainlink VRF
        uint256 randomWord;             // Palabra aleatoria de VRF
    }

    /**
     * @notice Información de un participante en una ronda
     */
    struct Participant {
        address participant;
        uint256 ticketCount;            // Número de tickets comprados
        uint256 btcContributed;         // BTC total contribuido
        uint256 firstTicketIndex;       // Índice del primer ticket
        uint256 lastTicketIndex;        // Índice del último ticket
        bool claimed;                   // Si ya reclamó su premio/capital
        bool refundClaimed;             // M-06: Si ya reclamó reembolso (lotería cancelada)
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

    /// @notice Chainlink VRF Coordinator
    VRFCoordinatorV2Interface public immutable VRF_COORDINATOR;

    /// @notice Chainlink VRF subscription ID
    uint64 public immutable SUBSCRIPTION_ID;

    /// @notice Chainlink VRF key hash
    bytes32 public immutable KEY_HASH;

    /// @notice Chainlink VRF callback gas limit
    uint32 public constant CALLBACK_GAS_LIMIT = 200000;

    /// @notice Chainlink VRF confirmations
    uint16 public constant REQUEST_CONFIRMATIONS = 3;

    /// @notice Number of random words to request
    uint32 public constant NUM_WORDS = 1;

    /// @notice Counter para round IDs
    uint256 public roundCounter;

    /// @notice Mapping de round ID a lottery info
    mapping(uint256 => LotteryRound) public lotteryRounds;

    /// @notice Mapping de round ID => participante => info
    mapping(uint256 => mapping(address => Participant)) public roundParticipants;

    /// @notice Mapping de round ID => array de participantes
    mapping(uint256 => address[]) public roundParticipantsList;

    /// @notice Mapping de VRF request ID a round ID
    mapping(uint256 => uint256) public vrfRequestToRound;

    /// @notice Performance fee (10% de yields van a treasury)
    uint256 public constant TREASURY_FEE = 1000; // 10%

    /// @notice Fee collector (treasury)
    address public feeCollector;

    /// @notice Minimum ticket price (0.0005 BTC = ~$30)
    uint256 public constant MIN_TICKET_PRICE = 0.0005 ether;

    /// @notice Maximum ticket price (0.1 BTC = ~$6000)
    uint256 public constant MAX_TICKET_PRICE = 0.1 ether;

    /// @notice Maximum tickets per user per round
    uint256 public constant MAX_TICKETS_PER_USER = 10;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event LotteryCreated(
        uint256 indexed roundId,
        LotteryType lotteryType,
        uint256 ticketPrice,
        uint256 maxParticipants,
        uint256 endTime
    );

    event TicketPurchased(
        uint256 indexed roundId,
        address indexed participant,
        uint256 ticketCount,
        uint256 btcAmount,
        uint256 firstTicket,
        uint256 lastTicket
    );

    event DrawRequested(
        uint256 indexed roundId,
        uint256 vrfRequestId
    );

    event WinnerSelected(
        uint256 indexed roundId,
        address indexed winner,
        uint256 prize,
        uint256 randomWord
    );

    event PrizeClaimed(
        uint256 indexed roundId,
        address indexed participant,
        uint256 amount,
        bool isWinner
    );

    event LotteryCancelled(
        uint256 indexed roundId,
        string reason
    );

    // H-05 FIX: Add event for fee collector changes
    event FeeCollectorUpdated(
        address indexed oldCollector,
        address indexed newCollector
    );

    // M-06: Event for refund claims
    event RefundClaimed(
        uint256 indexed roundId,
        address indexed participant,
        uint256 btcAmount
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidRoundId();
    error InvalidTicketPrice();
    error InvalidMaxParticipants();
    error InvalidAmount();
    error InvalidAddress();
    error LotteryNotOpen();
    error LotteryFull();
    error LotteryNotEnded();
    error DrawAlreadyRequested();
    error DrawNotCompleted();
    error AlreadyClaimed();
    error NotParticipant();
    error TooManyTickets();
    error InvalidDuration();
    error VRFRequestFailed();
    error RefundAlreadyClaimed();
    error LotteryNotCancelled();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _mezoIntegration Mezo integration address
     * @param _yieldAggregator Yield aggregator address
     * @param _wbtc WBTC token address
     * @param _musd MUSD token address
     * @param _vrfCoordinator Chainlink VRF Coordinator address
     * @param _subscriptionId Chainlink VRF subscription ID
     * @param _keyHash Chainlink VRF key hash
     * @param _feeCollector Fee collector address
     */
    constructor(
        address _mezoIntegration,
        address _yieldAggregator,
        address _wbtc,
        address _musd,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _feeCollector
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        if (_mezoIntegration == address(0) ||
            _yieldAggregator == address(0) ||
            _wbtc == address(0) ||
            _musd == address(0) ||
            _vrfCoordinator == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidAddress();

        MEZO_INTEGRATION = IMezoIntegration(_mezoIntegration);
        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        WBTC = IERC20(_wbtc);
        MUSD = IERC20(_musd);
        VRF_COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        SUBSCRIPTION_ID = _subscriptionId;
        KEY_HASH = _keyHash;
        feeCollector = _feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                        LOTTERY CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Crea una nueva ronda de lotería
     * @param lotteryType Tipo de lotería
     * @param ticketPrice Precio por ticket
     * @param maxParticipants Máximo de participantes
     * @param durationInSeconds Duración de la ronda
     * @return roundId ID de la ronda creada
     */
    function createLottery(
        LotteryType lotteryType,
        uint256 ticketPrice,
        uint256 maxParticipants,
        uint256 durationInSeconds
    ) 
        external 
        onlyOwner 
        whenNotPaused 
        returns (uint256 roundId) 
    {
        if (ticketPrice < MIN_TICKET_PRICE || ticketPrice > MAX_TICKET_PRICE) {
            revert InvalidTicketPrice();
        }
        if (maxParticipants == 0) revert InvalidMaxParticipants();
        if (durationInSeconds == 0) revert InvalidDuration();

        roundId = ++roundCounter;
        uint256 endTime = block.timestamp + durationInSeconds;

        lotteryRounds[roundId] = LotteryRound({
            roundId: roundId,
            lotteryType: lotteryType,
            ticketPrice: ticketPrice,
            maxParticipants: maxParticipants,
            currentParticipants: 0,
            totalBtcCollected: 0,
            totalMusdMinted: 0,
            totalYield: 0,
            startTime: block.timestamp,
            endTime: endTime,
            drawTime: 0,
            winner: address(0),
            winnerPrize: 0,
            status: LotteryStatus.OPEN,
            vrfRequestId: 0,
            randomWord: 0
        });

        emit LotteryCreated(
            roundId,
            lotteryType,
            ticketPrice,
            maxParticipants,
            endTime
        );
    }

    /*//////////////////////////////////////////////////////////////
                        TICKET PURCHASE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Compra tickets para una ronda
     * @param roundId ID de la ronda
     * @param ticketCount Número de tickets a comprar
     */
    function buyTickets(uint256 roundId, uint256 ticketCount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        LotteryRound storage lottery = lotteryRounds[roundId];
        if (lottery.roundId == 0) revert InvalidRoundId();
        if (lottery.status != LotteryStatus.OPEN) revert LotteryNotOpen();
        if (block.timestamp >= lottery.endTime) revert LotteryNotOpen();
        if (lottery.currentParticipants >= lottery.maxParticipants) revert LotteryFull();
        if (ticketCount == 0) revert InvalidAmount();

        Participant storage participant = roundParticipants[roundId][msg.sender];
        
        // Verificar límite de tickets por usuario
        if (participant.ticketCount + ticketCount > MAX_TICKETS_PER_USER) {
            revert TooManyTickets();
        }

        uint256 btcAmount = lottery.ticketPrice * ticketCount;

        // Transferir BTC del usuario
        WBTC.safeTransferFrom(msg.sender, address(this), btcAmount);

        // Si es la primera compra del usuario en esta ronda
        if (!participant.claimed && participant.ticketCount == 0) {
            participant.participant = msg.sender;
            roundParticipantsList[roundId].push(msg.sender);
            lottery.currentParticipants++;
        }

        // C-02 FIX: Calculate ticket indices correctly
        // Only set firstTicketIndex on FIRST purchase to avoid orphaning tickets
        uint256 totalTicketsSold = _getTotalTicketsSold(roundId);
        uint256 firstTicket;
        uint256 lastTicket;

        if (participant.ticketCount == 0) {
            // First purchase - set firstTicketIndex
            firstTicket = totalTicketsSold;
            participant.firstTicketIndex = firstTicket;
        } else {
            // Subsequent purchase - use existing firstTicketIndex, calculate from last
            firstTicket = participant.lastTicketIndex + 1;
        }
        lastTicket = firstTicket + ticketCount - 1;

        // Actualizar participante
        participant.ticketCount += ticketCount;
        participant.btcContributed += btcAmount;
        participant.lastTicketIndex = lastTicket; // Only update lastTicketIndex, never overwrite firstTicketIndex

        // Actualizar lotería
        lottery.totalBtcCollected += btcAmount;

        // Depositar en Mezo y generar yields
        _depositToMezo(roundId, btcAmount);

        emit TicketPurchased(
            roundId,
            msg.sender,
            ticketCount,
            btcAmount,
            firstTicket,
            lastTicket
        );
    }

    /*//////////////////////////////////////////////////////////////
                        DRAW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Solicita sorteo usando Chainlink VRF
     * @param roundId ID de la ronda
     */
    function requestDraw(uint256 roundId) 
        external 
        onlyOwner 
        nonReentrant 
    {
        LotteryRound storage lottery = lotteryRounds[roundId];
        if (lottery.roundId == 0) revert InvalidRoundId();
        // Check if draw already requested BEFORE checking status
        // (because requestDraw changes status to DRAWING)
        if (lottery.vrfRequestId != 0) revert DrawAlreadyRequested();
        if (lottery.status != LotteryStatus.OPEN) revert LotteryNotOpen();
        if (block.timestamp < lottery.endTime) revert LotteryNotEnded();
        if (lottery.currentParticipants == 0) revert NotParticipant();

        // Request random number from Chainlink VRF
        uint256 requestId = VRF_COORDINATOR.requestRandomWords(
            KEY_HASH,
            SUBSCRIPTION_ID,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        if (requestId == 0) revert VRFRequestFailed();

        // Update lottery state
        lottery.status = LotteryStatus.DRAWING;
        lottery.vrfRequestId = requestId;
        lottery.drawTime = block.timestamp;

        // Map request to round
        vrfRequestToRound[requestId] = roundId;

        emit DrawRequested(roundId, requestId);
    }

    /**
     * @notice Callback de Chainlink VRF (llamado por VRF Coordinator)
     * @param requestId ID del request
     * @param randomWords Array de palabras aleatorias
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        LotteryRound storage lottery = lotteryRounds[roundId];

        if (lottery.roundId == 0 || lottery.status != LotteryStatus.DRAWING) {
            return; // Invalid state, ignore
        }

        uint256 randomWord = randomWords[0];
        lottery.randomWord = randomWord;

        // Seleccionar ganador basado en random word
        address winner = _selectWinner(roundId, randomWord);
        
        if (winner != address(0)) {
            // Calcular premio del ganador (principal + 90% de yields)
            uint256 totalYield = _calculateTotalYield(roundId);
            lottery.totalYield = totalYield;
            
            // Retirar yields del aggregator si hay
            if (totalYield > 0) {
                try YIELD_AGGREGATOR.claimYield() {
                    // Claim exitoso - ahora el MUSD está en el contrato
                } catch {
                    // Si falla el claim, ajustar yields a lo que hay disponible
                    uint256 availableMusd = MUSD.balanceOf(address(this));
                    if (availableMusd < lottery.totalBtcCollected) {
                        totalYield = 0; // No hay yields extras
                    } else {
                        totalYield = availableMusd - lottery.totalBtcCollected;
                    }
                    lottery.totalYield = totalYield;
                }
            }

            uint256 treasuryAmount = (totalYield * TREASURY_FEE) / 10000;
            uint256 winnerYield = totalYield - treasuryAmount;

            Participant memory winnerInfo = roundParticipants[roundId][winner];
            lottery.winnerPrize = winnerInfo.btcContributed + winnerYield;
            lottery.winner = winner;
            lottery.status = LotteryStatus.COMPLETED;

            emit WinnerSelected(roundId, winner, lottery.winnerPrize, randomWord);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        CLAIM FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Reclama premio o capital después del sorteo
     * @param roundId ID de la ronda
     */
    function claimPrize(uint256 roundId) 
        external 
        nonReentrant 
    {
        LotteryRound storage lottery = lotteryRounds[roundId];
        Participant storage participant = roundParticipants[roundId][msg.sender];

        if (lottery.roundId == 0) revert InvalidRoundId();
        if (lottery.status != LotteryStatus.COMPLETED) revert DrawNotCompleted();
        if (participant.ticketCount == 0) revert NotParticipant();
        if (participant.claimed) revert AlreadyClaimed();

        bool isWinner = (msg.sender == lottery.winner);
        uint256 btcAmount;
        uint256 yieldAmount;

        // Marcar como reclamado primero
        participant.claimed = true;

        if (isWinner) {
            // Ganador recibe premio completo (principal BTC + yields en MUSD)
            btcAmount = participant.btcContributed;
            
            // Calcular yields del ganador (ya descontando treasury fee)
            uint256 treasuryAmount = (lottery.totalYield * TREASURY_FEE) / 10000;
            yieldAmount = lottery.totalYield - treasuryAmount;
            
            // Transferir treasury fee si aplica
            if (treasuryAmount > 0) {
                MUSD.safeTransfer(feeCollector, treasuryAmount);
            }
        } else {
            // Perdedores solo recuperan su capital en BTC
            btcAmount = participant.btcContributed;
            yieldAmount = 0;
        }

        // Transferir BTC (principal)
        if (btcAmount > 0) {
            WBTC.safeTransfer(msg.sender, btcAmount);
        }
        
        // Transferir MUSD (yields para ganador)
        if (yieldAmount > 0) {
            MUSD.safeTransfer(msg.sender, yieldAmount);
        }

        emit PrizeClaimed(roundId, msg.sender, btcAmount + yieldAmount, isWinner);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene información de una ronda
     */
    function getLotteryInfo(uint256 roundId) 
        external 
        view 
        returns (LotteryRound memory) 
    {
        return lotteryRounds[roundId];
    }

    /**
     * @notice Obtiene información de un participante
     */
    function getParticipantInfo(uint256 roundId, address participant) 
        external 
        view 
        returns (Participant memory) 
    {
        return roundParticipants[roundId][participant];
    }

    /**
     * @notice Obtiene lista de participantes
     */
    function getParticipants(uint256 roundId) 
        external 
        view 
        returns (address[] memory) 
    {
        return roundParticipantsList[roundId];
    }

    /**
     * @notice Calcula probabilidad de ganar de un usuario
     * @param roundId ID de la ronda
     * @param participant Dirección del participante
     * @return probability Probabilidad en basis points (10000 = 100%)
     */
    function getWinProbability(uint256 roundId, address participant) 
        external 
        view 
        returns (uint256 probability) 
    {
        uint256 totalTickets = _getTotalTicketsSold(roundId);
        if (totalTickets == 0) return 0;

        Participant memory info = roundParticipants[roundId][participant];
        probability = (info.ticketCount * 10000) / totalTickets;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposita BTC en Mezo y genera yields
     */
    function _depositToMezo(uint256 roundId, uint256 btcAmount) internal {
        LotteryRound storage lottery = lotteryRounds[roundId];

        // Aprobar Mezo
        WBTC.forceApprove(address(MEZO_INTEGRATION), btcAmount);

        // Depositar y mint MUSD
        uint256 musdAmount = MEZO_INTEGRATION.depositAndMint(btcAmount);

        // Aprobar yield aggregator
        MUSD.forceApprove(address(YIELD_AGGREGATOR), musdAmount);

        // H-8 FIX: Depositar en yield vault y verificar retorno
        (, uint256 shares) = YIELD_AGGREGATOR.deposit(musdAmount);
        require(shares > 0, "Deposit failed");

        // Actualizar stats
        lottery.totalMusdMinted += musdAmount;
    }

    /**
     * @notice Selecciona ganador basado en random word
     */
    function _selectWinner(uint256 roundId, uint256 randomWord) 
        internal 
        view 
        returns (address winner) 
    {
        uint256 totalTickets = _getTotalTicketsSold(roundId);
        if (totalTickets == 0) return address(0);

        // Usar módulo para obtener ticket ganador
        uint256 winningTicket = randomWord % totalTickets;

        // Encontrar participante dueño del ticket ganador
        address[] memory participants = roundParticipantsList[roundId];
        for (uint256 i = 0; i < participants.length; i++) {
            Participant memory participant = roundParticipants[roundId][participants[i]];
            if (winningTicket >= participant.firstTicketIndex && 
                winningTicket <= participant.lastTicketIndex) {
                return participants[i];
            }
        }

        return address(0);
    }

    /**
     * @notice Calcula total de yields generados
     */
    function _calculateTotalYield(uint256 roundId) 
        internal 
        view 
        returns (uint256 totalYield) 
    {
        return YIELD_AGGREGATOR.getPendingYield(address(this));
    }

    /**
     * @notice Obtiene total de tickets vendidos en una ronda
     */
    function _getTotalTicketsSold(uint256 roundId) 
        internal 
        view 
        returns (uint256 total) 
    {
        address[] memory participants = roundParticipantsList[roundId];
        for (uint256 i = 0; i < participants.length; i++) {
            total += roundParticipants[roundId][participants[i]].ticketCount;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Cancela una ronda (emergencia)
     */
    function cancelLottery(uint256 roundId, string memory reason) 
        external 
        onlyOwner 
    {
        LotteryRound storage lottery = lotteryRounds[roundId];
        if (lottery.roundId == 0) revert InvalidRoundId();
        
        lottery.status = LotteryStatus.CANCELLED;
        
        emit LotteryCancelled(roundId, reason);
    }

    /**
     * @notice H-05 FIX: Actualiza fee collector with event emission
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice M-06 FIX: Allows participants to claim refund when lottery is cancelled
     * @param roundId ID of the cancelled lottery round
     * @return btcAmount Amount of BTC refunded
     */
    function claimRefund(uint256 roundId)
        external
        nonReentrant
        returns (uint256 btcAmount)
    {
        LotteryRound storage lottery = lotteryRounds[roundId];
        Participant storage participant = roundParticipants[roundId][msg.sender];

        // Validate state
        if (lottery.roundId == 0) revert InvalidRoundId();
        if (lottery.status != LotteryStatus.CANCELLED) revert LotteryNotCancelled();
        if (participant.ticketCount == 0) revert NotParticipant();
        if (participant.refundClaimed) revert RefundAlreadyClaimed();

        // Mark as claimed FIRST (CEI pattern)
        participant.refundClaimed = true;
        btcAmount = participant.btcContributed;

        // Transfer BTC back to participant
        if (btcAmount > 0) {
            WBTC.safeTransfer(msg.sender, btcAmount);
        }

        emit RefundClaimed(roundId, msg.sender, btcAmount);
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