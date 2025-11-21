// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {CooperativePoolV3} from "../src/pools/v3/CooperativePoolV3.sol";
import {MockCooperativePoolV3} from "./mocks/MockCooperativePoolV3.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {MockMezoIntegration} from "./mocks/MockMezoIntegration.sol";
import {MockYieldAggregator} from "./mocks/MockYieldAggregator.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

/**
 * @title CooperativePoolV3 Test Suite
 * @notice Comprehensive tests for CooperativePoolV3 v3.1.0
 * @dev Uses MockCooperativePoolV3 to disable flash loan protection for testing
 */
contract CooperativePoolV3Test is Test {
    MockCooperativePoolV3 public implementation;
    MockCooperativePoolV3 public pool;
    MockMezoIntegration public mezoIntegration;
    MockYieldAggregator public yieldAggregator;
    MockMUSD public musd;
    UUPSProxy public proxy;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public feeCollector = makeAddr("feeCollector");

    uint256 public constant INITIAL_BTC_BALANCE = 100 ether;

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();
        mezoIntegration = new MockMezoIntegration(address(musd));
        yieldAggregator = new MockYieldAggregator(address(musd));

        musd.mint(address(mezoIntegration), 10_000_000 ether);
        musd.mint(address(yieldAggregator), 10_000_000 ether);

        // Deploy mock implementation (no flash loan protection)
        vm.prank(owner);
        implementation = new MockCooperativePoolV3();

        vm.prank(owner);
        proxy = new UUPSProxy(address(implementation), "");

        pool = MockCooperativePoolV3(payable(address(proxy)));

        vm.prank(owner);
        pool.initialize(
            address(mezoIntegration),
            address(yieldAggregator),
            address(musd),
            feeCollector
        );

        vm.deal(user1, INITIAL_BTC_BALANCE);
        vm.deal(user2, INITIAL_BTC_BALANCE);
    }

    /*//////////////////////////////////////////////////////////////
                        BASIC TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Version() public view {
        assertEq(pool.version(), "3.1.0");
    }

    function test_CreatePool() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test Pool", 0.1 ether, 5 ether, 10);
        
        assertEq(poolId, 1);
        assertEq(pool.poolCounter(), 1);
    }

    function test_JoinPool() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        CooperativePoolV3.MemberInfo memory memberInfo = pool.getMemberInfo(poolId, user2);
        assertEq(memberInfo.btcContributed, 1 ether);
        assertTrue(memberInfo.active);
    }

    /*//////////////////////////////////////////////////////////////
                    PARTIAL WITHDRAWAL TESTS (v3.1.0)
    //////////////////////////////////////////////////////////////*/

    function test_WithdrawPartial() public {
        // Create and join pool
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        uint256 balanceBefore = address(user2).balance;

        // Withdraw 0.3 BTC
        vm.prank(user2);
        pool.withdrawPartial(poolId, 0.3 ether);

        // Check member still active with reduced contribution
        CooperativePoolV3.MemberInfo memory memberInfo = pool.getMemberInfo(poolId, user2);
        assertTrue(memberInfo.active);
        assertEq(memberInfo.btcContributed, 0.7 ether);
        assertGt(address(user2).balance, balanceBefore);
    }

    function test_WithdrawPartial_BelowMinimum() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.5 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        // Try to withdraw leaving less than minimum
        vm.prank(user2);
        vm.expectRevert(CooperativePoolV3.ContributionTooLow.selector);
        pool.withdrawPartial(poolId, 0.6 ether);
    }

    function test_WithdrawPartial_ZeroAmount() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        vm.prank(user2);
        vm.expectRevert(CooperativePoolV3.InvalidAmount.selector);
        pool.withdrawPartial(poolId, 0);
    }

    function test_WithdrawPartial_FullAmount() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        vm.prank(user2);
        vm.expectRevert(CooperativePoolV3.InvalidAmount.selector);
        pool.withdrawPartial(poolId, 1 ether);
    }

    function test_WithdrawPartial_NotMember() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        vm.expectRevert(CooperativePoolV3.NotMember.selector);
        pool.withdrawPartial(poolId, 0.5 ether);
    }

    function test_WithdrawPartial_Multiple() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 2 ether}(poolId);

        // First withdrawal
        vm.prank(user2);
        pool.withdrawPartial(poolId, 0.5 ether);

        CooperativePoolV3.MemberInfo memory memberInfo = pool.getMemberInfo(poolId, user2);
        assertEq(memberInfo.btcContributed, 1.5 ether);

        // Second withdrawal
        vm.prank(user2);
        pool.withdrawPartial(poolId, 0.3 ether);

        memberInfo = pool.getMemberInfo(poolId, user2);
        assertEq(memberInfo.btcContributed, 1.2 ether);
        assertTrue(memberInfo.active);
    }

    function test_WithdrawPartial_ThenAddMore() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1.5 ether}(poolId);

        // Withdraw partial
        vm.prank(user2);
        pool.withdrawPartial(poolId, 0.5 ether);

        CooperativePoolV3.MemberInfo memory memberInfo = pool.getMemberInfo(poolId, user2);
        assertEq(memberInfo.btcContributed, 1.0 ether);

        // Add more
        vm.prank(user2);
        pool.joinPool{value: 0.5 ether}(poolId);

        memberInfo = pool.getMemberInfo(poolId, user2);
        assertEq(memberInfo.btcContributed, 1.5 ether);
    }

    function test_LeavePool() public {
        vm.prank(user1);
        uint256 poolId = pool.createPool("Test", 0.1 ether, 5 ether, 10);

        vm.prank(user2);
        pool.joinPool{value: 1 ether}(poolId);

        vm.warp(block.timestamp + 30 days);

        vm.prank(user2);
        pool.leavePool(poolId);

        CooperativePoolV3.MemberInfo memory memberInfo = pool.getMemberInfo(poolId, user2);
        assertFalse(memberInfo.active);
    }
}
