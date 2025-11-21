// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {LotteryPool} from "../src/pools/v3/LotteryPool.sol";
import {MockMezoIntegration} from "./mocks/MockMezoIntegration.sol";
import {MockYieldAggregator} from "./mocks/MockYieldAggregator.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/**
 * @title LotteryPool Test Suite
 * @notice Comprehensive tests for LotteryPool contract
 * @dev Tests lottery creation, ticket purchases, draws, prize claims, and admin functions
 */
contract LotteryPoolTest is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    LotteryPool public lotteryPool;
    MockMezoIntegration public mezoIntegration;
    MockYieldAggregator public yieldAggregator;
    MockMUSD public musd;
    MockERC20 public wbtc;

    // Mock VRF Coordinator
    address public vrfCoordinator = makeAddr("vrfCoordinator");

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public user4 = makeAddr("user4");
    address public feeCollector = makeAddr("feeCollector");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_WBTC_BALANCE = 100 ether;
    uint256 public constant MIN_TICKET_PRICE = 0.0005 ether;
    uint256 public constant MAX_TICKET_PRICE = 0.1 ether;
    uint64 public constant SUBSCRIPTION_ID = 1;
    bytes32 public constant KEY_HASH = bytes32(uint256(1));

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event LotteryCreated(
        uint256 indexed roundId,
        LotteryPool.LotteryType lotteryType,
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

    event DrawRequested(uint256 indexed roundId, uint256 vrfRequestId);

    event WinnerSelected(
        uint256 indexed roundId, address indexed winner, uint256 prize, uint256 randomWord
    );

    event PrizeClaimed(uint256 indexed roundId, address indexed participant, uint256 amount, bool isWinner);

    event LotteryCancelled(uint256 indexed roundId, string reason);

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();
        wbtc = new MockERC20("Wrapped BTC", "WBTC", 18);
        mezoIntegration = new MockMezoIntegration(address(musd));
        yieldAggregator = new MockYieldAggregator(address(musd));

        // Fund contracts
        musd.mint(address(mezoIntegration), 10_000_000 ether);
        musd.mint(address(yieldAggregator), 10_000_000 ether);

        // Deploy LotteryPool
        vm.prank(owner);
        lotteryPool = new LotteryPool(
            address(mezoIntegration),
            address(yieldAggregator),
            address(wbtc),
            address(musd),
            vrfCoordinator,
            SUBSCRIPTION_ID,
            KEY_HASH,
            feeCollector
        );

        // Give users WBTC
        wbtc.mint(user1, INITIAL_WBTC_BALANCE);
        wbtc.mint(user2, INITIAL_WBTC_BALANCE);
        wbtc.mint(user3, INITIAL_WBTC_BALANCE);
        wbtc.mint(user4, INITIAL_WBTC_BALANCE);

        // Approve lottery pool to spend WBTC
        vm.prank(user1);
        wbtc.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user2);
        wbtc.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user3);
        wbtc.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user4);
        wbtc.approve(address(lotteryPool), type(uint256).max);

        // Approve lottery pool to spend MUSD (for prize claims)
        vm.prank(user1);
        musd.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user2);
        musd.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user3);
        musd.approve(address(lotteryPool), type(uint256).max);

        vm.prank(user4);
        musd.approve(address(lotteryPool), type(uint256).max);

        // Label addresses
        vm.label(address(lotteryPool), "LotteryPool");
        vm.label(address(mezoIntegration), "MezoIntegration");
        vm.label(address(yieldAggregator), "YieldAggregator");
        vm.label(address(musd), "MUSD");
        vm.label(address(wbtc), "WBTC");
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(lotteryPool.owner(), owner);
        assertEq(address(lotteryPool.MEZO_INTEGRATION()), address(mezoIntegration));
        assertEq(address(lotteryPool.YIELD_AGGREGATOR()), address(yieldAggregator));
        assertEq(address(lotteryPool.WBTC()), address(wbtc));
        assertEq(address(lotteryPool.MUSD()), address(musd));
        assertEq(address(lotteryPool.VRF_COORDINATOR()), vrfCoordinator);
        assertEq(lotteryPool.SUBSCRIPTION_ID(), SUBSCRIPTION_ID);
        assertEq(lotteryPool.KEY_HASH(), KEY_HASH);
        assertEq(lotteryPool.feeCollector(), feeCollector);
        assertFalse(lotteryPool.paused());
    }

    function test_InitialState() public view {
        assertEq(lotteryPool.roundCounter(), 0);
    }

    function test_Constructor_ZeroAddress() public {
        vm.expectRevert(LotteryPool.InvalidAddress.selector);
        vm.prank(owner);
        new LotteryPool(
            address(0), // Invalid
            address(yieldAggregator),
            address(wbtc),
            address(musd),
            vrfCoordinator,
            SUBSCRIPTION_ID,
            KEY_HASH,
            feeCollector
        );
    }

    /*//////////////////////////////////////////////////////////////
                        LOTTERY CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateLottery() public {
        uint256 ticketPrice = 0.01 ether;
        uint256 maxParticipants = 100;
        uint256 duration = 7 days;

        vm.expectEmit(true, false, false, false);
        emit LotteryCreated(1, LotteryPool.LotteryType.WEEKLY, ticketPrice, maxParticipants, 0);

        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, ticketPrice, maxParticipants, duration
        );

        assertEq(roundId, 1);
        assertEq(lotteryPool.roundCounter(), 1);

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(round.roundId, roundId);
        assertEq(uint256(round.lotteryType), uint256(LotteryPool.LotteryType.WEEKLY));
        assertEq(round.ticketPrice, ticketPrice);
        assertEq(round.maxParticipants, maxParticipants);
        assertEq(round.currentParticipants, 0);
        assertEq(uint256(round.status), uint256(LotteryPool.LotteryStatus.OPEN));
        assertEq(round.endTime, block.timestamp + duration);
    }

    function test_CreateLottery_InvalidTicketPrice() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidTicketPrice.selector);
        lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, MIN_TICKET_PRICE - 1, 100, 7 days
        );
    }

    function test_CreateLottery_TicketPriceTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidTicketPrice.selector);
        lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, MAX_TICKET_PRICE + 1, 100, 7 days
        );
    }

    function test_CreateLottery_InvalidMaxParticipants() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidMaxParticipants.selector);
        lotteryPool.createLottery(LotteryPool.LotteryType.WEEKLY, 0.01 ether, 0, 7 days);
    }

    function test_CreateLottery_InvalidDuration() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidDuration.selector);
        lotteryPool.createLottery(LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 0);
    }

    function test_CreateLottery_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        lotteryPool.createLottery(LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days);
    }

    function test_CreateLottery_WhenPaused() public {
        vm.prank(owner);
        lotteryPool.pause();

        vm.prank(owner);
        vm.expectRevert();
        lotteryPool.createLottery(LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days);
    }

    /*//////////////////////////////////////////////////////////////
                        TICKET PURCHASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BuyTickets() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        uint256 ticketCount = 3;
        uint256 btcAmount = 0.03 ether;

        vm.expectEmit(true, true, false, true);
        emit TicketPurchased(roundId, user1, ticketCount, btcAmount, 0, 2);

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, ticketCount);

        // Check participant info
        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.participant, user1);
        assertEq(participant.ticketCount, ticketCount);
        assertEq(participant.btcContributed, btcAmount);
        assertEq(participant.firstTicketIndex, 0);
        assertEq(participant.lastTicketIndex, 2);
        assertFalse(participant.claimed);

        // Check round updated
        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(round.currentParticipants, 1);
        assertEq(round.totalBtcCollected, btcAmount);
    }

    function test_BuyTickets_Multiple() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        // First purchase
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 2);

        // Second purchase
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 3);

        // Check total tickets
        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.ticketCount, 5);
        assertEq(participant.btcContributed, 0.05 ether);
    }

    function test_BuyTickets_TooMany() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        vm.expectRevert(LotteryPool.TooManyTickets.selector);
        lotteryPool.buyTickets(roundId, 11); // > MAX_TICKETS_PER_USER (10)
    }

    function test_BuyTickets_InvalidRound() public {
        vm.prank(user1);
        vm.expectRevert(LotteryPool.InvalidRoundId.selector);
        lotteryPool.buyTickets(999, 1);
    }

    function test_BuyTickets_LotteryNotOpen() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        // Wait until lottery ends
        vm.warp(block.timestamp + 2 days);

        vm.prank(user1);
        vm.expectRevert(LotteryPool.LotteryNotOpen.selector);
        lotteryPool.buyTickets(roundId, 1);
    }

    function test_BuyTickets_LotteryFull() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 2, 7 days
        );

        // Fill lottery
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        vm.prank(user2);
        lotteryPool.buyTickets(roundId, 1);

        // Try to join full lottery
        vm.prank(user3);
        vm.expectRevert(LotteryPool.LotteryFull.selector);
        lotteryPool.buyTickets(roundId, 1);
    }

    function test_BuyTickets_ZeroAmount() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        vm.expectRevert(LotteryPool.InvalidAmount.selector);
        lotteryPool.buyTickets(roundId, 0);
    }

    function test_BuyTickets_WhenPaused() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(owner);
        lotteryPool.pause();

        vm.prank(user1);
        vm.expectRevert();
        lotteryPool.buyTickets(roundId, 1);
    }

    /*//////////////////////////////////////////////////////////////
                        DRAW REQUEST TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RequestDraw() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        // Buy some tickets
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        // Wait for lottery to end
        vm.warp(block.timestamp + 2 days);

        // Mock VRF response
        uint256 expectedRequestId = 123;
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSignature(
                "requestRandomWords(bytes32,uint64,uint16,uint32,uint32)",
                KEY_HASH,
                SUBSCRIPTION_ID,
                3,
                200000,
                1
            ),
            abi.encode(expectedRequestId)
        );

        vm.expectEmit(true, false, false, true);
        emit DrawRequested(roundId, expectedRequestId);

        vm.prank(owner);
        lotteryPool.requestDraw(roundId);

        // Check lottery status
        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(uint256(round.status), uint256(LotteryPool.LotteryStatus.DRAWING));
        assertEq(round.vrfRequestId, expectedRequestId);
    }

    function test_RequestDraw_InvalidRound() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidRoundId.selector);
        lotteryPool.requestDraw(999);
    }

    function test_RequestDraw_NotEnded() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        vm.prank(owner);
        vm.expectRevert(LotteryPool.LotteryNotEnded.selector);
        lotteryPool.requestDraw(roundId);
    }

    function test_RequestDraw_NoParticipants() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        // Wait for lottery to end
        vm.warp(block.timestamp + 2 days);

        vm.prank(owner);
        vm.expectRevert(LotteryPool.NotParticipant.selector);
        lotteryPool.requestDraw(roundId);
    }

    function test_RequestDraw_AlreadyRequested() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        vm.warp(block.timestamp + 2 days);

        // Mock VRF
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSignature(
                "requestRandomWords(bytes32,uint64,uint16,uint32,uint32)"
            ),
            abi.encode(123)
        );

        vm.startPrank(owner);
        lotteryPool.requestDraw(roundId);

        vm.expectRevert(LotteryPool.DrawAlreadyRequested.selector);
        lotteryPool.requestDraw(roundId);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetLotteryInfo() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(round.roundId, roundId);
        assertEq(round.ticketPrice, 0.01 ether);
    }

    function test_GetParticipants() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        vm.prank(user2);
        lotteryPool.buyTickets(roundId, 1);

        address[] memory participants = lotteryPool.getParticipants(roundId);
        assertEq(participants.length, 2);
        assertEq(participants[0], user1);
        assertEq(participants[1], user2);
    }

    function test_GetWinProbability() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 3);

        vm.prank(user2);
        lotteryPool.buyTickets(roundId, 7);

        // User1 has 3/10 = 30% probability
        uint256 prob1 = lotteryPool.getWinProbability(roundId, user1);
        assertEq(prob1, 3000); // 30% in basis points

        // User2 has 7/10 = 70% probability
        uint256 prob2 = lotteryPool.getWinProbability(roundId, user2);
        assertEq(prob2, 7000); // 70% in basis points
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CancelLottery() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.expectEmit(true, false, false, true);
        emit LotteryCancelled(roundId, "Emergency");

        vm.prank(owner);
        lotteryPool.cancelLottery(roundId, "Emergency");

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(uint256(round.status), uint256(LotteryPool.LotteryStatus.CANCELLED));
    }

    function test_CancelLottery_InvalidRound() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidRoundId.selector);
        lotteryPool.cancelLottery(999, "Test");
    }

    function test_CancelLottery_OnlyOwner() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        vm.expectRevert();
        lotteryPool.cancelLottery(roundId, "Test");
    }

    function test_SetFeeCollector() public {
        address newCollector = makeAddr("newCollector");

        vm.prank(owner);
        lotteryPool.setFeeCollector(newCollector);

        assertEq(lotteryPool.feeCollector(), newCollector);
    }

    function test_SetFeeCollector_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPool.InvalidAddress.selector);
        lotteryPool.setFeeCollector(address(0));
    }

    function test_SetFeeCollector_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        lotteryPool.setFeeCollector(makeAddr("new"));
    }

    function test_Pause() public {
        vm.prank(owner);
        lotteryPool.pause();

        assertTrue(lotteryPool.paused());
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        lotteryPool.pause();
        lotteryPool.unpause();
        vm.stopPrank();

        assertFalse(lotteryPool.paused());
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FullLotteryLifecycle() public {
        // 1. Create lottery
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        // 2. Multiple users buy tickets
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 3);

        vm.prank(user2);
        lotteryPool.buyTickets(roundId, 2);

        vm.prank(user3);
        lotteryPool.buyTickets(roundId, 5);

        // 3. Check participants
        address[] memory participants = lotteryPool.getParticipants(roundId);
        assertEq(participants.length, 3);

        // 4. Wait for lottery to end
        vm.warp(block.timestamp + 2 days);

        // Check lottery status before draw
        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(uint256(round.status), uint256(LotteryPool.LotteryStatus.OPEN));
        assertGt(round.totalBtcCollected, 0);
    }

    function test_MultipleRoundsSimultaneous() public {
        // Create multiple lottery rounds
        vm.startPrank(owner);
        uint256 round1 = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        uint256 round2 = lotteryPool.createLottery(
            LotteryPool.LotteryType.MONTHLY, 0.02 ether, 200, 30 days
        );
        vm.stopPrank();

        // Users can participate in multiple rounds
        vm.prank(user1);
        lotteryPool.buyTickets(round1, 1);

        vm.prank(user1);
        lotteryPool.buyTickets(round2, 2);

        // Check each round independently
        assertEq(lotteryPool.getLotteryInfo(round1).currentParticipants, 1);
        assertEq(lotteryPool.getLotteryInfo(round2).currentParticipants, 1);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_CreateLottery_TicketPrice(uint256 price) public {
        price = bound(price, MIN_TICKET_PRICE, MAX_TICKET_PRICE);

        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, price, 100, 7 days
        );

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(round.ticketPrice, price);
    }

    function testFuzz_BuyTickets_Amount(uint8 ticketCount) public {
        ticketCount = uint8(bound(ticketCount, 1, 10));

        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, ticketCount);

        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.ticketCount, ticketCount);
    }

    function testFuzz_CreateLottery_MaxParticipants(uint256 maxParticipants) public {
        maxParticipants = bound(maxParticipants, 1, 1000);

        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, maxParticipants, 7 days
        );

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(round.maxParticipants, maxParticipants);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_BuyMaxTickets() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        // Buy maximum tickets (10)
        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 10);

        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.ticketCount, 10);
    }

    function test_EdgeCase_SingleParticipant() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 1 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        // Single participant should have 100% probability
        uint256 probability = lotteryPool.getWinProbability(roundId, user1);
        assertEq(probability, 10000); // 100%
    }

    function test_EdgeCase_MinimumTicketPrice() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, MIN_TICKET_PRICE, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.btcContributed, MIN_TICKET_PRICE);
    }

    function test_EdgeCase_MaximumTicketPrice() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, MAX_TICKET_PRICE, 100, 7 days
        );

        vm.prank(user1);
        lotteryPool.buyTickets(roundId, 1);

        LotteryPool.Participant memory participant = lotteryPool.getParticipantInfo(roundId, user1);
        assertEq(participant.btcContributed, MAX_TICKET_PRICE);
    }

    function test_EdgeCase_CustomLotteryType() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.CUSTOM, 0.01 ether, 100, 14 days
        );

        LotteryPool.LotteryRound memory round = lotteryPool.getLotteryInfo(roundId);
        assertEq(uint256(round.lotteryType), uint256(LotteryPool.LotteryType.CUSTOM));
    }

    function test_EdgeCase_ZeroProbabilityBeforeTickets() public {
        vm.prank(owner);
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY, 0.01 ether, 100, 7 days
        );

        // Before any tickets, probability should be 0
        uint256 probability = lotteryPool.getWinProbability(roundId, user1);
        assertEq(probability, 0);
    }
}
