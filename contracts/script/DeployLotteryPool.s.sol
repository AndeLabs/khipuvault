// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "forge-std/Script.sol";
import "../src/pools/LotteryPool.sol";

/**
 * @title DeployLotteryPool
 * @notice Deploy LotteryPool contract to Mezo Testnet
 * 
 * Run:
 * forge script script/DeployLotteryPool.s.sol:DeployLotteryPool \
 *   --rpc-url https://rpc.test.mezo.org \
 *   --broadcast \
 *   --verify
 */
contract DeployLotteryPool is Script {
    // Deployed contracts from DEPLOYED_CONTRACTS.md
    address constant MEZO_INTEGRATION = 0x9AC6249d2f2E3cbAAF34E114EdF1Cb7519AF04C2;
    address constant YIELD_AGGREGATOR = 0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c;
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    
    // WBTC on Mezo Testnet (BTC is native, but using WBTC for compatibility)
    // NOTE: On Mezo, BTC is native with 18 decimals
    address constant WBTC = address(0); // Replace with actual WBTC if exists, or use native BTC wrapper
    
    // Chainlink VRF on Mezo Testnet
    // TODO: Get actual VRF Coordinator address for Mezo Testnet
    // For now, using placeholder - needs to be updated with real Mezo VRF
    address constant VRF_COORDINATOR = 0x0000000000000000000000000000000000000000; // PLACEHOLDER
    uint64 constant SUBSCRIPTION_ID = 0; // PLACEHOLDER - create VRF subscription
    bytes32 constant KEY_HASH = 0x0000000000000000000000000000000000000000000000000000000000000000; // PLACEHOLDER
    
    // Fee collector (treasury)
    address constant FEE_COLLECTOR = 0x0000000000000000000000000000000000000000; // TODO: Set treasury address

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying LotteryPool to Mezo Testnet ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy LotteryPool
        LotteryPool lotteryPool = new LotteryPool(
            MEZO_INTEGRATION,
            YIELD_AGGREGATOR,
            WBTC,
            MUSD,
            VRF_COORDINATOR,
            SUBSCRIPTION_ID,
            KEY_HASH,
            FEE_COLLECTOR
        );

        console.log("LotteryPool deployed at:", address(lotteryPool));
        console.log("");

        // Create initial lottery round
        console.log("Creating initial lottery round...");
        
        // Weekly lottery with reasonable parameters for testnet
        uint256 ticketPrice = 0.001 ether; // 0.001 BTC (~$60)
        uint256 maxParticipants = 100;
        uint256 durationInSeconds = 7 days;
        
        uint256 roundId = lotteryPool.createLottery(
            LotteryPool.LotteryType.WEEKLY,
            ticketPrice,
            maxParticipants,
            durationInSeconds
        );

        console.log("Initial lottery round created!");
        console.log("Round ID:", roundId);
        console.log("Ticket Price:", ticketPrice, "BTC");
        console.log("Max Participants:", maxParticipants);
        console.log("Duration:", durationInSeconds / 1 days, "days");
        console.log("");

        vm.stopBroadcast();

        console.log("=== Deployment Summary ===");
        console.log("LotteryPool:", address(lotteryPool));
        console.log("Initial Round ID:", roundId);
        console.log("");
        console.log("Next steps:");
        console.log("1. Update DEPLOYED_CONTRACTS.md with LotteryPool address");
        console.log("2. Update frontend use-lottery-pool.ts with contract address");
        console.log("3. Fund VRF subscription for random draws");
        console.log("4. Test buying tickets on testnet");
    }
}
