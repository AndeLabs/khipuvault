// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IStabilityPoolStrategy
 * @notice Interface for Stability Pool Strategy contract
 * @dev Defines the public API for interacting with the Stability Pool strategy
 */
interface IStabilityPoolStrategy {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct UserPosition {
        uint256 shares;
        uint256 lastCollateralSnapshot;
        uint256 pendingCollateralGains;
        uint256 depositTimestamp;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(
        address indexed user,
        uint256 musdAmount,
        uint256 sharesIssued,
        uint256 timestamp
    );

    event Withdrawn(
        address indexed user,
        uint256 musdAmount,
        uint256 sharesBurned,
        uint256 timestamp
    );

    event CollateralGainsClaimed(
        address indexed user,
        uint256 collateralAmount,
        uint256 feeAmount,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit MUSD to earn liquidation rewards
     * @param _amount Amount of MUSD to deposit
     * @return shares Number of shares issued
     */
    function depositMUSD(uint256 _amount) external returns (uint256 shares);

    /**
     * @notice Withdraw MUSD from Stability Pool
     * @param _amount Amount of MUSD to withdraw
     * @return sharesBurned Number of shares burned
     */
    function withdrawMUSD(uint256 _amount) external returns (uint256 sharesBurned);

    /**
     * @notice Claim accumulated collateral gains
     * @return collateralGains Amount of collateral claimed
     */
    function claimCollateralGains() external returns (uint256 collateralGains);

    /**
     * @notice Harvest collateral gains from Stability Pool
     * @return totalGains Total collateral harvested
     * @return feeAmount Fee collected
     */
    function harvestCollateralGains() external returns (uint256 totalGains, uint256 feeAmount);

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get user's MUSD deposit value
     * @param _user User address
     * @return musdValue MUSD value of user's shares
     */
    function getUserMusdValue(address _user) external view returns (uint256 musdValue);

    /**
     * @notice Get user's pending collateral gains
     * @param _user User address
     * @return pendingGains Pending collateral gains
     */
    function getUserPendingGains(address _user) external view returns (uint256 pendingGains);

    /**
     * @notice Get user's share percentage
     * @param _user User address
     * @return sharePct User's share percentage in basis points
     */
    function getUserSharePercentage(address _user) external view returns (uint256 sharePct);

    /**
     * @notice Get total value locked
     * @return tvl Total MUSD in strategy
     */
    function getTVL() external view returns (uint256 tvl);

    /**
     * @notice Get estimated APY
     * @return apy Estimated APY in basis points
     */
    function getEstimatedAPY() external view returns (uint256 apy);

    /**
     * @notice Get user position details
     * @param _user User address
     * @return position User position struct
     */
    function getUserPosition(address _user) external view returns (UserPosition memory position);
}
