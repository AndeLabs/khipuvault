// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "forge-std/Script.sol";

/**
 * @title DeploySimpleLotteryPool
 * @notice Deploy a simplified LotteryPool for testing WITHOUT Chainlink VRF
 * @dev This version uses pseudo-random for testing purposes only
 * 
 * Run:
 * source contracts/.env.testnet
 * forge script script/DeploySimpleLotteryPool.s.sol:DeploySimpleLotteryPool \
 *   --rpc-url $RPC_URL \
 *   --broadcast \
 *   --legacy
 */
contract DeploySimpleLotteryPool is Script {
    // Deployed contracts
    address constant MEZO_INTEGRATION = 0x9AC6249d2f2E3cbAAF34E114EdF1Cb7519AF04C2;
    address constant YIELD_AGGREGATOR = 0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c;
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Simple LotteryPool to Mezo Testnet ===");
        console.log("Deployer:", deployer);
        console.log("Balance (wei):", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy SimpleLotteryPool
        SimpleLotteryPool lotteryPool = new SimpleLotteryPool();

        console.log("SimpleLotteryPool deployed at:", address(lotteryPool));
        console.log("");

        // Create initial lottery round
        console.log("Creating initial weekly lottery round...");
        
        uint256 ticketPrice = 0.001 ether; // 0.001 BTC (~$60)
        uint256 maxTickets = 1000;
        uint256 durationInSeconds = 7 days;
        
        uint256 roundId = lotteryPool.createRound(
            ticketPrice,
            maxTickets,
            durationInSeconds
        );

        console.log("");
        console.log("Initial lottery round created!");
        console.log("Round ID:", roundId);
        console.log("Ticket Price (wei):", ticketPrice);
        console.log("Max Tickets:", maxTickets);
        console.log("Duration (days):", durationInSeconds / 1 days);
        console.log("");

        vm.stopBroadcast();

        console.log("=== Deployment Summary ===");
        console.log("SimpleLotteryPool:", address(lotteryPool));
        console.log("Initial Round ID:", roundId);
        console.log("");
        console.log("Update these files:");
        console.log("1. DEPLOYED_CONTRACTS.md - Add LotteryPool address");
        console.log("2. frontend/src/hooks/web3/use-lottery-pool.ts:47");
        console.log("   Replace: const LOTTERY_POOL_ADDRESS = '0x0000...'");
        console.log("   With:    const LOTTERY_POOL_ADDRESS = '", address(lotteryPool), "'");
    }
}

/**
 * @title SimpleLotteryPool  
 * @notice Simplified lottery pool for testing - BTC native, no VRF
 * @dev Uses pseudo-random (NOT FOR PRODUCTION - for testnet only)
 */
