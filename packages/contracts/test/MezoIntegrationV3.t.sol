// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {MezoIntegrationV3} from "../src/integrations/v3/MezoIntegrationV3.sol";
import {BaseMezoIntegration} from "../src/integrations/base/BaseMezoIntegration.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";

/**
 * @title MezoIntegrationV3 Test Suite
 * @notice Comprehensive tests for MezoIntegrationV3 contract
 * @dev Tests native BTC deposits, MUSD minting, collateral management, and admin functions
 */
contract MezoIntegrationV3Test is Test {
    /*//////////////////////////////////////////////////////////////
                            CONTRACTS
    //////////////////////////////////////////////////////////////*/

    MezoIntegrationV3 public implementation;
    MezoIntegrationV3 public mezoIntegration;
    MockMUSD public musd;
    UUPSProxy public proxy;

    // Mock Mezo contracts (simplified for testing)
    address public borrowerOperations = makeAddr("borrowerOperations");
    address public priceFeed = makeAddr("priceFeed");
    address public hintHelpers = makeAddr("hintHelpers");
    address public troveManager = makeAddr("troveManager");

    /*//////////////////////////////////////////////////////////////
                            ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant INITIAL_BTC_BALANCE = 100 ether;
    uint256 public constant MIN_BTC_DEPOSIT = 0.001 ether;
    uint256 public constant DEFAULT_TARGET_LTV = 5000; // 50%
    uint256 public constant BTC_PRICE = 60000e18; // $60,000

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event BTCDeposited(address indexed user, uint256 btcAmount, uint256 musdAmount);
    event BTCWithdrawn(address indexed user, uint256 btcAmount, uint256 musdAmount);
    event TargetLtvUpdated(uint256 oldLtv, uint256 newLtv);
    event MaxFeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyModeUpdated(bool enabled);

    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Deploy MUSD token
        musd = new MockMUSD();

        // Deploy implementation
        vm.prank(owner);
        implementation = new MezoIntegrationV3();

        // Deploy proxy
        vm.prank(owner);
        proxy = new UUPSProxy(address(implementation), "");

        // Wrap proxy as MezoIntegrationV3
        mezoIntegration = MezoIntegrationV3(payable(address(proxy)));

        // Initialize
        vm.prank(owner);
        mezoIntegration.initialize(
            address(musd),
            borrowerOperations,
            priceFeed,
            hintHelpers,
            troveManager
        );

        // Give users native BTC
        vm.deal(user1, INITIAL_BTC_BALANCE);
        vm.deal(user2, INITIAL_BTC_BALANCE);
        vm.deal(user3, INITIAL_BTC_BALANCE);

        // Mint MUSD to mezoIntegration for testing (simulates Mezo minting)
        musd.mint(address(mezoIntegration), 1_000_000 ether);

        // Approve mezoIntegration to spend user MUSD
        vm.prank(user1);
        musd.approve(address(mezoIntegration), type(uint256).max);

        vm.prank(user2);
        musd.approve(address(mezoIntegration), type(uint256).max);

        vm.prank(user3);
        musd.approve(address(mezoIntegration), type(uint256).max);

        // Label addresses
        vm.label(address(mezoIntegration), "MezoIntegrationV3");
        vm.label(address(musd), "MUSD");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(user3, "User3");
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Helper to setup all necessary mocks for price validation
     * @param price The BTC price to mock (18 decimals)
     */
    function _setupPriceMocks(uint256 price) internal {
        // Mock latestRoundData for freshness check
        vm.mockCall(
            priceFeed,
            abi.encodeWithSignature("latestRoundData()"),
            abi.encode(
                uint80(1),           // roundId
                int256(price),       // answer
                block.timestamp,     // startedAt
                block.timestamp,     // updatedAt (fresh)
                uint80(1)            // answeredInRound
            )
        );

        // Mock fetchPrice for actual price
        vm.mockCall(
            priceFeed,
            abi.encodeWithSignature("fetchPrice()"),
            abi.encode(price)
        );
    }

    /**
     * @notice Helper to setup mocks for a deposit operation
     * @param user Address of the user
     * @param existingDebt Existing debt (0 for new trove)
     */
    function _setupDepositMocks(address user, uint256 existingDebt) internal {
        // Mock trove state
        vm.mockCall(
            troveManager,
            abi.encodeWithSignature("getTroveDebtAndColl(address)", user),
            abi.encode(existingDebt, existingDebt > 0 ? 1 ether : 0)
        );

        // Mock price
        _setupPriceMocks(BTC_PRICE);

        // Mock hint helpers
        vm.mockCall(
            hintHelpers,
            abi.encodeWithSignature("getApproxHint(uint256,uint256,uint256)"),
            abi.encode(address(0), 0, 0)
        );

        // Mock borrower operations
        vm.mockCall(
            borrowerOperations,
            abi.encodeWithSignature("openTrove(uint256,uint256,address,address)"),
            abi.encode()
        );

        vm.mockCall(
            borrowerOperations,
            abi.encodeWithSignature("adjustTrove(uint256,uint256,bool,address,address)"),
            abi.encode()
        );
    }

    /**
     * @notice Helper to setup mocks for a withdrawal operation
     */
    function _setupWithdrawMocks() internal {
        _setupPriceMocks(BTC_PRICE);

        vm.mockCall(
            hintHelpers,
            abi.encodeWithSignature("getApproxHint(uint256,uint256,uint256)"),
            abi.encode(address(0), 0, 0)
        );

        vm.mockCall(
            borrowerOperations,
            abi.encodeWithSignature("adjustTrove(uint256,uint256,bool,address,address)"),
            abi.encode()
        );

        vm.mockCall(
            borrowerOperations,
            abi.encodeWithSignature("closeTrove()"),
            abi.encode()
        );
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(mezoIntegration.owner(), owner);
        assertEq(address(mezoIntegration.MUSD_TOKEN()), address(musd));
        assertEq(address(mezoIntegration.BORROWER_OPERATIONS()), borrowerOperations);
        assertEq(address(mezoIntegration.PRICE_FEED()), priceFeed);
        assertEq(address(mezoIntegration.HINT_HELPERS()), hintHelpers);
        assertEq(address(mezoIntegration.TROVE_MANAGER()), troveManager);
        assertFalse(mezoIntegration.paused());
    }

    function test_InitialState() public view {
        assertEq(mezoIntegration.totalBtcDeposited(), 0);
        assertEq(mezoIntegration.totalMusdMinted(), 0);
        assertEq(mezoIntegration.targetLtv(), DEFAULT_TARGET_LTV);
        assertEq(mezoIntegration.maxFeePercentage(), 500);
        assertFalse(mezoIntegration.emergencyMode());
    }

    function test_Version() public view {
        assertEq(mezoIntegration.version(), "3.1.0");
    }

    function test_Initialize_ZeroAddress() public {
        vm.prank(owner);
        MezoIntegrationV3 newImpl = new MezoIntegrationV3();

        vm.prank(owner);
        UUPSProxy newProxy = new UUPSProxy(address(newImpl), "");

        MezoIntegrationV3 newMezo = MezoIntegrationV3(payable(address(newProxy)));

        vm.prank(owner);
        vm.expectRevert(BaseMezoIntegration.InvalidAddress.selector);
        newMezo.initialize(
            address(0),
            borrowerOperations,
            priceFeed,
            hintHelpers,
            troveManager
        );
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DepositAndMintNative() public {
        uint256 btcAmount = 1 ether;
        uint256 balanceBefore = address(user1).balance;
        uint256 musdBalanceBefore = musd.balanceOf(user1);

        // Setup all necessary mocks
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        uint256 musdAmount = mezoIntegration.depositAndMintNative{value: btcAmount}();

        // Check BTC was sent
        assertEq(address(user1).balance, balanceBefore - btcAmount);

        // Check MUSD was received
        assertGt(musdAmount, 0);
        assertEq(musd.balanceOf(user1), musdBalanceBefore + musdAmount);

        // Check position tracking
        (uint256 btcCollateral, uint256 musdDebt) = mezoIntegration.getUserPosition(user1);
        assertEq(btcCollateral, btcAmount);
        assertEq(musdDebt, musdAmount);

        // Check totals
        assertEq(mezoIntegration.totalBtcDeposited(), btcAmount);
        assertEq(mezoIntegration.totalMusdMinted(), musdAmount);
    }

    function test_DepositAndMintNative_MinimumAmount() public {
        vm.mockCall(
            troveManager,
            abi.encodeWithSignature("getTroveDebtAndColl(address)", user1),
            abi.encode(0, 0)
        );

        vm.prank(user1);
        vm.expectRevert(BaseMezoIntegration.InvalidAmount.selector);
        mezoIntegration.depositAndMintNative{value: MIN_BTC_DEPOSIT - 1}();
    }

    function test_DepositAndMintNative_WhenPaused() public {
        vm.prank(owner);
        mezoIntegration.pause();

        vm.prank(user1);
        vm.expectRevert();
        mezoIntegration.depositAndMintNative{value: 1 ether}();
    }

    function test_DepositAndMint_RevertsWithMessage() public {
        vm.prank(user1);
        vm.expectRevert("Use depositAndMintNative() with payable BTC");
        mezoIntegration.depositAndMint(1 ether);
    }

    function test_DepositAndMintNative_Multiple() public {
        // First deposit - new trove
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        mezoIntegration.depositAndMintNative{value: 1 ether}();

        // Advance block to avoid flash loan protection
        vm.roll(block.number + 1);

        // Second deposit - existing trove (has debt)
        _setupDepositMocks(user1, 30000e18);

        vm.prank(user1);
        mezoIntegration.depositAndMintNative{value: 0.5 ether}();

        // Check total position
        (uint256 btcCollateral,) = mezoIntegration.getUserPosition(user1);
        assertEq(btcCollateral, 1.5 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BurnAndWithdraw() public {
        // First deposit
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        uint256 musdMinted = mezoIntegration.depositAndMintNative{value: 1 ether}();

        // Advance block to avoid flash loan protection
        vm.roll(block.number + 1);

        // Now withdraw
        uint256 btcBalanceBefore = address(user1).balance;

        // Setup withdrawal mocks
        _setupWithdrawMocks();

        vm.prank(user1);
        uint256 btcReturned = mezoIntegration.burnAndWithdraw(musdMinted);

        assertGt(btcReturned, 0);
        assertEq(address(user1).balance, btcBalanceBefore + btcReturned);
    }

    function test_BurnAndWithdraw_InvalidAmount() public {
        vm.prank(user1);
        vm.expectRevert(BaseMezoIntegration.InvalidAmount.selector);
        mezoIntegration.burnAndWithdraw(0);
    }

    function test_BurnAndWithdraw_InsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert(BaseMezoIntegration.InsufficientBalance.selector);
        mezoIntegration.burnAndWithdraw(1000 ether);
    }

    function test_BurnAndWithdraw_CloseTrove() public {
        // First deposit
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        uint256 musdMinted = mezoIntegration.depositAndMintNative{value: 1 ether}();

        // Advance block to avoid flash loan protection
        vm.roll(block.number + 1);

        // Setup withdrawal mocks for closing trove
        _setupWithdrawMocks();

        vm.prank(user1);
        mezoIntegration.burnAndWithdraw(musdMinted);

        // Position should be zero
        (uint256 btcCollateral, uint256 musdDebt) = mezoIntegration.getUserPosition(user1);
        assertEq(btcCollateral, 0);
        assertEq(musdDebt, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IsPositionHealthy() public {
        // Deposit first
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        mezoIntegration.depositAndMintNative{value: 1 ether}();

        // Setup price mocks for health check
        _setupPriceMocks(BTC_PRICE);

        bool healthy = mezoIntegration.isPositionHealthy(user1);
        assertTrue(healthy);
    }

    function test_GetCollateralRatio() public {
        // Deposit first
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        mezoIntegration.depositAndMintNative{value: 1 ether}();

        // Setup price mocks for ratio calculation
        _setupPriceMocks(BTC_PRICE);

        uint256 ratio = mezoIntegration.getCollateralRatio(user1);
        assertGt(ratio, 11000); // Should be > 110% (minimum healthy ratio)
    }

    function test_GetUserPosition() public {
        (uint256 btcCollateral, uint256 musdDebt) = mezoIntegration.getUserPosition(user1);
        assertEq(btcCollateral, 0);
        assertEq(musdDebt, 0);
    }

    function test_GetCollateralRatio_NoDebt() public {
        uint256 ratio = mezoIntegration.getCollateralRatio(user1);
        assertEq(ratio, type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetEmergencyMode() public {
        vm.expectEmit(false, false, false, true);
        emit EmergencyModeUpdated(true);

        vm.prank(owner);
        mezoIntegration.setEmergencyMode(true);

        assertTrue(mezoIntegration.emergencyMode());
    }

    function test_SetEmergencyMode_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        mezoIntegration.setEmergencyMode(true);
    }

    function test_SetTargetLtv() public {
        uint256 newLtv = 6000; // 60%

        vm.expectEmit(false, false, false, true);
        emit TargetLtvUpdated(DEFAULT_TARGET_LTV, newLtv);

        vm.prank(owner);
        mezoIntegration.setTargetLtv(newLtv);

        assertEq(mezoIntegration.targetLtv(), newLtv);
    }

    function test_SetTargetLtv_ZeroInvalid() public {
        vm.prank(owner);
        vm.expectRevert(BaseMezoIntegration.InvalidLtv.selector);
        mezoIntegration.setTargetLtv(0);
    }

    function test_SetTargetLtv_TooHigh() public {
        vm.prank(owner);
        vm.expectRevert(BaseMezoIntegration.InvalidLtv.selector);
        mezoIntegration.setTargetLtv(8001); // > 80%
    }

    function test_SetTargetLtv_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        mezoIntegration.setTargetLtv(6000);
    }

    function test_SetMaxFeePercentage() public {
        uint256 newFee = 700;

        vm.expectEmit(false, false, false, true);
        emit MaxFeeUpdated(500, newFee);

        vm.prank(owner);
        mezoIntegration.setMaxFeePercentage(newFee);

        assertEq(mezoIntegration.maxFeePercentage(), newFee);
    }

    function test_SetMaxFeePercentage_TooHigh() public {
        vm.prank(owner);
        vm.expectRevert(BaseMezoIntegration.ExcessiveFee.selector);
        mezoIntegration.setMaxFeePercentage(1001); // > 10%
    }

    function test_SetMaxFeePercentage_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        mezoIntegration.setMaxFeePercentage(700);
    }

    function test_Pause() public {
        vm.prank(owner);
        mezoIntegration.pause();

        assertTrue(mezoIntegration.paused());
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        mezoIntegration.pause();
        mezoIntegration.unpause();
        vm.stopPrank();

        assertFalse(mezoIntegration.paused());
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeAuthorization_OnlyOwner() public {
        vm.prank(owner);
        MezoIntegrationV3 newImpl = new MezoIntegrationV3();

        vm.prank(owner);
        mezoIntegration.upgradeToAndCall(address(newImpl), "");

        // Verify state is preserved
        assertEq(mezoIntegration.owner(), owner);
        assertEq(address(mezoIntegration.MUSD_TOKEN()), address(musd));
    }

    function test_UpgradeAuthorization_NotOwner() public {
        vm.prank(owner);
        MezoIntegrationV3 newImpl = new MezoIntegrationV3();

        vm.prank(user1);
        vm.expectRevert();
        mezoIntegration.upgradeToAndCall(address(newImpl), "");
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FullLifecycle() public {
        // Setup deposit mocks
        _setupDepositMocks(user1, 0);

        vm.prank(user1);

        // 1. Deposit BTC and mint MUSD
        uint256 musdMinted = mezoIntegration.depositAndMintNative{value: 1 ether}();
        assertGt(musdMinted, 0);

        // Setup price mocks for health check
        _setupPriceMocks(BTC_PRICE);

        // 2. Check position is healthy
        bool healthy = mezoIntegration.isPositionHealthy(user1);
        assertTrue(healthy);

        // Advance block to avoid flash loan protection
        vm.roll(block.number + 1);

        // Setup withdrawal mocks
        _setupWithdrawMocks();

        // 3. Burn MUSD and withdraw BTC
        vm.prank(user1);
        uint256 btcReturned = mezoIntegration.burnAndWithdraw(musdMinted);
        assertGt(btcReturned, 0);

        // Position should be closed
        (uint256 btcCollateral, uint256 musdDebt) = mezoIntegration.getUserPosition(user1);
        assertEq(btcCollateral, 0);
        assertEq(musdDebt, 0);
    }

    function test_MultipleUsers() public {
        // User1 deposits
        _setupDepositMocks(user1, 0);
        vm.prank(user1);
        mezoIntegration.depositAndMintNative{value: 1 ether}();

        // User2 deposits
        _setupDepositMocks(user2, 0);
        vm.prank(user2);
        mezoIntegration.depositAndMintNative{value: 2 ether}();

        // User3 deposits
        _setupDepositMocks(user3, 0);
        vm.prank(user3);
        mezoIntegration.depositAndMintNative{value: 3 ether}();

        // Check total deposits
        assertEq(mezoIntegration.totalBtcDeposited(), 6 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_DepositAndMintNative(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, MIN_BTC_DEPOSIT, 10 ether);

        vm.deal(user1, btcAmount);

        // Setup mocks
        _setupDepositMocks(user1, 0);

        vm.prank(user1);
        uint256 musdAmount = mezoIntegration.depositAndMintNative{value: btcAmount}();

        assertGt(musdAmount, 0);
        assertEq(mezoIntegration.totalBtcDeposited(), btcAmount);
    }

    function testFuzz_SetTargetLtv(uint256 ltv) public {
        ltv = bound(ltv, 1, 8000); // 0.01% to 80%

        vm.prank(owner);
        mezoIntegration.setTargetLtv(ltv);

        assertEq(mezoIntegration.targetLtv(), ltv);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_ReceiveNativeBTC() public {
        // Contract should accept native BTC via receive()
        vm.deal(user1, 10 ether);

        vm.prank(user1);
        (bool success,) = address(mezoIntegration).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(mezoIntegration).balance, 1 ether);
    }

    function test_EdgeCase_PriceFeedFailure() public {
        vm.mockCall(
            troveManager,
            abi.encodeWithSignature("getTroveDebtAndColl(address)", user1),
            abi.encode(0, 0)
        );

        // Mock latestRoundData to succeed (for freshness check to pass)
        vm.mockCall(
            priceFeed,
            abi.encodeWithSignature("latestRoundData()"),
            abi.encode(
                uint80(1),
                int256(BTC_PRICE),
                block.timestamp,
                block.timestamp,
                uint80(1)
            )
        );

        // Mock price feed fetchPrice to return 0 (failure case)
        vm.mockCall(
            priceFeed,
            abi.encodeWithSignature("fetchPrice()"),
            abi.encode(0)
        );

        vm.prank(user1);
        vm.expectRevert(BaseMezoIntegration.PriceFeedFailure.selector);
        mezoIntegration.depositAndMintNative{value: 1 ether}();
    }

    function test_EdgeCase_PriceFeedReverts() public {
        vm.mockCall(
            troveManager,
            abi.encodeWithSignature("getTroveDebtAndColl(address)", user1),
            abi.encode(0, 0)
        );

        // Mock latestRoundData to succeed (for freshness check to pass)
        vm.mockCall(
            priceFeed,
            abi.encodeWithSignature("latestRoundData()"),
            abi.encode(
                uint80(1),
                int256(BTC_PRICE),
                block.timestamp,
                block.timestamp,
                uint80(1)
            )
        );

        // Mock price feed fetchPrice to revert
        vm.mockCallRevert(
            priceFeed,
            abi.encodeWithSignature("fetchPrice()"),
            "Price feed error"
        );

        vm.prank(user1);
        vm.expectRevert(BaseMezoIntegration.PriceFeedFailure.selector);
        mezoIntegration.depositAndMintNative{value: 1 ether}();
    }
}
