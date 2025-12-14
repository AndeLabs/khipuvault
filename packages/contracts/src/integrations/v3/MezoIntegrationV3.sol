// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IMezoIntegration} from "../../interfaces/IMezoIntegration.sol";
import {IMezoBorrowerOperations} from "../../interfaces/IMezoBorrowerOperations.sol";
import {IMezoPriceFeed} from "../../interfaces/IMezoPriceFeed.sol";
import {IMezoHintHelpers} from "../../interfaces/IMezoHintHelpers.sol";
import {IMezoTroveManager} from "../../interfaces/IMezoTroveManager.sol";

/**
 * @title MezoIntegrationV3 - Production Grade with UUPS Proxy
 * @notice Wrapper para Mezo MUSD protocol con BTC nativo
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing
 *      ✅ Flash loan protection
 *      ✅ Emergency mode
 *      ✅ Optimized gas usage
 * 
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract MezoIntegrationV3 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    IMezoIntegration
{
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    /*//////////////////////////////////////////////////////////////
                          STRUCTS (OPTIMIZED)
    //////////////////////////////////////////////////////////////*/

    struct UserPosition {
        uint128 btcCollateral;
        uint128 musdDebt;
    }

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public MUSD_TOKEN;
    IMezoBorrowerOperations public BORROWER_OPERATIONS;
    IMezoPriceFeed public PRICE_FEED;
    IMezoHintHelpers public HINT_HELPERS;
    IMezoTroveManager public TROVE_MANAGER;

    mapping(address => UserPosition) public userPositions;

    uint256 public totalBtcDeposited;
    uint256 public totalMusdMinted;
    uint256 public targetLtv;
    uint256 public maxFeePercentage;
    uint256 public hintRandomSeed;
    bool public emergencyMode;

    uint256 public constant HINT_TRIALS = 15;
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600;
    uint256 public constant MIN_BTC_DEPOSIT = 0.001 ether;

    // Price bounds to detect oracle manipulation or malfunctions
    // BTC price: min $1,000, max $1,000,000 (in 18 decimal format: $1 = 1e18)
    uint256 public constant MIN_BTC_PRICE = 1_000 * 1e18;     // $1,000
    uint256 public constant MAX_BTC_PRICE = 1_000_000 * 1e18; // $1,000,000

    // Maximum allowed price deviation from last known price (50%)
    uint256 public constant MAX_PRICE_DEVIATION = 5000; // 50% in basis points

    // Last known good price for deviation checks
    uint256 public lastKnownPrice;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TargetLtvUpdated(uint256 oldLtv, uint256 newLtv);
    event MaxFeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyModeUpdated(bool enabled);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAmount();
    error InvalidAddress();
    error InsufficientCollateral();
    error InsufficientBalance();
    error UnhealthyPosition();
    error CollateralRatioTooLow();
    error StalePriceData();
    error InvalidLtv();
    error TroveNotExists();
    error PriceFeedFailure();
    error ExcessiveFee();
    error FlashLoanDetected();
    error PriceOutOfBounds(uint256 price, uint256 minPrice, uint256 maxPrice);
    error ExcessivePriceDeviation(uint256 currentPrice, uint256 lastPrice, uint256 maxDeviation);

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _musdToken,
        address _borrowerOperations,
        address _priceFeed,
        address _hintHelpers,
        address _troveManager
    ) public initializer {
        if (_musdToken == address(0) ||
            _borrowerOperations == address(0) ||
            _priceFeed == address(0) ||
            _hintHelpers == address(0) ||
            _troveManager == address(0)
        ) revert InvalidAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        MUSD_TOKEN = IERC20(_musdToken);
        BORROWER_OPERATIONS = IMezoBorrowerOperations(_borrowerOperations);
        PRICE_FEED = IMezoPriceFeed(_priceFeed);
        HINT_HELPERS = IMezoHintHelpers(_hintHelpers);
        TROVE_MANAGER = IMezoTroveManager(_troveManager);
        
        targetLtv = 5000;
        maxFeePercentage = 500;
        hintRandomSeed = 42;
    }

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prevents flash loan attacks
     * @dev Uses contract code check instead of tx.origin for better compatibility
     *      with meta-transactions, account abstraction, and to avoid phishing risks.
     *      Existing users (with positions) are allowed as they've passed previous checks.
     */
    modifier noFlashLoan() {
        if (!emergencyMode) {
            // Check if caller has code (is a contract)
            uint256 size;
            address sender = msg.sender;
            assembly {
                size := extcodesize(sender)
            }
            // If it's a contract, only allow if they already have a position
            // (prevents single-transaction flash loan attacks)
            if (size > 0 && userPositions[sender].btcCollateral == 0) {
                revert FlashLoanDetected();
            }
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

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

        uint256 currentPrice = _getCurrentPrice();
        musdAmount = _calculateMusdAmount(btcAmount, currentPrice, targetLtv);

        (, uint256 currentDebt) = TROVE_MANAGER.getTroveDebtAndColl(msg.sender);

        if (currentDebt == 0) {
            _openTrove(btcAmount, musdAmount, currentPrice);
        } else {
            _adjustTrove(btcAmount, musdAmount, true, currentPrice);
        }

        UserPosition storage position = userPositions[msg.sender];
        // H-3 FIX: Use SafeCast for safe downcasting
        position.btcCollateral = (uint256(position.btcCollateral) + btcAmount).toUint128();
        position.musdDebt = (uint256(position.musdDebt) + musdAmount).toUint128();

        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        // Use SafeERC20 for safe transfers (handles non-standard ERC20 tokens)
        MUSD_TOKEN.safeTransfer(msg.sender, musdAmount);

        if (!isPositionHealthy(msg.sender)) revert UnhealthyPosition();

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    function depositAndMint(uint256) 
        external 
        pure
        override
        returns (uint256)
    {
        revert("Use depositAndMintNative() with payable BTC");
    }

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

        // Use SafeERC20 for safe transfers
        MUSD_TOKEN.safeTransferFrom(msg.sender, address(this), musdAmount);

        uint256 debtReductionRatio = (musdAmount * 1e18) / uint256(position.musdDebt);
        btcAmount = (uint256(position.btcCollateral) * debtReductionRatio) / 1e18;

        uint256 currentPrice = _getCurrentPrice();

        // Use forceApprove to handle tokens that require approval to be reset to 0 first
        MUSD_TOKEN.forceApprove(address(BORROWER_OPERATIONS), musdAmount);

        if (musdAmount >= position.musdDebt) {
            // H-04 FIX: CEI Pattern - Update state BEFORE external call
            // Cache values for state update
            uint256 collateralToReturn = position.btcCollateral;
            uint256 debtToRepay = position.musdDebt;

            // Effects: Update internal state first
            position.btcCollateral = 0;
            position.musdDebt = 0;
            totalBtcDeposited -= collateralToReturn;
            totalMusdMinted -= debtToRepay;
            btcAmount = collateralToReturn;

            // Interactions: External call after state updates
            // closeTrove reverts on failure, which will undo state changes
            BORROWER_OPERATIONS.closeTrove();
        } else {
            // H-04 FIX: CEI Pattern - Update state BEFORE external call
            // Cache values for state update
            uint256 newCollateral = uint256(position.btcCollateral) - btcAmount;
            uint256 newDebt = uint256(position.musdDebt) - musdAmount;

            // Effects: Update internal state first (H-3 FIX: SafeCast)
            position.btcCollateral = newCollateral.toUint128();
            position.musdDebt = newDebt.toUint128();
            totalBtcDeposited -= btcAmount;
            totalMusdMinted -= musdAmount;

            // Calculate hints after state update (uses new values)
            (address upperHint, address lowerHint) = _getAdjustHints(
                newCollateral,
                newDebt,
                currentPrice
            );

            // Interactions: External call after state updates
            // adjustTrove reverts on failure, which will undo state changes
            BORROWER_OPERATIONS.adjustTrove{value: 0}(
                btcAmount,
                musdAmount,
                false,
                upperHint,
                lowerHint
            );
        }

        // Final interaction: Transfer BTC to user
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        emit BTCWithdrawn(msg.sender, btcAmount, musdAmount);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function isPositionHealthy(address user) public override returns (bool healthy) {
        UserPosition memory position = userPositions[user];
        if (position.musdDebt == 0) return true;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = (uint256(position.btcCollateral) * price) / 1e18;
        uint256 collateralRatio = (collateralValue * 10000) / uint256(position.musdDebt);

        return collateralRatio >= 11000;
    }

    function getCollateralRatio(address user) external override returns (uint256 ratio) {
        UserPosition memory position = userPositions[user];
        if (position.musdDebt == 0) return type(uint256).max;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = (uint256(position.btcCollateral) * price) / 1e18;
        ratio = (collateralValue * 10000) / uint256(position.musdDebt);
    }

    function getUserPosition(address user) 
        external 
        view 
        override 
        returns (uint256 btcCollateral, uint256 musdDebt) 
    {
        UserPosition memory position = userPositions[user];
        return (position.btcCollateral, position.musdDebt);
    }

    /*//////////////////////////////////////////////////////////////
                       INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _getCurrentPrice() internal returns (uint256 price) {
        // First, verify price is fresh using latestRoundData
        try PRICE_FEED.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check staleness using our threshold
            if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
                revert StalePriceData();
            }
            // Validate answer is positive
            if (answer <= 0) {
                revert PriceFeedFailure();
            }
        } catch {
            // If latestRoundData fails, try fetchPrice as fallback
            // but log warning - price freshness cannot be verified
        }

        // Fetch the price (this may include additional validations)
        try PRICE_FEED.fetchPrice() returns (uint256 _price) {
            if (_price == 0) revert PriceFeedFailure();
            price = _price;
        } catch {
            revert PriceFeedFailure();
        }

        // === PRICE BOUNDS VALIDATION ===
        // Check price is within reasonable bounds (protects against oracle manipulation)
        if (price < MIN_BTC_PRICE || price > MAX_BTC_PRICE) {
            revert PriceOutOfBounds(price, MIN_BTC_PRICE, MAX_BTC_PRICE);
        }

        // Check price deviation from last known price (protects against flash crashes)
        // Skip this check if this is the first price fetch or in emergency mode
        if (lastKnownPrice > 0 && !emergencyMode) {
            uint256 deviation;
            if (price > lastKnownPrice) {
                deviation = ((price - lastKnownPrice) * 10000) / lastKnownPrice;
            } else {
                deviation = ((lastKnownPrice - price) * 10000) / lastKnownPrice;
            }

            if (deviation > MAX_PRICE_DEVIATION) {
                revert ExcessivePriceDeviation(price, lastKnownPrice, MAX_PRICE_DEVIATION);
            }
        }

        // Update last known price for future deviation checks
        lastKnownPrice = price;
    }

    function _calculateMusdAmount(
        uint256 btcAmount,
        uint256 btcPrice,
        uint256 ltv
    ) internal pure returns (uint256 musdAmount) {
        uint256 collateralValue = (btcAmount * btcPrice) / 1e18;
        musdAmount = (collateralValue * ltv) / 10000;
    }

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

        (address upperHint, address lowerHint) = _getAdjustHints(
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

    function _getInsertHints(
        uint256 coll,
        uint256 debt,
        uint256 price
    ) internal view returns (address upperHint, address lowerHint) {
        uint256 nicr = _computeNICR(coll, debt, price);
        
        try HINT_HELPERS.getApproxHint(nicr, HINT_TRIALS, hintRandomSeed) 
            returns (address hint, uint256, uint256) 
        {
            (upperHint, lowerHint) = (hint, hint);
        } catch {
            (upperHint, lowerHint) = (address(0), address(0));
        }
    }

    function _getAdjustHints(
        uint256 newColl,
        uint256 newDebt,
        uint256 price
    ) internal view returns (address upperHint, address lowerHint) {
        return _getInsertHints(newColl, newDebt, price);
    }

    function _computeNICR(
        uint256 coll,
        uint256 debt,
        uint256 price
    ) internal pure returns (uint256 nicr) {
        if (debt == 0) return type(uint256).max;
        uint256 collValue = (coll * price) / 1e18;
        nicr = (collValue * 1e18) / debt;
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
    }

    function setTargetLtv(uint256 newLtv) external onlyOwner {
        if (newLtv == 0 || newLtv > 8000) revert InvalidLtv();
        uint256 oldLtv = targetLtv;
        targetLtv = newLtv;
        emit TargetLtvUpdated(oldLtv, newLtv);
    }

    function setMaxFeePercentage(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert ExcessiveFee();
        uint256 oldFee = maxFeePercentage;
        maxFeePercentage = newFee;
        emit MaxFeeUpdated(oldFee, newFee);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                       UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function version() external pure returns (string memory) {
        return "3.0.0";
    }

    receive() external payable {}
}
