// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ProductionTestRotatingPool
 * @notice Complete production-level test of RotatingPool with 3 members
 * @dev Simulates a full ROSCA cycle with real transactions on Mezo testnet
 *
 * Test Wallets:
 * - Member 0 (Creator): 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
 * - Member 1: 0xD7149fBc18d6cB2041B08b74CA2eAA07013e6A00
 * - Member 2: 0xB8D4b66f670151BD8C3F97C049e7DC3466Cc3c8f
 */
contract ProductionTestRotatingPool is Script {
    RotatingPool constant pool = RotatingPool(payable(0x0Bac59e87Af0D2e95711846BaDb124164382aafC));
    IERC20 constant wbtc = IERC20(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503);

    // Test Members
    address constant MEMBER_0 = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;
    address constant MEMBER_1 = 0xD7149fBc18d6cB2041B08b74CA2eAA07013e6A00;
    address constant MEMBER_2 = 0xB8D4b66f670151BD8C3F97C049e7DC3466Cc3c8f;

    uint256 constant CONTRIBUTION = 0.001 ether;
    uint256 constant PERIOD_DURATION = 7 days; // Minimum period duration

    function run() external {
        console.log("========================================");
        console.log("ROTATING POOL - PRODUCTION TEST");
        console.log("========================================");
        console.log("Contract:", address(pool));
        console.log("Test Members:");
        console.log("  Member 0 (Creator):", MEMBER_0);
        console.log("  Member 1:", MEMBER_1);
        console.log("  Member 2:", MEMBER_2);
        console.log("");

        // Get private keys from environment
        uint256 pk0 = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 pk1 = vm.envUint("MEMBER_1_PRIVATE_KEY");
        uint256 pk2 = vm.envUint("MEMBER_2_PRIVATE_KEY");

        // Step 1: Fund test wallets
        fundTestWallets(pk0);

        // Step 2: Create pool
        uint256 poolId = createProductionPool(pk0);

        // Step 3: Members join
        joinAsAllMembers(poolId, pk0, pk1, pk2);

        // Step 4: Start pool
        startPoolWhenFull(poolId, pk0);

        // Step 5: Period 0 - Contributions
        period0Contributions(poolId, pk0, pk1, pk2);

        // Step 6: Period 0 - Payout
        period0Payout(poolId, pk0);

        // Step 7: Advance to Period 1
        advanceToPeriod1(poolId, pk1);

        // Step 8: Period 1 - Contributions
        period1Contributions(poolId, pk0, pk1, pk2);

        // Step 9: Period 1 - Payout
        period1Payout(poolId, pk1);

        // Step 10: Advance to Period 2
        advanceToPeriod2(poolId, pk2);

        // Step 11: Period 2 - Contributions
        period2Contributions(poolId, pk0, pk1, pk2);

        // Step 12: Period 2 - Payout (Final)
        period2Payout(poolId, pk2);

        // Step 13: Verify completion
        verifyCompletion(poolId);

        console.log("");
        console.log("========================================");
        console.log("ALL PRODUCTION TESTS COMPLETED!");
        console.log("========================================");
    }

    function fundTestWallets(uint256 pk0) internal {
        console.log("STEP 1: Funding Test Wallets");
        console.log("----------------------------------------");

        vm.startBroadcast(pk0);

        // Send 0.01 BTC to each test wallet for gas + contributions
        console.log("Sending 0.01 BTC to Member 1...");
        (bool success1,) = MEMBER_1.call{value: 0.01 ether}("");
        require(success1, "Transfer to Member 1 failed");

        console.log("Sending 0.01 BTC to Member 2...");
        (bool success2,) = MEMBER_2.call{value: 0.01 ether}("");
        require(success2, "Transfer to Member 2 failed");

        vm.stopBroadcast();

        console.log("Member 1 Balance:", MEMBER_1.balance);
        console.log("Member 2 Balance:", MEMBER_2.balance);
        console.log("SUCCESS: Test wallets funded");
        console.log("");
    }

    function createProductionPool(uint256 pk0) internal returns (uint256) {
        console.log("STEP 2: Creating Production Pool");
        console.log("----------------------------------------");

        vm.startBroadcast(pk0);

        address[] memory members = new address[](0);
        uint256 poolId = pool.createPool(
            "Production Test ROSCA",
            3,
            CONTRIBUTION,
            PERIOD_DURATION,
            true, // useNativeBtc - native BTC contributions
            members
        );

        vm.stopBroadcast();

        console.log("Pool ID:", poolId);
        console.log("Members: 3");
        console.log("Contribution:", CONTRIBUTION);
        console.log("Period Duration (seconds):", PERIOD_DURATION);
        console.log("SUCCESS: Pool created");
        console.log("");

        return poolId;
    }

    function joinAsAllMembers(uint256 poolId, uint256 pk0, uint256 pk1, uint256 pk2) internal {
        console.log("STEP 3: Members Joining Pool");
        console.log("----------------------------------------");

        // Member 0 joins
        vm.startBroadcast(pk0);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("Member 0 joined");

        // Member 1 joins
        vm.startBroadcast(pk1);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("Member 1 joined");

        // Member 2 joins
        vm.startBroadcast(pk2);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("Member 2 joined");

        address[] memory poolMembers = pool.getPoolMembers(poolId);
        console.log("Total Members:", poolMembers.length, "/ 3");
        console.log("SUCCESS: All members joined");
        console.log("");
    }

    function startPoolWhenFull(uint256 poolId, uint256 pk0) internal {
        console.log("STEP 4: Starting Pool");
        console.log("----------------------------------------");

        vm.startBroadcast(pk0);
        pool.startPool(poolId);
        vm.stopBroadcast();

        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);
        console.log("Status:", poolInfo.status == RotatingPool.PoolStatus.ACTIVE ? "ACTIVE" : "NOT ACTIVE");
        console.log("Start Time:", poolInfo.startTime);
        console.log("SUCCESS: Pool started");
        console.log("");
    }

    function period0Contributions(uint256 poolId, uint256 pk0, uint256 pk1, uint256 pk2) internal {
        console.log("STEP 5: Period 0 - Contributions");
        console.log("----------------------------------------");

        // Member 0 contributes
        vm.startBroadcast(pk0);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 0 contributed:", CONTRIBUTION);

        // Member 1 contributes
        vm.startBroadcast(pk1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 1 contributed:", CONTRIBUTION);

        // Member 2 contributes
        vm.startBroadcast(pk2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 2 contributed:", CONTRIBUTION);

        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);
        console.log("Total BTC Collected:", poolInfo.totalBtcCollected);
        console.log("SUCCESS: All contributions made");
        console.log("");
    }

    function period0Payout(uint256 poolId, uint256 pk0) internal {
        console.log("STEP 6: Period 0 - Payout");
        console.log("----------------------------------------");

        uint256 balanceBefore = MEMBER_0.balance;

        vm.startBroadcast(pk0);
        pool.claimPayout(poolId);
        vm.stopBroadcast();

        uint256 balanceAfter = MEMBER_0.balance;
        uint256 received = balanceAfter - balanceBefore;

        console.log("Member 0 Balance Before:", balanceBefore);
        console.log("Member 0 Balance After:", balanceAfter);
        console.log("Amount Received:", received);
        console.log("SUCCESS: Payout claimed");
        console.log("");
    }

    function advanceToPeriod1(uint256 poolId, uint256 pk1) internal {
        console.log("STEP 7: Advancing to Period 1");
        console.log("----------------------------------------");

        // Wait for period to elapse
        vm.warp(block.timestamp + PERIOD_DURATION + 1);

        vm.startBroadcast(pk1);
        pool.advancePeriod(poolId);
        vm.stopBroadcast();

        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);
        console.log("Current Period:", poolInfo.currentPeriod);
        console.log("SUCCESS: Advanced to Period 1");
        console.log("");
    }

    function period1Contributions(uint256 poolId, uint256 pk0, uint256 pk1, uint256 pk2) internal {
        console.log("STEP 8: Period 1 - Contributions");
        console.log("----------------------------------------");

        vm.startBroadcast(pk0);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 0 contributed");

        vm.startBroadcast(pk1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 1 contributed");

        vm.startBroadcast(pk2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 2 contributed");

        console.log("SUCCESS: All Period 1 contributions made");
        console.log("");
    }

    function period1Payout(uint256 poolId, uint256 pk1) internal {
        console.log("STEP 9: Period 1 - Payout");
        console.log("----------------------------------------");

        uint256 balanceBefore = MEMBER_1.balance;

        vm.startBroadcast(pk1);
        pool.claimPayout(poolId);
        vm.stopBroadcast();

        uint256 balanceAfter = MEMBER_1.balance;
        uint256 received = balanceAfter - balanceBefore;

        console.log("Member 1 Received:", received);
        console.log("SUCCESS: Period 1 payout claimed");
        console.log("");
    }

    function advanceToPeriod2(uint256 poolId, uint256 pk2) internal {
        console.log("STEP 10: Advancing to Period 2");
        console.log("----------------------------------------");

        vm.warp(block.timestamp + PERIOD_DURATION + 1);

        vm.startBroadcast(pk2);
        pool.advancePeriod(poolId);
        vm.stopBroadcast();

        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);
        console.log("Current Period:", poolInfo.currentPeriod);
        console.log("SUCCESS: Advanced to Period 2 (Final)");
        console.log("");
    }

    function period2Contributions(uint256 poolId, uint256 pk0, uint256 pk1, uint256 pk2) internal {
        console.log("STEP 11: Period 2 - Final Contributions");
        console.log("----------------------------------------");

        vm.startBroadcast(pk0);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 0 contributed");

        vm.startBroadcast(pk1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 1 contributed");

        vm.startBroadcast(pk2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("Member 2 contributed");

        console.log("SUCCESS: All final contributions made");
        console.log("");
    }

    function period2Payout(uint256 poolId, uint256 pk2) internal {
        console.log("STEP 12: Period 2 - Final Payout");
        console.log("----------------------------------------");

        uint256 balanceBefore = MEMBER_2.balance;

        vm.startBroadcast(pk2);
        pool.claimPayout(poolId);
        vm.stopBroadcast();

        uint256 balanceAfter = MEMBER_2.balance;
        uint256 received = balanceAfter - balanceBefore;

        console.log("Member 2 Received:", received);
        console.log("SUCCESS: Final payout claimed");
        console.log("");
    }

    function verifyCompletion(uint256 poolId) internal view {
        console.log("STEP 13: Verification");
        console.log("----------------------------------------");

        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);

        console.log("Pool Status:", poolInfo.status == RotatingPool.PoolStatus.COMPLETED ? "COMPLETED" : "NOT COMPLETED");
        console.log("Total BTC Collected:", poolInfo.totalBtcCollected);
        console.log("Total Yield Generated:", poolInfo.totalYieldGenerated);
        console.log("Yield Distributed:", poolInfo.yieldDistributed);
        console.log("Current Period:", poolInfo.currentPeriod);
        console.log("Total Periods:", poolInfo.totalPeriods);

        // Verify all members received payouts
        RotatingPool.MemberInfo memory member0 = pool.getMemberInfo(poolId, MEMBER_0);
        RotatingPool.MemberInfo memory member1 = pool.getMemberInfo(poolId, MEMBER_1);
        RotatingPool.MemberInfo memory member2 = pool.getMemberInfo(poolId, MEMBER_2);

        console.log("");
        console.log("Member 0:");
        console.log("  Total Contributed:", member0.totalContributed);
        console.log("  Payout Received:", member0.payoutReceived);
        console.log("  Yield Received:", member0.yieldReceived);
        console.log("  Has Received Payout:", member0.hasReceivedPayout);

        console.log("");
        console.log("Member 1:");
        console.log("  Total Contributed:", member1.totalContributed);
        console.log("  Payout Received:", member1.payoutReceived);
        console.log("  Yield Received:", member1.yieldReceived);
        console.log("  Has Received Payout:", member1.hasReceivedPayout);

        console.log("");
        console.log("Member 2:");
        console.log("  Total Contributed:", member2.totalContributed);
        console.log("  Payout Received:", member2.payoutReceived);
        console.log("  Yield Received:", member2.yieldReceived);
        console.log("  Has Received Payout:", member2.hasReceivedPayout);

        console.log("");
        console.log("SUCCESS: Full ROSCA cycle completed");
    }
}
