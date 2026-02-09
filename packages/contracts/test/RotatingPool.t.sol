// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";
import {MockYieldAggregator} from "./mocks/MockYieldAggregator.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";
import {MockWBTC} from "./mocks/MockWBTC.sol";
import {MockMezoIntegration} from "./mocks/MockMezoIntegration.sol";

/**
 * @title RotatingPool Test Suite
 * @notice Comprehensive tests for RotatingPool (ROSCA) contract
 * @dev Tests all functionalities including pool creation, contributions, payouts, refunds, and security fixes
 */
contract RotatingPoolTest is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    RotatingPool public pool;
    MockYieldAggregator public yieldAggregator;
    MockMUSD public musd;
    MockWBTC public wbtc;
    MockMezoIntegration public mezoIntegration;

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public member1 = makeAddr("member1");
    address public member2 = makeAddr("member2");
    address public member3 = makeAddr("member3");
    address public member4 = makeAddr("member4");
    address public nonMember = makeAddr("nonMember");
    address public feeCollector = makeAddr("feeCollector");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_BTC = 10 ether; // 10 BTC
    uint256 public constant INITIAL_MUSD = 1_000_000 ether; // 1M MUSD
    uint256 public constant CONTRIBUTION = 0.01 ether; // 0.01 BTC
    uint256 public constant PERIOD_DURATION = 7 days;
    uint256 public constant PERFORMANCE_FEE = 100; // 1%

    // Pool constants (from contract)
    uint256 public constant MIN_MEMBERS = 3;
    uint256 public constant MAX_MEMBERS = 50;
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
    uint256 public constant MAX_CONTRIBUTION = 10 ether;
    uint256 public constant MIN_PERIOD_DURATION = 7 days;
    uint256 public constant MAX_PERIOD_DURATION = 90 days;

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 memberCount,
        uint256 contributionAmount,
        uint256 periodDuration
    );

    event MemberJoined(uint256 indexed poolId, address indexed member, uint256 memberIndex);

    event PoolStarted(uint256 indexed poolId, uint256 startTime);

    event ContributionMade(uint256 indexed poolId, address indexed member, uint256 period, uint256 amount);

    event PeriodCompleted(uint256 indexed poolId, uint256 period, uint256 totalContributions, uint256 yieldGenerated);

    event PayoutDistributed(
        uint256 indexed poolId, uint256 memberIndex, address indexed member, uint256 amount, uint256 yield
    );

    event RefundClaimed(uint256 indexed poolId, address indexed member, uint256 amount);

    event PoolCancelled(uint256 indexed poolId, string reason);

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();
        wbtc = new MockWBTC();
        yieldAggregator = new MockYieldAggregator(address(musd));
        mezoIntegration = new MockMezoIntegration(address(wbtc), address(musd));

        // Fund yield aggregator for yields
        musd.mint(address(yieldAggregator), 10_000_000 ether);

        // Deploy RotatingPool
        vm.prank(owner);
        pool = new RotatingPool(
            address(mezoIntegration), address(yieldAggregator), address(wbtc), address(musd), feeCollector
        );

        // Mint WBTC to test members
        wbtc.mint(member1, INITIAL_BTC);
        wbtc.mint(member2, INITIAL_BTC);
        wbtc.mint(member3, INITIAL_BTC);
        wbtc.mint(member4, INITIAL_BTC);

        // Mint native BTC to test members
        vm.deal(member1, INITIAL_BTC);
        vm.deal(member2, INITIAL_BTC);
        vm.deal(member3, INITIAL_BTC);
        vm.deal(member4, INITIAL_BTC);

        // Approve pool to spend WBTC
        vm.prank(member1);
        wbtc.approve(address(pool), type(uint256).max);

        vm.prank(member2);
        wbtc.approve(address(pool), type(uint256).max);

        vm.prank(member3);
        wbtc.approve(address(pool), type(uint256).max);

        vm.prank(member4);
        wbtc.approve(address(pool), type(uint256).max);

        // Label addresses for better trace output
        vm.label(address(pool), "RotatingPool");
        vm.label(address(yieldAggregator), "YieldAggregator");
        vm.label(address(musd), "MUSD");
        vm.label(address(wbtc), "WBTC");
        vm.label(address(mezoIntegration), "MezoIntegration");
        vm.label(member1, "Member1");
        vm.label(member2, "Member2");
        vm.label(member3, "Member3");
        vm.label(member4, "Member4");
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Helper to create and start a WBTC pool with predefined members
    function createAndStartWBTCPool(uint256 memberCount) internal returns (uint256 poolId) {
        address[] memory members = new address[](memberCount);
        if (memberCount >= 1) members[0] = member1;
        if (memberCount >= 2) members[1] = member2;
        if (memberCount >= 3) members[2] = member3;
        if (memberCount >= 4) members[3] = member4;

        vm.prank(owner);
        poolId = pool.createPool(
            "Test WBTC Pool",
            memberCount,
            CONTRIBUTION,
            PERIOD_DURATION,
            false, // WBTC mode
            members
        );

        vm.prank(owner);
        pool.startPool(poolId);
    }

    /// @notice Helper to create and start a Native BTC pool with predefined members
    function createAndStartNativePool(uint256 memberCount) internal returns (uint256 poolId) {
        address[] memory members = new address[](memberCount);
        if (memberCount >= 1) members[0] = member1;
        if (memberCount >= 2) members[1] = member2;
        if (memberCount >= 3) members[2] = member3;
        if (memberCount >= 4) members[3] = member4;

        vm.prank(owner);
        poolId = pool.createPool(
            "Test Native Pool",
            memberCount,
            CONTRIBUTION,
            PERIOD_DURATION,
            true, // Native BTC mode
            members
        );

        vm.prank(owner);
        pool.startPool(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(pool.owner(), owner);
        assertEq(address(pool.WBTC()), address(wbtc));
        assertEq(address(pool.MUSD()), address(musd));
        assertEq(address(pool.MEZO_INTEGRATION()), address(mezoIntegration));
        assertEq(address(pool.YIELD_AGGREGATOR()), address(yieldAggregator));
        assertEq(pool.feeCollector(), feeCollector);
        assertEq(pool.performanceFee(), 100); // 1%
        assertFalse(pool.paused());
        assertEq(pool.poolCounter(), 0);
    }

    function test_DeploymentConstants() public view {
        assertEq(pool.MIN_MEMBERS(), MIN_MEMBERS);
        assertEq(pool.MAX_MEMBERS(), MAX_MEMBERS);
        assertEq(pool.MIN_CONTRIBUTION(), MIN_CONTRIBUTION);
        assertEq(pool.MAX_CONTRIBUTION(), MAX_CONTRIBUTION);
        assertEq(pool.MIN_PERIOD_DURATION(), MIN_PERIOD_DURATION);
        assertEq(pool.MAX_PERIOD_DURATION(), MAX_PERIOD_DURATION);
    }

    /*//////////////////////////////////////////////////////////////
                        POOL CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreatePool_WBTC_Mode() public {
        address[] memory members = new address[](0);

        vm.expectEmit(true, true, false, true);
        emit PoolCreated(1, owner, "Test ROSCA", 3, CONTRIBUTION, PERIOD_DURATION);

        vm.prank(owner);
        uint256 poolId = pool.createPool(
            "Test ROSCA",
            3,
            CONTRIBUTION,
            PERIOD_DURATION,
            false, // WBTC mode
            members
        );

        assertEq(poolId, 1);
        assertEq(pool.poolCounter(), 1);

        // Check pool info
        (
            uint256 _poolId,
            string memory name,
            address creator,
            uint256 memberCount,
            uint256 contributionAmount,
            uint256 periodDuration,
            uint256 currentPeriod,
            uint256 totalPeriods,
            ,
            ,
            ,
            ,
            ,
            RotatingPool.PoolStatus status,
            ,
            bool useNativeBtc
        ) = pool.pools(poolId);

        assertEq(_poolId, 1);
        assertEq(name, "Test ROSCA");
        assertEq(creator, owner);
        assertEq(memberCount, 3);
        assertEq(contributionAmount, CONTRIBUTION);
        assertEq(periodDuration, PERIOD_DURATION);
        assertEq(currentPeriod, 0);
        assertEq(totalPeriods, 3);
        assertTrue(status == RotatingPool.PoolStatus.FORMING);
        assertFalse(useNativeBtc); // WBTC mode
    }

    function test_CreatePool_NativeBTC_Mode() public {
        address[] memory members = new address[](0);

        vm.prank(owner);
        uint256 poolId = pool.createPool(
            "Native BTC ROSCA",
            3,
            CONTRIBUTION,
            PERIOD_DURATION,
            true, // Native BTC mode
            members
        );

        // Check useNativeBtc flag
        (,,,,,,,,,,,,,,, bool useNativeBtc) = pool.pools(poolId);
        assertTrue(useNativeBtc); // Native BTC mode
    }

    function test_CreatePool_WithPredefinedMembers() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Predefined ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Check members were added
        address[] memory poolMembers = pool.getPoolMembers(poolId);
        assertEq(poolMembers.length, 3);
        assertEq(poolMembers[0], member1);
        assertEq(poolMembers[1], member2);
        assertEq(poolMembers[2], member3);

        // Pool should be AUTO-STARTED when all members are provided at creation
        (,,,,,,,,,,,,, RotatingPool.PoolStatus status,,) = pool.pools(poolId);
        assertTrue(status == RotatingPool.PoolStatus.ACTIVE, "Pool should be ACTIVE after creation with all members");

        // Verify pool start time is set
        (,,,,,,,, uint256 startTime,,,,,,,) = pool.pools(poolId);
        assertGt(startTime, 0, "Start time should be set");
    }

    function testRevert_CreatePool_InvalidMemberCount() public {
        address[] memory members = new address[](0);

        // Too few members
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidMemberCount.selector);
        pool.createPool("Test", 2, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Too many members
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidMemberCount.selector);
        pool.createPool("Test", 51, CONTRIBUTION, PERIOD_DURATION, false, members);
    }

    function testRevert_CreatePool_InvalidContribution() public {
        address[] memory members = new address[](0);

        // Too low
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidContribution.selector);
        pool.createPool("Test", 3, 0.0001 ether, PERIOD_DURATION, false, members);

        // Too high
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidContribution.selector);
        pool.createPool("Test", 3, 11 ether, PERIOD_DURATION, false, members);
    }

    function testRevert_CreatePool_InvalidPeriodDuration() public {
        address[] memory members = new address[](0);

        // Too short
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidPeriodDuration.selector);
        pool.createPool("Test", 3, CONTRIBUTION, 1 days, false, members);

        // Too long
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidPeriodDuration.selector);
        pool.createPool("Test", 3, CONTRIBUTION, 91 days, false, members);
    }

    /*//////////////////////////////////////////////////////////////
                        MEMBER JOINING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_JoinPool() public {
        // Create pool
        address[] memory members = new address[](0);
        vm.prank(owner);
        uint256 poolId = pool.createPool("Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Member joins
        vm.expectEmit(true, true, false, true);
        emit MemberJoined(poolId, member1, 0);

        vm.prank(member1);
        pool.joinPool(poolId);

        // Check member info
        (
            ,
            uint256 memberIndex,
            uint256 contributionsMade,
            uint256 totalContributed,
            ,
            ,
            bool hasReceivedPayout,
            bool active
        ) = pool.poolMembers(poolId, member1);

        assertTrue(active);
        assertEq(memberIndex, 0);
        assertEq(contributionsMade, 0);
        assertEq(totalContributed, 0);
        assertFalse(hasReceivedPayout);
    }

    function test_JoinPool_MultipleMembers_PoolStarts() public {
        // Create pool
        address[] memory members = new address[](0);
        vm.prank(owner);
        uint256 poolId = pool.createPool("Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Member 1 joins
        vm.prank(member1);
        pool.joinPool(poolId);

        // Member 2 joins
        vm.prank(member2);
        pool.joinPool(poolId);

        // Member 3 joins - pool should start
        vm.expectEmit(true, false, false, true);
        emit PoolStarted(poolId, block.timestamp);

        vm.prank(member3);
        pool.joinPool(poolId);

        // Check pool status
        (,,,,,,,,,,,,, RotatingPool.PoolStatus status,,) = pool.pools(poolId);
        assertTrue(status == RotatingPool.PoolStatus.ACTIVE);
    }

    function testRevert_JoinPool_InvalidPoolId() public {
        vm.prank(member1);
        vm.expectRevert(RotatingPool.InvalidPoolId.selector);
        pool.joinPool(999);
    }

    function testRevert_JoinPool_AlreadyActive() public {
        // Create and fill pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Try to join active pool
        vm.prank(member4);
        vm.expectRevert(RotatingPool.PoolNotForming.selector);
        pool.joinPool(poolId);
    }

    function testRevert_JoinPool_AlreadyMember() public {
        address[] memory members = new address[](0);
        vm.prank(owner);
        uint256 poolId = pool.createPool("Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        vm.prank(member1);
        pool.joinPool(poolId);

        // Try to join again
        vm.prank(member1);
        vm.expectRevert(RotatingPool.AlreadyMember.selector);
        pool.joinPool(poolId);
    }

    function testRevert_JoinPool_PoolFull() public {
        address[] memory members = new address[](0);
        vm.prank(owner);
        uint256 poolId = pool.createPool("Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        vm.prank(member1);
        pool.joinPool(poolId);

        vm.prank(member2);
        pool.joinPool(poolId);

        vm.prank(member3);
        pool.joinPool(poolId);

        // AUTO-START FIX: Pool automatically started when member3 joined (last member)
        // So member4 trying to join will get PoolNotForming (not PoolFull)
        // because the pool is now ACTIVE
        vm.prank(member4);
        vm.expectRevert(RotatingPool.PoolNotForming.selector);
        pool.joinPool(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                    WBTC CONTRIBUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MakeContribution_WBTC() public {
        // Create and start pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("WBTC ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Member 1 contributes
        vm.expectEmit(true, true, false, true);
        emit ContributionMade(poolId, member1, 0, CONTRIBUTION);

        vm.prank(member1);
        pool.makeContribution(poolId);

        // Check member info
        (,, uint256 contributionsMade, uint256 totalContributed,,,,) = pool.poolMembers(poolId, member1);
        assertEq(contributionsMade, 1);
        assertEq(totalContributed, CONTRIBUTION);

        // Check pool collected
        (,,,,,,,,, uint256 totalBtcCollected,,,,,,) = pool.pools(poolId);
        assertEq(totalBtcCollected, CONTRIBUTION);
    }

    function testRevert_MakeContribution_WBTC_WrongMode() public {
        // Create NATIVE BTC pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native BTC ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Try WBTC contribution on native BTC pool - should revert
        vm.prank(member1);
        vm.expectRevert(RotatingPool.WrongContributionMode.selector);
        pool.makeContribution(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                NATIVE BTC CONTRIBUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MakeContributionNative() public {
        // Create and start pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native BTC ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Member 1 contributes native BTC
        vm.expectEmit(true, true, false, true);
        emit ContributionMade(poolId, member1, 0, CONTRIBUTION);

        vm.prank(member1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // Check member info
        (,, uint256 contributionsMade, uint256 totalContributed,,,,) = pool.poolMembers(poolId, member1);
        assertEq(contributionsMade, 1);
        assertEq(totalContributed, CONTRIBUTION);

        // Check contract received BTC
        assertEq(address(pool).balance, CONTRIBUTION);
    }

    function testRevert_MakeContributionNative_WrongAmount() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native BTC ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Send wrong amount
        vm.prank(member1);
        vm.expectRevert(RotatingPool.InvalidAmount.selector);
        pool.makeContributionNative{value: CONTRIBUTION + 0.001 ether}(poolId);
    }

    function testRevert_MakeContributionNative_WrongMode() public {
        // Create WBTC pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("WBTC ROSCA", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Try native BTC contribution on WBTC pool - should revert
        vm.prank(member1);
        vm.expectRevert(RotatingPool.WrongContributionMode.selector);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
    }

    /*//////////////////////////////////////////////////////////////
            H-01 FIX VERIFICATION: DUAL-MODE VALIDATION
    //////////////////////////////////////////////////////////////*/

    function test_H01_Fix_ModeSetAtCreation() public {
        address[] memory members = new address[](0);

        // Create WBTC pool
        vm.prank(owner);
        uint256 wbtcPoolId = pool.createPool("WBTC", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Create Native BTC pool
        vm.prank(owner);
        uint256 nativePoolId = pool.createPool("Native", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Check modes
        (,,,,,,,,,,,,,,, bool wbtcMode) = pool.pools(wbtcPoolId);
        (,,,,,,,,,,,,,,, bool nativeMode) = pool.pools(nativePoolId);

        assertFalse(wbtcMode);
        assertTrue(nativeMode);
    }

    function test_H01_Fix_CannotHijackWBTCPool() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        // Create WBTC pool
        vm.prank(owner);
        uint256 poolId = pool.createPool("WBTC", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Attacker tries to contribute native BTC first to hijack mode
        vm.prank(member1);
        vm.expectRevert(RotatingPool.WrongContributionMode.selector);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // WBTC contributions should still work
        vm.prank(member1);
        pool.makeContribution(poolId);

        // Mode should still be WBTC
        (,,,,,,,,,,,,,,, bool useNativeBtc) = pool.pools(poolId);
        assertFalse(useNativeBtc);
    }

    function test_H01_Fix_CannotHijackNativePool() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        // Create Native BTC pool
        vm.prank(owner);
        uint256 poolId = pool.createPool("Native", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Attacker tries to contribute WBTC to change mode
        vm.prank(member1);
        vm.expectRevert(RotatingPool.WrongContributionMode.selector);
        pool.makeContribution(poolId);

        // Native BTC contributions should still work
        vm.prank(member1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // Mode should still be Native BTC
        (,,,,,,,,,,,,,,, bool useNativeBtc) = pool.pools(poolId);
        assertTrue(useNativeBtc);
    }

    /*//////////////////////////////////////////////////////////////
        H-02 FIX VERIFICATION: BALANCE CHECKS
    //////////////////////////////////////////////////////////////*/

    function test_H02_Fix_BalanceCheckBeforePayout() public {
        // Create native BTC pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // All members contribute
        vm.prank(member1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        vm.prank(member2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        vm.prank(member3);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // Advance time to complete period
        vm.warp(block.timestamp + PERIOD_DURATION + 1);

        // Manually complete period
        vm.prank(owner);
        pool.advancePeriod(poolId);

        // Simulate accounting error - drain contract
        uint256 contractBalance = address(pool).balance;
        vm.prank(address(pool));
        payable(owner).transfer(contractBalance);

        // FLASH LOAN PROTECTION: Move to next block to avoid SameBlockWithdrawal error
        vm.roll(block.number + 1);

        // Member tries to claim payout - should revert with clear error
        vm.prank(member1);
        vm.expectRevert(RotatingPool.InsufficientNativeBtcBalance.selector);
        pool.claimPayout(poolId);
    }

    function test_H02_Fix_BalanceCheckBeforeRefund() public {
        // Create native BTC pool
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // Member 1 contributes
        vm.prank(member1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // Cancel pool
        vm.prank(owner);
        pool.cancelPool(poolId, "Test cancellation");

        // Simulate accounting error - drain contract
        uint256 contractBalance = address(pool).balance;
        vm.prank(address(pool));
        payable(owner).transfer(contractBalance);

        // Member tries to claim refund - should revert with clear error
        vm.prank(member1);
        vm.expectRevert(RotatingPool.InsufficientNativeBtcBalance.selector);
        pool.claimRefund(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                    PERIOD ADVANCEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PeriodAutoCompletesAfterAllContributions() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Auto Complete", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Member 1 contributes
        vm.prank(member1);
        pool.makeContribution(poolId);

        // Member 2 contributes
        vm.prank(member2);
        pool.makeContribution(poolId);

        // Check period not completed yet
        (,,,,,, uint256 currentPeriodBefore,,,,,,,,,) = pool.pools(poolId);
        assertEq(currentPeriodBefore, 0);

        // Member 3 contributes - should auto-complete period
        // Note: We expect both ContributionMade and PeriodCompleted events
        vm.expectEmit(true, true, false, true);
        emit ContributionMade(poolId, member3, 0, CONTRIBUTION);

        vm.expectEmit(true, false, false, false);
        emit PeriodCompleted(poolId, 0, CONTRIBUTION * 3, 0);

        vm.prank(member3);
        pool.makeContribution(poolId);

        // Check period advanced
        (,,,,,, uint256 currentPeriodAfter,,,,,,,,,) = pool.pools(poolId);
        assertEq(currentPeriodAfter, 1);
    }

    function test_AdvancePeriod_Manual() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Manual Advance", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Only 2 members contribute
        vm.prank(member1);
        pool.makeContribution(poolId);

        vm.prank(member2);
        pool.makeContribution(poolId);

        // Advance time past period
        vm.warp(block.timestamp + PERIOD_DURATION + 1);

        // Owner can manually advance
        vm.prank(owner);
        pool.advancePeriod(poolId);

        // Check period advanced
        (,,,,,, uint256 currentPeriod,,,,,,,,,) = pool.pools(poolId);
        assertEq(currentPeriod, 1);
    }

    /*//////////////////////////////////////////////////////////////
                    PAYOUT CLAIMING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimPayout_WBTC() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("WBTC Payout", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // All members contribute
        vm.prank(member1);
        pool.makeContribution(poolId);

        vm.prank(member2);
        pool.makeContribution(poolId);

        vm.prank(member3);
        pool.makeContribution(poolId);

        // FLASH LOAN PROTECTION: Move to next block to avoid SameBlockWithdrawal error
        vm.roll(block.number + 1);

        // Period auto-completes, member 1 can claim
        uint256 balanceBefore = wbtc.balanceOf(member1);

        vm.prank(member1);
        pool.claimPayout(poolId);

        uint256 balanceAfter = wbtc.balanceOf(member1);

        // Member should receive all contributions (3 * CONTRIBUTION)
        assertEq(balanceAfter - balanceBefore, CONTRIBUTION * 3);
    }

    function test_ClaimPayout_NativeBTC() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Native Payout", 3, CONTRIBUTION, PERIOD_DURATION, true, members);

        // All members contribute
        vm.prank(member1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        vm.prank(member2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        vm.prank(member3);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);

        // FLASH LOAN PROTECTION: Move to next block to avoid SameBlockWithdrawal error
        vm.roll(block.number + 1);

        // Period auto-completes, member 1 can claim
        uint256 balanceBefore = member1.balance;

        vm.prank(member1);
        pool.claimPayout(poolId);

        uint256 balanceAfter = member1.balance;

        // Member should receive all contributions (3 * CONTRIBUTION)
        assertEq(balanceAfter - balanceBefore, CONTRIBUTION * 3);
    }

    /*//////////////////////////////////////////////////////////////
                    REFUND CLAIMING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimRefund_AfterCancellation() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Refund Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // Member 1 contributes
        vm.prank(member1);
        pool.makeContribution(poolId);

        uint256 balanceBefore = wbtc.balanceOf(member1);

        // Cancel pool
        vm.prank(owner);
        pool.cancelPool(poolId, "Test cancellation");

        // Member claims refund
        vm.expectEmit(true, true, false, true);
        emit RefundClaimed(poolId, member1, CONTRIBUTION);

        vm.prank(member1);
        pool.claimRefund(poolId);

        uint256 balanceAfter = wbtc.balanceOf(member1);

        // Member should get full refund
        assertEq(balanceAfter - balanceBefore, CONTRIBUTION);
    }

    function testRevert_ClaimRefund_PoolNotCancelled() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Active Pool", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        vm.prank(member1);
        pool.makeContribution(poolId);

        // Try to claim refund on active pool
        vm.prank(member1);
        vm.expectRevert(RotatingPool.PoolNotCancelled.selector);
        pool.claimRefund(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                FLASH LOAN PROTECTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testRevert_FlashLoan_SameBlockWithdrawal() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Flash Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        // All members contribute
        vm.prank(member1);
        pool.makeContribution(poolId);

        vm.prank(member2);
        pool.makeContribution(poolId);

        vm.prank(member3);
        pool.makeContribution(poolId);

        // Try to claim in same block as contribution
        vm.prank(member1);
        vm.expectRevert(RotatingPool.SameBlockWithdrawal.selector);
        pool.claimPayout(poolId);

        // Roll to next block
        vm.roll(block.number + 1);

        // Now it should work
        vm.prank(member1);
        pool.claimPayout(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                    ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetPerformanceFee() public {
        vm.prank(owner);
        pool.setPerformanceFee(200); // 2%

        assertEq(pool.performanceFee(), 200);
    }

    function testRevert_SetPerformanceFee_TooHigh() public {
        vm.prank(owner);
        vm.expectRevert(RotatingPool.InvalidFee.selector);
        pool.setPerformanceFee(1001); // > 10%
    }

    function test_SetFeeCollector() public {
        address newCollector = makeAddr("newCollector");

        vm.prank(owner);
        pool.setFeeCollector(newCollector);

        assertEq(pool.feeCollector(), newCollector);
    }

    function test_Pause() public {
        vm.prank(owner);
        pool.pause();

        assertTrue(pool.paused());
    }

    function test_Unpause() public {
        vm.prank(owner);
        pool.pause();

        vm.prank(owner);
        pool.unpause();

        assertFalse(pool.paused());
    }

    function testRevert_ContributeWhenPaused() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Pause Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        vm.prank(owner);
        pool.pause();

        vm.prank(member1);
        vm.expectRevert();
        pool.makeContribution(poolId);
    }

    /*//////////////////////////////////////////////////////////////
                    VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetPoolMembers() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Members Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        address[] memory poolMembers = pool.getPoolMembers(poolId);
        assertEq(poolMembers.length, 3);
        assertEq(poolMembers[0], member1);
        assertEq(poolMembers[1], member2);
        assertEq(poolMembers[2], member3);
    }

    function test_GetPoolMemberOrder() public {
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

        vm.prank(owner);
        uint256 poolId = pool.createPool("Order Test", 3, CONTRIBUTION, PERIOD_DURATION, false, members);

        assertEq(pool.poolMemberOrder(poolId, 0), member1);
        assertEq(pool.poolMemberOrder(poolId, 1), member2);
        assertEq(pool.poolMemberOrder(poolId, 2), member3);
    }

    /*//////////////////////////////////////////////////////////////
                    RECEIVE FUNCTION TEST
    //////////////////////////////////////////////////////////////*/

    function test_ReceiveNativeBTC() public {
        uint256 balanceBefore = address(pool).balance;

        // Send BTC to contract
        (bool success,) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        uint256 balanceAfter = address(pool).balance;
        assertEq(balanceAfter - balanceBefore, 1 ether);
    }
}
