// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoBorrowerOperations} from "../../../src/interfaces/IMezoBorrowerOperations.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMezoBorrowerOperations
 * @notice Comprehensive mock for Mezo BorrowerOperations - simulates trove operations
 * @dev Tracks collateral/debt state and can simulate success/failure scenarios
 * @author KhipuVault Team
 */
contract MockMezoBorrowerOperations is IMezoBorrowerOperations {
    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Trove {
        uint256 collateral;
        uint256 debt;
        bool exists;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    mapping(address => Trove) public troves;

    IERC20 public musdToken;
    address public troveManager;

    // Borrowing parameters
    uint256 private _borrowingRate = 50; // 0.5% default
    uint256 private _refinancingFee = 10; // 0.1% default

    // Failure simulation
    bool public shouldRevertOnOpen;
    bool public shouldRevertOnAdjust;
    bool public shouldRevertOnClose;
    string public revertReason;

    // Stats tracking
    uint256 public totalCollateral;
    uint256 public totalDebt;
    uint256 public troveCount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MockTroveOpened(address indexed borrower, uint256 coll, uint256 debt);
    event MockTroveAdjusted(address indexed borrower, uint256 newColl, uint256 newDebt);
    event MockTroveClosed(address indexed borrower);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _musdToken) {
        musdToken = IERC20(_musdToken);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function openTrove(
        uint256 _maxFeePercentage,
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external payable override {
        // Suppress unused parameter warnings
        _maxFeePercentage;
        _upperHint;
        _lowerHint;

        if (shouldRevertOnOpen) {
            revert(revertReason);
        }

        require(!troves[msg.sender].exists, "Trove already exists");
        require(msg.value > 0, "Zero collateral");
        require(_MUSDAmount > 0, "Zero debt");

        troves[msg.sender] = Trove({
            collateral: msg.value,
            debt: _MUSDAmount,
            exists: true
        });

        totalCollateral += msg.value;
        totalDebt += _MUSDAmount;
        troveCount++;

        emit TroveCreated(msg.sender, troveCount - 1);
        emit TroveUpdated(msg.sender, _MUSDAmount, msg.value, 0);
        emit MockTroveOpened(msg.sender, msg.value, _MUSDAmount);
    }

    function adjustTrove(
        uint256 _collWithdrawal,
        uint256 _MUSDChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable override {
        // Suppress unused parameter warnings
        _upperHint;
        _lowerHint;

        if (shouldRevertOnAdjust) {
            revert(revertReason);
        }

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");

        // Handle collateral changes
        if (msg.value > 0) {
            trove.collateral += msg.value;
            totalCollateral += msg.value;
        }

        if (_collWithdrawal > 0) {
            require(trove.collateral >= _collWithdrawal, "Insufficient collateral");
            trove.collateral -= _collWithdrawal;
            totalCollateral -= _collWithdrawal;

            // Transfer collateral back
            (bool success, ) = msg.sender.call{value: _collWithdrawal}("");
            require(success, "Collateral transfer failed");
        }

        // Handle debt changes
        if (_MUSDChange > 0) {
            if (_isDebtIncrease) {
                trove.debt += _MUSDChange;
                totalDebt += _MUSDChange;
            } else {
                require(trove.debt >= _MUSDChange, "Insufficient debt");
                trove.debt -= _MUSDChange;
                totalDebt -= _MUSDChange;
            }
        }

        emit TroveUpdated(msg.sender, trove.debt, trove.collateral, 1);
        emit MockTroveAdjusted(msg.sender, trove.collateral, trove.debt);
    }

    function closeTrove() external override {
        if (shouldRevertOnClose) {
            revert(revertReason);
        }

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");

        uint256 collateral = trove.collateral;
        uint256 debt = trove.debt;

        // Clear trove state
        totalCollateral -= collateral;
        totalDebt -= debt;
        troveCount--;
        delete troves[msg.sender];

        // Return collateral
        if (collateral > 0) {
            (bool success, ) = msg.sender.call{value: collateral}("");
            require(success, "Collateral return failed");
        }

        emit TroveUpdated(msg.sender, 0, 0, 2);
        emit MockTroveClosed(msg.sender);
    }

    function refinance(
        address _upperHint,
        address _lowerHint
    ) external override {
        // Suppress unused parameter warnings
        _upperHint;
        _lowerHint;

        require(troves[msg.sender].exists, "Trove does not exist");
        // In mock, refinancing is a no-op
        emit TroveUpdated(msg.sender, troves[msg.sender].debt, troves[msg.sender].collateral, 3);
    }

    function addColl(
        address _upperHint,
        address _lowerHint
    ) external payable override {
        // Suppress unused parameter warnings
        _upperHint;
        _lowerHint;

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");
        require(msg.value > 0, "Zero collateral");

        trove.collateral += msg.value;
        totalCollateral += msg.value;

        emit TroveUpdated(msg.sender, trove.debt, trove.collateral, 1);
    }

    function withdrawColl(
        uint256 _collWithdrawal,
        address _upperHint,
        address _lowerHint
    ) external override {
        // Suppress unused parameter warnings
        _upperHint;
        _lowerHint;

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");
        require(trove.collateral >= _collWithdrawal, "Insufficient collateral");

        trove.collateral -= _collWithdrawal;
        totalCollateral -= _collWithdrawal;

        (bool success, ) = msg.sender.call{value: _collWithdrawal}("");
        require(success, "Withdrawal failed");

        emit TroveUpdated(msg.sender, trove.debt, trove.collateral, 1);
    }

    function withdrawMUSD(
        uint256 _maxFeePercentage,
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external override {
        // Suppress unused parameter warnings
        _maxFeePercentage;
        _upperHint;
        _lowerHint;

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");

        trove.debt += _MUSDAmount;
        totalDebt += _MUSDAmount;

        emit TroveUpdated(msg.sender, trove.debt, trove.collateral, 1);
    }

    function repayMUSD(
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external override {
        // Suppress unused parameter warnings
        _upperHint;
        _lowerHint;

        Trove storage trove = troves[msg.sender];
        require(trove.exists, "Trove does not exist");
        require(trove.debt >= _MUSDAmount, "Insufficient debt");

        trove.debt -= _MUSDAmount;
        totalDebt -= _MUSDAmount;

        emit TroveUpdated(msg.sender, trove.debt, trove.collateral, 1);
    }

    function restrictedAdjustTrove(
        address _borrower,
        address _recipient,
        address _caller,
        uint256 _collWithdrawal,
        uint256 _MUSDChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable override {
        // Suppress unused parameter warnings
        _recipient;
        _caller;
        _upperHint;
        _lowerHint;

        Trove storage trove = troves[_borrower];
        require(trove.exists, "Trove does not exist");

        if (msg.value > 0) {
            trove.collateral += msg.value;
            totalCollateral += msg.value;
        }

        if (_collWithdrawal > 0) {
            trove.collateral -= _collWithdrawal;
            totalCollateral -= _collWithdrawal;
        }

        if (_MUSDChange > 0) {
            if (_isDebtIncrease) {
                trove.debt += _MUSDChange;
                totalDebt += _MUSDChange;
            } else {
                trove.debt -= _MUSDChange;
                totalDebt -= _MUSDChange;
            }
        }

        emit TroveUpdated(_borrower, trove.debt, trove.collateral, 1);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getBorrowingRate() external view override returns (uint256) {
        return _borrowingRate;
    }

    function getBorrowingRateWithDecay() external view override returns (uint256) {
        return _borrowingRate;
    }

    function getBorrowingFee(uint256 _MUSDDebt) external view override returns (uint256) {
        return (_MUSDDebt * _borrowingRate) / 10000;
    }

    function getBorrowingFeeWithDecay(uint256 _MUSDDebt) external view override returns (uint256) {
        return (_MUSDDebt * _borrowingRate) / 10000;
    }

    function refinancingFeePercentage() external view override returns (uint256) {
        return _refinancingFee;
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set failure mode for testing
     * @param operation "open", "adjust", or "close"
     * @param shouldRevert Whether operation should revert
     * @param reason Revert reason message
     */
    function setFailureMode(string calldata operation, bool shouldRevert, string calldata reason) external {
        bytes32 opHash = keccak256(bytes(operation));
        revertReason = reason;

        if (opHash == keccak256("open")) {
            shouldRevertOnOpen = shouldRevert;
        } else if (opHash == keccak256("adjust")) {
            shouldRevertOnAdjust = shouldRevert;
        } else if (opHash == keccak256("close")) {
            shouldRevertOnClose = shouldRevert;
        }
    }

    /**
     * @notice Reset all failure modes
     */
    function resetFailureModes() external {
        shouldRevertOnOpen = false;
        shouldRevertOnAdjust = false;
        shouldRevertOnClose = false;
        revertReason = "";
    }

    /**
     * @notice Set borrowing rate for testing
     */
    function setBorrowingRate(uint256 rate) external {
        _borrowingRate = rate;
    }

    /**
     * @notice Get trove data for an address
     */
    function getTrove(address borrower) external view returns (uint256 coll, uint256 debt, bool exists) {
        Trove memory trove = troves[borrower];
        return (trove.collateral, trove.debt, trove.exists);
    }

    /**
     * @notice Directly set trove state for testing
     */
    function setTrove(address borrower, uint256 coll, uint256 debt) external {
        if (!troves[borrower].exists) {
            troveCount++;
        }
        troves[borrower] = Trove({
            collateral: coll,
            debt: debt,
            exists: true
        });
    }

    /**
     * @notice Set MUSD token address
     */
    function setMusdToken(address _musdToken) external {
        musdToken = IERC20(_musdToken);
    }

    /**
     * @notice Accept native BTC
     */
    receive() external payable {}
}
