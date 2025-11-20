// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoStabilityPool} from "../../src/interfaces/IMezoStabilityPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMezoStabilityPool
 * @notice Complete mock implementation of Mezo Stability Pool for testing
 */
contract MockMezoStabilityPool is IMezoStabilityPool {
    
    IERC20 public musd;
    
    uint256 public totalMusdDeposits;
    uint256 public totalCollateralGains;
    
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public collateralGains;
    mapping(address => uint256) public snapshots;
    
    uint256 public currentEpochValue = 1;
    uint256 public scaleValue = 1e18;
    
    constructor(address _musd) {
        musd = IERC20(_musd);
    }
    
    function provideToSP(uint256 _amount, address) external override {
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer MUSD from depositor
        musd.transferFrom(msg.sender, address(this), _amount);
        
        // Update deposits
        deposits[msg.sender] += _amount;
        totalMusdDeposits += _amount;
        snapshots[msg.sender] = totalCollateralGains;
    }
    
    function withdrawFromSP(uint256 _amount) external override {
        if (_amount == 0) {
            // Trigger collateral distribution (for harvesting)
            _distributeCollateral(msg.sender);
            return;
        }
        
        require(deposits[msg.sender] >= _amount, "Insufficient balance");
        
        // Distribute collateral first
        _distributeCollateral(msg.sender);
        
        // Update deposits
        deposits[msg.sender] -= _amount;
        totalMusdDeposits -= _amount;
        
        // Transfer MUSD back
        musd.transfer(msg.sender, _amount);
    }
    
    function getTotalMUSDDeposits() external view override returns (uint256) {
        return totalMusdDeposits;
    }
    
    function getDepositorMUSDBalance(address _depositor) external view override returns (uint256) {
        return deposits[_depositor];
    }
    
    function getDepositorCollateralGain(address _depositor) external view override returns (uint256) {
        return collateralGains[_depositor];
    }
    
    function getTotalCollateralGains() external view override returns (uint256) {
        return totalCollateralGains;
    }
    
    function getPendingCollateralGain(address _depositor) external view override returns (uint256) {
        // Calculate pending gains since last snapshot
        uint256 newGains = totalCollateralGains - snapshots[_depositor];
        if (totalMusdDeposits == 0) return 0;
        
        uint256 userShare = (deposits[_depositor] * newGains) / totalMusdDeposits;
        return collateralGains[_depositor] + userShare;
    }
    
    function isActive() external pure override returns (bool) {
        return true;
    }
    
    function currentEpoch() external view override returns (uint256) {
        return currentEpochValue;
    }
    
    function scale() external view override returns (uint256) {
        return scaleValue;
    }
    
    function getCompoundedMUSDDeposit(address _depositor) external view override returns (uint256) {
        return deposits[_depositor];
    }
    
    function getSnapshot(address _depositor) external view override returns (uint256) {
        return snapshots[_depositor];
    }
    
    function getFrontEndTag(address) external pure override returns (address) {
        return address(0);
    }
    
    function setFrontEndTag(address) external override {
        // No-op in mock
    }
    
    function triggerLiquidationRewardDistribution() external override {
        // No-op in mock - distribution happens on withdraw
    }
    
    function getFrontEndStake(address) external pure override returns (uint256) {
        return 0;
    }
    
    function getFrontEndSnapshot(address) external pure override returns (uint256) {
        return 0;
    }
    
    function getFrontEndEndStake(address) external pure override returns (uint256) {
        return 0;
    }
    
    function getFrontEndKickbacks(address) external pure override returns (uint256) {
        return 0;
    }
    
    function getFrontEndRewardRate() external pure override returns (uint256) {
        return 0;
    }
    
    // ============ TESTING HELPERS ============
    
    /**
     * @notice Simulate a liquidation event
     * @param _collateralAmount Amount of collateral from liquidation
     */
    function simulateLiquidation(uint256 _collateralAmount) external payable {
        require(msg.value == _collateralAmount, "Must send collateral");
        totalCollateralGains += _collateralAmount;
    }
    
    /**
     * @notice Internal function to distribute collateral gains
     */
    function _distributeCollateral(address _depositor) internal {
        uint256 pending = this.getPendingCollateralGain(_depositor);
        
        if (pending > 0) {
            // Update user's collateral gains
            collateralGains[_depositor] += pending;
            snapshots[_depositor] = totalCollateralGains;
            
            // Transfer collateral (BTC) to depositor
            (bool success, ) = _depositor.call{value: pending}("");
            require(success, "Collateral transfer failed");
        }
    }
    
    receive() external payable {}
}
