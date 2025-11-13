// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {RotatingPool} from "../src/pools/RotatingPool.sol";

/**
 * @title DeployRotatingPool
 * @notice Deploy RotatingPool (ROSCA) to Mezo Testnet
 * @dev Uses native BTC (not WBTC) - BTC is native on Mezo like ETH on Ethereum
 *
 * Run:
 * source contracts/.env.deployment
 * forge script script/DeployRotatingPool.s.sol:DeployRotatingPool \
 *   --rpc-url https://testnet.mezo.org \
 *   --broadcast \
 *   --legacy
 */
contract DeployRotatingPool is Script {
    // Deployed contracts on Mezo Testnet
    address constant MEZO_INTEGRATION = 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6;
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant FEE_COLLECTOR = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploying RotatingPool to Mezo Testnet");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Balance (wei):", deployer.balance);
        console.log("");
        console.log("Using Contracts:");
        console.log("  MEZO_INTEGRATION:", MEZO_INTEGRATION);
        console.log("  YIELD_AGGREGATOR:", YIELD_AGGREGATOR);
        console.log("  MUSD Token:", MUSD);
        console.log("  FEE_COLLECTOR:", FEE_COLLECTOR);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RotatingPool
        RotatingPool rotatingPool = new RotatingPool(
            MEZO_INTEGRATION,
            YIELD_AGGREGATOR,
            MUSD,
            FEE_COLLECTOR
        );

        console.log("RotatingPool deployed at:", address(rotatingPool));
        console.log("");

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("===========================================");
        console.log("RotatingPool:", address(rotatingPool));
        console.log("");
        console.log("FRONTEND CONFIGURATION:");
        console.log("NEXT_PUBLIC_ROTATING_POOL_ADDRESS=", address(rotatingPool));
        console.log("");
        console.log("Update these files:");
        console.log("1. frontend/src/lib/web3/contracts.ts");
        console.log("   rotatingPool: '", address(rotatingPool), "'");
        console.log("");
        console.log("2. frontend/src/contracts/addresses.ts");
        console.log("   ROTATING_POOL: getEnvAddress(ENV_KEYS.ROTATING_POOL, '", address(rotatingPool), "')");
        console.log("===========================================");
    }
}