contract SimpleLotteryPool {
    enum RoundStatus { OPEN, COMPLETED, CANCELLED }

    struct Round {
        uint256 roundId;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 totalTicketsSold;
        uint256 totalPrize;
        uint256 startTime;
        uint256 endTime;
        address winner;
        RoundStatus status;
    }

    uint256 public roundCounter;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => uint256)) public userTickets; // roundId => user => ticketCount
    mapping(uint256 => address[]) public participants; // roundId => participants list
    
    address public owner;
    uint256 public constant MIN_TICKET_PRICE = 0.0001 ether;
    uint256 public constant MAX_TICKETS_PER_USER = 50;

    event RoundCreated(uint256 indexed roundId, uint256 ticketPrice, uint256 maxTickets, uint256 endTime);
    event TicketsPurchased(uint256 indexed roundId, address indexed user, uint256 ticketCount, uint256 btcPaid);
    event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 prize);
    event PrizeClaimed(uint256 indexed roundId, address indexed user, uint256 amount);

    error OnlyOwner();
    error InvalidTicketPrice();
    error InvalidMaxTickets();
    error RoundNotOpen();
    error RoundNotEnded();
    error InvalidTicketCount();
    error TooManyTickets();
    error InsufficientPayment();
    error RoundNotCompleted();
    error NoPrize();
    error TransferFailed();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @notice Create a new lottery round
     */
    function createRound(
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 durationInSeconds
    ) external onlyOwner returns (uint256) {
        if (ticketPrice < MIN_TICKET_PRICE) revert InvalidTicketPrice();
        if (maxTickets == 0) revert InvalidMaxTickets();

        uint256 roundId = ++roundCounter;
        uint256 endTime = block.timestamp + durationInSeconds;

        rounds[roundId] = Round({
            roundId: roundId,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            totalTicketsSold: 0,
            totalPrize: 0,
            startTime: block.timestamp,
            endTime: endTime,
            winner: address(0),
            status: RoundStatus.OPEN
        });

        emit RoundCreated(roundId, ticketPrice, maxTickets, endTime);
        return roundId;
    }

    /**
     * @notice Buy tickets for a round
     */
    function buyTickets(uint256 roundId, uint256 ticketCount) external payable {
        Round storage round = rounds[roundId];
        
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp >= round.endTime) revert RoundNotOpen();
        if (ticketCount == 0) revert InvalidTicketCount();
        if (round.totalTicketsSold + ticketCount > round.maxTickets) revert TooManyTickets();
        
        uint256 userCurrentTickets = userTickets[roundId][msg.sender];
        if (userCurrentTickets + ticketCount > MAX_TICKETS_PER_USER) revert TooManyTickets();
        
        uint256 requiredPayment = round.ticketPrice * ticketCount;
        if (msg.value < requiredPayment) revert InsufficientPayment();

        // Add user to participants if first time
        if (userCurrentTickets == 0) {
            participants[roundId].push(msg.sender);
        }

        // Update state
        userTickets[roundId][msg.sender] += ticketCount;
        round.totalTicketsSold += ticketCount;
        round.totalPrize += requiredPayment;

        // Refund excess payment
        if (msg.value > requiredPayment) {
            (bool success,) = msg.sender.call{value: msg.value - requiredPayment}("");
            if (!success) revert TransferFailed();
        }

        emit TicketsPurchased(roundId, msg.sender, ticketCount, requiredPayment);
    }

    /**
     * @notice Draw winner (pseudo-random - TESTNET ONLY)
     */
    function drawWinner(uint256 roundId) external onlyOwner {
        Round storage round = rounds[roundId];
        
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp < round.endTime) revert RoundNotEnded();
        if (round.totalTicketsSold == 0) revert InvalidTicketCount();

        // Pseudo-random selection (NOT SECURE - for testnet only)
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            roundId,
            round.totalTicketsSold
        ))) % participants[roundId].length;

        address winner = participants[roundId][randomIndex];
        round.winner = winner;
        round.status = RoundStatus.COMPLETED;

        emit WinnerSelected(roundId, winner, round.totalPrize);
    }

    /**
     * @notice Claim prize (winner gets everything for now)
     */
    function claimPrize(uint256 roundId) external {
        Round storage round = rounds[roundId];
        
        if (round.status != RoundStatus.COMPLETED) revert RoundNotCompleted();
        if (msg.sender != round.winner) revert NoPrize();
        if (round.totalPrize == 0) revert NoPrize();

        uint256 prize = round.totalPrize;
        round.totalPrize = 0; // Prevent re-entrancy

        (bool success,) = msg.sender.call{value: prize}("");
        if (!success) revert TransferFailed();

        emit PrizeClaimed(roundId, msg.sender, prize);
    }

    /**
     * @notice Withdraw capital (non-winners get refund)
     */
    function withdrawCapital(uint256 roundId) external {
        Round storage round = rounds[roundId];
        
        if (round.status != RoundStatus.COMPLETED) revert RoundNotCompleted();
        if (msg.sender == round.winner) revert NoPrize(); // Winner uses claimPrize
        
        uint256 ticketCount = userTickets[roundId][msg.sender];
        if (ticketCount == 0) revert NoPrize();

        uint256 refund = round.ticketPrice * ticketCount;
        userTickets[roundId][msg.sender] = 0; // Prevent re-entrancy

        (bool success,) = msg.sender.call{value: refund}("");
        if (!success) revert TransferFailed();

        emit PrizeClaimed(roundId, msg.sender, refund);
    }

    /**
     * @notice Get round info
     */
    function getRoundInfo(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    /**
     * @notice Get user tickets for a round
     */
    function getUserTickets(uint256 roundId, address user) external view returns (uint256) {
        return userTickets[roundId][user];
    }

    /**
     * @notice Get user investment
     */
    function getUserInvestment(uint256 roundId, address user) external view returns (uint256) {
        return userTickets[roundId][user] * rounds[roundId].ticketPrice;
    }

    /**
     * @notice Calculate user probability (basis points)
     */
    function calculateUserProbability(uint256 roundId, address user) external view returns (uint256) {
        Round memory round = rounds[roundId];
        if (round.totalTicketsSold == 0) return 0;
        
        uint256 tickets = userTickets[roundId][user];
        return (tickets * 10000) / round.totalTicketsSold;
    }

    /**
     * @notice Get current round ID
     */
    function currentRoundId() external view returns (uint256) {
        return roundCounter;
    }

    receive() external payable {}
}
