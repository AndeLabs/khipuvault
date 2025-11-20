// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoIntegration
 * @notice Interface for Mezo protocol integration - NATIVE BTC version
 * @dev Handles NATIVE BTC deposits, MUSD minting via Mezo protocol
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
     * @param btcAmount Amount of BTC returned
     * @param musdBurned Amount of MUSD burned
     */
    event BTCWithdrawn(address indexed user, uint256 btcAmount, uint256 musdBurned);

    /**
     * @notice Deposits NATIVE BTC to Mezo and mints MUSD (PAYABLE)
     * @dev User sends BTC via msg.value
     * @return musdAmount Amount of MUSD minted
     */
    function depositAndMintNative() external payable returns (uint256 musdAmount);

    /**
     * @notice Legacy function - reverts (use depositAndMintNative instead)
     * @param btcAmount Not used
     * @return musdAmount Not used
     */
    function depositAndMint(uint256 btcAmount) external returns (uint256 musdAmount);

    /**
     * @notice Burns MUSD and withdraws NATIVE BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
     */
    function burnAndWithdraw(uint256 musdAmount) external returns (uint256 btcAmount);

    /**
     * @notice Gets the user's position info
     * @param user Address of the user
     * @return btcCollateral BTC collateral amount
     * @return musdDebt MUSD debt amount
     */
    function getUserPosition(address user) 
        external 
        view 
        returns (uint256 btcCollateral, uint256 musdDebt);

    /**
     * @notice Gets the user's collateral ratio
     * @param user Address of the user
     * @return ratio Collateral ratio in basis points (e.g., 15000 = 150%)
     */
    function getCollateralRatio(address user) external returns (uint256 ratio);

    /**
     * @notice Checks if the user's position is healthy
     * @param user Address of the user
     * @return healthy True if position is healthy, false otherwise
     */
    function isPositionHealthy(address user) external returns (bool healthy);
}
