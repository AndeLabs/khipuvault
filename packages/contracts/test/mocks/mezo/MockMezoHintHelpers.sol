// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoHintHelpers} from "../../../src/interfaces/IMezoHintHelpers.sol";

/**
 * @title MockMezoHintHelpers
 * @notice Comprehensive mock for Mezo HintHelpers - provides hint suggestions for trove operations
 * @dev Implements full IMezoHintHelpers interface for thorough testing
 * @author KhipuVault Team
 */
contract MockMezoHintHelpers is IMezoHintHelpers {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    address public defaultHint;
    bool public shouldRevert;
    string public revertReason;

    // Configurable hints per NICR
    mapping(uint256 => address) public nicrToHint;

    // Contract references
    address private _sortedTroves;
    address private _troveManager;
    address private _borrowerOperations;

    // Constants
    uint256 private constant _MCR = 11000;  // 110%
    uint256 private constant _CCR = 15000;  // 150%
    uint256 private constant _GAS_COMPENSATION = 200e18;  // 200 MUSD
    uint256 private constant _MIN_NET_DEBT = 1800e18;  // 1800 MUSD
    uint256 private constant _PERCENT_DIVISOR = 10000;

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        defaultHint = address(0);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getApproxHint(
        uint256 _CR,
        uint256 _numTrials,
        uint256 _inputRandomSeed
    )
        external
        view
        override
        returns (
            address hintAddress,
            uint256 diff,
            uint256 latestRandomSeed
        )
    {
        if (shouldRevert) {
            revert(revertReason);
        }

        // Suppress unused warnings
        _numTrials;

        // Check if we have a configured hint for this NICR
        address configuredHint = nicrToHint[_CR];
        if (configuredHint != address(0)) {
            return (configuredHint, 0, _inputRandomSeed + 1);
        }

        return (defaultHint, 0, _inputRandomSeed + 1);
    }

    function getRedemptionHints(
        uint256 _MUSDamount,
        uint256 _price,
        uint256 _maxIterations
    )
        external
        pure
        override
        returns (
            address firstRedemptionHint,
            uint256 partialRedemptionHintNICR,
            uint256 truncatedMUSDamount
        )
    {
        // Suppress unused warnings
        _price;
        _maxIterations;

        // Mock: return default values
        return (address(0), 0, _MUSDamount);
    }

    /*//////////////////////////////////////////////////////////////
                        COMPUTATION HELPERS
    //////////////////////////////////////////////////////////////*/

    function computeNominalCR(
        uint256 _coll,
        uint256 _debt
    ) external pure override returns (uint256) {
        if (_debt == 0) return type(uint256).max;
        return (_coll * 1e18) / _debt;
    }

    function computeCR(
        uint256 _coll,
        uint256 _debt,
        uint256 _price
    ) external pure override returns (uint256) {
        if (_debt == 0) return type(uint256).max;
        uint256 collValue = (_coll * _price) / 1e18;
        return (collValue * _PERCENT_DIVISOR) / _debt;
    }

    /*//////////////////////////////////////////////////////////////
                         POSITION HELPERS
    //////////////////////////////////////////////////////////////*/

    function computeNewNICR(
        uint256 _coll,
        uint256 _debt,
        uint256 _collChange,
        bool _isCollIncrease,
        uint256 _debtChange,
        bool _isDebtIncrease
    ) external pure override returns (uint256) {
        uint256 newColl = _isCollIncrease ? _coll + _collChange : _coll - _collChange;
        uint256 newDebt = _isDebtIncrease ? _debt + _debtChange : _debt - _debtChange;

        if (newDebt == 0) return type(uint256).max;
        return (newColl * 1e18) / newDebt;
    }

    /*//////////////////////////////////////////////////////////////
                        LIQUIDATION HELPERS
    //////////////////////////////////////////////////////////////*/

    function getLiquidationHints(
        address _troveManagerAddr,
        uint256 _price,
        uint256 _maxTrovesToCheck
    )
        external
        pure
        override
        returns (
            address[] memory liquidatableTroves,
            uint256 totalDebtToLiquidate,
            uint256 totalCollToLiquidate
        )
    {
        // Suppress unused warnings
        _troveManagerAddr;
        _price;
        _maxTrovesToCheck;

        // Mock: return empty arrays
        liquidatableTroves = new address[](0);
        totalDebtToLiquidate = 0;
        totalCollToLiquidate = 0;
    }

    /*//////////////////////////////////////////////////////////////
                         SYSTEM STATE HELPERS
    //////////////////////////////////////////////////////////////*/

    function getSystemStats(
        address _troveManagerAddr,
        uint256 _price
    )
        external
        pure
        override
        returns (
            uint256 totalCollateral,
            uint256 totalDebt,
            uint256 avgICR,
            uint256 trovesCount
        )
    {
        // Suppress unused warnings
        _troveManagerAddr;
        _price;

        // Mock: return reasonable defaults
        return (0, 0, 15000, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        INTEREST RATE HELPERS
    //////////////////////////////////////////////////////////////*/

    function estimateBorrowingFee(
        address _borrowerOps,
        uint256 _MUSDAmount
    )
        external
        pure
        override
        returns (
            uint256 estimatedFee,
            uint256 totalDebt
        )
    {
        // Suppress unused warnings
        _borrowerOps;

        // Mock: 0.5% fee
        estimatedFee = (_MUSDAmount * 50) / _PERCENT_DIVISOR;
        totalDebt = _MUSDAmount + estimatedFee + _GAS_COMPENSATION;
    }

    function calculateRefinancingBenefit(
        address _troveManagerAddr,
        address _borrower,
        address _interestRateManager
    )
        external
        pure
        override
        returns (
            uint256 currentRate,
            uint256 newRate,
            uint256 potentialSavings,
            uint256 refinancingFee,
            bool isWorthwhile
        )
    {
        // Suppress unused warnings
        _troveManagerAddr;
        _borrower;
        _interestRateManager;

        // Mock: refinancing not worthwhile
        return (50, 50, 0, 10, false);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function sortedTroves() external view override returns (address) {
        return _sortedTroves;
    }

    function troveManager() external view override returns (address) {
        return _troveManager;
    }

    function borrowerOperations() external view override returns (address) {
        return _borrowerOperations;
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

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set default hint address
     */
    function setDefaultHint(address _hint) external {
        defaultHint = _hint;
    }

    /**
     * @notice Set hint for specific NICR
     */
    function setHintForNICR(uint256 nicr, address hint) external {
        nicrToHint[nicr] = hint;
    }

    /**
     * @notice Set failure mode
     */
    function setFailureMode(bool _shouldRevert, string calldata _reason) external {
        shouldRevert = _shouldRevert;
        revertReason = _reason;
    }

    /**
     * @notice Set contract references
     */
    function setContractAddresses(
        address sortedTrovesAddr,
        address troveManagerAddr,
        address borrowerOpsAddr
    ) external {
        _sortedTroves = sortedTrovesAddr;
        _troveManager = troveManagerAddr;
        _borrowerOperations = borrowerOpsAddr;
    }

    /**
     * @notice Reset to default state
     */
    function reset() external {
        defaultHint = address(0);
        shouldRevert = false;
        revertReason = "";
    }
}
