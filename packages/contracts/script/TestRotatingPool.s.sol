// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TestRotatingPool
 * @notice Interactive script to test all RotatingPool functionality on Mezo testnet
 * @dev Run: forge script script/TestRotatingPool.s.sol --rpc-url https://rpc.test.mezo.org --broadcast -vvvv
 */
contract TestRotatingPool is Script {
    // Deployed contract address
    address constant ROTATING_POOL = 0x0Bac59e87Af0D2e95711846BaDb124164382aafC;
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    RotatingPool pool;
    IERC20 musd;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        pool = RotatingPool(payable(ROTATING_POOL));
        musd = IERC20(MUSD_TOKEN);

        console.log("=== ROTATING POOL COMPREHENSIVE TEST ===");
        console.log("Contract:", address(pool));
        console.log("Tester:", deployer);
        console.log("MUSD Balance:", musd.balanceOf(deployer));
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Test 1: Check Initial State
        console.log("TEST 1: Checking Initial State...");
        uint256 poolCounter = pool.poolCounter();
        console.log("Pool Counter:", poolCounter);
        console.log("Owner:", pool.owner());
        console.log("Performance Fee:", pool.performanceFee(), "basis points");
        console.log("");

        // Test 2: Create a Pool
        console.log("TEST 2: Creating ROSCA Pool...");
        string memory poolName = "Test ROSCA - Full Cycle";
        uint256 memberCount = 3;
        uint256 contributionAmount = 0.001 ether; // 0.001 BTC
        uint256 periodDuration = 7 days;
        address[] memory memberAddresses = new address[](0);

        console.log("Parameters:");
        console.log("  Name:", poolName);
        console.log("  Members:", memberCount);
        console.log("  Contribution:", contributionAmount);
        console.log("  Period:", periodDuration, "seconds");

        try pool.createPool(
            poolName,
            memberCount,
            contributionAmount,
            periodDuration,
            true, // useNativeBtc
            memberAddresses
        ) {
            console.log("  SUCCESS: Pool created!");
            uint256 newPoolId = pool.poolCounter();
            console.log("  New Pool ID:", newPoolId);

            // Get pool info
            RotatingPool.PoolInfo memory poolInfo = pool.getPoolInfo(newPoolId);

            console.log("");
            console.log("Pool Details:");
            console.log("  Pool ID:", poolInfo.poolId);
            console.log("  Name:", poolInfo.name);
            console.log("  Creator:", poolInfo.creator);
            console.log("  Member Count:", poolInfo.memberCount);
            console.log("  Contribution:", poolInfo.contributionAmount);
            console.log("  Period Duration:", poolInfo.periodDuration);
            console.log("  Current Period:", poolInfo.currentPeriod);
            console.log("  Total Periods:", poolInfo.totalPeriods);
            console.log("  Total BTC Collected:", poolInfo.totalBtcCollected);
            console.log("  Auto Advance:", poolInfo.autoAdvance);
            console.log("");

            // Test 3: Check Pool Member (Creator)
            console.log("TEST 3: Checking Pool Member...");
            RotatingPool.MemberInfo memory memberInfo = pool.getMemberInfo(newPoolId, deployer);

            console.log("Member Info:");
            console.log("  Address:", memberInfo.memberAddress);
            console.log("  Index:", memberInfo.memberIndex);
            console.log("  Contributions Made:", memberInfo.contributionsMade);
            console.log("  Total Contributed:", memberInfo.totalContributed);
            console.log("  Active:", memberInfo.active);
            console.log("");

            // Test 4: Try to Join Own Pool (Should Fail)
            console.log("TEST 4: Attempting to Join Own Pool (Should Fail)...");
            try pool.joinPool(newPoolId) {
                console.log("  UNEXPECTED: Joined own pool!");
            } catch Error(string memory reason) {
                console.log("  EXPECTED FAIL:", reason);
            } catch {
                console.log("  EXPECTED FAIL: Already a member");
            }
            console.log("");

            // Test 5: Check Pool Counter
            console.log("TEST 5: Verifying Pool Counter...");
            uint256 finalCounter = pool.poolCounter();
            console.log("  Final Pool Counter:", finalCounter);
            console.log("  Pools Created:", finalCounter);
            console.log("");

            // Test 6: Get All Pool Members
            console.log("TEST 6: Getting Pool Members...");
            address[] memory poolMembers = pool.getPoolMembers(newPoolId);
            console.log("  Total Members:", poolMembers.length);
            for (uint256 i = 0; i < poolMembers.length; i++) {
                console.log("  Member", i, ":", poolMembers[i]);
            }
            console.log("");

            // Test 7: Get Period Info
            console.log("TEST 7: Getting Period 0 Info...");
            RotatingPool.PeriodInfo memory periodInfo = pool.getPeriodInfo(newPoolId, 0);

            console.log("Period Info:");
            console.log("  Period Number:", periodInfo.periodNumber);
            console.log("  Start Time:", periodInfo.startTime);
            console.log("  End Time:", periodInfo.endTime);
            console.log("  Recipient:", periodInfo.recipient);
            console.log("  Payout Amount:", periodInfo.payoutAmount);
            console.log("  Yield Amount:", periodInfo.yieldAmount);
            console.log("  Completed:", periodInfo.completed);
            console.log("  Paid:", periodInfo.paid);
            console.log("");

        } catch Error(string memory reason) {
            console.log("  FAIL:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("  FAIL: Low-level error");
            console.logBytes(lowLevelData);
        }

        vm.stopBroadcast();

        console.log("=== TEST SUMMARY ===");
        console.log("Contract Address:", ROTATING_POOL);
        console.log("All basic tests completed!");
        console.log("");
        console.log("NEXT STEPS FOR FULL TESTING:");
        console.log("1. Use different wallets to join the pool (need 2 more members)");
        console.log("2. Once pool is full, call startPool()");
        console.log("3. Members make contributions each period");
        console.log("4. Test claiming payouts when period completes");
        console.log("5. Test advancing periods");
        console.log("6. Complete full ROSCA cycle");
        console.log("");
        console.log("To join pool from another wallet:");
        console.log("  cast send", ROTATING_POOL);
        console.log("    'joinPool(uint256)' 1");
        console.log("    --value 0.001ether");
        console.log("    --rpc-url https://rpc.test.mezo.org");
        console.log("    --private-key YOUR_OTHER_WALLET_KEY");
    }
}
