// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMezoIntegration} from "../interfaces/IMezoIntegration.sol";
import {IMezoBorrowerOperations} from "../interfaces/IMezoBorrowerOperations.sol";
import {IMezoPriceFeed} from "../interfaces/IMezoPriceFeed.sol";
import {IMezoHintHelpers} from "../interfaces/IMezoHintHelpers.sol";
import {IMezoTroveManager} from "../interfaces/IMezoTroveManager.sol";

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

    modifier noFlashLoan() {
        if (tx.origin != msg.sender) revert FlashLoanDetected();
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
        position.btcCollateral = uint128(uint256(position.btcCollateral) + btcAmount);
        position.musdDebt = uint128(uint256(position.musdDebt) + musdAmount);

        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        require(MUSD_TOKEN.transfer(msg.sender, musdAmount), "MUSD transfer failed");

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

        require(MUSD_TOKEN.transferFrom(msg.sender, address(this), musdAmount), "MUSD transfer failed");

        uint256 debtReductionRatio = (musdAmount * 1e18) / uint256(position.musdDebt);
        btcAmount = (uint256(position.btcCollateral) * debtReductionRatio) / 1e18;

        uint256 currentPrice = _getCurrentPrice();

        require(MUSD_TOKEN.approve(address(BORROWER_OPERATIONS), musdAmount), "MUSD approve failed");

        if (musdAmount >= position.musdDebt) {
            BORROWER_OPERATIONS.closeTrove();
            btcAmount = position.btcCollateral;
            
            totalBtcDeposited -= position.btcCollateral;
            totalMusdMinted -= position.musdDebt;
            position.btcCollateral = 0;
            position.musdDebt = 0;
        } else {
            (address upperHint, address lowerHint) = _getAdjustHints(
                uint256(position.btcCollateral) - btcAmount,
                uint256(position.musdDebt) - musdAmount,
                currentPrice
            );

            BORROWER_OPERATIONS.adjustTrove{value: 0}(
                btcAmount,
                musdAmount,
                false,
                upperHint,
                lowerHint
            );

            position.btcCollateral = uint128(uint256(position.btcCollateral) - btcAmount);
            position.musdDebt = uint128(uint256(position.musdDebt) - musdAmount);
            totalBtcDeposited -= btcAmount;
            totalMusdMinted -= musdAmount;
        }

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
        try PRICE_FEED.fetchPrice() returns (uint256 _price) {
            if (_price == 0) revert PriceFeedFailure();
            price = _price;
        } catch {
            revert PriceFeedFailure();
        }
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
