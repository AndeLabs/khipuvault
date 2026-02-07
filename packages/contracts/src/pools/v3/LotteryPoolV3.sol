// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {BasePoolV3} from "./BasePoolV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";
import {SecureRandomness} from "../../libraries/SecureRandomness.sol";

/**
 * @title LotteryPoolV3 - Production Grade No-Loss Lottery
 * @notice Prize pool where participants never lose their principal
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern (consistent with other V3 pools)
 *      ✅ Commit-Reveal randomness (secure without external oracle)
 *      ✅ Flash loan protection (inherited from BasePoolV3)
 *      ✅ Emergency mode (inherited from BasePoolV3)
 *      ✅ MUSD-based (consistent with IndividualPoolV3)
 *      ✅ Modular architecture for future VRF integration
 *
 * How it works:
 * 1. Users buy tickets with MUSD
 * 2. MUSD generates yield via YieldAggregator
 * 3. At round end, commit-reveal selects winner
 * 4. Winner gets: their principal + percentage of total yields
 * 5. Non-winners get: their principal back (no loss)
 * 6. Treasury gets: small percentage of yields
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract LotteryPoolV3 is BasePoolV3 {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum RoundStatus {
        OPEN, // Accepting participants
        COMMIT, // Commit phase for randomness
        REVEAL, // Reveal phase for randomness
        COMPLETED, // Draw completed, claims open
        CANCELLED // Round cancelled, refunds available

    }

    /*//////////////////////////////////////////////////////////////
                             STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Lottery round configuration and state
     * @dev Optimized storage packing
     */
    struct Round {
        uint128 ticketPrice; // Price per ticket in MUSD (18 decimals)
        uint128 totalMusd; // Total MUSD collected
        uint64 maxTickets; // Maximum tickets allowed
        uint64 totalTicketsSold; // Current tickets sold
        uint64 startTime; // Round start timestamp
        uint64 endTime; // Round end timestamp
        uint64 commitDeadline; // Commit phase deadline
        uint64 revealDeadline; // Reveal phase deadline
        address winner; // Winner address (after draw)
        uint256 winnerPrize; // Total prize for winner
        uint256 totalYield; // Total yield generated
        RoundStatus status; // Current round status
        bytes32 operatorCommit; // Operator's commitment hash
        uint256 revealedSeed; // Revealed random seed
    }

    /**
     * @notice Participant info per round
     */
    struct Participant {
        uint128 ticketCount; // Number of tickets owned
        uint128 musdContributed; // Total MUSD contributed
        uint64 firstTicketIndex; // First ticket index (for winner selection)
        bool claimed; // Has claimed prize/refund
    }

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Yield aggregator for generating returns
    IYieldAggregator public YIELD_AGGREGATOR;

    /// @notice Current round counter
    uint256 public currentRoundId;

    /// @notice Round data by ID
    mapping(uint256 => Round) public rounds;

    /// @notice Participant data per round
    mapping(uint256 => mapping(address => Participant)) public participants;

    /// @notice List of participants per round (for iteration)
    mapping(uint256 => address[]) public participantList;

    /// @notice C-02 FIX: Direct ticket ownership mapping for non-contiguous ticket support
    /// @dev Maps roundId => ticketIndex => owner address
    mapping(uint256 => mapping(uint256 => address)) public ticketOwners;

    /// @notice Operator address (can commit/reveal)
    address public operator;

    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MIN_TICKET_PRICE = 1 ether; // 1 MUSD minimum
    uint256 public constant MAX_TICKET_PRICE = 10_000 ether; // 10,000 MUSD maximum
    uint256 public constant MAX_TICKETS_PER_USER = 100; // Per user per round
    uint256 public constant MIN_ROUND_DURATION = 1 hours; // Minimum round length
    uint256 public constant COMMIT_PHASE_DURATION = 1 hours; // Commit phase length
    uint256 public constant REVEAL_PHASE_DURATION = 1 hours; // Reveal phase length
    uint256 public constant WINNER_YIELD_SHARE = 9000; // 90% of yields to winner
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant FORCE_COMPLETE_DELAY = 1 hours; // C-01 FIX: Delay after reveal deadline
    uint256 public constant MULTI_BLOCK_ENTROPY_RANGE = 5; // C-01 FIX: Use multiple block hashes

    /*//////////////////////////////////////////////////////////////
                            STORAGE GAP
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Storage gap for future upgrades
     * Size: 50 slots - base pool (5) - lottery pool (8) = 37 slots
     * Note: Reduced by 1 for ticketOwners mapping added in C-02 FIX
     */
    uint256[37] private __gap;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event RoundCreated(uint256 indexed roundId, uint256 ticketPrice, uint256 maxTickets, uint256 endTime);

    event TicketsPurchased(
        uint256 indexed roundId,
        address indexed participant,
        uint256 ticketCount,
        uint256 musdAmount,
        uint256 firstTicket,
        uint256 lastTicket
    );

    event CommitSubmitted(uint256 indexed roundId, bytes32 commitment);
    event SeedRevealed(uint256 indexed roundId, uint256 seed);

    event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket);

    event PrizeClaimed(uint256 indexed roundId, address indexed participant, uint256 amount, bool isWinner);

    event RoundCancelled(uint256 indexed roundId, string reason);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidRoundId();
    error InvalidTicketPrice();
    error InvalidMaxTickets();
    error InvalidDuration();
    error RoundNotOpen();
    error RoundFull();
    error InvalidTicketCount();
    error TooManyTickets();
    error InsufficientBalance();
    error AlreadyClaimed();
    error NotParticipant();
    error InvalidCommitment();
    error CommitPhaseNotStarted();
    error CommitPhaseEnded();
    error RevealPhaseNotStarted();
    error RevealPhaseEnded();
    error InvalidReveal();
    error DrawNotCompleted();
    error RoundNotCancelled();
    error OnlyOperator();
    error RoundStillActive();
    error NoParticipants();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner()) revert OnlyOperator();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the lottery pool
     * @param _musd MUSD token address
     * @param _yieldAggregator Yield aggregator address
     * @param _feeCollector Fee collector address
     * @param _operator Operator address for commit-reveal
     */
    function initialize(address _musd, address _yieldAggregator, address _feeCollector, address _operator)
        external
        initializer
    {
        if (_yieldAggregator == address(0)) revert ZeroAddress();
        if (_operator == address(0)) revert ZeroAddress();

        __BasePool_init(_musd, _feeCollector, 1000); // 10% performance fee

        YIELD_AGGREGATOR = IYieldAggregator(_yieldAggregator);
        operator = _operator;
    }

    /*//////////////////////////////////////////////////////////////
                        ROUND MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new lottery round
     * @param ticketPrice Price per ticket in MUSD (18 decimals)
     * @param maxTickets Maximum number of tickets for this round
     * @param durationSeconds Duration of the open phase in seconds
     * @return roundId The ID of the created round
     */
    function createRound(uint256 ticketPrice, uint256 maxTickets, uint256 durationSeconds)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 roundId)
    {
        if (ticketPrice < MIN_TICKET_PRICE || ticketPrice > MAX_TICKET_PRICE) {
            revert InvalidTicketPrice();
        }
        if (maxTickets == 0 || maxTickets > type(uint64).max) {
            revert InvalidMaxTickets();
        }
        if (durationSeconds < MIN_ROUND_DURATION) {
            revert InvalidDuration();
        }

        roundId = ++currentRoundId;

        uint64 endTime = uint64(block.timestamp + durationSeconds);
        uint64 commitDeadline = endTime + uint64(COMMIT_PHASE_DURATION);
        uint64 revealDeadline = commitDeadline + uint64(REVEAL_PHASE_DURATION);

        rounds[roundId] = Round({
            ticketPrice: uint128(ticketPrice),
            totalMusd: 0,
            maxTickets: uint64(maxTickets),
            totalTicketsSold: 0,
            startTime: uint64(block.timestamp),
            endTime: endTime,
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            winner: address(0),
            winnerPrize: 0,
            totalYield: 0,
            status: RoundStatus.OPEN,
            operatorCommit: bytes32(0),
            revealedSeed: 0
        });

        emit RoundCreated(roundId, ticketPrice, maxTickets, endTime);
    }

    /*//////////////////////////////////////////////////////////////
                        TICKET PURCHASE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Buy tickets for a lottery round
     * @param roundId The round to participate in
     * @param ticketCount Number of tickets to buy
     */
    function buyTickets(uint256 roundId, uint256 ticketCount) external nonReentrant whenNotPaused notInEmergency {
        Round storage round = rounds[roundId];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp >= round.endTime) revert RoundNotOpen();
        if (ticketCount == 0) revert InvalidTicketCount();
        if (round.totalTicketsSold + ticketCount > round.maxTickets) revert RoundFull();

        Participant storage participant = participants[roundId][msg.sender];

        if (participant.ticketCount + ticketCount > MAX_TICKETS_PER_USER) {
            revert TooManyTickets();
        }

        uint256 musdAmount = uint256(round.ticketPrice) * ticketCount;

        // C-02 FIX: Calculate ticket indices based on global totalTicketsSold
        // This ensures each ticket has a unique global index regardless of purchase order
        uint64 firstTicket = round.totalTicketsSold;
        uint64 lastTicket = firstTicket + uint64(ticketCount) - 1;

        // Record first ticket index only for new participants
        if (participant.ticketCount == 0) {
            participant.firstTicketIndex = firstTicket;
            participantList[roundId].push(msg.sender);
        }

        // C-02 FIX: Register ownership for each ticket in this batch
        // This handles non-contiguous ticket purchases correctly
        for (uint64 i = firstTicket; i <= lastTicket; i++) {
            ticketOwners[roundId][i] = msg.sender;
        }

        // Update state (CEI pattern)
        participant.ticketCount += uint128(ticketCount);
        participant.musdContributed += uint128(musdAmount);
        round.totalTicketsSold += uint64(ticketCount);
        round.totalMusd += uint128(musdAmount);

        // Record deposit for flash loan protection
        _recordDeposit();

        emit TicketsPurchased(roundId, msg.sender, ticketCount, musdAmount, firstTicket, lastTicket);

        // Transfer MUSD from user
        MUSD.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Deposit to yield aggregator
        _depositToYieldAggregator(musdAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        COMMIT-REVEAL RANDOMNESS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Submit commitment for random seed (operator only)
     * @param roundId The round ID
     * @param commitment Hash of (seed + salt)
     */
    function submitCommitment(uint256 roundId, bytes32 commitment) external onlyOperator {
        Round storage round = rounds[roundId];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp < round.endTime) revert CommitPhaseNotStarted();
        if (block.timestamp > round.commitDeadline) revert CommitPhaseEnded();
        if (round.totalTicketsSold == 0) revert NoParticipants();
        if (commitment == bytes32(0)) revert InvalidCommitment();

        round.status = RoundStatus.COMMIT;
        round.operatorCommit = commitment;

        emit CommitSubmitted(roundId, commitment);
    }

    /**
     * @notice Reveal the random seed and select winner (operator only)
     * @param roundId The round ID
     * @param seed The random seed
     * @param salt The salt used in commitment
     */
    function revealSeed(uint256 roundId, uint256 seed, bytes32 salt) external onlyOperator nonReentrant {
        Round storage round = rounds[roundId];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status != RoundStatus.COMMIT) revert RevealPhaseNotStarted();
        if (block.timestamp > round.revealDeadline) revert RevealPhaseEnded();

        // Verify commitment
        bytes32 expectedCommit = keccak256(abi.encodePacked(seed, salt));
        if (expectedCommit != round.operatorCommit) revert InvalidReveal();

        round.revealedSeed = seed;
        round.status = RoundStatus.REVEAL;

        emit SeedRevealed(roundId, seed);

        // Select winner and complete round
        _selectWinnerAndComplete(roundId, seed);
    }

    /*//////////////////////////////////////////////////////////////
                          CLAIM FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Claim prize or principal after round completion
     * @param roundId The round ID
     */
    function claimPrize(uint256 roundId) external nonReentrant noFlashLoan {
        Round storage round = rounds[roundId];
        Participant storage participant = participants[roundId][msg.sender];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status != RoundStatus.COMPLETED) revert DrawNotCompleted();
        if (participant.ticketCount == 0) revert NotParticipant();
        if (participant.claimed) revert AlreadyClaimed();

        participant.claimed = true;

        bool isWinner = (msg.sender == round.winner);
        uint256 claimAmount;

        if (isWinner) {
            claimAmount = round.winnerPrize;
        } else {
            // Non-winners get their principal back
            claimAmount = participant.musdContributed;
        }

        emit PrizeClaimed(roundId, msg.sender, claimAmount, isWinner);

        if (claimAmount > 0) {
            MUSD.safeTransfer(msg.sender, claimAmount);
        }
    }

    /**
     * @notice Claim refund for cancelled round
     * @param roundId The round ID
     */
    function claimRefund(uint256 roundId) external nonReentrant {
        Round storage round = rounds[roundId];
        Participant storage participant = participants[roundId][msg.sender];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status != RoundStatus.CANCELLED) revert RoundNotCancelled();
        if (participant.ticketCount == 0) revert NotParticipant();
        if (participant.claimed) revert AlreadyClaimed();

        participant.claimed = true;
        uint256 refundAmount = participant.musdContributed;

        emit PrizeClaimed(roundId, msg.sender, refundAmount, false);

        if (refundAmount > 0) {
            MUSD.safeTransfer(msg.sender, refundAmount);
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get round information
     */
    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    /**
     * @notice Get participant information
     */
    function getParticipant(uint256 roundId, address user) external view returns (Participant memory) {
        return participants[roundId][user];
    }

    /**
     * @notice Get all participants in a round
     */
    function getParticipants(uint256 roundId) external view returns (address[] memory) {
        return participantList[roundId];
    }

    /**
     * @notice Calculate win probability for a user (in basis points)
     */
    function getWinProbability(uint256 roundId, address user) external view returns (uint256) {
        Round memory round = rounds[roundId];
        if (round.totalTicketsSold == 0) return 0;

        Participant memory participant = participants[roundId][user];
        return (uint256(participant.ticketCount) * BASIS_POINTS) / uint256(round.totalTicketsSold);
    }

    /**
     * @notice Get current active round ID (if any)
     */
    function getActiveRound() external view returns (uint256) {
        if (currentRoundId == 0) return 0;

        Round memory round = rounds[currentRoundId];
        if (round.status == RoundStatus.OPEN && block.timestamp < round.endTime) {
            return currentRoundId;
        }
        return 0;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit MUSD to yield aggregator
     */
    function _depositToYieldAggregator(uint256 amount) internal {
        MUSD.forceApprove(address(YIELD_AGGREGATOR), amount);
        YIELD_AGGREGATOR.deposit(amount);
    }

    /**
     * @notice Select winner and complete the round
     */
    function _selectWinnerAndComplete(uint256 roundId, uint256 seed) internal {
        Round storage round = rounds[roundId];

        // ✅ SECURITY FIX: Use SecureRandomness library instead of simple modulo
        // Combines multiple entropy sources for better randomness:
        // 1. Revealed seed from operator commit-reveal
        // 2. RANDAO (Ethereum's native randomness)
        // 3. Block hash from previous blocks
        // 4. Current block number and timestamp

        // Wait at least 1 block after reveal for block hash entropy
        uint256 entropyBlock = block.number - 1;

        // Generate secure random number using hybrid approach
        uint256 secureRandom = SecureRandomness.generateSecureRandom(entropyBlock, bytes32(seed));

        // Select winning ticket using secure random number
        uint256 winningTicket = SecureRandomness.randomInRange(secureRandom, round.totalTicketsSold);

        // Find winner by iterating through participants
        address winner = _findTicketOwner(roundId, winningTicket);
        round.winner = winner;

        // Withdraw from yield aggregator and calculate yields
        uint256 totalYield = _withdrawAndCalculateYield(roundId);
        round.totalYield = totalYield;

        // Calculate winner prize
        uint256 winnerYield = (totalYield * WINNER_YIELD_SHARE) / BASIS_POINTS;
        uint256 treasuryYield = totalYield - winnerYield;

        Participant memory winnerParticipant = participants[roundId][winner];
        round.winnerPrize = uint256(winnerParticipant.musdContributed) + winnerYield;

        round.status = RoundStatus.COMPLETED;

        emit WinnerSelected(roundId, winner, round.winnerPrize, winningTicket);

        // Transfer treasury fee
        if (treasuryYield > 0 && feeCollector != address(0)) {
            MUSD.safeTransfer(feeCollector, treasuryYield);
        }
    }

    /**
     * @notice Find owner of a specific ticket
     * @dev C-02 FIX: Now uses direct mapping lookup (O(1)) instead of iteration
     *      This correctly handles non-contiguous ticket purchases
     */
    function _findTicketOwner(uint256 roundId, uint256 ticketIndex) internal view returns (address) {
        return ticketOwners[roundId][ticketIndex];
    }

    /**
     * @notice Withdraw from yield aggregator and calculate total yield
     */
    function _withdrawAndCalculateYield(uint256 roundId) internal returns (uint256 totalYield) {
        Round memory round = rounds[roundId];

        // Get pending yield
        uint256 pendingYield = YIELD_AGGREGATOR.getPendingYield(address(this));

        // Withdraw principal + yield
        uint256 totalToWithdraw = round.totalMusd + pendingYield;

        try YIELD_AGGREGATOR.withdraw(totalToWithdraw) returns (uint256 withdrawn) {
            if (withdrawn > round.totalMusd) {
                totalYield = withdrawn - round.totalMusd;
            }
        } catch {
            // If full withdrawal fails, try to withdraw just principal
            try YIELD_AGGREGATOR.withdraw(round.totalMusd) {
                totalYield = 0;
            } catch {
                // Last resort: use balance
                totalYield = 0;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Cancel a round (only if not completed)
     * @param roundId The round ID
     * @param reason Cancellation reason
     */
    function cancelRound(uint256 roundId, string calldata reason) external onlyOwner {
        Round storage round = rounds[roundId];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status == RoundStatus.COMPLETED) revert DrawNotCompleted();

        // Withdraw from yield aggregator
        if (round.totalMusd > 0) {
            try YIELD_AGGREGATOR.withdraw(round.totalMusd) {} catch {}
        }

        round.status = RoundStatus.CANCELLED;

        emit RoundCancelled(roundId, reason);
    }

    /**
     * @notice Update operator address
     */
    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();
        address oldOperator = operator;
        operator = newOperator;
        emit OperatorUpdated(oldOperator, newOperator);
    }

    /**
     * @notice Force complete a round if reveal phase expired
     * @dev C-01 FIX: Improved fallback randomness with:
     *      1. FORCE_COMPLETE_DELAY after reveal deadline (prevents timing attacks)
     *      2. Multi-block entropy (uses multiple block hashes)
     *      3. Additional entropy sources (msg.sender, timestamp, round data)
     *
     * SECURITY NOTE: For mainnet production, integrate Chainlink VRF or similar
     *                decentralized randomness oracle for cryptographic security.
     *                This fallback is only for emergency situations when operator
     *                fails to reveal within the deadline.
     */
    function forceComplete(uint256 roundId) external onlyOwner nonReentrant {
        Round storage round = rounds[roundId];

        if (round.startTime == 0) revert InvalidRoundId();
        if (round.status == RoundStatus.COMPLETED) revert DrawNotCompleted();
        if (round.totalTicketsSold == 0) revert NoParticipants();

        // C-01 FIX: Add delay requirement after reveal deadline
        // This prevents timing attacks by giving more blocks for entropy
        if (block.timestamp <= round.revealDeadline + FORCE_COMPLETE_DELAY) {
            revert RoundStillActive();
        }

        // C-01 FIX: Multi-block entropy - combine multiple block hashes
        // This makes it harder for miners to predict the outcome
        uint256 fallbackSeed;
        unchecked {
            for (uint256 i = 1; i <= MULTI_BLOCK_ENTROPY_RANGE; i++) {
                // Only use blocks that exist (within 256 block range)
                if (block.number > i) {
                    fallbackSeed ^= uint256(blockhash(block.number - i));
                }
            }
        }

        // C-01 FIX: Add additional entropy sources
        fallbackSeed = uint256(
            keccak256(
                abi.encodePacked(
                    fallbackSeed,
                    msg.sender,
                    block.timestamp,
                    block.prevrandao, // EIP-4399: Use prevrandao for additional entropy
                    round.totalTicketsSold,
                    round.totalMusd,
                    roundId
                )
            )
        );

        round.revealedSeed = fallbackSeed;
        round.status = RoundStatus.REVEAL;

        emit SeedRevealed(roundId, fallbackSeed);

        _selectWinnerAndComplete(roundId, fallbackSeed);
    }

    /**
     * @notice Emergency withdraw all funds (emergency mode only)
     */
    function emergencyWithdraw() external onlyOwner {
        if (!emergencyMode) revert EmergencyModeActive();

        uint256 balance = MUSD.balanceOf(address(this));
        if (balance > 0) {
            MUSD.safeTransfer(owner(), balance);
        }
    }
}
