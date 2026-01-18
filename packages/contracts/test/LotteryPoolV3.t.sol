// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {LotteryPoolV3} from "../src/pools/v3/LotteryPoolV3.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {MockYieldAggregator} from "./mocks/MockYieldAggregator.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

/**
 * @title LotteryPoolV3 Test Suite
 * @notice Comprehensive tests for the upgradeable LotteryPoolV3 contract
 */
contract LotteryPoolV3Test is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    LotteryPoolV3 public lottery;
    LotteryPoolV3 public lotteryImpl;
    MockYieldAggregator public yieldAggregator;
    MockMUSD public musd;

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public operator = makeAddr("operator");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public feeCollector = makeAddr("feeCollector");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_BALANCE = 100_000 ether;
    uint256 public constant TICKET_PRICE = 10 ether;
    uint256 public constant MAX_TICKETS = 1000;
    uint256 public constant ROUND_DURATION = 7 days;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event RoundCreated(
        uint256 indexed roundId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 endTime
    );

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

    event WinnerSelected(
        uint256 indexed roundId,
        address indexed winner,
        uint256 prize,
        uint256 winningTicket
    );

    event PrizeClaimed(
        uint256 indexed roundId,
        address indexed participant,
        uint256 amount,
        bool isWinner
    );

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();
        yieldAggregator = new MockYieldAggregator(address(musd));

        // Fund yield aggregator
        musd.mint(address(yieldAggregator), 10_000_000 ether);

        // Deploy LotteryPoolV3 with proxy
        vm.startPrank(owner);
        lotteryImpl = new LotteryPoolV3();

        bytes memory initData = abi.encodeWithSelector(
            LotteryPoolV3.initialize.selector,
            address(musd),
            address(yieldAggregator),
            feeCollector,
            operator
        );

        UUPSProxy proxy = new UUPSProxy(address(lotteryImpl), initData);
        lottery = LotteryPoolV3(address(proxy));
        vm.stopPrank();

        // Give users MUSD
        musd.mint(user1, INITIAL_BALANCE);
        musd.mint(user2, INITIAL_BALANCE);
        musd.mint(user3, INITIAL_BALANCE);

        // Approve lottery to spend MUSD
        vm.prank(user1);
        musd.approve(address(lottery), type(uint256).max);

        vm.prank(user2);
        musd.approve(address(lottery), type(uint256).max);

        vm.prank(user3);
        musd.approve(address(lottery), type(uint256).max);

        // Labels
        vm.label(address(lottery), "LotteryPoolV3");
        vm.label(address(yieldAggregator), "YieldAggregator");
        vm.label(address(musd), "MUSD");
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public view {
        assertEq(lottery.owner(), owner);
        assertEq(lottery.operator(), operator);
        assertEq(address(lottery.MUSD()), address(musd));
        assertEq(lottery.feeCollector(), feeCollector);
        assertEq(lottery.currentRoundId(), 0);
        assertFalse(lottery.paused());
    }

    function test_Initialization_ZeroAddress() public {
        LotteryPoolV3 newImpl = new LotteryPoolV3();

        bytes memory initData = abi.encodeWithSelector(
            LotteryPoolV3.initialize.selector,
            address(0), // Invalid
            address(yieldAggregator),
            feeCollector,
            operator
        );

        vm.expectRevert();
        new UUPSProxy(address(newImpl), initData);
    }

    /*//////////////////////////////////////////////////////////////
                        ROUND CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateRound() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        assertEq(roundId, 1);
        assertEq(lottery.currentRoundId(), 1);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.ticketPrice, TICKET_PRICE);
        assertEq(round.maxTickets, MAX_TICKETS);
        assertEq(round.totalTicketsSold, 0);
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.OPEN));
    }

    function test_CreateRound_InvalidTicketPrice() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPoolV3.InvalidTicketPrice.selector);
        lottery.createRound(0.5 ether, MAX_TICKETS, ROUND_DURATION); // Below minimum
    }

    function test_CreateRound_InvalidDuration() public {
        vm.prank(owner);
        vm.expectRevert(LotteryPoolV3.InvalidDuration.selector);
        lottery.createRound(TICKET_PRICE, MAX_TICKETS, 30 minutes); // Below minimum
    }

    function test_CreateRound_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);
    }

    /*//////////////////////////////////////////////////////////////
                        TICKET PURCHASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BuyTickets() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        uint256 ticketCount = 5;
        uint256 expectedCost = TICKET_PRICE * ticketCount;

        vm.prank(user1);
        lottery.buyTickets(roundId, ticketCount);

        LotteryPoolV3.Participant memory participant = lottery.getParticipant(roundId, user1);
        assertEq(participant.ticketCount, ticketCount);
        assertEq(participant.musdContributed, expectedCost);
        assertEq(participant.firstTicketIndex, 0);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.totalTicketsSold, ticketCount);
        assertEq(round.totalMusd, expectedCost);
    }

    function test_BuyTickets_MultipleUsers() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 3);

        vm.prank(user2);
        lottery.buyTickets(roundId, 5);

        vm.prank(user3);
        lottery.buyTickets(roundId, 2);

        address[] memory participants = lottery.getParticipants(roundId);
        assertEq(participants.length, 3);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.totalTicketsSold, 10);
    }

    function test_BuyTickets_TooMany() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        vm.expectRevert(LotteryPoolV3.TooManyTickets.selector);
        lottery.buyTickets(roundId, 101); // > MAX_TICKETS_PER_USER
    }

    function test_BuyTickets_RoundNotOpen() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        // Warp past end time
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        vm.prank(user1);
        vm.expectRevert(LotteryPoolV3.RoundNotOpen.selector);
        lottery.buyTickets(roundId, 1);
    }

    /*//////////////////////////////////////////////////////////////
                        COMMIT-REVEAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CommitReveal_FullFlow() public {
        // 1. Create round
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        // 2. Buy tickets
        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        vm.prank(user2);
        lottery.buyTickets(roundId, 3);

        // 3. Wait for round to end
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        // 4. Submit commitment
        uint256 seed = 12345;
        bytes32 salt = keccak256("secret_salt");
        bytes32 commitment = keccak256(abi.encodePacked(seed, salt));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.COMMIT));

        // 5. Reveal seed
        vm.prank(operator);
        lottery.revealSeed(roundId, seed, salt);

        round = lottery.getRound(roundId);
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.COMPLETED));
        assertTrue(round.winner != address(0));
    }

    function test_CommitReveal_InvalidCommitment() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 1);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        vm.prank(operator);
        vm.expectRevert(LotteryPoolV3.InvalidCommitment.selector);
        lottery.submitCommitment(roundId, bytes32(0));
    }

    function test_CommitReveal_InvalidReveal() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 1);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        bytes32 commitment = keccak256(abi.encodePacked(uint256(123), bytes32("salt")));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        // Try to reveal with wrong values
        vm.prank(operator);
        vm.expectRevert(LotteryPoolV3.InvalidReveal.selector);
        lottery.revealSeed(roundId, 456, bytes32("wrong_salt"));
    }

    /*//////////////////////////////////////////////////////////////
                        CLAIM TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimPrize_Winner() public {
        // Setup and complete round
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 1);

        // Advance block for flash loan protection
        vm.roll(block.number + 1);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        uint256 seed = 0; // Will select ticket 0 (user1)
        bytes32 salt = bytes32("salt");
        bytes32 commitment = keccak256(abi.encodePacked(seed, salt));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        vm.prank(operator);
        lottery.revealSeed(roundId, seed, salt);

        // Claim prize
        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.winner, user1);

        uint256 balanceBefore = musd.balanceOf(user1);

        vm.prank(user1);
        lottery.claimPrize(roundId);

        uint256 balanceAfter = musd.balanceOf(user1);
        assertGt(balanceAfter, balanceBefore);
    }

    function test_ClaimPrize_NonWinner() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        vm.prank(user2);
        lottery.buyTickets(roundId, 5);

        // Advance block for flash loan protection
        vm.roll(block.number + 1);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        // Use seed that selects user1 (ticket 0-4)
        uint256 seed = 2;
        bytes32 salt = bytes32("salt");
        bytes32 commitment = keccak256(abi.encodePacked(seed, salt));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        vm.prank(operator);
        lottery.revealSeed(roundId, seed, salt);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        address winner = round.winner;
        address nonWinner = winner == user1 ? user2 : user1;

        uint256 balanceBefore = musd.balanceOf(nonWinner);

        vm.prank(nonWinner);
        lottery.claimPrize(roundId);

        uint256 balanceAfter = musd.balanceOf(nonWinner);
        // Non-winner should get their principal back
        assertEq(balanceAfter - balanceBefore, 5 * TICKET_PRICE);
    }

    function test_ClaimPrize_AlreadyClaimed() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 1);

        // Advance block for flash loan protection
        vm.roll(block.number + 1);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        uint256 seed = 0;
        bytes32 salt = bytes32("salt");
        bytes32 commitment = keccak256(abi.encodePacked(seed, salt));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        vm.prank(operator);
        lottery.revealSeed(roundId, seed, salt);

        vm.prank(user1);
        lottery.claimPrize(roundId);

        vm.prank(user1);
        vm.expectRevert(LotteryPoolV3.AlreadyClaimed.selector);
        lottery.claimPrize(roundId);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CancelRound() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        vm.prank(owner);
        lottery.cancelRound(roundId, "Emergency");

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.CANCELLED));
    }

    function test_ClaimRefund_CancelledRound() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        uint256 balanceBefore = musd.balanceOf(user1);

        vm.prank(owner);
        lottery.cancelRound(roundId, "Emergency");

        vm.prank(user1);
        lottery.claimRefund(roundId);

        uint256 balanceAfter = musd.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 5 * TICKET_PRICE);
    }

    function test_SetOperator() public {
        address newOperator = makeAddr("newOperator");

        vm.prank(owner);
        lottery.setOperator(newOperator);

        assertEq(lottery.operator(), newOperator);
    }

    function test_ForceComplete() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        // Warp past reveal deadline + FORCE_COMPLETE_DELAY (C-01 security fix)
        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        vm.warp(round.revealDeadline + lottery.FORCE_COMPLETE_DELAY() + 1);

        vm.prank(owner);
        lottery.forceComplete(roundId);

        round = lottery.getRound(roundId);
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.COMPLETED));
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetWinProbability() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 3);

        vm.prank(user2);
        lottery.buyTickets(roundId, 7);

        // User1: 3/10 = 30%
        assertEq(lottery.getWinProbability(roundId, user1), 3000);

        // User2: 7/10 = 70%
        assertEq(lottery.getWinProbability(roundId, user2), 7000);
    }

    function test_GetActiveRound() public {
        assertEq(lottery.getActiveRound(), 0);

        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        assertEq(lottery.getActiveRound(), roundId);

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        assertEq(lottery.getActiveRound(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_BuyTickets(uint8 ticketCount) public {
        ticketCount = uint8(bound(ticketCount, 1, 100));

        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, ticketCount);

        LotteryPoolV3.Participant memory participant = lottery.getParticipant(roundId, user1);
        assertEq(participant.ticketCount, ticketCount);
    }

    function testFuzz_CreateRound_TicketPrice(uint256 price) public {
        price = bound(price, 1 ether, 10_000 ether);

        vm.prank(owner);
        uint256 roundId = lottery.createRound(price, MAX_TICKETS, ROUND_DURATION);

        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.ticketPrice, price);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_SingleParticipant_100Probability() public {
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        vm.prank(user1);
        lottery.buyTickets(roundId, 1);

        assertEq(lottery.getWinProbability(roundId, user1), 10000); // 100%
    }

    function test_MultipleRounds() public {
        vm.startPrank(owner);
        uint256 round1 = lottery.createRound(TICKET_PRICE, 100, ROUND_DURATION);
        uint256 round2 = lottery.createRound(TICKET_PRICE * 2, 200, ROUND_DURATION * 2);
        vm.stopPrank();

        assertEq(round1, 1);
        assertEq(round2, 2);
        assertEq(lottery.currentRoundId(), 2);
    }

    /*//////////////////////////////////////////////////////////////
                        C-02 FIX VERIFICATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Test C-02 Fix: Non-contiguous ticket purchases are handled correctly
     * @dev This test verifies that when users buy tickets in multiple batches
     *      (with other users buying in between), all tickets are correctly
     *      assigned to their owners and can win the lottery.
     *
     * Scenario:
     * 1. User1 buys 5 tickets (tickets 0-4)
     * 2. User2 buys 5 tickets (tickets 5-9)
     * 3. User1 buys 3 more tickets (tickets 10-12) <- NON-CONTIGUOUS!
     *
     * Before fix: Tickets 10-12 would have no owner (orphaned)
     * After fix: Tickets 10-12 correctly belong to User1
     */
    function test_C02Fix_NonContiguousTicketPurchases() public {
        // Create round
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        // User1 buys 5 tickets (tickets 0-4)
        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        // User2 buys 5 tickets (tickets 5-9)
        vm.prank(user2);
        lottery.buyTickets(roundId, 5);

        // User1 buys 3 more tickets (tickets 10-12) - NON-CONTIGUOUS
        vm.prank(user1);
        lottery.buyTickets(roundId, 3);

        // Verify total tickets and user counts
        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.totalTicketsSold, 13, "Total tickets should be 13");

        LotteryPoolV3.Participant memory p1 = lottery.getParticipant(roundId, user1);
        assertEq(p1.ticketCount, 8, "User1 should have 8 tickets total");

        LotteryPoolV3.Participant memory p2 = lottery.getParticipant(roundId, user2);
        assertEq(p2.ticketCount, 5, "User2 should have 5 tickets");

        // Verify ticket ownership via the ticketOwners mapping
        // Tickets 0-4 belong to user1
        for (uint256 i = 0; i < 5; i++) {
            assertEq(lottery.ticketOwners(roundId, i), user1, "Tickets 0-4 should belong to user1");
        }

        // Tickets 5-9 belong to user2
        for (uint256 i = 5; i < 10; i++) {
            assertEq(lottery.ticketOwners(roundId, i), user2, "Tickets 5-9 should belong to user2");
        }

        // Tickets 10-12 belong to user1 (NON-CONTIGUOUS - this is the C-02 fix)
        for (uint256 i = 10; i < 13; i++) {
            assertEq(lottery.ticketOwners(roundId, i), user1, "Tickets 10-12 should belong to user1 (C-02 fix)");
        }

        // Verify win probability is correct
        // User1: 8/13 tickets ≈ 61.5% = 6153 basis points
        uint256 user1Prob = lottery.getWinProbability(roundId, user1);
        assertEq(user1Prob, 6153, "User1 probability should be 6153 basis points (8/13)");

        // User2: 5/13 tickets ≈ 38.5% = 3846 basis points
        uint256 user2Prob = lottery.getWinProbability(roundId, user2);
        assertEq(user2Prob, 3846, "User2 probability should be 3846 basis points (5/13)");
    }

    /**
     * @notice Test that non-contiguous ticket winner selection works correctly
     * @dev Completes a full round to ensure the winner is correctly identified
     *      even when their tickets are non-contiguous
     */
    function test_C02Fix_NonContiguousTicketWinnerSelection() public {
        // Create round
        vm.prank(owner);
        uint256 roundId = lottery.createRound(TICKET_PRICE, MAX_TICKETS, ROUND_DURATION);

        // User1 buys tickets 0-4
        vm.prank(user1);
        lottery.buyTickets(roundId, 5);

        // User2 buys tickets 5-9
        vm.prank(user2);
        lottery.buyTickets(roundId, 5);

        // User1 buys tickets 10-12 (non-contiguous)
        vm.prank(user1);
        lottery.buyTickets(roundId, 3);

        // End open phase
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        // Commit phase - use a seed that will select ticket 11 (belongs to user1)
        // The winning ticket = seed % totalTicketsSold = seed % 13
        // We need seed % 13 = 11, so seed could be 11, 24, 37, etc.
        uint256 seed = 11; // This will select ticket 11
        bytes32 salt = keccak256("test_salt");
        bytes32 commitment = keccak256(abi.encodePacked(seed, salt));

        vm.prank(operator);
        lottery.submitCommitment(roundId, commitment);

        // Reveal phase
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(operator);
        lottery.revealSeed(roundId, seed, salt);

        // Verify user1 is the winner (ticket 11 belongs to user1's non-contiguous batch)
        LotteryPoolV3.Round memory round = lottery.getRound(roundId);
        assertEq(round.winner, user1, "User1 should win with ticket 11 (C-02 fix)");
        assertEq(uint256(round.status), uint256(LotteryPoolV3.RoundStatus.COMPLETED), "Round should be completed");
    }
}
