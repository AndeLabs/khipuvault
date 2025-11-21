// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {YieldAggregatorV3} from "../src/integrations/v3/YieldAggregatorV3.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";
import {IYieldAggregator} from "../src/interfaces/IYieldAggregator.sol";

/**
 * @title YieldAggregatorV3 Test Suite
 * @notice Comprehensive tests for YieldAggregatorV3 contract
 * @dev Tests all functionalities including deposits, withdrawals, yields, vaults, and admin functions
 */
contract YieldAggregatorV3Test is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    YieldAggregatorV3 public implementation;
    YieldAggregatorV3 public aggregator;
    MockMUSD public musd;
    UUPSProxy public proxy;

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public vault1 = makeAddr("vault1");
    address public vault2 = makeAddr("vault2");
    address public vault3 = makeAddr("vault3");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_BALANCE = 1_000_000 ether;
    uint256 public constant MIN_DEPOSIT = 1 ether;

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event YieldDeposited(address indexed user, address indexed vault, uint256 amount, uint256 shares);
    event YieldWithdrawn(address indexed user, address indexed vault, uint256 principal, uint256 yield);
    event YieldClaimed(address indexed user, uint256 amount);
    event YieldCompounded(address indexed user, uint256 amount);
    event VaultAdded(address indexed vaultAddress, IYieldAggregator.YieldStrategy strategy, uint256 apr);
    event VaultUpdated(address indexed vaultAddress, uint256 apr, bool active);
    event EmergencyModeUpdated(bool enabled);

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy mocks
        musd = new MockMUSD();

        // Deploy implementation
        vm.prank(owner);
        implementation = new YieldAggregatorV3();

        // Deploy proxy
        vm.prank(owner);
        proxy = new UUPSProxy(address(implementation), "");

        // Wrap proxy as YieldAggregatorV3
        aggregator = YieldAggregatorV3(address(proxy));

        // Initialize
        vm.prank(owner);
        aggregator.initialize(address(musd));

        // Enable emergency mode to bypass flash loan protection
        vm.prank(owner);
        aggregator.setEmergencyMode(true);

        // Mint MUSD to test users
        musd.mint(user1, INITIAL_BALANCE);
        musd.mint(user2, INITIAL_BALANCE);
        musd.mint(user3, INITIAL_BALANCE);

        // Approve aggregator to spend MUSD
        vm.prank(user1);
        musd.approve(address(aggregator), type(uint256).max);

        vm.prank(user2);
        musd.approve(address(aggregator), type(uint256).max);

        vm.prank(user3);
        musd.approve(address(aggregator), type(uint256).max);

        // Label addresses
        vm.label(address(aggregator), "YieldAggregatorV3");
        vm.label(address(musd), "MUSD");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(user3, "User3");
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(aggregator.owner(), owner);
        assertEq(address(aggregator.MUSD_TOKEN()), address(musd));
        assertFalse(aggregator.paused());
        assertTrue(aggregator.emergencyMode());
    }

    function test_InitialState() public view {
        assertEq(aggregator.totalValueLocked(), 0);
        assertEq(aggregator.totalYieldGenerated(), 0);
        assertFalse(aggregator.depositsPaused());
    }

    function test_Version() public view {
        assertEq(aggregator.version(), "3.0.0");
    }

    function test_Initialize_ZeroAddress() public {
        vm.prank(owner);
        YieldAggregatorV3 newImpl = new YieldAggregatorV3();

        vm.prank(owner);
        UUPSProxy newProxy = new UUPSProxy(address(newImpl), "");

        YieldAggregatorV3 newAggregator = YieldAggregatorV3(address(newProxy));

        vm.prank(owner);
        vm.expectRevert(YieldAggregatorV3.InvalidAddress.selector);
        newAggregator.initialize(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        VAULT MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddVault() public {
        vm.expectEmit(true, false, false, true);
        emit VaultAdded(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        IYieldAggregator.VaultInfo memory info = aggregator.getVaultInfo(vault1);
        assertEq(info.vaultAddress, vault1);
        assertEq(uint256(info.strategy), uint256(IYieldAggregator.YieldStrategy.AAVE));
        assertEq(info.apr, 500);
        assertTrue(info.active);
        assertEq(info.totalDeposited, 0);
    }

    function test_AddVault_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(YieldAggregatorV3.InvalidAddress.selector);
        aggregator.addVault(address(0), IYieldAggregator.YieldStrategy.AAVE, 500);
    }

    function test_AddVault_AlreadyExists() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.expectRevert(YieldAggregatorV3.VaultAlreadyExists.selector);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.COMPOUND, 600);
        vm.stopPrank();
    }

    function test_AddVault_MaxVaultsLimit() public {
        vm.startPrank(owner);

        // Add maximum vaults
        for (uint256 i = 0; i < 10; i++) {
            address vault = address(uint160(i + 1000));
            aggregator.addVault(vault, IYieldAggregator.YieldStrategy.AAVE, 500);
        }

        // Try to add one more
        vm.expectRevert(YieldAggregatorV3.TooManyVaults.selector);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.stopPrank();
    }

    function test_AddVault_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
    }

    function test_UpdateVaultApr() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.expectEmit(true, false, false, true);
        emit VaultUpdated(vault1, 700, true);

        aggregator.updateVaultApr(vault1, 700);
        vm.stopPrank();

        IYieldAggregator.VaultInfo memory info = aggregator.getVaultInfo(vault1);
        assertEq(info.apr, 700);
    }

    function test_UpdateVaultApr_VaultNotFound() public {
        vm.prank(owner);
        vm.expectRevert(YieldAggregatorV3.VaultNotFound.selector);
        aggregator.updateVaultApr(vault1, 700);
    }

    function test_SetVaultActive() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.expectEmit(true, false, false, true);
        emit VaultUpdated(vault1, 500, false);

        aggregator.setVaultActive(vault1, false);
        vm.stopPrank();

        IYieldAggregator.VaultInfo memory info = aggregator.getVaultInfo(vault1);
        assertFalse(info.active);
    }

    function test_GetActiveVaults() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
        aggregator.addVault(vault2, IYieldAggregator.YieldStrategy.COMPOUND, 600);
        aggregator.addVault(vault3, IYieldAggregator.YieldStrategy.YEARN, 700);
        vm.stopPrank();

        address[] memory vaults = aggregator.getActiveVaults();
        assertEq(vaults.length, 3);
        assertEq(vaults[0], vault1);
        assertEq(vaults[1], vault2);
        assertEq(vaults[2], vault3);
    }

    function test_GetBestVault() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
        aggregator.addVault(vault2, IYieldAggregator.YieldStrategy.COMPOUND, 800);
        aggregator.addVault(vault3, IYieldAggregator.YieldStrategy.YEARN, 600);
        vm.stopPrank();

        (address bestVault, uint256 apr) = aggregator.getBestVault();
        assertEq(bestVault, vault2);
        assertEq(apr, 800);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deposit() public {
        // Setup vault
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        uint256 depositAmount = 100 ether;
        uint256 balanceBefore = musd.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit YieldDeposited(user1, vault1, depositAmount, depositAmount);

        vm.prank(user1);
        (address vaultAddr, uint256 shares) = aggregator.deposit(depositAmount);

        // Check deposit
        assertEq(vaultAddr, vault1);
        assertEq(shares, depositAmount);
        assertEq(musd.balanceOf(user1), balanceBefore - depositAmount);
        assertEq(aggregator.totalValueLocked(), depositAmount);
        assertEq(aggregator.userTotalDeposited(user1), depositAmount);
    }

    function test_Deposit_MinimumAmount() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.InvalidAmount.selector);
        aggregator.deposit(MIN_DEPOSIT - 1);
    }

    function test_Deposit_NoVaults() public {
        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.VaultNotFound.selector);
        aggregator.deposit(100 ether);
    }

    function test_Deposit_WhenPaused() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
        aggregator.pause();
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert();
        aggregator.deposit(100 ether);
    }

    function test_Deposit_WhenDepositsPaused() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
        aggregator.pauseDeposits();
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.DepositsPaused.selector);
        aggregator.deposit(100 ether);
    }

    function test_DepositToVault() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        uint256 depositAmount = 100 ether;

        vm.prank(user1);
        uint256 shares = aggregator.depositToVault(vault1, depositAmount);

        assertEq(shares, depositAmount);
        assertEq(aggregator.userTotalDeposited(user1), depositAmount);
    }

    function test_DepositToVault_InactiveVault() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);
        aggregator.setVaultActive(vault1, false);
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.VaultInactive.selector);
        aggregator.depositToVault(vault1, 100 ether);
    }

    function test_Deposit_Multiple() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);
        aggregator.deposit(50 ether);
        aggregator.deposit(25 ether);
        vm.stopPrank();

        assertEq(aggregator.userTotalDeposited(user1), 175 ether);
        assertEq(aggregator.totalValueLocked(), 175 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Withdraw() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        // Simulate time passing
        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = musd.balanceOf(user1);
        uint256 totalWithdrawn = aggregator.withdraw(0); // 0 = withdraw all

        vm.stopPrank();

        assertGt(totalWithdrawn, 100 ether); // Should include yields
        assertEq(musd.balanceOf(user1), balanceBefore + totalWithdrawn);
        assertEq(aggregator.userTotalDeposited(user1), 0);
    }

    function test_Withdraw_Partial() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        uint256 withdrawAmount = 40 ether;
        uint256 totalWithdrawn = aggregator.withdraw(withdrawAmount);

        vm.stopPrank();

        assertGt(totalWithdrawn, 0);
        assertEq(aggregator.userTotalDeposited(user1), 60 ether);
    }

    function test_Withdraw_NoDeposit() public {
        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.NoDeposit.selector);
        aggregator.withdraw(100 ether);
    }

    function test_Withdraw_ExceedsBalance() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        vm.expectRevert(YieldAggregatorV3.InvalidAmount.selector);
        aggregator.withdraw(200 ether);

        vm.stopPrank();
    }

    function test_WithdrawFromVault() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        uint256 shares = aggregator.depositToVault(vault1, 100 ether);

        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = musd.balanceOf(user1);
        uint256 amount = aggregator.withdrawFromVault(vault1, shares);

        vm.stopPrank();

        assertGt(amount, 100 ether); // Should include yields
        assertEq(musd.balanceOf(user1), balanceBefore + amount);
    }

    /*//////////////////////////////////////////////////////////////
                        YIELD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ClaimYield() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        // Simulate time passing
        vm.warp(block.timestamp + 365 days);

        uint256 balanceBefore = musd.balanceOf(user1);

        vm.expectEmit(true, false, false, false);
        emit YieldClaimed(user1, 0);

        uint256 yieldAmount = aggregator.claimYield();

        vm.stopPrank();

        assertGt(yieldAmount, 0);
        assertEq(musd.balanceOf(user1), balanceBefore + yieldAmount);

        // Principal should remain
        assertEq(aggregator.userTotalDeposited(user1), 100 ether);
    }

    function test_ClaimYield_NoDeposit() public {
        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.NoDeposit.selector);
        aggregator.claimYield();
    }

    function test_ClaimYield_NoYields() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        // Try to claim immediately (no yields yet)
        vm.expectRevert(YieldAggregatorV3.InvalidAmount.selector);
        aggregator.claimYield();

        vm.stopPrank();
    }

    function test_CompoundYields() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        // Simulate time passing
        vm.warp(block.timestamp + 365 days);

        uint256 depositBefore = aggregator.userTotalDeposited(user1);

        vm.expectEmit(true, false, false, false);
        emit YieldCompounded(user1, 0);

        uint256 compoundedAmount = aggregator.compoundYields();

        vm.stopPrank();

        assertGt(compoundedAmount, 0);
        assertEq(aggregator.userTotalDeposited(user1), depositBefore + compoundedAmount);
    }

    function test_CompoundYields_NoDeposit() public {
        vm.prank(user1);
        vm.expectRevert(YieldAggregatorV3.NoDeposit.selector);
        aggregator.compoundYields();
    }

    function test_GetPendingYield() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(user1);
        aggregator.deposit(100 ether);

        // Simulate time passing
        vm.warp(block.timestamp + 365 days);

        uint256 pendingYield = aggregator.getPendingYield(user1);
        assertGt(pendingYield, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetUserPosition() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(user1);
        aggregator.deposit(100 ether);

        vm.warp(block.timestamp + 30 days);

        (uint256 principal, uint256 yields) = aggregator.getUserPosition(user1);
        assertEq(principal, 100 ether);
        assertGt(yields, 0);
    }

    function test_CalculateExpectedYield() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500); // 5% APR

        uint256 expectedYield = aggregator.calculateExpectedYield(100 ether, vault1, 365 days);

        // Expected: 100 * 0.05 = 5 ether (approximately)
        assertApproxEqAbs(expectedYield, 5 ether, 0.1 ether);
    }

    function test_GetTotalValueLocked() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(user1);
        aggregator.deposit(100 ether);

        vm.prank(user2);
        aggregator.deposit(200 ether);

        assertEq(aggregator.getTotalValueLocked(), 300 ether);
    }

    function test_GetAverageApr() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500); // 5%
        aggregator.addVault(vault2, IYieldAggregator.YieldStrategy.COMPOUND, 700); // 7%
        vm.stopPrank();

        vm.prank(user1);
        aggregator.depositToVault(vault1, 100 ether);

        vm.prank(user2);
        aggregator.depositToVault(vault2, 100 ether);

        uint256 avgApr = aggregator.getAverageApr();
        assertEq(avgApr, 600); // (500 + 700) / 2 = 600 (weighted equally)
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetEmergencyMode() public {
        vm.prank(owner);
        aggregator.setEmergencyMode(false);
        assertFalse(aggregator.emergencyMode());

        vm.prank(owner);
        aggregator.setEmergencyMode(true);
        assertTrue(aggregator.emergencyMode());
    }

    function test_SetEmergencyMode_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        aggregator.setEmergencyMode(true);
    }

    function test_SetAuthorizedCaller() public {
        vm.prank(owner);
        aggregator.setAuthorizedCaller(user1, true);
        assertTrue(aggregator.authorizedCallers(user1));

        vm.prank(owner);
        aggregator.setAuthorizedCaller(user1, false);
        assertFalse(aggregator.authorizedCallers(user1));
    }

    function test_PauseDeposits() public {
        vm.prank(owner);
        aggregator.pauseDeposits();
        assertTrue(aggregator.depositsPaused());
    }

    function test_ResumeDeposits() public {
        vm.startPrank(owner);
        aggregator.pauseDeposits();
        aggregator.resumeDeposits();
        vm.stopPrank();

        assertFalse(aggregator.depositsPaused());
    }

    function test_Pause() public {
        vm.prank(owner);
        aggregator.pause();
        assertTrue(aggregator.paused());
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        aggregator.pause();
        aggregator.unpause();
        vm.stopPrank();

        assertFalse(aggregator.paused());
    }

    function test_EmergencyWithdrawFromVault() public {
        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        aggregator.emergencyWithdrawFromVault(vault1);
        vm.stopPrank();

        IYieldAggregator.VaultInfo memory info = aggregator.getVaultInfo(vault1);
        assertFalse(info.active);
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeAuthorization_OnlyOwner() public {
        vm.prank(owner);
        YieldAggregatorV3 newImpl = new YieldAggregatorV3();

        vm.prank(owner);
        aggregator.upgradeToAndCall(address(newImpl), "");

        // Verify state is preserved
        assertEq(aggregator.owner(), owner);
        assertEq(address(aggregator.MUSD_TOKEN()), address(musd));
    }

    function test_UpgradeAuthorization_NotOwner() public {
        vm.prank(owner);
        YieldAggregatorV3 newImpl = new YieldAggregatorV3();

        vm.prank(user1);
        vm.expectRevert();
        aggregator.upgradeToAndCall(address(newImpl), "");
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FullLifecycle() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);

        // 1. Deposit
        aggregator.deposit(100 ether);

        // 2. Wait and deposit more
        vm.warp(block.timestamp + 30 days);
        aggregator.deposit(50 ether);

        // 3. Claim yields
        vm.warp(block.timestamp + 30 days);
        uint256 yield1 = aggregator.claimYield();
        assertGt(yield1, 0);

        // 4. Compound yields
        vm.warp(block.timestamp + 30 days);
        uint256 compounded = aggregator.compoundYields();
        assertGt(compounded, 0);

        // 5. Partial withdrawal
        aggregator.withdraw(50 ether);

        // 6. Final withdrawal
        uint256 finalWithdrawal = aggregator.withdraw(0);
        assertGt(finalWithdrawal, 0);

        vm.stopPrank();

        assertEq(aggregator.userTotalDeposited(user1), 0);
    }

    function test_MultipleUsers() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        // User1 deposits
        vm.prank(user1);
        aggregator.deposit(100 ether);

        // User2 deposits
        vm.prank(user2);
        aggregator.deposit(200 ether);

        // User3 deposits
        vm.prank(user3);
        aggregator.deposit(300 ether);

        // Check TVL
        assertEq(aggregator.getTotalValueLocked(), 600 ether);

        // Wait for yields
        vm.warp(block.timestamp + 365 days);

        // All users should have yields proportional to their deposits
        uint256 yield1 = aggregator.getPendingYield(user1);
        uint256 yield2 = aggregator.getPendingYield(user2);
        uint256 yield3 = aggregator.getPendingYield(user3);

        assertGt(yield1, 0);
        assertGt(yield2, 0);
        assertGt(yield3, 0);

        // User3 should have most yields (largest deposit)
        assertGt(yield3, yield2);
        assertGt(yield2, yield1);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, MIN_DEPOSIT, INITIAL_BALANCE);

        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.prank(user1);
        aggregator.deposit(amount);

        assertEq(aggregator.userTotalDeposited(user1), amount);
    }

    function testFuzz_VaultApr(uint256 apr) public {
        apr = bound(apr, 0, 10000); // 0% to 100%

        vm.startPrank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, apr);
        vm.stopPrank();

        IYieldAggregator.VaultInfo memory info = aggregator.getVaultInfo(vault1);
        assertEq(info.apr, apr);
    }

    function testFuzz_MultipleDeposits(uint8 numDeposits) public {
        numDeposits = uint8(bound(numDeposits, 1, 10));

        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        uint256 depositAmount = 10 ether;
        uint256 totalDeposited = 0;

        vm.startPrank(user1);

        for (uint256 i = 0; i < numDeposits; i++) {
            if (totalDeposited + depositAmount <= INITIAL_BALANCE) {
                aggregator.deposit(depositAmount);
                totalDeposited += depositAmount;
            }
        }

        vm.stopPrank();

        assertEq(aggregator.userTotalDeposited(user1), totalDeposited);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_WithdrawExactAmount() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);
        aggregator.withdraw(100 ether);
        vm.stopPrank();

        assertEq(aggregator.userTotalDeposited(user1), 0);
    }

    function test_EdgeCase_ClaimMultipleTimes() public {
        vm.prank(owner);
        aggregator.addVault(vault1, IYieldAggregator.YieldStrategy.AAVE, 500);

        vm.startPrank(user1);
        aggregator.deposit(100 ether);

        // Claim 1
        vm.warp(block.timestamp + 30 days);
        uint256 yield1 = aggregator.claimYield();

        // Claim 2
        vm.warp(block.timestamp + 30 days);
        uint256 yield2 = aggregator.claimYield();

        // Claim 3
        vm.warp(block.timestamp + 30 days);
        uint256 yield3 = aggregator.claimYield();

        vm.stopPrank();

        assertGt(yield1, 0);
        assertGt(yield2, 0);
        assertGt(yield3, 0);
    }
}
