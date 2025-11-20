// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoTroveManager
 * @notice Interface for Mezo MUSD TroveManager contract
 * @dev Based on official MUSD protocol documentation from mezo-org/musd
 * @dev Manages Trove liquidations, redemptions, and system operations
 */
interface IMezoTroveManager {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TroveLiquidated(
        address indexed _borrower,
        uint _debt,
        uint _coll,
        uint8 operation
    );

    event TroveUpdated(
        address indexed _borrower,
        uint _debt,
        uint _coll,
        uint8 operation
    );

    event Redemption(
        uint _attemptedMUSDAmount,
        uint _actualMUSDAmount,
        uint _collateralSent,
        uint _collateralFee
    );

    event SystemSnapshotsUpdated(uint _totalStakesSnapshot, uint _totalCollateralSnapshot);

    event LTermsUpdated(uint _L_BTC, uint _L_MUSDDebt);

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum TroveManagerOperation {
        applyPendingRewards,
        liquidateInNormalMode,
        liquidateInRecoveryMode,
        redeemCollateral
    }

    /*//////////////////////////////////////////////////////////////
                        LIQUIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Liquidates a single undercollateralized Trove
     * @param _borrower Address of the Trove owner to liquidate
     * @dev Trove must be below minimum collateral ratio (MCR)
     * @dev Liquidated collateral goes to Stability Pool or gets redistributed
     * @dev Liquidator receives gas compensation
     */
    function liquidate(address _borrower) external;

    /**
     * @notice Liquidates multiple Troves in a single transaction
     * @param _troveArray Array of Trove owner addresses to liquidate
     * @dev More gas-efficient than individual liquidations
     * @dev Automatically skips healthy Troves in the array
     */
    function batchLiquidateTroves(address[] calldata _troveArray) external;

    /**
     * @notice Liquidates up to n Troves starting from lowest collateral ratio
     * @param _n Maximum number of Troves to liquidate
     * @dev Traverses sorted Trove list from lowest ICR
     * @dev Stops when no more liquidatable Troves are found
     */
    function liquidateTroves(uint _n) external;

    /*//////////////////////////////////////////////////////////////
                        REDEMPTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Redeems MUSD for BTC collateral at face value
     * @param _MUSDAmount Amount of MUSD to redeem
     * @param _firstRedemptionHint Address hint for first Trove to redeem from
     * @param _upperPartialRedemptionHint Upper hint for partial redemption positioning
     * @param _lowerPartialRedemptionHint Lower hint for partial redemption positioning
     * @param _partialRedemptionHintNICR NICR hint for partial redemption positioning
     * @param _maxIterations Maximum iterations to prevent infinite loops
     * @return Amount of BTC collateral sent to redeemer
     * @dev Enforces $1 price floor for MUSD through arbitrage
     * @dev Charges redemption fee (increases with redemption volume)
     * @dev Must approve MUSD spending before calling
     */
    function redeemCollateral(
        uint _MUSDAmount,
        address _firstRedemptionHint,
        address _upperPartialRedemptionHint,
        address _lowerPartialRedemptionHint,
        uint _partialRedemptionHintNICR,
        uint _maxIterations
    ) external returns (uint);

    /*//////////////////////////////////////////////////////////////
                        TROVE STATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets comprehensive Trove information
     * @param _borrower Address of Trove owner
     * @return coll Current collateral amount (BTC)
     * @return debt Current total debt (principal + interest)
     * @return interest Accrued interest amount
     * @return pendingColl Pending collateral rewards
     * @return pendingDebt Pending debt redistribution
     * @return pendingInterest Pending interest from redistributions
     * @dev Returns complete Trove state including pending rewards
     */
    function getEntireDebtAndColl(address _borrower)
        external
        view
        returns (
            uint coll,
            uint debt,
            uint interest,
            uint pendingColl,
            uint pendingDebt,
            uint pendingInterest
        );

    /**
     * @notice Gets Trove's current Individual Collateral Ratio
     * @param _borrower Address of Trove owner
     * @param _price Current BTC/USD price
     * @return ICR in basis points (e.g., 15000 = 150%)
     */
    function getCurrentICR(address _borrower, uint _price) external view returns (uint);

    /**
     * @notice Gets Trove's Nominal Individual Collateral Ratio (price-independent)
     * @param _borrower Address of Trove owner
     * @return NICR used for sorting Troves
     */
    function getNominalICR(address _borrower) external view returns (uint);

    /**
     * @notice Gets Trove's debt and collateral
     * @param _borrower Address of Trove owner
     * @return debt Total debt amount (MUSD)
     * @return coll Collateral amount (BTC)
     */
    function getTroveDebtAndColl(address _borrower) external view returns (uint debt, uint coll);

    /**
     * @notice Gets Trove's principal debt (excluding interest)
     * @param _borrower Address of Trove owner
     * @return Principal debt amount
     */
    function getTrovePrincipal(address _borrower) external view returns (uint);

    /**
     * @notice Gets Trove's current interest rate
     * @param _borrower Address of Trove owner
     * @return Interest rate in basis points
     */
    function getTroveInterestRate(address _borrower) external view returns (uint);

