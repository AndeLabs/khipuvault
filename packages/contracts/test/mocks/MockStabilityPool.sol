// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoStabilityPool} from "../../src/interfaces/IMezoStabilityPool.sol";

/**
 * @title MockStabilityPool
 * @notice Mock implementation of Mezo Stability Pool for testing
 * @dev Simulates core functionality of the real Stability Pool
 */
contract MockStabilityPool is IMezoStabilityPool {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public musdToken;
    address public btcToken; // Simulated BTC collateral

    uint256 public totalMUSDDeposits_;
    uint256 public totalCollateralGains_;
    uint256 private currentEpoch_ = 1;
    uint256 private scale_ = 1e18;
    bool public isActive_ = true;

    // Depositor tracking
    mapping(address => uint256) public depositorMUSDBalance;
    mapping(address => uint256) public depositorCollateralGain;
    mapping(address => uint256) public depositorSnapshot;
    mapping(address => address) public depositorFrontEndTag;
    mapping(address => uint256) public lastInteractionEpoch;

    // Front end tracking
    mapping(address => uint256) public frontEndStake;
    mapping(address => uint256) public frontEndSnapshot;
    mapping(address => uint256) public frontEndKickbacks;
    uint256 public frontEndRewardRate_ = 500; // 5%

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event UserDepositChanged(address indexed _depositor, uint256 _newDeposit);
    event UserCollateralGainProcessed(address indexed _depositor, uint256 _gain);
    event StabilityPoolUpdated(uint256 _totalDeposits, uint256 _totalGains);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _musdToken, address _btcToken) {
        musdToken = IERC20(_musdToken);
        btcToken = _btcToken;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE POOL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Simulate providing MUSD to Stability Pool
     * @param _amount Amount of MUSD to provide
     * @param _frontEndTag Front end tag (optional)
     */
    function provideToSP(uint256 _amount, address _frontEndTag) external override {
        require(isActive_, "Pool not active");
        require(_amount > 0, "Amount must be greater than 0");

        // Record interaction
        uint256 oldDeposit = depositorMUSDBalance[msg.sender];
        depositorMUSDBalance[msg.sender] += _amount;
        totalMUSDDeposits_ += _amount;

        // Track snapshot
        depositorSnapshot[msg.sender] = scale_;
        lastInteractionEpoch[msg.sender] = currentEpoch_;

        // Track front end tag
        if (_frontEndTag != address(0)) {
            depositorFrontEndTag[msg.sender] = _frontEndTag;
            frontEndStake[_frontEndTag] += _amount;
        }

        // Transfer MUSD from user to pool
        musdToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit UserDepositChanged(msg.sender, depositorMUSDBalance[msg.sender]);
    }

    /**
     * @notice Simulate withdrawing MUSD from Stability Pool
     * @param _amount Amount of MUSD to withdraw
     */
    function withdrawFromSP(uint256 _amount) external override {
        require(depositorMUSDBalance[msg.sender] >= _amount, "Insufficient balance");

        // Get collateral gains before withdrawal
        uint256 collateralGain = depositorCollateralGain[msg.sender];

        // Update balances
        depositorMUSDBalance[msg.sender] -= _amount;
        totalMUSDDeposits_ -= _amount;

        // Update front end tracking
        address frontEnd = depositorFrontEndTag[msg.sender];
        if (frontEnd != address(0)) {
            frontEndStake[frontEnd] -= _amount;
        }

        // Transfer MUSD back to user
        musdToken.safeTransfer(msg.sender, _amount);

        // Transfer collateral gains if any
        if (collateralGain > 0) {
            depositorCollateralGain[msg.sender] = 0;
            totalCollateralGains_ -= collateralGain;
            // In real scenario, would transfer BTC collateral
        }

        emit UserDepositChanged(msg.sender, depositorMUSDBalance[msg.sender]);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getTotalMUSDDeposits() external view override returns (uint256) {
        return totalMUSDDeposits_;
    }

    function getDepositorMUSDBalance(address _depositor) external view override returns (uint256) {
        return depositorMUSDBalance[_depositor];
    }

    function getDepositorCollateralGain(address _depositor) external view override returns (uint256) {
        return depositorCollateralGain[_depositor];
    }

    function getTotalCollateralGains() external view override returns (uint256) {
        return totalCollateralGains_;
    }

    function getPendingCollateralGain(address _depositor) external view override returns (uint256) {
        return depositorCollateralGain[_depositor];
    }

    function isActive() external view override returns (bool) {
        return isActive_;
    }

    function currentEpoch() external view override returns (uint256) {
        return currentEpoch_;
    }

    function scale() external view override returns (uint256) {
        return scale_;
    }

    function getCompoundedMUSDDeposit(address _depositor) external view override returns (uint256) {
        return depositorMUSDBalance[_depositor];
    }

    function getSnapshot(address _depositor) external view override returns (uint256) {
        return depositorSnapshot[_depositor];
    }

    function getFrontEndTag(address _depositor) external view override returns (address) {
        return depositorFrontEndTag[_depositor];
    }

    function getFrontEndStake(address _frontEndTag) external view override returns (uint256) {
        return frontEndStake[_frontEndTag];
    }

    function getFrontEndSnapshot(address _frontEndTag) external view override returns (uint256) {
        return frontEndSnapshot[_frontEndTag];
    }

    function getFrontEndEndStake(address _frontEndTag) external view override returns (uint256) {
        return frontEndStake[_frontEndTag];
    }

    function getFrontEndKickbacks(address _frontEndTag) external view override returns (uint256) {
        return frontEndKickbacks[_frontEndTag];
    }

    function getFrontEndRewardRate() external view override returns (uint256) {
        return frontEndRewardRate_;
    }

    /*//////////////////////////////////////////////////////////////
                    ADMIN/TESTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Simulate liquidation by distributing collateral gains
     * @param _depositor Depositor to reward
     * @param _collateralGain Amount of collateral to give
     */
    function simulateLiquidation(address _depositor, uint256 _collateralGain) external {
        require(depositorMUSDBalance[_depositor] > 0, "No deposit");
        depositorCollateralGain[_depositor] += _collateralGain;
        totalCollateralGains_ += _collateralGain;
        emit UserCollateralGainProcessed(_depositor, _collateralGain);
    }

    /**
     * @notice Move to next epoch (simulate time passage)
     */
    function nextEpoch() external {
        currentEpoch_ += 1;
    }

    /**
     * @notice Update scale factor (simulate compounding)
     * @param _newScale New scale value
     */
    function setScale(uint256 _newScale) external {
        scale_ = _newScale;
    }

    /**
     * @notice Set pool active status
     * @param _active Active status
     */
    function setActive(bool _active) external {
        isActive_ = _active;
    }

    /**
     * @notice Set front end reward rate
     * @param _rate New reward rate in basis points
     */
    function setFrontEndRewardRate(uint256 _rate) external {
        frontEndRewardRate_ = _rate;
    }

    // Stub implementations for unused functions
    function setFrontEndTag(address _frontEndTag) external override {}

    function triggerLiquidationRewardDistribution() external override {}
}
