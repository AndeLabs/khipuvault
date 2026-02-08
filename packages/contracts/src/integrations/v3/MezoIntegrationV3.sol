// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {BaseMezoIntegration} from "../base/BaseMezoIntegration.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {PriceValidator} from "../base/PriceValidator.sol";

/**
 * @title MezoIntegrationV3 - Production Grade with Modular Architecture
 * @notice Wrapper for Mezo MUSD protocol with native BTC
 * @dev Inherits from BaseMezoIntegration for:
 *      - Price validation (PriceValidator library)
 *      - Flash loan protection (block-based)
 *      - Position management
 *      - Admin functions
 *      - UUPS upgradeable pattern
 *
 * This contract handles the specific trove operations:
 *      - Opening/closing troves
 *      - Adjusting collateral and debt
 *      - Minting/burning MUSD
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract MezoIntegrationV3 is BaseMezoIntegration, IMezoIntegration {
    using SafeERC20 for IERC20;
    using PriceValidator for uint256;

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the integration contract
     * @param _musdToken MUSD token address
     * @param _borrowerOperations BorrowerOperations contract
     * @param _priceFeed PriceFeed contract
     * @param _hintHelpers HintHelpers contract
     * @param _troveManager TroveManager contract
     */
    function initialize(
        address _musdToken,
        address _borrowerOperations,
        address _priceFeed,
        address _hintHelpers,
        address _troveManager
    ) public initializer {
        __BaseMezoIntegration_init(
            _musdToken,
            _borrowerOperations,
            _priceFeed,
            _hintHelpers,
            _troveManager
        );
    }

    /*//////////////////////////////////////////////////////////////
                         CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit native BTC and mint MUSD
     * @return musdAmount Amount of MUSD minted
     */
    function depositAndMintNative()
        external
        payable
        override
        nonReentrant
        whenNotPaused
        noFlashLoan
        returns (uint256 musdAmount)
    {
        uint256 btcAmount = msg.value;
        if (btcAmount < MIN_BTC_DEPOSIT) revert InvalidAmount();

        // Record deposit for flash loan protection
        _recordDeposit();

        // Get validated price
        uint256 currentPrice = _getCurrentPrice();

        // Calculate MUSD to mint
        musdAmount = _calculateMusdAmount(btcAmount, currentPrice, targetLtv);

        // CEI FIX: Update position tracking BEFORE external calls
        _addToPosition(msg.sender, btcAmount, musdAmount);

        // Check if user has existing trove
        (, uint256 currentDebt) = TROVE_MANAGER.getTroveDebtAndColl(msg.sender);

        if (currentDebt == 0) {
            _openTrove(btcAmount, musdAmount, currentPrice);
        } else {
            _adjustTrove(btcAmount, musdAmount, true, currentPrice);
        }

        // Transfer MUSD to user
        MUSD_TOKEN.safeTransfer(msg.sender, musdAmount);

        // Verify position health
        if (!isPositionHealthy(msg.sender)) revert UnhealthyPosition();

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Legacy function - reverts with helpful message
     */
    function depositAndMint(uint256)
        external
        pure
        override
        returns (uint256)
    {
        revert("Use depositAndMintNative() with payable BTC");
    }

    /**
     * @notice Burn MUSD and withdraw BTC
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
     */
    function burnAndWithdraw(uint256 musdAmount)
        external
        override
        nonReentrant
        whenNotPaused
        noFlashLoan
        returns (uint256 btcAmount)
    {
        if (musdAmount == 0) revert InvalidAmount();

        UserPosition storage position = userPositions[msg.sender];
        if (position.musdDebt < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from user
        MUSD_TOKEN.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Calculate BTC to return (proportional)
        // FIX: Single operation to avoid divide-before-multiply precision loss
        btcAmount = (uint256(position.btcCollateral) * musdAmount) / uint256(position.musdDebt);

        // Get validated price for hints
        uint256 currentPrice = _getCurrentPrice();

        // Approve MUSD spending
        MUSD_TOKEN.forceApprove(address(BORROWER_OPERATIONS), musdAmount);

        if (musdAmount >= position.musdDebt) {
            // Full withdrawal - close trove
            // H-04 FIX: CEI Pattern - Update state BEFORE external call
            btcAmount = position.btcCollateral;
            _clearPosition(msg.sender);

            // External call after state update
            BORROWER_OPERATIONS.closeTrove();
        } else {
            // Partial withdrawal - adjust trove
            // H-04 FIX: CEI Pattern - Update state BEFORE external call
            uint256 newCollateral = uint256(position.btcCollateral) - btcAmount;
            uint256 newDebt = uint256(position.musdDebt) - musdAmount;

            _subtractFromPosition(msg.sender, btcAmount, musdAmount);

            // Get hints for new position
            (address upperHint, address lowerHint) = _getInsertHints(
                newCollateral,
                newDebt,
                currentPrice
            );

            // External call after state update
            BORROWER_OPERATIONS.adjustTrove{value: 0}(
                btcAmount,
                musdAmount,
                false,
                upperHint,
                lowerHint
            );
        }

        // Transfer BTC to user
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        emit BTCWithdrawn(msg.sender, btcAmount, musdAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL: TROVE OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Open a new trove
     */
    function _openTrove(
        uint256 btcAmount,
        uint256 musdAmount,
        uint256 currentPrice
    ) internal {
        (address upperHint, address lowerHint) = _getInsertHints(
            btcAmount,
            musdAmount,
            currentPrice
        );

        BORROWER_OPERATIONS.openTrove{value: btcAmount}(
            maxFeePercentage,
            musdAmount,
            upperHint,
            lowerHint
        );
    }

    /**
     * @notice Adjust existing trove
     */
    function _adjustTrove(
        uint256 btcAmount,
        uint256 musdAmount,
        bool isDebtIncrease,
        uint256 currentPrice
    ) internal {
        UserPosition memory position = userPositions[msg.sender];
        uint256 newCollateral = uint256(position.btcCollateral) + btcAmount;
        uint256 newDebt = isDebtIncrease
            ? uint256(position.musdDebt) + musdAmount
            : uint256(position.musdDebt) - musdAmount;

        (address upperHint, address lowerHint) = _getInsertHints(
            newCollateral,
            newDebt,
            currentPrice
        );

        BORROWER_OPERATIONS.adjustTrove{value: btcAmount}(
            0,
            musdAmount,
            isDebtIncrease,
            upperHint,
            lowerHint
        );
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS (OVERRIDES)
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if user position is healthy
     * @dev Override to satisfy both base and interface
     */
    function isPositionHealthy(address user)
        public
        override(BaseMezoIntegration, IMezoIntegration)
        returns (bool healthy)
    {
        return super.isPositionHealthy(user);
    }

    /**
     * @notice Get user's collateral ratio
     * @dev Override to satisfy both base and interface
     */
    function getCollateralRatio(address user)
        external
        override(BaseMezoIntegration, IMezoIntegration)
        returns (uint256 ratio)
    {
        UserPosition memory position = userPositions[user];
        if (position.musdDebt == 0) return type(uint256).max;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = PriceValidator.calculateValue(position.btcCollateral, price);

        ratio = PriceValidator.calculateCollateralRatio(collateralValue, position.musdDebt);
    }

    /**
     * @notice Get user position
     * @dev Override to satisfy both base and interface
     */
    function getUserPosition(address user)
        external
        view
        override(BaseMezoIntegration, IMezoIntegration)
        returns (uint256 btcCollateral, uint256 musdDebt)
    {
        UserPosition memory position = userPositions[user];
        return (position.btcCollateral, position.musdDebt);
    }

    /**
     * @notice Get contract version
     */
    function version() external pure returns (string memory) {
        return "3.1.0";  // Bumped for modular refactor
    }
}
