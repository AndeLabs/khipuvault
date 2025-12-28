// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoTroveManager} from "../../../src/interfaces/IMezoTroveManager.sol";

/**
 * @title MockMezoTroveManager
 * @notice Comprehensive mock for Mezo TroveManager - tracks and manages trove state
 * @dev Provides configurable trove data and liquidation simulation
 * @author KhipuVault Team
 */
contract MockMezoTroveManager is IMezoTroveManager {
    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct TroveData {
        uint256 collateral;
        uint256 debt;
        uint256 interest;
        uint256 interestRate;
        uint256 lastUpdateTime;
        bool exists;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    mapping(address => TroveData) public troveData;

    // System state
    uint256 public totalSystemColl;
    uint256 public totalSystemDebt;
    bool public recoveryMode;

    // Constants
    uint256 private constant _MCR = 11000;  // 110%
    uint256 private constant _CCR = 15000;  // 150%
    uint256 private constant _GAS_COMPENSATION = 200e18;  // 200 MUSD
    uint256 private constant _MIN_NET_DEBT = 1800e18;  // 1800 MUSD
    uint256 private constant _PERCENT_DIVISOR = 10000;
    uint256 private constant _BORROWING_FEE_FLOOR = 50;  // 0.5%
    uint256 private constant _MAX_BORROWING_FEE = 500;   // 5%

    // Contract addresses (mocks)
    address public borrowerOps;
    address public activePoolAddr;

    // Failure simulation
    bool public shouldRevertOnLiquidate;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MockTroveDataSet(address indexed borrower, uint256 coll, uint256 debt);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {}

    /*//////////////////////////////////////////////////////////////
                        LIQUIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function liquidate(address _borrower) external override {
        if (shouldRevertOnLiquidate) {
            revert TroveNotLiquidatable();
        }

        TroveData storage trove = troveData[_borrower];
        require(trove.exists, "Trove not active");

        uint256 coll = trove.collateral;
        uint256 debt = trove.debt;

        // Clear trove
        totalSystemColl -= coll;
        totalSystemDebt -= debt;
        delete troveData[_borrower];

        emit TroveLiquidated(_borrower, debt, coll, uint8(TroveManagerOperation.liquidateInNormalMode));
    }

    function batchLiquidateTroves(address[] calldata _troveArray) external override {
        for (uint256 i = 0; i < _troveArray.length; i++) {
            TroveData storage trove = troveData[_troveArray[i]];
            if (trove.exists) {
                totalSystemColl -= trove.collateral;
                totalSystemDebt -= trove.debt;
                emit TroveLiquidated(_troveArray[i], trove.debt, trove.collateral, uint8(TroveManagerOperation.liquidateInNormalMode));
                delete troveData[_troveArray[i]];
            }
        }
    }

    function liquidateTroves(uint256 _n) external override {
        // Mock: liquidate first _n troves that exist
        // In practice, this would traverse sorted list
        _n; // Suppress unused warning
    }

    /*//////////////////////////////////////////////////////////////
                        REDEMPTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function redeemCollateral(
        uint256 _MUSDAmount,
        address _firstRedemptionHint,
        address _upperPartialRedemptionHint,
        address _lowerPartialRedemptionHint,
        uint256 _partialRedemptionHintNICR,
        uint256 _maxIterations
    ) external override returns (uint256) {
        // Suppress unused warnings
        _firstRedemptionHint;
        _upperPartialRedemptionHint;
        _lowerPartialRedemptionHint;
        _partialRedemptionHintNICR;
        _maxIterations;

        // Mock: return collateral proportional to MUSD
        uint256 collToReturn = _MUSDAmount * 1e18 / 60000e18; // Assume $60k BTC price
        totalSystemDebt -= _MUSDAmount;
        totalSystemColl -= collToReturn;

        emit Redemption(_MUSDAmount, _MUSDAmount, collToReturn, 0);
        return collToReturn;
    }

    /*//////////////////////////////////////////////////////////////
                        TROVE STATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getEntireDebtAndColl(address _borrower)
        external
        view
        override
        returns (
            uint256 coll,
            uint256 debt,
            uint256 interest,
            uint256 pendingColl,
            uint256 pendingDebt,
            uint256 pendingInterest
        )
    {
        TroveData memory trove = troveData[_borrower];
        return (
            trove.collateral,
            trove.debt,
            trove.interest,
            0, // pendingColl
            0, // pendingDebt
            0  // pendingInterest
        );
    }

    function getCurrentICR(address _borrower, uint256 _price) external view override returns (uint256) {
        TroveData memory trove = troveData[_borrower];
        if (trove.debt == 0) return type(uint256).max;

        uint256 collValue = (trove.collateral * _price) / 1e18;
        return (collValue * _PERCENT_DIVISOR) / trove.debt;
    }

    function getNominalICR(address _borrower) external view override returns (uint256) {
        TroveData memory trove = troveData[_borrower];
        if (trove.debt == 0) return type(uint256).max;

        return (trove.collateral * 1e18) / trove.debt;
    }

    function getTroveDebtAndColl(address _borrower) external view override returns (uint256 debt, uint256 coll) {
        TroveData memory trove = troveData[_borrower];
        return (trove.debt, trove.collateral);
    }

    function getTrovePrincipal(address _borrower) external view override returns (uint256) {
        return troveData[_borrower].debt - troveData[_borrower].interest;
    }

    function getTroveInterestRate(address _borrower) external view override returns (uint256) {
        return troveData[_borrower].interestRate;
    }

    function getTroveLastInterestUpdateTime(address _borrower) external view override returns (uint256) {
        return troveData[_borrower].lastUpdateTime;
    }

    function getTroveMaxBorrowingCapacity(address _borrower) external view override returns (uint256) {
        TroveData memory trove = troveData[_borrower];
        // Max borrowing at MCR (110%)
        uint256 maxDebt = (trove.collateral * _PERCENT_DIVISOR) / _MCR;
        return maxDebt > trove.debt ? maxDebt - trove.debt : 0;
    }

    /*//////////////////////////////////////////////////////////////
                        SYSTEM STATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function checkRecoveryMode(uint256 _price) external view override returns (bool) {
        if (recoveryMode) return true;

        if (totalSystemDebt == 0) return false;
        uint256 tcr = getTCR(_price);
        return tcr < _CCR;
    }

    function getTCR(uint256 _price) public view override returns (uint256) {
        if (totalSystemDebt == 0) return type(uint256).max;

        uint256 totalCollValue = (totalSystemColl * _price) / 1e18;
        return (totalCollValue * _PERCENT_DIVISOR) / totalSystemDebt;
    }

    function getEntireSystemColl() external view override returns (uint256) {
        return totalSystemColl;
    }

    function getEntireSystemDebt() external view override returns (uint256) {
        return totalSystemDebt;
    }

    /*//////////////////////////////////////////////////////////////
                            FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getRedemptionRate(uint256 _collateralDrawn) external pure override returns (uint256) {
        _collateralDrawn;
        return 50; // 0.5% base rate
    }

    function getRedemptionRateWithDecay(uint256 _collateralDrawn) external pure override returns (uint256) {
        _collateralDrawn;
        return 50;
    }

    function getRedemptionFeeWithDecay(uint256 _collateralDrawn) external pure override returns (uint256) {
        return (_collateralDrawn * 50) / _PERCENT_DIVISOR;
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    function MCR() external pure override returns (uint256) {
        return _MCR;
    }

    function CCR() external pure override returns (uint256) {
        return _CCR;
    }

    function MUSD_GAS_COMPENSATION() external pure override returns (uint256) {
        return _GAS_COMPENSATION;
    }

    function MIN_NET_DEBT() external pure override returns (uint256) {
        return _MIN_NET_DEBT;
    }

    function PERCENT_DIVISOR() external pure override returns (uint256) {
        return _PERCENT_DIVISOR;
    }

    function BORROWING_FEE_FLOOR() external pure override returns (uint256) {
        return _BORROWING_FEE_FLOOR;
    }

    function MAX_BORROWING_FEE() external pure override returns (uint256) {
        return _MAX_BORROWING_FEE;
    }

    /*//////////////////////////////////////////////////////////////
                        CONTRACT ADDRESSES
    //////////////////////////////////////////////////////////////*/

    function borrowerOperationsAddress() external view override returns (address) {
        return borrowerOps;
    }

    function activePool() external view override returns (address) {
        return activePoolAddr;
    }

    function defaultPool() external pure override returns (address) {
        return address(0);
    }

    function stabilityPool() external pure override returns (address) {
        return address(0);
    }

    function gasPoolAddress() external pure override returns (address) {
        return address(0);
    }

    function collSurplusPool() external pure override returns (address) {
        return address(0);
    }

    function priceFeed() external pure override returns (address) {
        return address(0);
    }

    function musdToken() external pure override returns (address) {
        return address(0);
    }

    function sortedTroves() external pure override returns (address) {
        return address(0);
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set trove data for testing
     */
    function setTroveData(
        address borrower,
        uint256 coll,
        uint256 debt
    ) external {
        if (!troveData[borrower].exists) {
            totalSystemColl += coll;
            totalSystemDebt += debt;
        } else {
            totalSystemColl = totalSystemColl - troveData[borrower].collateral + coll;
            totalSystemDebt = totalSystemDebt - troveData[borrower].debt + debt;
        }

        troveData[borrower] = TroveData({
            collateral: coll,
            debt: debt,
            interest: 0,
            interestRate: 50, // 0.5%
            lastUpdateTime: block.timestamp,
            exists: true
        });

        emit MockTroveDataSet(borrower, coll, debt);
    }

    /**
     * @notice Set trove data with full params
     */
    function setTroveDataFull(
        address borrower,
        uint256 coll,
        uint256 debt,
        uint256 interest,
        uint256 interestRate
    ) external {
        if (!troveData[borrower].exists) {
            totalSystemColl += coll;
            totalSystemDebt += debt;
        } else {
            totalSystemColl = totalSystemColl - troveData[borrower].collateral + coll;
            totalSystemDebt = totalSystemDebt - troveData[borrower].debt + debt;
        }

        troveData[borrower] = TroveData({
            collateral: coll,
            debt: debt,
            interest: interest,
            interestRate: interestRate,
            lastUpdateTime: block.timestamp,
            exists: true
        });
    }

    /**
     * @notice Clear trove for testing
     */
    function clearTrove(address borrower) external {
        TroveData storage trove = troveData[borrower];
        if (trove.exists) {
            totalSystemColl -= trove.collateral;
            totalSystemDebt -= trove.debt;
            delete troveData[borrower];
        }
    }

    /**
     * @notice Set recovery mode for testing
     */
    function setRecoveryMode(bool _recoveryMode) external {
        recoveryMode = _recoveryMode;
    }

    /**
     * @notice Set failure mode
     */
    function setFailureMode(bool shouldRevert) external {
        shouldRevertOnLiquidate = shouldRevert;
    }

    /**
     * @notice Set borrower operations address
     */
    function setBorrowerOperations(address _borrowerOps) external {
        borrowerOps = _borrowerOps;
    }

    /**
     * @notice Set system totals directly
     */
    function setSystemTotals(uint256 coll, uint256 debt) external {
        totalSystemColl = coll;
        totalSystemDebt = debt;
    }
}