    /**
     * @notice Gets when Trove's interest was last updated
     * @param _borrower Address of Trove owner
     * @return Timestamp of last interest update
     */
    function getTroveLastInterestUpdateTime(address _borrower) external view returns (uint);

    /**
     * @notice Gets Trove's maximum borrowing capacity
     * @param _borrower Address of Trove owner
     * @return Maximum MUSD that can be borrowed against current collateral
     */
    function getTroveMaxBorrowingCapacity(address _borrower) external view returns (uint);

    /*//////////////////////////////////////////////////////////////
                        SYSTEM STATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if system is in Recovery Mode
     * @param _price Current BTC/USD price
     * @return True if Total Collateral Ratio < Critical Collateral Ratio (150%)
     */
    function checkRecoveryMode(uint _price) external view returns (bool);

    /**
     * @notice Gets Total Collateral Ratio for the entire system
     * @param _price Current BTC/USD price
     * @return TCR in basis points
     */
    function getTCR(uint _price) external view returns (uint);

    /**
     * @notice Gets total system collateral
     * @return Total BTC collateral across all Troves
     */
    function getEntireSystemColl() external view returns (uint);

    /**
     * @notice Gets total system debt
     * @return Total MUSD debt across all Troves
     */
    function getEntireSystemDebt() external view returns (uint);

    /*//////////////////////////////////////////////////////////////
                            FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets current redemption rate (fee percentage)
     * @param _collateralDrawn Amount of collateral being redeemed
     * @return Redemption rate in basis points
     */
    function getRedemptionRate(uint _collateralDrawn) external view returns (uint);

    /**
     * @notice Gets redemption rate with decay applied
     * @param _collateralDrawn Amount of collateral being redeemed
     * @return Redemption rate with time decay in basis points
     */
    function getRedemptionRateWithDecay(uint _collateralDrawn) external view returns (uint);

    /**
     * @notice Calculates redemption fee for a given collateral amount
     * @param _collateralDrawn Amount of collateral to redeem
     * @return Fee amount in BTC
     */
    function getRedemptionFeeWithDecay(uint _collateralDrawn) external view returns (uint);

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Minimum collateral ratio (110%)
     * @return MCR value in basis points (11000)
     */
    function MCR() external view returns (uint);

    /**
     * @notice Critical collateral ratio for recovery mode (150%)
     * @return CCR value in basis points (15000)
     */
    function CCR() external view returns (uint);

    /**
     * @notice Gas compensation for liquidations
     * @return MUSD amount given to liquidator (typically 200 MUSD)
     */
    function MUSD_GAS_COMPENSATION() external view returns (uint);

    /**
     * @notice Minimum net debt for opening a Trove
     * @return Minimum debt amount (typically 1800 MUSD)
     */
    function MIN_NET_DEBT() external view returns (uint);

    /**
     * @notice Percent divisor for calculations
     * @return Divisor value (10000 = 100%)
     */
    function PERCENT_DIVISOR() external view returns (uint);

    /**
     * @notice Borrowing fee floor (minimum fee percentage)
     * @return Minimum borrowing fee in basis points (typically 50 = 0.5%)
     */
    function BORROWING_FEE_FLOOR() external view returns (uint);

    /**
     * @notice Maximum borrowing fee percentage
     * @return Maximum fee in basis points (typically 500 = 5%)
     */
    function MAX_BORROWING_FEE() external view returns (uint);

    /*//////////////////////////////////////////////////////////////
                        CONTRACT ADDRESSES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the BorrowerOperations contract address
     * @return Address of BorrowerOperations contract
     */
    function borrowerOperationsAddress() external view returns (address);

    /**
     * @notice Gets the ActivePool contract address
     * @return Address of ActivePool contract
     */
    function activePool() external view returns (address);

    /**
     * @notice Gets the DefaultPool contract address
     * @return Address of DefaultPool contract
     */
    function defaultPool() external view returns (address);

    /**
     * @notice Gets the StabilityPool contract address
     * @return Address of StabilityPool contract
     */
    function stabilityPool() external view returns (address);

    /**
     * @notice Gets the GasPool contract address
     * @return Address of GasPool contract
     */
    function gasPoolAddress() external view returns (address);

    /**
     * @notice Gets the CollSurplusPool contract address
     * @return Address of CollSurplusPool contract
     */
    function collSurplusPool() external view returns (address);

    /**
     * @notice Gets the PriceFeed contract address
     * @return Address of PriceFeed contract
     */
    function priceFeed() external view returns (address);

    /**
     * @notice Gets the MUSD token contract address
     * @return Address of MUSD token contract
     */
    function musdToken() external view returns (address);

    /**
     * @notice Gets the SortedTroves contract address
     * @return Address of SortedTroves contract
     */
    function sortedTroves() external view returns (address);

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    error TroveNotActive();
    error TroveNotLiquidatable();
    error InsufficientMUSDBalance();
    error SystemInRecoveryMode();
    error RedemptionAmountTooLow();
    error UnauthorizedAccess();
    error InvalidParameters();
}