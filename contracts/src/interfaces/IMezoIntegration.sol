// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoIntegration
 * @notice Interface for Mezo protocol integration
 * @dev Handles BTC deposits, MUSD minting, and collateral management
 */
interface IMezoIntegration {
    /**
     * @notice Emitted when BTC is deposited to Mezo
     * @param user Address of the user depositing
     * @param btcAmount Amount of BTC deposited
     * @param musdMinted Amount of MUSD minted
     */
    event BTCDeposited(address indexed user, uint256 btcAmount, uint256 musdMinted);

    /**
     * @notice Emitted when MUSD is burned and BTC is withdrawn
     * @param user Address of the user withdrawing
     * @param musdAmount Amount of MUSD burned
     * @param btcReturned Amount of BTC returned
     */
    event BTCWithdrawn(address indexed user, uint256 musdAmount, uint256 btcReturned);

    /**
     * @notice Emitted when collateral ratio is updated
     * @param user Address of the user
     * @param collateralRatio New collateral ratio (in basis points)
     */
    event CollateralRatioUpdated(address indexed user, uint256 collateralRatio);

    /**
     * @notice Deposits BTC to Mezo and mints MUSD against the collateral
     * @param btcAmount Amount of BTC to deposit (in wei/satoshis)
     * @return musdAmount Amount of MUSD minted
     */
    function depositAndMint(uint256 btcAmount) external returns (uint256 musdAmount);

    /**
     * @notice Burns MUSD and withdraws BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
     */
    function burnAndWithdraw(uint256 musdAmount) external returns (uint256 btcAmount);

    /**
     * @notice Gets the user's BTC collateral balance in Mezo
     * @param user Address of the user
     * @return btcBalance BTC collateral balance
     */
    function getBtcBalance(address user) external view returns (uint256 btcBalance);

    /**
     * @notice Gets the user's MUSD debt balance
     * @param user Address of the user
     * @return musdDebt MUSD debt balance
     */
    function getMusdDebt(address user) external view returns (uint256 musdDebt);

    /**
     * @notice Gets the user's collateral ratio
     * @param user Address of the user
     * @return ratio Collateral ratio in basis points (e.g., 15000 = 150%)
     */
    function getCollateralRatio(address user) external view returns (uint256 ratio);

    /**
     * @notice Gets the current BTC/USD price from Mezo oracle
     * @return price BTC price in USD (scaled by 1e8)
     */
    function getBtcPrice() external view returns (uint256 price);

    /**
     * @notice Gets the borrowing rate for MUSD (APR)
     * @return rate Borrowing rate in basis points (e.g., 100 = 1%)
     */
    function getBorrowRate() external view returns (uint256 rate);

    /**
     * @notice Checks if the user's position is healthy (not at risk of liquidation)
     * @param user Address of the user
     * @return isHealthy True if position is healthy, false otherwise
     */
    function isPositionHealthy(address user) external view returns (bool isHealthy);

    /**
     * @notice Gets the minimum collateral ratio required by Mezo
     * @return minRatio Minimum collateral ratio in basis points
     */
    function getMinCollateralRatio() external view returns (uint256 minRatio);

    /**
     * @notice Gets the liquidation threshold ratio
     * @return threshold Liquidation threshold in basis points
     */
    function getLiquidationThreshold() external view returns (uint256 threshold);

    /**
     * @notice Adds more BTC collateral without minting additional MUSD
     * @param btcAmount Amount of BTC to add as collateral
     */
    function addCollateral(uint256 btcAmount) external;

    /**
     * @notice Mints additional MUSD against existing collateral
     * @param musdAmount Amount of MUSD to mint
     * @return success True if minting was successful
     */
    function mintMore(uint256 musdAmount) external returns (bool success);

    /**
     * @notice Repays MUSD debt without withdrawing collateral
     * @param musdAmount Amount of MUSD to repay
     */
    function repayDebt(uint256 musdAmount) external;
}