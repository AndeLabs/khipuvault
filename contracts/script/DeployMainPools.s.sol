// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {IndividualPool} from "../src/pools/IndividualPool.sol";
import {CooperativePool} from "../src/pools/CooperativePool.sol";

contract DeployMainPools is Script {
    address public individualPool;
    address public cooperativePool;
    address public mezoIntegration;
    address public yieldAggregator;
    address public musd;
    address public feeCollector;

    function run() external {
        _loadConfig();
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        require(mezoIntegration != address(0), "MezoIntegration not set");
        require(yieldAggregator != address(0), "YieldAggregator not set");
        require(musd != address(0), "MUSD not set");

        console2.log("Deploying IndividualPool and CooperativePool...");
        console2.log("MezoIntegration:", mezoIntegration);
        console2.log("YieldAggregator:", yieldAggregator);

        vm.startBroadcast(deployerPrivateKey);

        IndividualPool individual = new IndividualPool(
            yieldAggregator, musd, feeCollector
        );
        individualPool = address(individual);
        console2.log("IndividualPool:", individualPool);

        CooperativePool cooperative = new CooperativePool(
            mezoIntegration, yieldAggregator, musd, feeCollector
        );
        cooperativePool = address(cooperative);
        console2.log("CooperativePool:", cooperativePool);

        vm.stopBroadcast();
        _saveDeployment();
    }

    function _loadConfig() internal {
        mezoIntegration = vm.envAddress("MEZO_INTEGRATION_ADDRESS");
        yieldAggregator = vm.envAddress("YIELD_AGGREGATOR_ADDRESS");
        musd = vm.envAddress("MUSD_ADDRESS");
        feeCollector = vm.envOr("FEE_COLLECTOR_ADDRESS", vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY")));
    }

    function _saveDeployment() internal {
        string memory json = "deployment";
        vm.serializeAddress(json, "individualPool", individualPool);
        vm.serializeAddress(json, "cooperativePool", cooperativePool);
        vm.serializeAddress(json, "mezoIntegration", mezoIntegration);
        vm.serializeAddress(json, "yieldAggregator", yieldAggregator);
        string memory finalJson = vm.serializeAddress(json, "musd", musd);
        vm.writeJson(finalJson, string.concat("./deployments/pools-", vm.toString(block.chainid), ".json"));
    }
}
