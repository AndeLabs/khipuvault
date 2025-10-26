// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {IndividualPool} from "../../src/pools/IndividualPool.sol";
import {MockMezoIntegration} from "../mocks/MockMezoIntegration.sol";
import {MockYieldAggregator} from "../mocks/MockYieldAggregator.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/**
 * @title IndividualPoolTest
 * @notice Comprehensive unit tests for IndividualPool contract
 * @dev Tests all core functionality: deposit, yield, withdraw, admin functions
 */
contract IndividualPoolTest is Test {
    /*//////////////////////////////////////////////////////////////
                                CONTRACTS
    //////////////////////////////////////////////////////////////*/

    IndividualPool public pool;
    MockMezoIntegration public mezoIntegration;
    MockYieldAggregator public yieldAggregator;
    MockERC20 public wbtc;
    MockERC20 public musd;

    /*//////////////////////////////////////////////////////////////
                                ACTORS
    //////////////////////////////////////////////////////////////*/

    address public owner = address(this);
    address public feeCollector = makeAddr("feeCollector");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 constant INITIAL_BALANCE = 100 ether;
    uint256 constant MIN_DEPOSIT = 0.001 ether;
    uint256 constant MAX_DEPOSIT = 10 ether;
    uint256 constant PERFORMANCE_FEE = 100; // 1%

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 btcAmount,
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
        uint256 btcAmount,
        uint256 musdAmount,
        uint256 yieldAmount
    );

    event YieldUpdated(
        address indexed user,
        uint256 newYieldAmount
    );

    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mock tokens
        wbtc = new MockERC20("Wrapped Bitcoin", "WBTC", 8);
        musd = new MockERC20("Mezo USD", "MUSD", 18);

        // Deploy mock integrations
        mezoIntegration = new MockMezoIntegration(address(wbtc), address(musd));
        yieldAggregator = new MockYieldAggregator(address(musd));

        // Deploy IndividualPool
        pool = new IndividualPool(
            address(mezoIntegration),
            address(yieldAggregator),
            address(wbtc),
            address(musd),
            feeCollector
        );

        // Setup initial balances and approvals
        _setupUser(alice);
        _setupUser(bob);
        _setupUser(charlie);

        // Fund mocks with MUSD for operations
        musd.mint(address(mezoIntegration), 1000000 ether);
        musd.mint(address(yieldAggregator), 1000000 ether);
    }

    function _setupUser(address user) internal {
        // Mint WBTC to user
        wbtc.mint(user, INITIAL_BALANCE);
        
        // Approve pool to spend WBTC
        vm.prank(user);
        wbtc.approve(address(pool), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor_Success() public view {
        assertEq(address(pool.MEZO_INTEGRATION()), address(mezoIntegration));
        assertEq(address(pool.YIELD_AGGREGATOR()), address(yieldAggregator));
        assertEq(address(pool.WBTC()), address(wbtc));
        assertEq(address(pool.MUSD()), address(musd));
        assertEq(pool.feeCollector(), feeCollector);
        assertEq(pool.performanceFee(), PERFORMANCE_FEE);
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert(IndividualPool.InvalidAddress.selector);
        new IndividualPool(
            address(0),
            address(yieldAggregator),
            address(wbtc),
            address(musd),
            feeCollector
        );
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deposit_Success() public {
        uint256 depositAmount = 1 ether;
        
        vm.startPrank(alice);
        
        // Calculate expected MUSD (50% LTV at $60k BTC price)
        uint256 expectedMusd = (depositAmount * 60000e8 * 5000) / (1e8 * 10000);
        
        // Expect events
        vm.expectEmit(true, true, true, true);
        emit Deposited(alice, depositAmount, expectedMusd, block.timestamp);
        
        pool.deposit(depositAmount);
        
        vm.stopPrank();

        // Verify user deposit
        (
            uint256 btcAmount,
            uint256 musdMinted,
            uint256 yieldAccrued,
            uint256 depositTimestamp,
            uint256 lastYieldUpdate,
            bool active
        ) = pool.userDeposits(alice);

        assertEq(btcAmount, depositAmount);
        assertEq(musdMinted, expectedMusd);
        assertEq(yieldAccrued, 0);
        assertEq(depositTimestamp, block.timestamp);
        assertEq(lastYieldUpdate, block.timestamp);
        assertTrue(active);

        // Verify pool stats
        assertEq(pool.totalBtcDeposited(), depositAmount);
        assertEq(pool.totalMusdMinted(), expectedMusd);
    }

    function test_Deposit_RevertsOnMinimumNotMet() public {
        uint256 tooSmall = MIN_DEPOSIT - 1;
        
        vm.prank(alice);
        vm.expectRevert(IndividualPool.MinimumDepositNotMet.selector);
        pool.deposit(tooSmall);
    }

    function test_Deposit_RevertsOnMaximumExceeded() public {
        uint256 tooLarge = MAX_DEPOSIT + 1;
        
        vm.prank(alice);
        vm.expectRevert(IndividualPool.MaximumDepositExceeded.selector);
        pool.deposit(tooLarge);
    }

    function test_Deposit_RevertsOnDuplicateDeposit() public {
        uint256 depositAmount = 1 ether;
        
        vm.startPrank(alice);
        pool.deposit(depositAmount);
        
        vm.expectRevert(IndividualPool.DepositAlreadyExists.selector);
        pool.deposit(depositAmount);
        vm.stopPrank();
    }

    function test_Deposit_MultipleUsers() public {
        uint256 aliceDeposit = 1 ether;
        uint256 bobDeposit = 2 ether;
        
        vm.prank(alice);
        pool.deposit(aliceDeposit);
        
        vm.prank(bob);
        pool.deposit(bobDeposit);
        
        assertEq(pool.totalBtcDeposited(), aliceDeposit + bobDeposit);
    }

    /*//////////////////////////////////////////////////////////////
                        YIELD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateYield_Success() public {
        uint256 depositAmount = 1 ether;
        
        // Alice deposits
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        // Advance time by 30 days
        skip(30 days);
        
        // Update yield
        vm.prank(alice);
        pool.updateYield();
        
        // Verify yield was accrued
        (, , uint256 yieldAccrued, , , ) = pool.userDeposits(alice);
        assertGt(yieldAccrued, 0, "Yield should be greater than 0");
    }

    function test_UpdateYield_RevertsOnNoDeposit() public {
        vm.prank(alice);
        vm.expectRevert(IndividualPool.NoActiveDeposit.selector);
        pool.updateYield();
    }

    function test_CalculateYield_ReturnsCorrectAmount() public {
        uint256 depositAmount = 1 ether;
        
        // Alice deposits
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        // Advance time by 1 year
        skip(365 days);
        
        // Calculate expected yield (6% APR on MUSD principal)
        uint256 musdPrincipal = (depositAmount * 60000e8 * 5000) / (1e8 * 10000);
        uint256 expectedYield = (musdPrincipal * 600) / 10000; // 6% APR
        
        uint256 actualYield = pool.calculateYield(alice);
        
        // Allow 1% variance due to timing
        assertApproxEqRel(actualYield, expectedYield, 0.01e18);
    }

    function test_CalculateYield_ReturnsZeroForInactiveDeposit() public {
        uint256 yield = pool.calculateYield(alice);
        assertEq(yield, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        CLAIM YIELD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimYield_Success() public {
        uint256 depositAmount = 1 ether;
        
        // Alice deposits
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        // Advance time to accrue yield
        skip(365 days);
        
        // Get initial MUSD balance
        uint256 initialBalance = musd.balanceOf(alice);
        uint256 initialFeeCollectorBalance = musd.balanceOf(feeCollector);
        
        // Claim yield
        vm.prank(alice);
        uint256 yieldClaimed = pool.claimYield();
        
        // Verify yield was transferred
        assertGt(yieldClaimed, 0);
        assertEq(musd.balanceOf(alice), initialBalance + yieldClaimed);
        
        // Verify fee was collected
        uint256 feeCollected = musd.balanceOf(feeCollector) - initialFeeCollectorBalance;
        assertEq(feeCollected, yieldClaimed * PERFORMANCE_FEE / (10000 - PERFORMANCE_FEE));
        
        // Verify yield was reset
        (, , uint256 yieldAccrued, , , ) = pool.userDeposits(alice);
        assertEq(yieldAccrued, 0);
    }

    function test_ClaimYield_RevertsOnNoDeposit() public {
        vm.prank(alice);
        vm.expectRevert(IndividualPool.NoActiveDeposit.selector);
        pool.claimYield();
    }

    function test_ClaimYield_RevertsOnZeroYield() public {
        // Alice deposits
        vm.prank(alice);
        pool.deposit(1 ether);
        
        // Try to claim immediately (no yield accrued)
        vm.prank(alice);
        vm.expectRevert(IndividualPool.InvalidAmount.selector);
        pool.claimYield();
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAW TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Withdraw_Success() public {
        uint256 depositAmount = 1 ether;
        
        // Alice deposits
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        // Advance time
        skip(180 days);
        
        // Get initial balances
        uint256 initialWbtcBalance = wbtc.balanceOf(alice);
        uint256 initialMusdBalance = musd.balanceOf(alice);
        
        // Withdraw
        vm.prank(alice);
        (uint256 btcAmount, uint256 yieldAmount) = pool.withdraw();
        
        // Verify BTC was returned
        assertEq(btcAmount, depositAmount);
        assertEq(wbtc.balanceOf(alice), initialWbtcBalance + btcAmount);
        
        // Verify yield was paid
        assertGt(yieldAmount, 0);
        assertEq(musd.balanceOf(alice), initialMusdBalance + yieldAmount);
        
        // Verify deposit is now inactive
        (, , , , , bool active) = pool.userDeposits(alice);
        assertFalse(active);
        
        // Verify pool stats updated
        assertEq(pool.totalBtcDeposited(), 0);
    }

    function test_Withdraw_RevertsOnNoDeposit() public {
        vm.prank(alice);
        vm.expectRevert(IndividualPool.NoActiveDeposit.selector);
        pool.withdraw();
    }

    function test_Withdraw_WithNoYield() public {
        uint256 depositAmount = 1 ether;
        
        // Alice deposits and withdraws immediately
        vm.startPrank(alice);
        pool.deposit(depositAmount);
        
        (uint256 btcAmount, uint256 yieldAmount) = pool.withdraw();
        vm.stopPrank();
        
        assertEq(btcAmount, depositAmount);
        assertEq(yieldAmount, 0); // No time for yield to accrue
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetUserInfo_ReturnsCorrectData() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        skip(365 days);
        
        (
            IndividualPool.UserDeposit memory deposit,
            uint256 currentYield,
            uint256 netYield
        ) = pool.getUserInfo(alice);
        
        assertEq(deposit.btcAmount, depositAmount);
        assertTrue(deposit.active);
        assertGt(currentYield, 0);
        assertLt(netYield, currentYield); // Net should be less due to fee
    }

    function test_GetUserRoi_ReturnsCorrectPercentage() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(alice);
        pool.deposit(depositAmount);
        
        skip(365 days);
        
        uint256 roi = pool.getUserRoi(alice);
        
        // ROI should be approximately 6% = 600 basis points
        // Allow 10% variance
        assertApproxEqRel(roi, 600, 0.1e18);
    }

    function test_GetPoolStats_ReturnsCorrectData() public {
        vm.prank(alice);
        pool.deposit(1 ether);
        
        vm.prank(bob);
        pool.deposit(2 ether);
        
        (
            uint256 totalBtc,
            uint256 totalMusd,
            uint256 totalYields,
            uint256 avgApr
        ) = pool.getPoolStats();
        
        assertEq(totalBtc, 3 ether);
        assertGt(totalMusd, 0);
        assertEq(totalYields, 0); // No yields yet
        assertEq(avgApr, 600); // 6% APR
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetPerformanceFee_Success() public {
        uint256 newFee = 200; // 2%
        
        pool.setPerformanceFee(newFee);
        
        assertEq(pool.performanceFee(), newFee);
    }

    function test_SetPerformanceFee_RevertsOnTooHigh() public {
        uint256 tooHighFee = 1001; // > 10%
        
        vm.expectRevert(IndividualPool.InvalidFee.selector);
        pool.setPerformanceFee(tooHighFee);
    }

    function test_SetPerformanceFee_RevertsOnNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.setPerformanceFee(200);
    }

    function test_SetFeeCollector_Success() public {
        address newCollector = makeAddr("newCollector");
        
        pool.setFeeCollector(newCollector);
        
        assertEq(pool.feeCollector(), newCollector);
    }

    function test_SetFeeCollector_RevertsOnZeroAddress() public {
        vm.expectRevert(IndividualPool.InvalidAddress.selector);
        pool.setFeeCollector(address(0));
    }

    function test_Pause_Success() public {
        pool.pause();
        
        assertTrue(pool.paused());
        
        // Try to deposit while paused
        vm.prank(alice);
        vm.expectRevert();
        pool.deposit(1 ether);
    }

    function test_Unpause_Success() public {
        pool.pause();
        pool.unpause();
        
        assertFalse(pool.paused());
        
        // Deposit should work again
        vm.prank(alice);
        pool.deposit(1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_Deposit_ValidAmounts(uint256 amount) public {
        // Bound to valid range
        amount = bound(amount, MIN_DEPOSIT, MAX_DEPOSIT);
        
        // Ensure alice has enough
        wbtc.mint(alice, amount);
        
        vm.prank(alice);
        pool.deposit(amount);
        
        (uint256 btcAmount, , , , , bool active) = pool.userDeposits(alice);
        assertEq(btcAmount, amount);
        assertTrue(active);
    }

    function testFuzz_Withdraw_AfterTimeElapsed(uint256 timeElapsed) public {
        // Bound to reasonable time range (1 day to 2 years)
        timeElapsed = bound(timeElapsed, 1 days, 730 days);
        
        // Alice deposits
        vm.prank(alice);
        pool.deposit(1 ether);
        
        // Advance time
        skip(timeElapsed);
        
        // Withdraw
        vm.prank(alice);
        (uint256 btcAmount, uint256 yieldAmount) = pool.withdraw();
        
        assertEq(btcAmount, 1 ether);
        assertGt(yieldAmount, 0); // Should have some yield
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Integration_FullLifecycle() public {
        // Alice deposits
        vm.prank(alice);
        pool.deposit(1 ether);
        
        // Wait 6 months
        skip(180 days);
        
        // Alice claims some yield
        vm.prank(alice);
        uint256 firstClaim = pool.claimYield();
        assertGt(firstClaim, 0);
        
        // Wait another 6 months
        skip(180 days);
        
        // Alice withdraws everything
        vm.prank(alice);
        (uint256 btcAmount, uint256 yieldAmount) = pool.withdraw();
        
        assertEq(btcAmount, 1 ether);
        assertGt(yieldAmount, 0);
        
        // Alice should have BTC back + yields claimed
        assertEq(wbtc.balanceOf(alice), INITIAL_BALANCE);
        assertGt(musd.balanceOf(alice), 0);
    }

    function test_Integration_MultipleUsersIndependent() public {
        // Alice deposits
        vm.prank(alice);
        pool.deposit(1 ether);
        
        skip(30 days);
        
        // Bob deposits
        vm.prank(bob);
        pool.deposit(2 ether);
        
        skip(30 days);
        
        // Alice withdraws
        vm.prank(alice);
        pool.withdraw();
        
        // Bob's deposit should be unaffected
        (, , , , , bool bobActive) = pool.userDeposits(bob);
        assertTrue(bobActive);
        
        // Bob can still withdraw
        vm.prank(bob);
        (uint256 btcAmount, ) = pool.withdraw();
        assertEq(btcAmount, 2 ether);
    }
}