// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {StabilityPoolStrategy} from "../src/strategies/StabilityPoolStrategy.sol";
import {IMezoStabilityPool} from "../src/interfaces/IMezoStabilityPool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/**
 * @title StabilityPoolStrategyLocalTest
 * @notice Local tests without fork (using mocks)
 */
contract StabilityPoolStrategyLocalTest is Test {
    
    StabilityPoolStrategy public strategy;
    MockERC20 public musd;
    MockStabilityPool public stabilityPool;
    
    address public alice;
    address public bob;
    address public feeCollector;
    
    uint256 constant INITIAL_BALANCE = 100000e18;
    uint256 constant MIN_DEPOSIT = 10e18;
    uint256 constant PERFORMANCE_FEE = 100; // 1%
    
    function setUp() public {
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        feeCollector = makeAddr("feeCollector");
        
        // Deploy mocks
        musd = new MockERC20("MUSD", "MUSD", 18);
        stabilityPool = new MockStabilityPool();
        
        // Deploy strategy
        strategy = new StabilityPoolStrategy(
            address(stabilityPool),
            address(musd),
            feeCollector,
            PERFORMANCE_FEE
        );
        
        // Mint MUSD to users
        musd.mint(alice, INITIAL_BALANCE);
        musd.mint(bob, INITIAL_BALANCE);
    }

    function test_Deployment() public view {
        assertEq(address(strategy.STABILITY_POOL()), address(stabilityPool));
        assertEq(address(strategy.MUSD_TOKEN()), address(musd));
        assertEq(strategy.feeCollector(), feeCollector);
        assertEq(strategy.performanceFee(), PERFORMANCE_FEE);
    }

    function test_DepositMUSD_FirstDeposit() public {
        uint256 depositAmount = 1000e18;
        
        vm.startPrank(alice);
        musd.approve(address(strategy), depositAmount);
        
        uint256 shares = strategy.depositMUSD(depositAmount);
        vm.stopPrank();
        
        // First deposit should get 1:1 shares
        assertEq(shares, depositAmount);
        assertEq(strategy.totalShares(), shares);
        assertEq(strategy.totalMusdDeposited(), depositAmount);
    }

    function test_DepositMUSD_MultipleUsers() public {
        uint256 aliceDeposit = 1000e18;
        uint256 bobDeposit = 500e18;
        
        vm.startPrank(alice);
        musd.approve(address(strategy), aliceDeposit);
        strategy.depositMUSD(aliceDeposit);
        vm.stopPrank();
        
        vm.startPrank(bob);
        musd.approve(address(strategy), bobDeposit);
        strategy.depositMUSD(bobDeposit);
        vm.stopPrank();
        
        assertEq(strategy.getTVL(), aliceDeposit + bobDeposit);
    }

    function test_WithdrawMUSD() public {
        uint256 depositAmount = 1000e18;

        vm.startPrank(alice);
        musd.approve(address(strategy), depositAmount);
        strategy.depositMUSD(depositAmount);
        vm.stopPrank();

        // Advance block for flash loan protection
        vm.roll(block.number + 1);

        vm.startPrank(alice);
        uint256 balanceBefore = musd.balanceOf(alice);
        strategy.withdrawMUSD(depositAmount);
        uint256 balanceAfter = musd.balanceOf(alice);
        vm.stopPrank();

        assertEq(balanceAfter - balanceBefore, depositAmount);
    }

    function test_RevertIf_DepositBelowMinimum() public {
        uint256 tooSmall = MIN_DEPOSIT - 1;
        
        vm.startPrank(alice);
        musd.approve(address(strategy), tooSmall);
        
        vm.expectRevert(StabilityPoolStrategy.MinimumDepositNotMet.selector);
        strategy.depositMUSD(tooSmall);
        
        vm.stopPrank();
    }
}

/**
 * @notice Mock Stability Pool for testing
 */
contract MockStabilityPool is IMezoStabilityPool {
    uint256 public totalDeposits;
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public collateralGains;
    
    function provideToSP(uint256 _amount, address) external {
        deposits[msg.sender] += _amount;
        totalDeposits += _amount;
    }
    
    function withdrawFromSP(uint256 _amount) external {
        if (_amount > 0) {
            deposits[msg.sender] -= _amount;
            totalDeposits -= _amount;
        }
    }
    
    function getTotalMUSDDeposits() external view returns (uint256) {
        return totalDeposits;
    }
    
    function getDepositorMUSDBalance(address _depositor) external view returns (uint256) {
        return deposits[_depositor];
    }
    
    function getDepositorCollateralGain(address _depositor) external view returns (uint256) {
        return collateralGains[_depositor];
    }
    
    function getPendingCollateralGain(address _depositor) external view returns (uint256) {
        return collateralGains[_depositor];
    }
    
    // Mock function to simulate liquidation
    function simulateLiquidation(address _depositor, uint256 _collateral) external {
        collateralGains[_depositor] += _collateral;
    }
    
    // Unused interface functions
    function getTotalCollateralGains() external pure returns (uint256) { return 0; }
    function isActive() external pure returns (bool) { return true; }
    function currentEpoch() external pure returns (uint256) { return 1; }
    function scale() external pure returns (uint256) { return 1e18; }
    function getCompoundedMUSDDeposit(address) external pure returns (uint256) { return 0; }
    function getSnapshot(address) external pure returns (uint256) { return 0; }
    function getFrontEndTag(address) external pure returns (address) { return address(0); }
    function setFrontEndTag(address) external {}
    function triggerLiquidationRewardDistribution() external {}
    function getFrontEndStake(address) external pure returns (uint256) { return 0; }
    function getFrontEndSnapshot(address) external pure returns (uint256) { return 0; }
    function getFrontEndEndStake(address) external pure returns (uint256) { return 0; }
    function getFrontEndKickbacks(address) external pure returns (uint256) { return 0; }
    function getFrontEndRewardRate() external pure returns (uint256) { return 0; }
}
