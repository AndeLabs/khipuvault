// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoHintHelpers
 * @notice Interface for Mezo MUSD HintHelpers contract
 * @dev Based on official MUSD protocol documentation from mezo-org/musd
 * @dev Provides gas-efficient hints for Trove operations in sorted lists
 */
interface IMezoHintHelpers {
    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets approximate hint for Trove insertion/repositioning
     * @param _CR Nominal Individual Collateral Ratio (NICR) for the Trove
     * @param _numTrials Number of trials to run for better accuracy (higher = more accurate, more gas)
     * @param _inputRandomSeed Random seed for hint generation
     * @return hintAddress Address hint for approximate position
     * @return diff Difference metric (lower = more accurate)
     * @return latestRandomSeed Updated random seed for subsequent calls
     * @dev Higher numTrials provides better accuracy but costs more gas
     * @dev Typical numTrials: 15-20 for good balance of accuracy/gas
     */
    function getApproxHint(
        uint _CR,
        uint _numTrials,
        uint _inputRandomSeed
    ) external view returns (
        address hintAddress,
        uint diff,
        uint latestRandomSeed
    );

    /**
     * @notice Gets redemption hints for efficient batch redemption
     * @param _MUSDamount Amount of MUSD to redeem
     * @param _price Current BTC/USD price (from PriceFeed)
     * @param _maxIterations Maximum iterations to prevent infinite loops
     * @return firstRedemptionHint Address of first Trove to redeem from
     * @return partialRedemptionHintNICR NICR for partial redemption positioning
     * @return truncatedMUSDamount Actual MUSD amount that can be redeemed
     * @dev Used by TroveManager.redeemCollateral for gas optimization
     */
    function getRedemptionHints(
        uint _MUSDamount,
        uint _price,
        uint _maxIterations
    ) external view returns (
        address firstRedemptionHint,
        uint partialRedemptionHintNICR,
        uint truncatedMUSDamount
    );

    /*//////////////////////////////////////////////////////////////
                        COMPUTATION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Computes Nominal Individual Collateral Ratio (NICR)
     * @param _coll Collateral amount in BTC
     * @param _debt Debt amount in MUSD
     * @return NICR value used for Trove ordering
     * @dev NICR = (collateral * 100) / debt
     * @dev Used for efficient sorting without price dependency
     */
    function computeNominalCR(uint _coll, uint _debt) external pure returns (uint);

    /**
     * @notice Computes Current Individual Collateral Ratio (ICR)
     * @param _coll Collateral amount in BTC
     * @param _debt Debt amount in MUSD  
     * @param _price Current BTC/USD price
     * @return ICR value in basis points (e.g., 15000 = 150%)
     * @dev ICR = (collateral * price * 100) / debt
     */
    function computeCR(uint _coll, uint _debt, uint _price) external pure returns (uint);

    /*//////////////////////////////////////////////////////////////
                         POSITION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Predicts new NICR after Trove adjustment
     * @param _coll Current collateral amount
     * @param _debt Current debt amount
     * @param _collChange Collateral change (positive = add, negative = remove)
     * @param _isCollIncrease True if adding collateral, false if removing
     * @param _debtChange Debt change amount
     * @param _isDebtIncrease True if borrowing more, false if repaying
     * @return New NICR after the adjustment
     * @dev Useful for frontend UIs to show predicted position
     */
    function computeNewNICR(
        uint _coll,
        uint _debt,
        uint _collChange,
        bool _isCollIncrease,
        uint _debtChange,
        bool _isDebtIncrease
    ) external pure returns (uint);

    /*//////////////////////////////////////////////////////////////
                        LIQUIDATION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets hints for batch liquidation operations
     * @param _troveManager Address of TroveManager contract
     * @param _price Current BTC/USD price
     * @param _maxTrovesToCheck Maximum number of Troves to examine
     * @return liquidatableTroves Array of addresses of liquidatable Troves
     * @return totalDebtToLiquidate Total debt amount to be liquidated
     * @return totalCollToLiquidate Total collateral to be liquidated
     * @dev Helps optimize gas usage in batch liquidations
     */
    function getLiquidationHints(
        address _troveManager,
        uint _price,
        uint _maxTrovesToCheck
    ) external view returns (
        address[] memory liquidatableTroves,
        uint totalDebtToLiquidate,
        uint totalCollToLiquidate
    );

    /*//////////////////////////////////////////////////////////////
                         SYSTEM STATE HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates system-wide metrics efficiently
     * @param _troveManager Address of TroveManager contract
     * @param _price Current BTC/USD price
     * @return totalCollateral Total BTC collateral in system
     * @return totalDebt Total MUSD debt in system
     * @return avgICR Average Individual Collateral Ratio
     * @return trovesCount Total number of active Troves
     * @dev Provides system overview for monitoring and governance
     */
    function getSystemStats(
        address _troveManager,
        uint _price
    ) external view returns (
        uint totalCollateral,
        uint totalDebt,
        uint avgICR,
        uint trovesCount
    );

    /*//////////////////////////////////////////////////////////////
                        INTEREST RATE HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estimates borrowing fee for a given debt amount
     * @param _borrowerOperations Address of BorrowerOperations contract
     * @param _MUSDAmount Amount of MUSD to borrow
     * @return estimatedFee Estimated borrowing fee
     * @return totalDebt Total debt including fee and gas compensation
     * @dev Useful for frontend fee estimation
     */
    function estimateBorrowingFee(
        address _borrowerOperations,
        uint _MUSDAmount
    ) external view returns (
        uint estimatedFee,
        uint totalDebt
    );

    /**
     * @notice Calculates potential savings from refinancing
     * @param _troveManager Address of TroveManager contract
     * @param _borrower Address of Trove owner
     * @param _interestRateManager Address of InterestRateManager contract
     * @return currentRate Current Trove interest rate in basis points
     * @return newRate New global interest rate in basis points
     * @return potentialSavings Annual savings if refinanced
     * @return refinancingFee One-time fee to refinance
     * @return isWorthwhile True if refinancing provides net benefit
     * @dev Helps users decide whether to refinance their Troves
     */
    function calculateRefinancingBenefit(
        address _troveManager,
        address _borrower,
        address _interestRateManager
    ) external view returns (
        uint currentRate,
        uint newRate,
        uint potentialSavings,
        uint refinancingFee,
        bool isWorthwhile
    );

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the sorted Troves contract address
     * @return Address of SortedTroves contract
     */
    function sortedTroves() external view returns (address);

    /**
     * @notice Gets the Trove Manager contract address
     * @return Address of TroveManager contract
     */
    function troveManager() external view returns (address);

    /**
     * @notice Gets the Borrower Operations contract address
     * @return Address of BorrowerOperations contract
     */
    function borrowerOperations() external view returns (address);

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Minimum collateral ratio in basis points (110%)
     * @return MCR value (11000 = 110%)
     */
    function MCR() external view returns (uint);

    /**
     * @notice Critical collateral ratio for recovery mode (150%)
     * @return CCR value (15000 = 150%)
     */
    function CCR() external view returns (uint);

    /**
     * @notice Gas compensation for liquidations
     * @return MUSD gas compensation amount (typically 200 MUSD)
     */
    function MUSD_GAS_COMPENSATION() external view returns (uint);

    /**
     * @notice Minimum net debt for a Trove
     * @return Minimum net debt amount (typically 1800 MUSD)
     */
    function MIN_NET_DEBT() external view returns (uint);

    /**
     * @notice Percent divisor for calculations (10000 = 100%)
     * @return Percent divisor constant
     */
    function PERCENT_DIVISOR() external view returns (uint);
}