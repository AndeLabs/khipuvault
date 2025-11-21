// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {IndividualPoolV3} from "../src/pools/v3/IndividualPoolV3.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {MockYieldAggregator} from "./mocks/MockYieldAggregator.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

/**
 * @title IndividualPoolV3 Test Suite
 * @notice Comprehensive tests for IndividualPoolV3 contract
 * @dev Tests all functionalities including deposits, withdrawals, yields, auto-compound, and referrals
 */
contract IndividualPoolV3Test is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    IndividualPoolV3 public implementation;
    IndividualPoolV3 public pool;
    MockYieldAggregator public yieldAggregator;
    MockMUSD public musd;
    UUPSProxy public proxy;

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public referrer = makeAddr("referrer");
    address public feeCollector = makeAddr("feeCollector");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_BALANCE = 1_000_000 ether; // 1M MUSD
    uint256 public constant MIN_DEPOSIT = 10 ether;
    uint256 public constant MAX_DEPOSIT = 100_000 ether;
    uint256 public constant MIN_WITHDRAWAL = 1 ether;
    uint256 public constant PERFORMANCE_FEE = 100; // 1%
    uint256 public constant REFERRAL_BONUS = 50; // 0.5%

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 musdAmount,
        uint256 totalDeposit,
        address indexed referrer,
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

    event AutoCompounded(
        address indexed user,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event FullWithdrawal(
        address indexed user,
        uint256 principal,
        uint256 netYield,
        uint256 timestamp
    );

    event ReferralRecorded(
        address indexed user,
        address indexed referrer,
        uint256 bonus
    );

    event AutoCompoundToggled(
        address indexed user,
        bool enabled
    );

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();
        yieldAggregator = new MockYieldAggregator(address(musd));

        // Fund yield aggregator for yields
        musd.mint(address(yieldAggregator), 10_000_000 ether);

        // Deploy implementation
        vm.prank(owner);
        implementation = new IndividualPoolV3();

        // Deploy proxy
        vm.prank(owner);
        proxy = new UUPSProxy(address(implementation), "");

        // Wrap proxy as IndividualPoolV3
        pool = IndividualPoolV3(address(proxy));

        // Initialize
        vm.prank(owner);
        pool.initialize(
            address(yieldAggregator),
            address(musd),
            feeCollector
        );

        // Enable emergency mode to bypass flash loan protection in tests
        vm.prank(owner);
        pool.setEmergencyMode(true);

        // Mint MUSD to test users
        musd.mint(user1, INITIAL_BALANCE);
        musd.mint(user2, INITIAL_BALANCE);
        musd.mint(user3, INITIAL_BALANCE);
        musd.mint(referrer, INITIAL_BALANCE);

        // Approve pool to spend MUSD
        vm.prank(user1);
        musd.approve(address(pool), type(uint256).max);

        vm.prank(user2);
        musd.approve(address(pool), type(uint256).max);

        vm.prank(user3);
        musd.approve(address(pool), type(uint256).max);

        vm.prank(referrer);
        musd.approve(address(pool), type(uint256).max);

        // Label addresses for better trace output
        vm.label(address(pool), "IndividualPoolV3");
        vm.label(address(yieldAggregator), "YieldAggregator");
        vm.label(address(musd), "MUSD");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(user3, "User3");
        vm.label(referrer, "Referrer");
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(pool.owner(), owner);
        assertEq(address(pool.YIELD_AGGREGATOR()), address(yieldAggregator));
        assertEq(address(pool.MUSD()), address(musd));
        assertEq(pool.feeCollector(), feeCollector);
        assertEq(pool.performanceFee(), 100); // 1%
        assertEq(pool.referralBonus(), 50); // 0.5%
        assertFalse(pool.paused());
        assertTrue(pool.emergencyMode()); // Emergency mode enabled for testing
    }

    function test_InitialState() public view {
        assertEq(pool.totalMusdDeposited(), 0);
        assertEq(pool.totalYieldsGenerated(), 0);
        assertEq(pool.totalReferralRewards(), 0);
    }

    function test_Version() public view {
        assertEq(pool.version(), "3.0.0");
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deposit() public {
        uint256 depositAmount = 100 ether;
        uint256 balanceBefore = musd.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit Deposited(user1, depositAmount, depositAmount, address(0), block.timestamp);

        vm.prank(user1);
        pool.deposit(depositAmount);

        // Check balances
        assertEq(musd.balanceOf(user1), balanceBefore - depositAmount);
        assertEq(pool.totalMusdDeposited(), depositAmount);

        // Check user deposit
        (uint256 deposit, uint256 yields,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, depositAmount);
        assertEq(yields, 0); // No yields yet
    }

    function test_Deposit_Incremental() public {
        uint256 firstDeposit = 100 ether;
        uint256 secondDeposit = 50 ether;

        vm.startPrank(user1);

        pool.deposit(firstDeposit);

        // Wait some time
        vm.warp(block.timestamp + 30 days);

        pool.deposit(secondDeposit);

        vm.stopPrank();

        // Check total deposit
        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, firstDeposit + secondDeposit);
        assertEq(pool.totalMusdDeposited(), firstDeposit + secondDeposit);
    }

    function test_Deposit_WithReferral() public {
        uint256 depositAmount = 100 ether;
        uint256 expectedBonus = (depositAmount * REFERRAL_BONUS) / 10000; // 0.5%

        vm.expectEmit(true, true, false, true);
        emit ReferralRecorded(user1, referrer, expectedBonus);

        vm.expectEmit(true, true, true, true);
        emit Deposited(user1, depositAmount, depositAmount, referrer, block.timestamp);

        vm.prank(user1);
        pool.depositWithReferral(depositAmount, referrer);

        // Check referral was recorded
        (uint256 count, uint256 rewards, address ref) = pool.getReferralStats(referrer);
        assertEq(count, 1);
        assertEq(rewards, expectedBonus);
        assertEq(ref, address(0)); // Referrer doesn't have a referrer

        // Check user's referrer
        (,, address userRef) = pool.getReferralStats(user1);
        assertEq(userRef, referrer);
    }

    function test_Deposit_ReferralOnlyFirstTime() public {
        uint256 depositAmount = 100 ether;

        // First deposit with referral
        vm.prank(user1);
        pool.depositWithReferral(depositAmount, referrer);

        // Second deposit should use same referrer
        vm.prank(user1);
        pool.depositWithReferral(depositAmount, user2); // Try to change referrer

        // Referrer should still be the original one
        (,, address userRef) = pool.getReferralStats(user1);
        assertEq(userRef, referrer);

        // Referral count should be 1 (not 2)
        (uint256 count,,) = pool.getReferralStats(referrer);
        assertEq(count, 1);
    }

    function test_Deposit_MinimumAmount() public {
        vm.prank(user1);
        vm.expectRevert(IndividualPoolV3.MinimumDepositNotMet.selector);
        pool.deposit(MIN_DEPOSIT - 1);
    }

    function test_Deposit_MaximumAmount() public {
        vm.prank(user1);
        vm.expectRevert(IndividualPoolV3.MaximumDepositExceeded.selector);
        pool.deposit(MAX_DEPOSIT + 1 ether);
    }

    function test_Deposit_MaximumIncremental() public {
        vm.startPrank(user1);

        pool.deposit(MAX_DEPOSIT);

        vm.expectRevert(IndividualPoolV3.MaximumDepositExceeded.selector);
        pool.deposit(1 ether); // Would exceed max

        vm.stopPrank();
    }

    function test_Deposit_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(IndividualPoolV3.InvalidAmount.selector);
        pool.deposit(0);
    }

    function test_Deposit_WhenPaused() public {
        vm.prank(owner);
        pool.pause();

        vm.prank(user1);
        vm.expectRevert();
        pool.deposit(100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_WithdrawPartial() public {
        uint256 depositAmount = 1000 ether;
        uint256 withdrawAmount = 400 ether;

        vm.startPrank(user1);
        pool.deposit(depositAmount);

        uint256 balanceBefore = musd.balanceOf(user1);

        vm.expectEmit(true, false, false, true);
        emit PartialWithdrawn(user1, withdrawAmount, depositAmount - withdrawAmount, block.timestamp);

        pool.withdrawPartial(withdrawAmount);
        vm.stopPrank();

        // Check balances
        assertEq(musd.balanceOf(user1), balanceBefore + withdrawAmount);

        // Check remaining deposit
        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, depositAmount - withdrawAmount);
    }

    function test_WithdrawPartial_BelowMinimum() public {
        uint256 depositAmount = 15 ether; // Just above MIN_DEPOSIT
        uint256 withdrawAmount = 6 ether; // Would leave 9, below MIN_DEPOSIT

        vm.startPrank(user1);
        pool.deposit(depositAmount);

        uint256 balanceBefore = musd.balanceOf(user1);

        // Should withdraw everything if remaining < MIN_DEPOSIT
        pool.withdrawPartial(withdrawAmount);
        vm.stopPrank();

        // Check balances - should have withdrawn all
        assertEq(musd.balanceOf(user1), balanceBefore + depositAmount);

        // Check deposit is closed
        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, 0);
    }

    function test_WithdrawPartial_MinimumAmount() public {
        vm.startPrank(user1);
        pool.deposit(1000 ether);

        vm.expectRevert(IndividualPoolV3.MinimumWithdrawalNotMet.selector);
        pool.withdrawPartial(MIN_WITHDRAWAL - 0.1 ether);

        vm.stopPrank();
    }

    function test_WithdrawPartial_ExceedsBalance() public {
        vm.startPrank(user1);
        pool.deposit(100 ether);

        vm.expectRevert(IndividualPoolV3.WithdrawalExceedsBalance.selector);
        pool.withdrawPartial(101 ether);

        vm.stopPrank();
    }

    function test_WithdrawFull() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        pool.deposit(depositAmount);

        // Wait for yields
        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = musd.balanceOf(user1);

        (uint256 musdAmount, uint256 netYield) = pool.withdraw();
        vm.stopPrank();

        // Check balances
        assertGt(musdAmount, 0);
        assertGt(netYield, 0);
        assertEq(musd.balanceOf(user1), balanceBefore + musdAmount + netYield);

        // Check position is closed
        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, 0);
    }

    function test_WithdrawFull_NoActiveDeposit() public {
        vm.prank(user1);
        vm.expectRevert(IndividualPoolV3.NoActiveDeposit.selector);
        pool.withdraw();
    }

    /*//////////////////////////////////////////////////////////////
                        YIELD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimYield() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        pool.deposit(depositAmount);

        // Wait for yields
        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = musd.balanceOf(user1);

        vm.expectEmit(true, false, false, false);
        emit YieldClaimed(user1, 0, 0, 0, block.timestamp);

        uint256 netYield = pool.claimYield();
        vm.stopPrank();

        // Check yields were claimed
        assertGt(netYield, 0);
        assertEq(musd.balanceOf(user1), balanceBefore + netYield);

        // Check principal remains
        (uint256 deposit, uint256 yields,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, depositAmount);
        assertEq(yields, 0); // Yields should be zero after claim
    }

    function test_ClaimYield_WithFee() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        pool.deposit(depositAmount);

        // Wait for yields
        vm.warp(block.timestamp + 365 days); // 1 year for significant yield

        uint256 feeCollectorBalanceBefore = musd.balanceOf(feeCollector);
        uint256 user1BalanceBefore = musd.balanceOf(user1);

        uint256 netYield = pool.claimYield();
        vm.stopPrank();

        // Check fee was collected
        uint256 feeCollectorBalanceAfter = musd.balanceOf(feeCollector);
        uint256 feeCollected = feeCollectorBalanceAfter - feeCollectorBalanceBefore;

        assertGt(feeCollected, 0);
        assertGt(netYield, 0);

        // Fee should be approximately 1% of gross yield
        uint256 grossYield = netYield + feeCollected;
        uint256 expectedFee = (grossYield * PERFORMANCE_FEE) / 10000;
        assertApproxEqAbs(feeCollected, expectedFee, 1e10); // Small tolerance for rounding
    }

    function test_ClaimYield_NoYields() public {
        vm.startPrank(user1);
        pool.deposit(1000 ether);

        // Try to claim immediately (no yields yet)
        vm.expectRevert(IndividualPoolV3.InvalidAmount.selector);
        pool.claimYield();

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    AUTO-COMPOUND TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetAutoCompound() public {
        vm.startPrank(user1);
        pool.deposit(1000 ether);

        vm.expectEmit(true, false, false, true);
        emit AutoCompoundToggled(user1, true);

        pool.setAutoCompound(true);
        vm.stopPrank();

        (,,,,, bool autoCompoundEnabled) = pool.getUserInfo(user1);
        assertTrue(autoCompoundEnabled);
    }

    function test_SetAutoCompound_NoDeposit() public {
        vm.prank(user1);
        vm.expectRevert(IndividualPoolV3.NoActiveDeposit.selector);
        pool.setAutoCompound(true);
    }

    function test_AutoCompound_OnDeposit() public {
        uint256 firstDeposit = 1000 ether;
        uint256 secondDeposit = 100 ether;

        vm.startPrank(user1);

        // First deposit
        pool.deposit(firstDeposit);

        // Enable auto-compound
        pool.setAutoCompound(true);

        // Wait for yields
        vm.warp(block.timestamp + 30 days);

        // Get yields before second deposit
        (, uint256 yieldsBefore,,,,) = pool.getUserInfo(user1);

        // Second deposit should auto-compound if yields > threshold
        pool.deposit(secondDeposit);

        vm.stopPrank();

        // If yields were > threshold, they should be compounded
        (uint256 deposit, uint256 yieldsAfter,,,,) = pool.getUserInfo(user1);

        if (yieldsBefore >= 1 ether) { // AUTO_COMPOUND_THRESHOLD
            // Yields should be zero (compounded into principal)
            assertEq(yieldsAfter, 0);
            // Principal should include compounded yields
            assertGt(deposit, firstDeposit + secondDeposit);
        }
    }

    /*//////////////////////////////////////////////////////////////
                    REFERRAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimReferralRewards() public {
        uint256 depositAmount = 1000 ether;
        uint256 expectedBonus = (depositAmount * REFERRAL_BONUS) / 10000;

        // User deposits with referral
        vm.prank(user1);
        pool.depositWithReferral(depositAmount, referrer);

        // Referrer claims rewards
        vm.startPrank(referrer);

        uint256 balanceBefore = musd.balanceOf(referrer);
        uint256 rewards = pool.claimReferralRewards();

        vm.stopPrank();

        // Check rewards
        assertEq(rewards, expectedBonus);
        assertEq(musd.balanceOf(referrer), balanceBefore + rewards);

        // Rewards should be zero after claim
        (, uint256 remainingRewards,) = pool.getReferralStats(referrer);
        assertEq(remainingRewards, 0);
    }

    function test_ClaimReferralRewards_NoRewards() public {
        vm.prank(referrer);
        vm.expectRevert(IndividualPoolV3.NoReferralRewards.selector);
        pool.claimReferralRewards();
    }

    function test_GetReferralStats() public {
        // Multiple users with same referrer
        vm.prank(user1);
        pool.depositWithReferral(1000 ether, referrer);

        vm.prank(user2);
        pool.depositWithReferral(500 ether, referrer);

        (uint256 count, uint256 rewards,) = pool.getReferralStats(referrer);

        assertEq(count, 2);
        assertGt(rewards, 0);
    }

    /*//////////////////////////////////////////////////////////////
                    VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetUserInfo() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        pool.deposit(depositAmount);
        pool.setAutoCompound(true);
        vm.warp(block.timestamp + 30 days);
        vm.stopPrank();

        (
            uint256 deposit,
            uint256 yields,
            uint256 netYields,
            uint256 daysActive,
            uint256 estimatedAPR,
            bool autoCompoundEnabled
        ) = pool.getUserInfo(user1);

        assertEq(deposit, depositAmount);
        assertGt(yields, 0);
        assertGt(netYields, 0);
        assertLt(netYields, yields); // Net should be less than gross (due to fees)
        assertGe(daysActive, 30);
        assertGt(estimatedAPR, 0);
        assertTrue(autoCompoundEnabled);
    }

    function test_GetUserTotalBalance() public {
        uint256 depositAmount = 1000 ether;

        vm.prank(user1);
        pool.deposit(depositAmount);

        vm.warp(block.timestamp + 30 days);

        uint256 totalBalance = pool.getUserTotalBalance(user1);

        assertGt(totalBalance, depositAmount); // Should include yields
    }

    /*//////////////////////////////////////////////////////////////
                    ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetEmergencyMode() public {
        // Emergency mode starts as true, toggle to false
        vm.prank(owner);
        pool.setEmergencyMode(false);
        assertFalse(pool.emergencyMode());

        // Toggle back to true
        vm.prank(owner);
        pool.setEmergencyMode(true);
        assertTrue(pool.emergencyMode());
    }

    function test_SetEmergencyMode_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pool.setEmergencyMode(true);
    }

    function test_SetPerformanceFee() public {
        uint256 newFee = 200; // 2%

        vm.prank(owner);
        pool.setPerformanceFee(newFee);

        assertEq(pool.performanceFee(), newFee);
    }

    function test_SetPerformanceFee_MaxLimit() public {
        vm.prank(owner);
        vm.expectRevert(IndividualPoolV3.InvalidFee.selector);
        pool.setPerformanceFee(1001); // > 10%
    }

    function test_SetReferralBonus() public {
        uint256 newBonus = 100; // 1%

        vm.prank(owner);
        pool.setReferralBonus(newBonus);

        assertEq(pool.referralBonus(), newBonus);
    }

    function test_SetReferralBonus_MaxLimit() public {
        vm.prank(owner);
        vm.expectRevert(IndividualPoolV3.InvalidFee.selector);
        pool.setReferralBonus(501); // > 5%
    }

    function test_SetFeeCollector() public {
        address newCollector = makeAddr("newCollector");

        vm.prank(owner);
        pool.setFeeCollector(newCollector);

        assertEq(pool.feeCollector(), newCollector);
    }

    function test_SetFeeCollector_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IndividualPoolV3.InvalidAddress.selector);
        pool.setFeeCollector(address(0));
    }

    function test_Pause() public {
        vm.prank(owner);
        pool.pause();

        assertTrue(pool.paused());
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        pool.pause();
        pool.unpause();
        vm.stopPrank();

        assertFalse(pool.paused());
    }

    /*//////////////////////////////////////////////////////////////
                    INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FullLifecycle() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);

        // 1. Deposit with referral
        pool.depositWithReferral(depositAmount, referrer);

        // 2. Enable auto-compound
        pool.setAutoCompound(true);

        // 3. Wait and make incremental deposit
        vm.warp(block.timestamp + 30 days);
        pool.deposit(500 ether);

        // 4. Wait more
        vm.warp(block.timestamp + 60 days);

        // 5. Claim yields
        uint256 yield1 = pool.claimYield();
        assertGt(yield1, 0);

        // 6. Wait more
        vm.warp(block.timestamp + 90 days);

        // 7. Partial withdrawal
        pool.withdrawPartial(500 ether);

        // 8. Final withdrawal
        (uint256 principal, uint256 yield2) = pool.withdraw();

        vm.stopPrank();

        assertGt(principal, 0);
        assertGt(yield2, 0);

        // Check position is closed
        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, 0);
    }

    function test_MultipleUsers() public {
        // User1 deposits
        vm.prank(user1);
        pool.deposit(1000 ether);

        // User2 deposits with referral
        vm.prank(user2);
        pool.depositWithReferral(500 ether, user1);

        // User3 deposits
        vm.prank(user3);
        pool.deposit(2000 ether);

        // Wait for yields
        vm.warp(block.timestamp + 30 days);

        // All users should have different yields based on deposit amount
        (,uint256 yields1,,,,) = pool.getUserInfo(user1);
        (,uint256 yields2,,,,) = pool.getUserInfo(user2);
        (,uint256 yields3,,,,) = pool.getUserInfo(user3);

        assertGt(yields1, 0);
        assertGt(yields2, 0);
        assertGt(yields3, 0);

        // User3 should have most yields (largest deposit)
        assertGt(yields3, yields1);
        assertGt(yields3, yields2);
    }

    /*//////////////////////////////////////////////////////////////
                    FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, MIN_DEPOSIT, MAX_DEPOSIT);

        vm.prank(user1);
        pool.deposit(amount);

        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, amount);
    }

    function testFuzz_WithdrawPartial(uint256 depositAmount, uint256 withdrawAmount) public {
        depositAmount = bound(depositAmount, MIN_DEPOSIT + 100 ether, MAX_DEPOSIT);
        withdrawAmount = bound(withdrawAmount, MIN_WITHDRAWAL, depositAmount - MIN_DEPOSIT);

        vm.startPrank(user1);
        pool.deposit(depositAmount);
        pool.withdrawPartial(withdrawAmount);
        vm.stopPrank();

        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertApproxEqAbs(deposit, depositAmount - withdrawAmount, MIN_DEPOSIT);
    }

    function testFuzz_MultipleDeposits(uint8 numDeposits) public {
        numDeposits = uint8(bound(numDeposits, 1, 10));

        uint256 depositAmount = 100 ether;
        uint256 totalDeposited = 0;

        vm.startPrank(user1);

        for (uint256 i = 0; i < numDeposits; i++) {
            if (totalDeposited + depositAmount <= MAX_DEPOSIT) {
                pool.deposit(depositAmount);
                totalDeposited += depositAmount;
            }
        }

        vm.stopPrank();

        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, totalDeposited);
    }

    /*//////////////////////////////////////////////////////////////
                    EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_DepositExactMax() public {
        vm.prank(user1);
        pool.deposit(MAX_DEPOSIT);

        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, MAX_DEPOSIT);
    }

    function test_EdgeCase_WithdrawAll() public {
        vm.startPrank(user1);
        pool.deposit(100 ether);

        vm.warp(block.timestamp + 1 days);

        pool.withdraw();
        vm.stopPrank();

        (uint256 deposit,,,,,) = pool.getUserInfo(user1);
        assertEq(deposit, 0);
    }

    function test_EdgeCase_ClaimMultipleTimes() public {
        vm.startPrank(user1);
        pool.deposit(1000 ether);

        // Claim 1
        vm.warp(block.timestamp + 30 days);
        uint256 yield1 = pool.claimYield();

        // Claim 2
        vm.warp(block.timestamp + 30 days);
        uint256 yield2 = pool.claimYield();

        // Claim 3
        vm.warp(block.timestamp + 30 days);
        uint256 yield3 = pool.claimYield();

        vm.stopPrank();

        assertGt(yield1, 0);
        assertGt(yield2, 0);
        assertGt(yield3, 0);
    }
}
