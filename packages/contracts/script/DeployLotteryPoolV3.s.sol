// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {UUPSProxy} from "../src/proxy/UUPSProxy.sol";
import {LotteryPoolV3} from "../src/pools/v3/LotteryPoolV3.sol";

/**
 * @title DeployLotteryPoolV3
 * @notice Deploys LotteryPoolV3 with UUPS proxy pattern
 * @dev Run: forge script script/DeployLotteryPoolV3.s.sol:DeployLotteryPoolV3 \
 *          --rpc-url https://rpc.test.mezo.org --broadcast --legacy
 */
contract DeployLotteryPoolV3 is Script {
    // Mezo Testnet addresses (already deployed V3 contracts)
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant YIELD_AGGREGATOR_V3 = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying LotteryPoolV3 to Mezo Testnet ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy LotteryPoolV3 Implementation
        console.log("Deploying LotteryPoolV3 implementation...");
        LotteryPoolV3 lotteryImpl = new LotteryPoolV3();
        console.log("Implementation deployed at:", address(lotteryImpl));

        // 2. Prepare initialization data
        // operator = deployer (can be changed later)
        bytes memory initData = abi.encodeWithSelector(
            LotteryPoolV3.initialize.selector,
            MUSD_TOKEN,
            YIELD_AGGREGATOR_V3,
            FEE_COLLECTOR,
            deployer // operator
        );

        // 3. Deploy UUPS Proxy
        console.log("Deploying LotteryPoolV3 proxy...");
        UUPSProxy lotteryProxy = new UUPSProxy(
            address(lotteryImpl),
            initData
        );
        console.log("Proxy deployed at:", address(lotteryProxy));

        // 4. Create initial lottery round
        console.log("");
        console.log("Creating initial weekly lottery round...");

        LotteryPoolV3 lottery = LotteryPoolV3(address(lotteryProxy));

        uint256 ticketPrice = 10 ether; // 10 MUSD per ticket
        uint256 maxTickets = 1000;
        uint256 duration = 7 days;

        uint256 roundId = lottery.createRound(ticketPrice, maxTickets, duration);
        console.log("Initial round created with ID:", roundId);
        console.log("Ticket Price: 10 MUSD");
        console.log("Max Tickets: 1000");
        console.log("Duration: 7 days");

        vm.stopBroadcast();

        // Deployment summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("LotteryPoolV3 Proxy:         ", address(lotteryProxy));
        console.log("LotteryPoolV3 Implementation:", address(lotteryImpl));
        console.log("");
        console.log("=== CONFIGURATION REQUIRED ===");
        console.log("Update packages/web3/src/addresses/testnet.ts:");
        console.log("  LOTTERY_POOL: \"", address(lotteryProxy), "\"");
        console.log("");
        console.log("=== VERIFICATION ===");

        // Verify initialization
        console.log("Owner:", lottery.owner());
        console.log("Operator:", lottery.operator());
        console.log("MUSD:", address(lottery.MUSD()));
        console.log("Fee Collector:", lottery.feeCollector());
        console.log("Current Round ID:", lottery.currentRoundId());

        console.log("");
        console.log("[SUCCESS] LotteryPoolV3 deployed and initialized!");
    }
}

/**
 * @title CreateLotteryRound
 * @notice Helper script to create new lottery rounds
 */
contract CreateLotteryRound is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address lotteryPoolAddress = vm.envAddress("LOTTERY_POOL_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        LotteryPoolV3 lottery = LotteryPoolV3(lotteryPoolAddress);

        // Weekly lottery: 10 MUSD, 1000 max tickets, 7 days
        uint256 roundId = lottery.createRound(10 ether, 1000, 7 days);

        console.log("New round created with ID:", roundId);

        vm.stopBroadcast();
    }
}
