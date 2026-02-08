// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/v3/RotatingPool.sol";

contract TestPayout is Script {
    RotatingPool constant pool = RotatingPool(payable(0x0Bac59e87Af0D2e95711846BaDb124164382aafC));

    address constant MEMBER_0 = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    function run() external {
        uint256 pk0 = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("========================================");
        console.log("TESTING NATIVE BTC PAYOUT");
        console.log("========================================");
        console.log("");

        // Check balance before
        uint256 balanceBefore = MEMBER_0.balance;
        console.log("Member 0 balance before:", balanceBefore);

        // Claim payout
        console.log("Claiming payout...");
        vm.startBroadcast(pk0);
        pool.claimPayout(1);
        vm.stopBroadcast();

        // Check balance after
        uint256 balanceAfter = MEMBER_0.balance;
        console.log("Member 0 balance after:", balanceAfter);
        console.log("Amount received:", balanceAfter - balanceBefore);

        console.log("");
        console.log("SUCCESS! Native BTC payout complete!");
    }
}
