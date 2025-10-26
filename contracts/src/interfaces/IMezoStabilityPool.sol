// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoStabilityPool
 * @notice Interface for Mezo Stability Pool contract
 * @dev The Stability Pool provides MUSD to liquidate undercollateralized troves
 *      and receives the liquidated collateral in return
 */
interface IMezoStabilityPool {
    /**
     * @notice Provide MUSD to Stability Pool
     * @param _amount Amount of MUSD to provide
     * @param _frontEndTag Address of front end (optional)
     */
    function provideToSP(uint256 _amount, address _frontEndTag) external;

    /**
     * @notice Withdraw MUSD from Stability Pool
     * @param _amount Amount of MUSD to withdraw
     */
    function withdrawFromSP(uint256 _amount) external;

    /**
     * @notice Get total MUSD deposits in Stability Pool
     * @return totalDeposits Total MUSD deposited
     */
    function getTotalMUSDDeposits() external view returns (uint256 totalDeposits);

    /**
     * @notice Get MUSD deposit balance for a user
     * @param _depositor Address of the depositor
     * @return depositBalance User's MUSD deposit balance
     */
    function getDepositorMUSDBalance(address _depositor) external view returns (uint256 depositBalance);

    /**
     * @notice Get collateral gains for a user
     * @param _depositor Address of the depositor
     * @return collateralGains User's collateral gains
     */
    function getDepositorCollateralGain(address _depositor) external view returns (uint256 collateralGains);

    /**
     * @notice Get total collateral gains in Stability Pool
     * @return totalCollateralGains Total collateral gains
     */
    function getTotalCollateralGains() external view returns (uint256 totalCollateralGains);

    /**
     * @notice Get pending collateral gains for a user
     * @param _depositor Address of the depositor
     * @return pendingGains Pending collateral gains
     */
    function getPendingCollateralGain(address _depositor) external view returns (uint256 pendingGains);

    /**
     * @notice Check if Stability Pool is active
     * @return isActive True if Stability Pool is active
     */
    function isActive() external view returns (bool isActive);

    /**
     * @notice Get current epoch
     * @return epoch Current epoch number
     */
    function currentEpoch() external view returns (uint256 epoch);

    /**
     * @notice Get scale factor
     * @return scale Current scale factor
     */
    function scale() external view returns (uint256 scale);

    /**
     * @notice Get P (proportion) for a user
     * @param _depositor Address of the depositor
     * @return P User's proportion value
     */
    function getCompoundedMUSDDeposit(address _depositor) external view returns (uint256 P);

    /**
     * @notice Get S (snapshot) for a user
     * @param _depositor Address of the depositor
     * @return S User's snapshot value
     */
    function getSnapshot(address _depositor) external view returns (uint256 S);

    /**
     * @notice Get front end tags for a user
     * @param _depositor Address of the depositor
     * @return frontEndTag User's front end tag
     */
    function getFrontEndTag(address _depositor) external view returns (address frontEndTag);

    /**
     * @notice Set front end tag
     * @param _frontEndTag Address of front end tag
     */
    function setFrontEndTag(address _frontEndTag) external;

    /**
     * @notice Trigger liquidation reward distribution
     */
    function triggerLiquidationRewardDistribution() external;

    /**
     * @notice Get front end stake
     * @param _frontEndTag Address of front end tag
     * @return stake Front end stake amount
     */
    function getFrontEndStake(address _frontEndTag) external view returns (uint256 stake);

    /**
     * @notice Get front end snapshot
     * @param _frontEndTag Address of front end tag
     * @return snapshot Front end snapshot
     */
    function getFrontEndSnapshot(address _frontEndTag) external view returns (uint256 snapshot);

    /**
     * @notice Get front end end stake
     * @param _frontEndTag Address of front end tag
     * @return endStake Front end end stake
     */
    function getFrontEndEndStake(address _frontEndTag) external view returns (uint256 endStake);

    /**
     * @notice Get front end kickbacks
     * @param _frontEndTag Address of front end tag
     * @return kickbacks Front end kickbacks
     */
    function getFrontEndKickbacks(address _frontEndTag) external view returns (uint256 kickbacks);

    /**
     * @notice Get front end reward rate
     * @return rewardRate Front end reward rate
     */
    function getFrontEndRewardRate() external view returns (uint256 rewardRate);
}