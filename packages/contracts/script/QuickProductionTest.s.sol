// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";

/**
 * @title QuickProductionTest
 * @notice Quick production test - Setup phase only (no time-dependent operations)
 * @dev Executes: funding, pool creation, joining, starting, and first contributions
 */
contract QuickProductionTest is Script {
    RotatingPool constant pool = RotatingPool(payable(0x0Bac59e87Af0D2e95711846BaDb124164382aafC));

    address constant MEMBER_0 = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;
    address constant MEMBER_1 = 0xD7149fBc18d6cB2041B08b74CA2eAA07013e6A00;
    address constant MEMBER_2 = 0xB8D4b66f670151BD8C3F97C049e7DC3466Cc3c8f;

    uint256 constant CONTRIBUTION = 0.001 ether;
    uint256 constant PERIOD_DURATION = 7 days; // Minimum period duration

    function run() external {
        console.log("========================================");
        console.log("QUICK PRODUCTION TEST - ROTATING POOL");
        console.log("========================================");
        console.log("");

        uint256 pk0 = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 pk1 = vm.envUint("MEMBER_1_PRIVATE_KEY");
        uint256 pk2 = vm.envUint("MEMBER_2_PRIVATE_KEY");

        // Check balances
        console.log("Initial Balances:");
        console.log("  Member 0:", MEMBER_0.balance);
        console.log("  Member 1:", MEMBER_1.balance);
        console.log("  Member 2:", MEMBER_2.balance);
        console.log("");

        // Fund if needed
        if (MEMBER_1.balance < 0.01 ether || MEMBER_2.balance < 0.01 ether) {
            console.log("FUNDING TEST WALLETS...");
            vm.startBroadcast(pk0);
            if (MEMBER_1.balance < 0.01 ether) {
                (bool s1,) = MEMBER_1.call{value: 0.01 ether}("");
                require(s1);
                console.log("  Funded Member 1: 0.01 BTC");
            }
            if (MEMBER_2.balance < 0.01 ether) {
                (bool s2,) = MEMBER_2.call{value: 0.01 ether}("");
                require(s2);
                console.log("  Funded Member 2: 0.01 BTC");
            }
            vm.stopBroadcast();
            console.log("");
        }

        // Create pool
        console.log("CREATING POOL...");
        vm.startBroadcast(pk0);
        address[] memory members = new address[](0);
        uint256 poolId = pool.createPool(
            "Quick Production Test",
            3,
            CONTRIBUTION,
            PERIOD_DURATION,
            true, // useNativeBtc - better UX, no approval needed
            members
        );
        vm.stopBroadcast();
        console.log("  Pool ID:", poolId);
        console.log("  SUCCESS");
        console.log("");

        // All members join
        console.log("MEMBERS JOINING...");
        vm.startBroadcast(pk0);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("  Member 0 joined");

        vm.startBroadcast(pk1);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("  Member 1 joined");

        vm.startBroadcast(pk2);
        pool.joinPool(poolId);
        vm.stopBroadcast();
        console.log("  Member 2 joined");
        console.log("  SUCCESS - Pool full (3/3)");
        console.log("");

        // Start pool
        console.log("STARTING POOL...");
        vm.startBroadcast(pk0);
        pool.startPool(poolId);
        vm.stopBroadcast();
        RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(poolId);
        console.log("  Status:", poolInfo.status == RotatingPool.PoolStatus.ACTIVE ? "ACTIVE" : "ERROR");
        console.log("  Start Time:", poolInfo.startTime);
        console.log("  SUCCESS");
        console.log("");

        // All members contribute to Period 0
        console.log("PERIOD 0 CONTRIBUTIONS...");
        vm.startBroadcast(pk0);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("  Member 0 contributed");

        vm.startBroadcast(pk1);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("  Member 1 contributed");

        vm.startBroadcast(pk2);
        pool.makeContributionNative{value: CONTRIBUTION}(poolId);
        vm.stopBroadcast();
        console.log("  Member 2 contributed");

        poolInfo = pool.getPoolInfo(poolId);
        console.log("  Total Collected:", poolInfo.totalBtcCollected);
        console.log("  SUCCESS - Period 0 complete");
        console.log("");

        // Display next steps
        console.log("========================================");
        console.log("SETUP COMPLETE - POOL IS RUNNING!");
        console.log("========================================");
        console.log("");
        console.log("Pool ID:", poolId);
        console.log("Status: ACTIVE");
        console.log("Current Period: 0");
        console.log("Period Duration (seconds):", PERIOD_DURATION);
        console.log("Period Duration (minutes):", PERIOD_DURATION / 60);
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Member 0 can claim payout NOW:");
        console.log("   cast send", address(pool));
        console.log("   'claimPayout(uint256)'", poolId);
        console.log("   --rpc-url https://rpc.test.mezo.org");
        console.log("   --private-key $DEPLOYER_PRIVATE_KEY");
        console.log("");
        console.log("2. Wait", PERIOD_DURATION / 60, "minutes, then advance period:");
        console.log("   cast send", address(pool));
        console.log("   'advancePeriod(uint256)'", poolId);
        console.log("   --rpc-url https://rpc.test.mezo.org");
        console.log("   --private-key $MEMBER_1_PRIVATE_KEY");
        console.log("");
        console.log("3. Repeat contributions for Period 1");
        console.log("4. Member 1 claims payout");
        console.log("5. Continue cycle until completion");
        console.log("");

        // Final verification
        console.log("FINAL VERIFICATION:");
        console.log("----------------------------------------");
        RotatingPool.MemberInfo memory m0 = pool.getMemberInfo(poolId, MEMBER_0);
        RotatingPool.MemberInfo memory m1 = pool.getMemberInfo(poolId, MEMBER_1);
        RotatingPool.MemberInfo memory m2 = pool.getMemberInfo(poolId, MEMBER_2);

        console.log("Member 0 - Contributions:", m0.contributionsMade, "/ 3");
        console.log("Member 1 - Contributions:", m1.contributionsMade, "/ 3");
        console.log("Member 2 - Contributions:", m2.contributionsMade, "/ 3");
        console.log("");
        console.log("Period 0 Info:");
        RotatingPool.PeriodInfo memory p0 = pool.getPeriodInfo(poolId, 0);
        console.log("  Completed:", p0.completed);
        console.log("  Recipient:", p0.recipient);
        console.log("  Payout Amount:", p0.payoutAmount);
        console.log("");
        console.log("Test wallet balances remaining:");
        console.log("  Member 1:", MEMBER_1.balance);
        console.log("  Member 2:", MEMBER_2.balance);
    }
}
