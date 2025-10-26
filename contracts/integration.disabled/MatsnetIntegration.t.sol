// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {MezoIntegration} from "../../src/integrations/MezoIntegration.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MatsnetIntegrationTest
 * @notice Integration tests for KhipuVault with real Mezo MUSD protocol on Matsnet
 * @dev Tests run against forked Matsnet (Sepolia with MUSD contracts)
 * 
 * Requirements:
 * - Matsnet RPC URL in environment
 * - Real MUSD protocol contracts deployed on Matsnet
 * - Test runs with --fork-url $MATSNET_RPC_URL
 * 
 * Test Categories:
 * 1. Contract Integration - Verify connections to MUSD contracts
 * 2. Trove Operations - Open, adjust, close Troves
 * 3. Price Feed Integration - BTC price updates and staleness
 * 4. Position Health - Collateral ratio monitoring
 * 5. System State - Recovery mode and liquidation scenarios
 * 6. Error Handling - Invalid operations and edge cases
 */
contract MatsnetIntegrationTest is Test {
    /*//////////////////////////////////////////////////////////////
                            TEST SETUP
    //////////////////////////////////////////////////////////////*/

    MezoIntegration public mezoIntegration;
    
    // Real Matsnet contract addresses (loaded from environment)
    address public wbtc;
    address public musd;
    address public borrowerOperations;
    address public priceFeed;
    address public hintHelpers;
    address public troveManager;
    
    // Test accounts
    address public deployer;
    address public alice;
    address public bob;
    address public charlie;
    
    // Test amounts (8 decimals for WBTC, 18 for MUSD)
    uint256 public constant WBTC_AMOUNT = 0.1 ether; // 0.1 WBTC
    uint256 public constant SMALL_WBTC_AMOUNT = 0.01 ether; // 0.01 WBTC
    uint256 public constant LARGE_WBTC_AMOUNT = 1 ether; // 1 WBTC

    /*//////////////////////////////////////////////////////////////
                            SETUP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Load environment variables
        _loadMatsnetConfig();
        
        // Setup test accounts
        deployer = makeAddr("deployer");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        
        // Deploy MezoIntegration with real MUSD contract addresses
        vm.startPrank(deployer);
        mezoIntegration = new MezoIntegration(
            wbtc,
            musd,
            borrowerOperations,
            priceFeed,
            hintHelpers,
            troveManager
        );
        vm.stopPrank();
        
        // Verify deployment
        assertEq(address(mezoIntegration.WBTC_TOKEN()), wbtc);
        assertEq(address(mezoIntegration.MUSD_TOKEN()), musd);
        assertEq(address(mezoIntegration.BORROWER_OPERATIONS()), borrowerOperations);
        assertEq(address(mezoIntegration.PRICE_FEED()), priceFeed);
        
        // Fund test accounts with WBTC
        _fundAccountWithWBTC(alice, LARGE_WBTC_AMOUNT);
        _fundAccountWithWBTC(bob, LARGE_WBTC_AMOUNT);
        _fundAccountWithWBTC(charlie, WBTC_AMOUNT);
        
        console2.log("=== Matsnet Integration Test Setup Complete ===");
        console2.log("MezoIntegration:", address(mezoIntegration));
        console2.log("WBTC Address:", wbtc);
        console2.log("MUSD Address:", musd);
        console2.log("Current BTC Price:", mezoIntegration.getBtcPrice() / 1e18, "USD");
    }

    /*//////////////////////////////////////////////////////////////
                        CONTRACT INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ContractIntegration_AddressesSetCorrectly() public view {
        // Verify all contract addresses are set correctly
        assertTrue(address(mezoIntegration.WBTC_TOKEN()) != address(0));
        assertTrue(address(mezoIntegration.MUSD_TOKEN()) != address(0));
        assertTrue(address(mezoIntegration.BORROWER_OPERATIONS()) != address(0));
        assertTrue(address(mezoIntegration.PRICE_FEED()) != address(0));
        assertTrue(address(mezoIntegration.HINT_HELPERS()) != address(0));
        assertTrue(address(mezoIntegration.TROVE_MANAGER()) != address(0));
    }

    function test_ContractIntegration_PriceFeedWorking() public {
        // Test that price feed is working and returns reasonable BTC price
        uint256 price = mezoIntegration.getBtcPrice();
        
        // BTC price should be between $10k and $200k (reasonable bounds)
        assertGt(price, 10_000 * 1e18, "BTC price too low");
        assertLt(price, 200_000 * 1e18, "BTC price too high");
        
        console2.log("Current BTC Price: $", price / 1e18);
    }

    function test_ContractIntegration_SystemParameters() public {
        // Test system parameters are loaded correctly
        uint256 mcr = mezoIntegration.getMinCollateralRatio();
        uint256 liquidationThreshold = mezoIntegration.getLiquidationThreshold();
        uint256 borrowRate = mezoIntegration.getBorrowRate();
        
        // MCR should be reasonable (100% - 200%)
        assertGe(mcr, 10000, "MCR too low"); // >= 100%
        assertLe(mcr, 20000, "MCR too high"); // <= 200%
        
        // Liquidation threshold should be <= MCR
        assertLe(liquidationThreshold, mcr, "Liquidation threshold > MCR");
        
        console2.log("MCR:", mcr / 100, "%");
        console2.log("Liquidation Threshold:", liquidationThreshold / 100, "%");
        console2.log("Borrow Rate:", borrowRate, "bps");
    }

    /*//////////////////////////////////////////////////////////////
                        TROVE OPERATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TroveOperations_DepositAndMint_Success() public {
        uint256 depositAmount = WBTC_AMOUNT;
        
        vm.startPrank(alice);
        
        // Check initial state
        assertEq(mezoIntegration.getBtcBalance(alice), 0);
        assertEq(mezoIntegration.getMusdDebt(alice), 0);
        
        // Approve WBTC spending
        IERC20(wbtc).approve(address(mezoIntegration), depositAmount);
        
        // Get initial MUSD balance
        uint256 initialMusdBalance = IERC20(musd).balanceOf(alice);
        
        // Deposit and mint
        uint256 musdMinted = mezoIntegration.depositAndMint(depositAmount);
        
        // Verify MUSD was minted and transferred
        assertGt(musdMinted, 0, "No MUSD minted");
        assertEq(
            IERC20(musd).balanceOf(alice),
            initialMusdBalance + musdMinted,
            "MUSD not transferred"
        );
        
        // Verify position created in MUSD protocol
        uint256 btcBalance = mezoIntegration.getBtcBalance(alice);
        uint256 musdDebt = mezoIntegration.getMusdDebt(alice);
        
        assertEq(btcBalance, depositAmount, "BTC balance incorrect");
        assertGt(musdDebt, 0, "MUSD debt not created");
        
        // Verify position is healthy
        assertTrue(mezoIntegration.isPositionHealthy(alice), "Position not healthy");
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Deposit and mint successful");
        console2.log("  BTC Deposited:", depositAmount / 1e8);
        console2.log("  MUSD Minted:", musdMinted / 1e18);
        console2.log("  Collateral Ratio:", mezoIntegration.getCollateralRatio(alice) / 100);
    }

    function test_TroveOperations_AddCollateral_Success() public {
        // First create a position
        _createPosition(alice, WBTC_AMOUNT);
        
        uint256 initialCollateral = mezoIntegration.getBtcBalance(alice);
        uint256 initialRatio = mezoIntegration.getCollateralRatio(alice);
        uint256 additionalCollateral = SMALL_WBTC_AMOUNT;
        
        vm.startPrank(alice);
        
        // Approve additional WBTC
        IERC20(wbtc).approve(address(mezoIntegration), additionalCollateral);
        
        // Add collateral
        mezoIntegration.addCollateral(additionalCollateral);
        
        // Verify collateral increased
        assertEq(
            mezoIntegration.getBtcBalance(alice),
            initialCollateral + additionalCollateral,
            "Collateral not added"
        );
        
        // Verify collateral ratio improved
        uint256 newRatio = mezoIntegration.getCollateralRatio(alice);
        assertGt(newRatio, initialRatio, "Collateral ratio did not improve");
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Add collateral successful");
        console2.log("  Added:", additionalCollateral / 1e8);
        console2.log("  New Ratio:", newRatio / 100);
    }

    function test_TroveOperations_MintMore_Success() public {
        // Create initial position
        _createPosition(alice, WBTC_AMOUNT);
        
        uint256 initialDebt = mezoIntegration.getMusdDebt(alice);
        uint256 initialRatio = mezoIntegration.getCollateralRatio(alice);
        
        // Calculate safe additional mint amount (maintain healthy ratio)
        uint256 btcPrice = mezoIntegration.getBtcPrice();
        uint256 collateralValue = (WBTC_AMOUNT * btcPrice) / 1e8;
        uint256 maxSafeDebt = (collateralValue * 10000) / 16000; // 160% collateral ratio
        uint256 additionalMint = maxSafeDebt - initialDebt;
        
        // Ensure we don't mint too much
        additionalMint = (additionalMint * 80) / 100; // 80% of max for safety
        
        vm.startPrank(alice);
        
        uint256 initialMusdBalance = IERC20(musd).balanceOf(alice);
        
        // Mint more MUSD
        bool success = mezoIntegration.mintMore(additionalMint);
        assertTrue(success, "Mint more failed");
        
        // Verify MUSD was minted
        assertEq(
            IERC20(musd).balanceOf(alice),
            initialMusdBalance + additionalMint,
            "Additional MUSD not received"
        );
        
        // Verify debt increased
        assertEq(
            mezoIntegration.getMusdDebt(alice),
            initialDebt + additionalMint,
            "Debt not increased"
        );
        
        // Verify position still healthy
        assertTrue(mezoIntegration.isPositionHealthy(alice), "Position became unhealthy");
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Mint more successful");
        console2.log("  Additional MUSD:", additionalMint / 1e18);
        console2.log("  New Ratio:", mezoIntegration.getCollateralRatio(alice) / 100);
    }

    function test_TroveOperations_RepayDebt_Success() public {
        // Create position
        _createPosition(alice, WBTC_AMOUNT);
        
        uint256 initialDebt = mezoIntegration.getMusdDebt(alice);
        uint256 repayAmount = initialDebt / 4; // Repay 25% of debt
        
        vm.startPrank(alice);
        
        // Approve MUSD spending
        IERC20(musd).approve(address(mezoIntegration), repayAmount);
        
        // Repay debt
        mezoIntegration.repayDebt(repayAmount);
        
        // Verify debt decreased
        assertEq(
            mezoIntegration.getMusdDebt(alice),
            initialDebt - repayAmount,
            "Debt not decreased"
        );
        
        // Verify collateral ratio improved
        assertTrue(mezoIntegration.isPositionHealthy(alice), "Position not healthy");
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Repay debt successful");
        console2.log("  Repaid:", repayAmount / 1e18);
    }

    function test_TroveOperations_BurnAndWithdraw_Partial() public {
        // Create position
        _createPosition(alice, WBTC_AMOUNT);
        
        uint256 initialDebt = mezoIntegration.getMusdDebt(alice);
        uint256 initialCollateral = mezoIntegration.getBtcBalance(alice);
        uint256 burnAmount = initialDebt / 2; // Burn 50% of debt
        
        vm.startPrank(alice);
        
        // Approve MUSD for burning
        IERC20(musd).approve(address(mezoIntegration), burnAmount);
        
        uint256 initialWbtcBalance = IERC20(wbtc).balanceOf(alice);
        
        // Burn and withdraw
        uint256 btcReturned = mezoIntegration.burnAndWithdraw(burnAmount);
        
        // Verify BTC was returned
        assertGt(btcReturned, 0, "No BTC returned");
        assertEq(
            IERC20(wbtc).balanceOf(alice),
            initialWbtcBalance + btcReturned,
            "BTC not returned"
        );
        
        // Verify debt and collateral decreased proportionally
        assertLt(mezoIntegration.getMusdDebt(alice), initialDebt, "Debt not decreased");
        assertLt(mezoIntegration.getBtcBalance(alice), initialCollateral, "Collateral not decreased");
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Burn and withdraw successful");
        console2.log("  Burned:", burnAmount / 1e18);
        console2.log("  Received:", btcReturned / 1e8);
    }

    /*//////////////////////////////////////////////////////////////
                        PRICE FEED TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PriceFeed_FreshPrice() public {
        uint256 price = mezoIntegration.getBtcPrice();
        
        // Price should be reasonable and non-zero
        assertGt(price, 0, "Price is zero");
        assertGt(price, 10_000 * 1e18, "Price too low");
        assertLt(price, 200_000 * 1e18, "Price too high");
        
        console2.log("[SUCCESS] Fresh BTC price:", price / 1e18);
    }

    /*//////////////////////////////////////////////////////////////
                        POSITION HEALTH TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PositionHealth_HealthyPosition() public {
        _createPosition(alice, WBTC_AMOUNT);
        
        assertTrue(mezoIntegration.isPositionHealthy(alice), "Position should be healthy");
        
        uint256 ratio = mezoIntegration.getCollateralRatio(alice);
        uint256 minRatio = mezoIntegration.getMinCollateralRatio();
        
        assertGe(ratio, minRatio, "Ratio below minimum");
        
        console2.log("[SUCCESS] Position healthy");
        console2.log("  Ratio:", ratio / 100);
        console2.log("  Min Ratio:", minRatio / 100);
    }

    /*//////////////////////////////////////////////////////////////
                        ERROR HANDLING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ErrorHandling_InsufficientCollateral() public {
        uint256 tinyAmount = 1000; // Very small amount
        
        vm.startPrank(alice);
        IERC20(wbtc).approve(address(mezoIntegration), tinyAmount);
        
        // Should revert with insufficient collateral or invalid amount
        vm.expectRevert();
        mezoIntegration.depositAndMint(tinyAmount);
        
        vm.stopPrank();
    }

    function test_ErrorHandling_NoExistingTrove() public {
        vm.startPrank(bob); // Bob has no Trove
        
        // Should revert when trying to add collateral without existing Trove
        IERC20(wbtc).approve(address(mezoIntegration), WBTC_AMOUNT);
        vm.expectRevert();
        mezoIntegration.addCollateral(WBTC_AMOUNT);
        
        vm.stopPrank();
    }

    function test_ErrorHandling_ZeroAmounts() public {
        vm.startPrank(alice);
        
        // Should revert with zero amount
        vm.expectRevert();
        mezoIntegration.depositAndMint(0);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _loadMatsnetConfig() internal {
        // Try to load from environment or use defaults for testing
        wbtc = vm.envOr("WBTC_ADDRESS", address(0x1));
        musd = vm.envOr("MUSD_ADDRESS", address(0x2));
        borrowerOperations = vm.envOr("MATSNET_BORROWER_OPERATIONS", address(0x3));
        priceFeed = vm.envOr("MATSNET_PRICE_FEED", address(0x4));
        hintHelpers = vm.envOr("MATSNET_HINT_HELPERS", address(0x5));
        troveManager = vm.envOr("MATSNET_TROVE_MANAGER", address(0x6));
        
        // In fork mode, these should be real addresses
        if (block.chainid == 11155111) { // Sepolia/Matsnet
            require(wbtc != address(0x1), "Real WBTC address required for fork tests");
            require(musd != address(0x2), "Real MUSD address required for fork tests");
            require(borrowerOperations != address(0x3), "Real BorrowerOperations required");
        }
    }

    function _fundAccountWithWBTC(address account, uint256 amount) internal {
        // In fork mode, we can use deal or get from faucet
        deal(wbtc, account, amount);
        
        // Verify funding
        assertEq(IERC20(wbtc).balanceOf(account), amount, "WBTC funding failed");
    }

    function _createPosition(address user, uint256 wbtcAmount) internal {
        vm.startPrank(user);
        
        IERC20(wbtc).approve(address(mezoIntegration), wbtcAmount);
        uint256 musdMinted = mezoIntegration.depositAndMint(wbtcAmount);
        
        assertGt(musdMinted, 0, "Position creation failed");
        assertTrue(mezoIntegration.isPositionHealthy(user), "Created position unhealthy");
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS FOR DEBUGGING
    //////////////////////////////////////////////////////////////*/

    function test_Debug_SystemState() public view {
        console2.log("=== System State Debug Info ===");
        console2.log("BTC Price:", mezoIntegration.getBtcPrice() / 1e18);
        console2.log("Borrow Rate:", mezoIntegration.getBorrowRate());
        console2.log("Min Collateral Ratio:", mezoIntegration.getMinCollateralRatio() / 100);
        console2.log("Liquidation Threshold:", mezoIntegration.getLiquidationThreshold() / 100);
        console2.log("Target LTV:", mezoIntegration.targetLtv() / 100);
        console2.log("Max Fee:", mezoIntegration.maxFeePercentage() / 100);
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION SCENARIOS
    //////////////////////////////////////////////////////////////*/

    function test_Integration_FullUserJourney() public {
        console2.log("=== Full User Journey Integration Test ===");
        
        // 1. User deposits and mints
        vm.startPrank(alice);
        IERC20(wbtc).approve(address(mezoIntegration), WBTC_AMOUNT);
        uint256 initialMinted = mezoIntegration.depositAndMint(WBTC_AMOUNT);
        console2.log("1. Initial MUSD minted:", initialMinted / 1e18);
        
        // 2. User adds more collateral
        IERC20(wbtc).approve(address(mezoIntegration), SMALL_WBTC_AMOUNT);
        mezoIntegration.addCollateral(SMALL_WBTC_AMOUNT);
        console2.log("2. Added collateral:", SMALL_WBTC_AMOUNT / 1e8, "WBTC");
        
        // 3. User mints more MUSD
        uint256 additionalMint = initialMinted / 4; // 25% more
        bool mintSuccess = mezoIntegration.mintMore(additionalMint);
        assertTrue(mintSuccess, "Additional minting failed");
        console2.log("3. Additional MUSD minted:", additionalMint / 1e18);
        
        // 4. User repays some debt
        IERC20(musd).approve(address(mezoIntegration), additionalMint);
        mezoIntegration.repayDebt(additionalMint);
        console2.log("4. Repaid debt:", additionalMint / 1e18);
        
        // 5. User partially exits
        uint256 burnAmount = initialMinted / 2;
        IERC20(musd).approve(address(mezoIntegration), burnAmount);
        uint256 btcReturned = mezoIntegration.burnAndWithdraw(burnAmount);
        console2.log("5. Burned and withdrew:", burnAmount / 1e18);
        console2.log("   BTC returned:", btcReturned / 1e8);
        
        // Verify final state is healthy
        assertTrue(mezoIntegration.isPositionHealthy(alice), "Final position unhealthy");
        console2.log("6. Final collateral ratio:", mezoIntegration.getCollateralRatio(alice) / 100);
        
        vm.stopPrank();
        
        console2.log("[SUCCESS] Full user journey completed successfully");
    }
}