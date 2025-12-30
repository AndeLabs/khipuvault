// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIndividualPoolV3 {
    function deposit(uint256 amount, address referrer) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function getUserInfo(address user) external view returns (
        uint256 balance,
        uint256 pendingYield,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 daysActive,
        address referrer,
        bool isActive,
        uint256 depositTimestamp
    );
    function getPoolStats() external view returns (
        uint256 totalDeposits,
        uint256 totalUsers,
        uint256 currentApr,
        uint256 totalYieldDistributed
    );
}

interface ILotteryPool {
    function buyTickets(uint256 ticketCount) external returns (uint256[] memory);
    function getCurrentRound() external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPrize,
        uint256 ticketsSold,
        bool isActive,
        bool isDrawn
    );
    function getUserTickets(address user, uint256 roundId) external view returns (uint256[] memory);
}

/**
 * @title TestInteractions
 * @notice Script to test KhipuVault contract interactions on Mezo Testnet
 * @dev Run with: forge script script/TestInteractions.s.sol --rpc-url https://rpc.test.mezo.org --broadcast -vvvv
 */
contract TestInteractions is Script {
    // Mezo Testnet Addresses
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant INDIVIDUAL_POOL = 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393;
    address constant LOTTERY_POOL = 0x0000000000000000000000000000000000000000; // Update with actual address

    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey == 0) {
            console2.log("=== READ-ONLY MODE (no PRIVATE_KEY set) ===");
            _readOnlyTests();
        } else {
            console2.log("=== INTERACTIVE MODE ===");
            vm.startBroadcast(deployerPrivateKey);
            _interactiveTests();
            vm.stopBroadcast();
        }
    }

    function _readOnlyTests() internal view {
        console2.log("\n--- Pool Stats ---");

        IIndividualPoolV3 pool = IIndividualPoolV3(INDIVIDUAL_POOL);

        (
            uint256 totalDeposits,
            uint256 totalUsers,
            uint256 currentApr,
            uint256 totalYieldDistributed
        ) = pool.getPoolStats();

        console2.log("Total Deposits:", totalDeposits / 1e18, "MUSD");
        console2.log("Total Users:", totalUsers);
        console2.log("Current APR:", currentApr, "basis points");
        console2.log("Total Yield Distributed:", totalYieldDistributed / 1e18, "MUSD");

        // Check test wallet
        address testWallet = 0xB4d5B9a6e744A3c5fdBE2726f469e878e319a8D8;
        console2.log("\n--- Test Wallet Info ---");
        console2.log("Address:", testWallet);

        uint256 musdBalance = IERC20(MUSD).balanceOf(testWallet);
        console2.log("MUSD Balance:", musdBalance / 1e18, "MUSD");

        (
            uint256 balance,
            uint256 pendingYield,
            uint256 totalDeposited,
            uint256 totalWithdrawn,
            uint256 daysActive,
            address referrer,
            bool isActive,
            uint256 depositTimestamp
        ) = pool.getUserInfo(testWallet);

        console2.log("Pool Balance:", balance / 1e18, "MUSD");
        console2.log("Pending Yield:", pendingYield / 1e18, "MUSD");
        console2.log("Total Deposited:", totalDeposited / 1e18, "MUSD");
        console2.log("Is Active:", isActive);
    }

    function _interactiveTests() internal {
        address sender = msg.sender;
        console2.log("Sender:", sender);

        uint256 musdBalance = IERC20(MUSD).balanceOf(sender);
        console2.log("MUSD Balance:", musdBalance / 1e18, "MUSD");

        if (musdBalance < 1e18) {
            console2.log("ERROR: Insufficient MUSD balance. Need at least 1 MUSD.");
            return;
        }

        IIndividualPoolV3 pool = IIndividualPoolV3(INDIVIDUAL_POOL);

        // Check current allowance
        uint256 allowance = IERC20(MUSD).allowance(sender, INDIVIDUAL_POOL);
        console2.log("Current Allowance:", allowance / 1e18, "MUSD");

        // Approve if needed
        if (allowance < 1e18) {
            console2.log("\n--- Approving MUSD ---");
            IERC20(MUSD).approve(INDIVIDUAL_POOL, type(uint256).max);
            console2.log("Approved max MUSD");
        }

        // Deposit 1 MUSD
        console2.log("\n--- Depositing 1 MUSD ---");
        uint256 depositAmount = 1e18; // 1 MUSD
        uint256 shares = pool.deposit(depositAmount, address(0));
        console2.log("Deposit successful! Shares received:", shares / 1e18);

        // Check updated balance
        (
            uint256 balance,
            uint256 pendingYield,
            ,
            ,
            ,
            ,
            bool isActive,
        ) = pool.getUserInfo(sender);

        console2.log("\n--- Updated Position ---");
        console2.log("Pool Balance:", balance / 1e18, "MUSD");
        console2.log("Pending Yield:", pendingYield / 1e18, "MUSD");
        console2.log("Is Active:", isActive);

        console2.log("\n=== TEST COMPLETE ===");
    }
}
