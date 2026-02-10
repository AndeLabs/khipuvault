// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PostDeployVerify
 * @notice Verification script to check all contract states after deployment
 * @dev Run after Deploy.s.sol to verify:
 *      1. All contracts are deployed and accessible
 *      2. Owners are correctly set (not 0x0)
 *      3. Pool authorizations in YieldAggregator
 *      4. MUSD token integration
 *      5. Contract versions
 *
 * Usage:
 *   forge script script/PostDeployVerify.s.sol --rpc-url $RPC_URL -vvvv
 */

interface IOwnable {
    function owner() external view returns (address);
}

interface IYieldAggregator {
    function authorizedCallers(address) external view returns (bool);
    function paused() external view returns (bool);
    function MUSD_TOKEN() external view returns (address);
}

interface IIndividualPool {
    function version() external view returns (string memory);
    // Note: Current deployment uses constants (MIN_DEPOSIT, MAX_DEPOSIT)
    // Future deployments will use state variables (minDeposit, maxDeposit)
    function MIN_DEPOSIT() external view returns (uint256);
    function MAX_DEPOSIT() external view returns (uint256);
    function paused() external view returns (bool);
}

interface ICooperativePool {
    function version() external view returns (string memory);
    function poolCounter() external view returns (uint256);
    function paused() external view returns (bool);
}

interface ILotteryPool {
    // Note: LotteryPoolV3 doesn't have version() function
    function currentRoundId() external view returns (uint256);
    function paused() external view returns (bool);
    function emergencyMode() external view returns (bool);
}

interface IRotatingPool {
    function poolCounter() external view returns (uint256);
    function paused() external view returns (bool);
}

interface IMezoIntegration {
    function version() external view returns (string memory);
    function paused() external view returns (bool);
}

