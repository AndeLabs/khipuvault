// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title FixAuthorizations
 * @notice Script to fix missing pool authorizations in YieldAggregator
 * @dev Use this script if pools were deployed but not authorized
 *
 * Problem: Pools need to be authorized in YieldAggregator to deposit/withdraw
 * Solution: Owner calls setAuthorizedCaller(pool, true) for each pool
 *
 * Usage:
 *   forge script script/FixAuthorizations.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 */

interface IYieldAggregator {
    function setAuthorizedCaller(address caller, bool authorized) external;
    function authorizedCallers(address) external view returns (bool);
    function owner() external view returns (address);
}

contract FixAuthorizations is Script {
    // Contract addresses - UPDATE THESE FOR YOUR DEPLOYMENT
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant INDIVIDUAL_POOL = 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393;
    address constant LOTTERY_POOL = 0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4;
    address constant ROTATING_POOL = 0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("");
        console.log("==============================================");
        console.log("     FIX YIELDAGGREGATOR AUTHORIZATIONS       ");
        console.log("==============================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("");

        IYieldAggregator aggregator = IYieldAggregator(YIELD_AGGREGATOR);

        // Verify we are the owner
        address owner = aggregator.owner();
        console.log("YieldAggregator Owner:", owner);
        require(owner == deployer, "Deployer is not the owner!");

        console.log("");
        console.log(">>> Checking current authorizations...");

        bool individualAuthed = aggregator.authorizedCallers(INDIVIDUAL_POOL);
        bool lotteryAuthed = aggregator.authorizedCallers(LOTTERY_POOL);
        bool rotatingAuthed = aggregator.authorizedCallers(ROTATING_POOL);

        console.log("    IndividualPool:", individualAuthed ? "AUTHORIZED" : "NOT AUTHORIZED");
        console.log("    LotteryPool:   ", lotteryAuthed ? "AUTHORIZED" : "NOT AUTHORIZED");
        console.log("    RotatingPool:  ", rotatingAuthed ? "AUTHORIZED" : "NOT AUTHORIZED");

        vm.startBroadcast(deployerPrivateKey);

        if (!individualAuthed) {
            console.log("");
            console.log(">>> Authorizing IndividualPool...");
            aggregator.setAuthorizedCaller(INDIVIDUAL_POOL, true);
            console.log("    [OK] IndividualPool authorized");
        }

        if (!lotteryAuthed) {
            console.log("");
            console.log(">>> Authorizing LotteryPool...");
            aggregator.setAuthorizedCaller(LOTTERY_POOL, true);
            console.log("    [OK] LotteryPool authorized");
        }

        if (!rotatingAuthed) {
            console.log("");
            console.log(">>> Authorizing RotatingPool...");
            aggregator.setAuthorizedCaller(ROTATING_POOL, true);
            console.log("    [OK] RotatingPool authorized");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("==============================================");
        console.log(">>> Verifying final state...");
        console.log("    IndividualPool:", aggregator.authorizedCallers(INDIVIDUAL_POOL) ? "AUTHORIZED" : "FAILED");
        console.log("    LotteryPool:   ", aggregator.authorizedCallers(LOTTERY_POOL) ? "AUTHORIZED" : "FAILED");
        console.log("    RotatingPool:  ", aggregator.authorizedCallers(ROTATING_POOL) ? "AUTHORIZED" : "FAILED");
        console.log("");
        console.log("[SUCCESS] All authorizations configured!");
        console.log("==============================================");
    }
}
