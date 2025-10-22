// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoBorrowerOperations
 * @notice Interface for Mezo MUSD BorrowerOperations contract
 * @dev Based on official MUSD protocol documentation from mezo-org/musd
 */
interface IMezoBorrowerOperations {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TroveCreated(address indexed _borrower, uint arrayIndex);
    event TroveUpdated(
        address indexed _borrower,
        uint _debt,
        uint _coll,
        uint8 operation
    );
    event MUSDBorrowingFeePaid(address indexed _borrower, uint _MUSDBorrowingFee);

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Opens a new Trove (CDP) by depositing BTC and borrowing MUSD
     * @param _maxFeePercentage Maximum borrowing fee percentage (in basis points)
     * @param _MUSDAmount Amount of MUSD to borrow/mint
     * @param _upperHint Address hint for efficient insertion in sorted list
     * @param _lowerHint Address hint for efficient insertion in sorted list
     * @dev Requires sending BTC as msg.value for collateral
     * @dev Minimum collateral ratio: 110% (150% in recovery mode)
     */
    function openTrove(
        uint _maxFeePercentage,
        uint _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external payable;

    /**
     * @notice Adjusts existing Trove collateral and/or debt
     * @param _collWithdrawal Amount of collateral to withdraw (0 if none)
     * @param _MUSDChange Amount of MUSD to borrow/repay
     * @param _isDebtIncrease True to borrow more, false to repay
     * @param _upperHint Address hint for repositioning in sorted list
     * @param _lowerHint Address hint for repositioning in sorted list
     * @dev Send additional collateral as msg.value if adding
     * @dev For debt repayment, approve MUSD spending first
     */
    function adjustTrove(
        uint _collWithdrawal,
        uint _MUSDChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;

    /**
     * @notice Closes Trove by repaying all debt and withdrawing all collateral
     * @dev Must approve MUSD token spending for full debt amount
     * @dev Trove must have debt to close
     */
    function closeTrove() external;

    /**
     * @notice Refinances Trove to current global interest rate
     * @param _upperHint Address hint for repositioning after refinancing
     * @param _lowerHint Address hint for repositioning after refinancing
     * @dev Charges refinancing fee (typically 0.1% of principal)
     * @dev Only beneficial if current global rate < trove's rate
     */
    function refinance(
        address _upperHint,
        address _lowerHint
    ) external;

    /**
     * @notice Adds collateral to existing Trove without borrowing
     * @param _upperHint Address hint for repositioning
     * @param _lowerHint Address hint for repositioning
     * @dev Send BTC as msg.value
     */
    function addColl(
        address _upperHint,
        address _lowerHint
    ) external payable;

    /**
     * @notice Withdraws collateral from Trove without changing debt
     * @param _collWithdrawal Amount of BTC collateral to withdraw
     * @param _upperHint Address hint for repositioning
     * @param _lowerHint Address hint for repositioning
     * @dev Must maintain minimum collateral ratio
     */
    function withdrawColl(
        uint _collWithdrawal,
        address _upperHint,
        address _lowerHint
    ) external;

    /**
     * @notice Borrows additional MUSD against existing collateral
     * @param _maxFeePercentage Maximum fee to pay for borrowing
     * @param _MUSDAmount Additional MUSD amount to borrow
     * @param _upperHint Address hint for repositioning
     * @param _lowerHint Address hint for repositioning
     * @dev Must maintain minimum collateral ratio after borrowing
     */
    function withdrawMUSD(
        uint _maxFeePercentage,
        uint _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external;

    /**
     * @notice Repays MUSD debt without withdrawing collateral
     * @param _MUSDAmount Amount of MUSD to repay
     * @param _upperHint Address hint for repositioning
     * @param _lowerHint Address hint for repositioning
     * @dev Must approve MUSD token spending first
     */
    function repayMUSD(
        uint _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external;

    /*//////////////////////////////////////////////////////////////
                        RESTRICTED FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adjusts Trove on behalf of another user (requires approval)
     * @param _borrower Address of Trove owner
     * @param _collWithdrawal Amount of collateral to withdraw
     * @param _MUSDChange Amount of MUSD change
     * @param _isDebtIncrease True to increase debt, false to decrease
     * @param _upperHint Address hint for repositioning
     * @param _lowerHint Address hint for repositioning
     * @dev Requires prior approval via signatures or direct approval
     */
    function restrictedAdjustTrove(
        address _borrower,
        address _recipient,
        address _caller,
        uint _collWithdrawal,
        uint _MUSDChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the current borrowing rate (interest rate)
     * @return Borrowing rate in basis points
     */
    function getBorrowingRate() external view returns (uint);

    /**
     * @notice Gets the borrowing rate with decay applied
     * @return Borrowing rate with time decay in basis points
     */
    function getBorrowingRateWithDecay() external view returns (uint);

    /**
     * @notice Calculates borrowing fee for a given debt amount
     * @param _MUSDDebt Amount of MUSD debt
     * @return Borrowing fee amount
     */
    function getBorrowingFee(uint _MUSDDebt) external view returns (uint);

    /**
     * @notice Calculates borrowing fee with decay for a given debt amount
     * @param _MUSDDebt Amount of MUSD debt
     * @return Borrowing fee amount with decay applied
     */
    function getBorrowingFeeWithDecay(uint _MUSDDebt) external view returns (uint);

    /**
     * @notice Gets the refinancing fee percentage
     * @return Fee percentage in basis points (e.g., 10 = 0.1%)
     */
    function refinancingFeePercentage() external view returns (uint);
}