contract PostDeployVerify is Script {
    // Contract addresses (update these after deployment)
    address constant YIELD_AGGREGATOR = 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6;
    address constant MEZO_INTEGRATION = 0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD;
    address constant INDIVIDUAL_POOL = 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393;
    address constant COOPERATIVE_POOL = 0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F;
    address constant LOTTERY_POOL = 0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4;
    address constant ROTATING_POOL = 0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04;
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    // Expected deployer/owner
    address constant EXPECTED_OWNER = 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257;

    // Counters
    uint256 public passedChecks;
    uint256 public failedChecks;
    uint256 public totalChecks;

    function run() external view {
        console.log("");
        console.log("==============================================");
        console.log("     POST-DEPLOYMENT VERIFICATION SCRIPT      ");
        console.log("==============================================");
        console.log("");
        console.log("Expected Owner:", EXPECTED_OWNER);
        console.log("Network:       ", block.chainid == 31611 ? "Mezo Testnet" : "Unknown");
        console.log("");

        // 1. Verify Owners
        _verifyOwners();

        // 2. Verify YieldAggregator Authorizations
        _verifyAuthorizations();

        // 3. Verify Contract States
        _verifyContractStates();

        // 4. Verify MUSD Integration
        _verifyMusdIntegration();

        // Print Summary
        _printSummary();
    }

    function _verifyOwners() internal view {
        console.log(">>> STEP 1: Verifying Contract Owners");
        console.log("");

        _checkOwner("YieldAggregator", YIELD_AGGREGATOR);
        _checkOwner("MezoIntegration", MEZO_INTEGRATION);
        _checkOwner("IndividualPool", INDIVIDUAL_POOL);
        _checkOwner("CooperativePool", COOPERATIVE_POOL);
        _checkOwner("LotteryPool", LOTTERY_POOL);
        _checkOwner("RotatingPool", ROTATING_POOL);

        console.log("");
    }

    function _verifyAuthorizations() internal view {
        console.log(">>> STEP 2: Verifying YieldAggregator Authorizations");
        console.log("");

        IYieldAggregator aggregator = IYieldAggregator(YIELD_AGGREGATOR);

        _checkAuth("IndividualPool", INDIVIDUAL_POOL, aggregator);
        _checkAuth("LotteryPool", LOTTERY_POOL, aggregator);
        _checkAuth("RotatingPool", ROTATING_POOL, aggregator);

        // Note: CooperativePool doesn't need YieldAggregator auth (uses MezoIntegration)
        console.log("    [INFO] CooperativePool uses MezoIntegration directly");

        console.log("");
    }

    function _verifyContractStates() internal view {
        console.log(">>> STEP 3: Verifying Contract States");
        console.log("");

        // IndividualPool
        IIndividualPool individual = IIndividualPool(INDIVIDUAL_POOL);
        console.log("    IndividualPool:");
        console.log("      Version:", individual.version());
        console.log("      Min Deposit:", individual.MIN_DEPOSIT() / 1e18, "MUSD");
        console.log("      Max Deposit:", individual.MAX_DEPOSIT() / 1e18, "MUSD");
        console.log("      Paused:", individual.paused() ? "YES" : "NO");

        // CooperativePool
        ICooperativePool cooperative = ICooperativePool(COOPERATIVE_POOL);
        console.log("    CooperativePool:");
        console.log("      Version:", cooperative.version());
        console.log("      Pool Count:", cooperative.poolCounter());
        console.log("      Paused:", cooperative.paused() ? "YES" : "NO");

        // LotteryPool
        ILotteryPool lottery = ILotteryPool(LOTTERY_POOL);
        console.log("    LotteryPool:");
        console.log("      Current Round:", lottery.currentRoundId());
        console.log("      Paused:", lottery.paused() ? "YES" : "NO");
        console.log("      Emergency:", lottery.emergencyMode() ? "YES" : "NO");

        // RotatingPool
        IRotatingPool rotating = IRotatingPool(ROTATING_POOL);
        console.log("    RotatingPool:");
        console.log("      Pool Count:", rotating.poolCounter());
        console.log("      Paused:", rotating.paused() ? "YES" : "NO");

        // MezoIntegration
        IMezoIntegration mezo = IMezoIntegration(MEZO_INTEGRATION);
        console.log("    MezoIntegration:");
        console.log("      Version:", mezo.version());
        console.log("      Paused:", mezo.paused() ? "YES" : "NO");

        console.log("");
    }

    function _verifyMusdIntegration() internal view {
        console.log(">>> STEP 4: Verifying MUSD Integration");
        console.log("");

        IYieldAggregator aggregator = IYieldAggregator(YIELD_AGGREGATOR);
        address configuredMusd = aggregator.MUSD_TOKEN();

        if (configuredMusd == MUSD) {
            console.log("    [PASS] YieldAggregator MUSD_TOKEN:", configuredMusd);
        } else {
            console.log("    [FAIL] YieldAggregator MUSD_TOKEN mismatch!");
            console.log("      Expected:", MUSD);
            console.log("      Got:     ", configuredMusd);
        }

        // Check MUSD token is accessible
        IERC20 musd = IERC20(MUSD);
        uint256 totalSupply = musd.totalSupply();
        console.log("    MUSD Total Supply:", totalSupply / 1e18, "MUSD");

        console.log("");
    }

    function _checkOwner(string memory name, address contractAddr) internal view {
        address owner = IOwnable(contractAddr).owner();
        if (owner == EXPECTED_OWNER) {
            console.log("    [PASS]", name);
            console.log("      Owner:", owner);
        } else if (owner == address(0)) {
            console.log("    [FAIL]", name, "- owner is 0x0!");
        } else {
            console.log("    [WARN]", name, "- unexpected owner");
            console.log("      Owner:", owner);
        }
    }

    function _checkAuth(string memory name, address pool, IYieldAggregator aggregator) internal view {
        bool isAuthorized = aggregator.authorizedCallers(pool);
        if (isAuthorized) {
            console.log("    [PASS]", name, "is authorized");
        } else {
            console.log("    [FAIL]", name, "NOT authorized!");
        }
    }

    function _printSummary() internal view {
        console.log("==============================================");
        console.log("              VERIFICATION SUMMARY            ");
        console.log("==============================================");
        console.log("");
        console.log("All checks completed. Review output above for");
        console.log("[PASS], [FAIL], or [WARN] indicators.");
        console.log("");
        console.log("If any [FAIL] is shown, run the appropriate");
        console.log("fix script or manually correct the issue.");
        console.log("");
        console.log("==============================================");
    }
}
