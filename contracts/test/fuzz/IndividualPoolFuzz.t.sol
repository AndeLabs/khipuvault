// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "forge-std/Test.sol";
import {IndividualPool} from "../../src/pools/IndividualPool.sol";
import {MockMezoIntegration} from "../mocks/MockMezoIntegration.sol";
import {MockYieldAggregator} from "../mocks/MockYieldAggregator.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/**
 * @title IndividualPoolFuzzTest
 * @notice Fuzzing tests for IndividualPool to find edge cases
 * @dev Tests random inputs to ensure contract behaves correctly
 */
contract IndividualPoolFuzzTest is Test {
    IndividualPool public pool;
    MockMezoIntegration public mezoIntegration;
    MockYieldAggregator public yieldAggregator;
    MockERC20 public wbtc;
    MockERC20 public musd;

    address public feeCollector = address(0x999);
    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        // Deploy mock tokens
        wbtc = new MockERC20("Wrapped Bitcoin", "WBTC", 8);
        musd = new MockERC20("Mezo USD", "MUSD", 18);

        // Deploy mock integrations
        mezoIntegration = new MockMezoIntegration(address(wbtc), address(musd));
        yieldAggregator = new MockYieldAggregator(address(musd));

        // Deploy pool
        pool = new IndividualPool(
            address(mezoIntegration),
            address(yieldAggregator),
            address(wbtc),
            address(musd),
            feeCollector
        );

        // Setup: Mint tokens and approvals
        wbtc.mint(alice, 1000 ether);
        wbtc.mint(bob, 1000 ether);

        vm.prank(alice);
        wbtc.approve(address(pool), type(uint256).max);

        vm.prank(bob);
        wbtc.approve(address(pool), type(uint256).max);

        // Fund mezo integration
        musd.mint(address(mezoIntegration), 1000000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT FUZZING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fuzz test: Deposit should work for any valid amount
     * @dev Tests deposits between MIN and MAX limits
     */
    function testFuzz_Deposit_ValidRange(uint256 btcAmount) public {
        // Bound the amount to valid range
        btcAmount = bound(btcAmount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());

        vm.prank(alice);
        pool.deposit(btcAmount);

        // Verify deposit was recorded
        (uint256 depositedBtc, , , , , bool active) = pool.userDeposits(alice);
        assertEq(depositedBtc, btcAmount);
        assertTrue(active);
    }

    /**
     * @notice Fuzz test: Deposits below minimum should revert
     */
    function testFuzz_Deposit_RevertsIfBelowMinimum(uint256 btcAmount) public {
        // Bound to values below minimum
        btcAmount = bound(btcAmount, 1, pool.MIN_DEPOSIT() - 1);

        vm.prank(alice);
        vm.expectRevert(IndividualPool.MinimumDepositNotMet.selector);
        pool.deposit(btcAmount);
    }

    /**
     * @notice Fuzz test: Deposits above maximum should revert
     */
    function testFuzz_Deposit_RevertsIfAboveMaximum(uint256 btcAmount) public {
        // Bound to values above maximum
        btcAmount = bound(btcAmount, pool.MAX_DEPOSIT() + 1, 1000 ether);
        
        // Ensure user has enough tokens
        wbtc.mint(alice, btcAmount);

        vm.prank(alice);
        vm.expectRevert(IndividualPool.MaximumDepositExceeded.selector);
        pool.deposit(btcAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        MULTI-USER FUZZING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fuzz test: Two users with random deposits should both be able to withdraw
     * @dev Critical test for multi-user rounding errors
     */
    function testFuzz_MultiUser_BothCanWithdraw(
        uint256 aliceAmount,
        uint256 bobAmount,
        uint256 timeElapsed
    ) public {
        // Bound amounts to valid range
        aliceAmount = bound(aliceAmount, pool.MIN_DEPOSIT(), 10 ether);
        bobAmount = bound(bobAmount, pool.MIN_DEPOSIT(), 10 ether);
        timeElapsed = bound(timeElapsed, 1 days, 365 days);

        // Alice deposits
        vm.prank(alice);
        pool.deposit(aliceAmount);

        // Time passes
        skip(timeElapsed / 2);

        // Bob deposits
        vm.prank(bob);
        pool.deposit(bobAmount);

        // More time passes
        skip(timeElapsed / 2);

        // Alice withdraws
        vm.prank(alice);
        (uint256 aliceBtc, ) = pool.withdraw();
        assertGt(aliceBtc, 0, "Alice should receive BTC");

        // Bob should still be able to withdraw
        vm.prank(bob);
        (uint256 bobBtc, ) = pool.withdraw();
        assertGt(bobBtc, 0, "Bob should receive BTC");
    }

    /**
     * @notice Fuzz test: Multiple deposits and withdrawals with random timing
     */
    function testFuzz_MultiUser_RandomTiming(
        uint256 amount1,
        uint256 amount2,
        uint256 time1,
        uint256 time2
    ) public {
        // Bound inputs
        amount1 = bound(amount1, pool.MIN_DEPOSIT(), 5 ether);
        amount2 = bound(amount2, pool.MIN_DEPOSIT(), 5 ether);
        time1 = bound(time1, 1 days, 180 days);
        time2 = bound(time2, 1 days, 180 days);

        // User 1 deposits
        vm.prank(alice);
        pool.deposit(amount1);

        skip(time1);

        // User 2 deposits
        vm.prank(bob);
        pool.deposit(amount2);

        skip(time2);

        // Both withdraw - should not revert
        vm.prank(alice);
        pool.withdraw();

        vm.prank(bob);
        pool.withdraw();

        // Pool should be empty
        assertEq(pool.totalBtcDeposited(), 0);
        assertEq(pool.totalMusdMinted(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        YIELD CALCULATION FUZZING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fuzz test: Yield calculations should always be <= total pool yield
     */
    function testFuzz_Yield_ProportionalCalculation(
        uint256 aliceAmount,
        uint256 bobAmount
    ) public {
        // Bound amounts
        aliceAmount = bound(aliceAmount, pool.MIN_DEPOSIT(), 10 ether);
        bobAmount = bound(bobAmount, pool.MIN_DEPOSIT(), 10 ether);

        // Both deposit
        vm.prank(alice);
        pool.deposit(aliceAmount);

        vm.prank(bob);
        pool.deposit(bobAmount);

        // Time passes
        skip(365 days);

        // Calculate individual yields
        uint256 aliceYield = pool.calculateYield(alice);
        uint256 bobYield = pool.calculateYield(bob);

        // Get total pool yield
        uint256 totalPoolYield = yieldAggregator.getPendingYield(address(pool));

        // Individual yields should not exceed total
        assertLe(aliceYield, totalPoolYield, "Alice yield should be <= total");
        assertLe(bobYield, totalPoolYield, "Bob yield should be <= total");
        
        // Sum should be approximately equal to total (allowing small rounding)
        uint256 sum = aliceYield + bobYield;
        assertApproxEqAbs(sum, totalPoolYield, 1e15, "Sum should approximate total");
    }

    /**
     * @notice Fuzz test: Yield should increase with time
     */
    function testFuzz_Yield_IncreasesWithTime(
        uint256 amount,
        uint256 time1,
        uint256 time2
    ) public {
        // Bound inputs
        amount = bound(amount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());
        time1 = bound(time1, 1 days, 180 days);
        time2 = bound(time2, time1 + 1 days, 365 days);

        vm.startPrank(alice);
        pool.deposit(amount);

        skip(time1);
        uint256 yield1 = pool.calculateYield(alice);

        skip(time2 - time1);
        uint256 yield2 = pool.calculateYield(alice);

        vm.stopPrank();

        assertGt(yield2, yield1, "Yield should increase with time");
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUZZING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fuzz test: User should get back approximately their deposit
     */
    function testFuzz_Withdraw_ReturnsApproximateDeposit(
        uint256 btcAmount,
        uint256 timeElapsed
    ) public {
        btcAmount = bound(btcAmount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());
        timeElapsed = bound(timeElapsed, 0, 365 days);

        vm.startPrank(alice);
        pool.deposit(btcAmount);

        skip(timeElapsed);

        (uint256 returnedBtc, uint256 yieldAmount) = pool.withdraw();
        vm.stopPrank();

        // Should get approximately the same BTC back (allowing for small differences)
        assertApproxEqAbs(
            returnedBtc,
            btcAmount,
            btcAmount / 100, // 1% tolerance
            "Should return approximately deposited amount"
        );

        // If time passed, should have some yield
        if (timeElapsed > 30 days) {
            assertGt(yieldAmount, 0, "Should have earned yield");
        }
    }

    /**
     * @notice Fuzz test: Cannot withdraw more than once
     */
    function testFuzz_Withdraw_CannotWithdrawTwice(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());

        vm.startPrank(alice);
        pool.deposit(btcAmount);

        skip(30 days);

        pool.withdraw();

        // Second withdrawal should fail
        vm.expectRevert(IndividualPool.NoActiveDeposit.selector);
        pool.withdraw();
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        STRESS TESTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Stress test: Many sequential deposits and withdrawals
     */
    function testFuzz_Stress_SequentialOperations(uint8 userCount) public {
        // Bound to reasonable number of users
        userCount = uint8(bound(userCount, 2, 20));

        address[] memory users = new address[](userCount);
        uint256[] memory deposits = new uint256[](userCount);

        // Create users and deposits
        for (uint256 i = 0; i < userCount; i++) {
            users[i] = address(uint160(1000 + i));
            deposits[i] = bound(
                uint256(keccak256(abi.encode(i))),
                pool.MIN_DEPOSIT(),
                2 ether
            );

            // Mint and approve
            wbtc.mint(users[i], deposits[i]);
            vm.prank(users[i]);
            wbtc.approve(address(pool), deposits[i]);
        }

        // All users deposit
        for (uint256 i = 0; i < userCount; i++) {
            vm.prank(users[i]);
            pool.deposit(deposits[i]);
        }

        skip(90 days);

        // All users withdraw in random order
        for (uint256 i = 0; i < userCount; i++) {
            uint256 randomIndex = uint256(keccak256(abi.encode(i, block.timestamp))) % userCount;
            address user = users[randomIndex];

            // Skip if already withdrawn
            (, , , , , bool active) = pool.userDeposits(user);
            if (!active) continue;

            vm.prank(user);
            (uint256 btc, ) = pool.withdraw();
            assertGt(btc, 0, "User should receive BTC");
        }

        // Pool should be empty or near-empty
        assertLt(pool.totalMusdMinted(), 1e15, "Pool should be nearly empty");
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Edge case: Immediate withdrawal (no yield)
     */
    function testFuzz_EdgeCase_ImmediateWithdrawal(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());

        vm.startPrank(alice);
        pool.deposit(btcAmount);

        // Withdraw immediately
        (uint256 returnedBtc, uint256 yieldAmount) = pool.withdraw();
        vm.stopPrank();

        assertApproxEqAbs(returnedBtc, btcAmount, 1e5, "Should return deposit");
        assertEq(yieldAmount, 0, "Should have no yield");
    }

    /**
     * @notice Edge case: Maximum time elapsed
     */
    function testFuzz_EdgeCase_MaxTimeElapsed(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, pool.MIN_DEPOSIT(), pool.MAX_DEPOSIT());

        vm.prank(alice);
        pool.deposit(btcAmount);

        // Max realistic time: 10 years
        skip(3650 days);

        uint256 yield = pool.calculateYield(alice);
        assertGt(yield, 0, "Should have accumulated yield");

        vm.prank(alice);
        (uint256 returnedBtc, uint256 yieldAmount) = pool.withdraw();
        
        assertGt(returnedBtc, 0, "Should return BTC");
        assertGt(yieldAmount, 0, "Should have yield");
    }
}
