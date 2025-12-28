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

import {IMezoPriceFeed} from "../../interfaces/IMezoPriceFeed.sol";
import {IMezoBorrowerOperations} from "../../interfaces/IMezoBorrowerOperations.sol";
import {IMezoTroveManager} from "../../interfaces/IMezoTroveManager.sol";
import {IMezoHintHelpers} from "../../interfaces/IMezoHintHelpers.sol";
import {PriceValidator} from "./PriceValidator.sol";

/**
 * @title BaseMezoIntegration
 * @notice Abstract base contract for Mezo protocol integrations
 * @dev Provides modular, reusable functionality:
 *      - Price validation with PriceValidator library
 *      - Flash loan protection (block-based)
 *      - Position management
 *      - Admin functions (pause, emergency mode)
 *      - UUPS upgradeable pattern
 *
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
abstract contract BaseMezoIntegration is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using PriceValidator for uint256;

    /*//////////////////////////////////////////////////////////////
                          STRUCTS (PACKED)
    //////////////////////////////////////////////////////////////*/

    /// @notice User position with packed storage
    struct UserPosition {
        uint128 btcCollateral;  // BTC collateral amount
        uint128 musdDebt;       // MUSD debt amount
    }

    /// @notice Price validation configuration
    struct PriceConfig {
        uint64 minPrice;         // Minimum valid price (scaled down)
        uint64 maxPrice;         // Maximum valid price (scaled down)
        uint32 stalenessThreshold; // Max seconds for price freshness
        uint16 maxDeviationBps;  // Max price deviation in basis points
        uint72 __gap;            // Reserved for future use
    }

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    // Protocol contracts
    IERC20 public MUSD_TOKEN;
    IMezoBorrowerOperations public BORROWER_OPERATIONS;
    IMezoPriceFeed public PRICE_FEED;
    IMezoHintHelpers public HINT_HELPERS;
    IMezoTroveManager public TROVE_MANAGER;

    // User positions
    mapping(address => UserPosition) public userPositions;

    // Flash loan protection
    mapping(address => uint256) public depositBlock;

    // Global state
    uint256 public totalBtcDeposited;
    uint256 public totalMusdMinted;

    // Configuration
    uint256 public targetLtv;         // Target LTV in basis points
    uint256 public maxFeePercentage;  // Max borrowing fee
    uint256 public hintRandomSeed;    // Seed for hint generation
    bool public emergencyMode;        // Emergency mode flag

    // Price tracking for deviation checks
    uint256 public lastKnownPrice;

    // Price configuration (uses defaults if not set)
    PriceConfig public priceConfig;

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant HINT_TRIALS = 15;
    uint256 public constant MIN_BTC_DEPOSIT = 0.001 ether;
    uint256 public constant MIN_COLLATERAL_RATIO = 11000;  // 110%
    uint256 public constant BPS = 10000;

    // Default price bounds (can be overridden)
    uint256 public constant DEFAULT_MIN_PRICE = 1_000 * 1e18;      // $1,000
    uint256 public constant DEFAULT_MAX_PRICE = 1_000_000 * 1e18;  // $1,000,000
    uint256 public constant DEFAULT_STALENESS = 3600;              // 1 hour
    uint256 public constant DEFAULT_MAX_DEVIATION = 5000;          // 50%

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    // Note: BTCDeposited and BTCWithdrawn are defined in IMezoIntegration
    // to avoid duplicate event definitions in derived contracts
    event TargetLtvUpdated(uint256 oldLtv, uint256 newLtv);
    event MaxFeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyModeUpdated(bool enabled);
    event PriceConfigUpdated(uint256 minPrice, uint256 maxPrice, uint256 staleness, uint256 maxDeviation);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientBalance();
    error UnhealthyPosition();
    error InvalidLtv();
    error ExcessiveFee();
    error SameBlockWithdrawal();
    error PriceFeedFailure();

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prevents flash loan attacks using block-based protection
     * @dev H-01 FIX: Unified approach - deposits and withdrawals must be in different blocks
     */
    modifier noFlashLoan() virtual {
        if (!emergencyMode) {
            if (depositBlock[msg.sender] == block.number) {
                revert SameBlockWithdrawal();
            }
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize base integration state
     * @param _musdToken MUSD token address
     * @param _borrowerOperations BorrowerOperations contract
     * @param _priceFeed PriceFeed contract
     * @param _hintHelpers HintHelpers contract
     * @param _troveManager TroveManager contract
     */
    function __BaseMezoIntegration_init(
        address _musdToken,
        address _borrowerOperations,
        address _priceFeed,
        address _hintHelpers,
        address _troveManager
    ) internal onlyInitializing {
        // Validate addresses
        if (_musdToken == address(0) ||
            _borrowerOperations == address(0) ||
            _priceFeed == address(0) ||
            _hintHelpers == address(0) ||
            _troveManager == address(0)
        ) revert InvalidAddress();

        // Initialize OpenZeppelin contracts
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        // Set protocol contracts
        MUSD_TOKEN = IERC20(_musdToken);
        BORROWER_OPERATIONS = IMezoBorrowerOperations(_borrowerOperations);
        PRICE_FEED = IMezoPriceFeed(_priceFeed);
        HINT_HELPERS = IMezoHintHelpers(_hintHelpers);
        TROVE_MANAGER = IMezoTroveManager(_troveManager);

        // Set defaults
        targetLtv = 5000;           // 50%
        maxFeePercentage = 500;     // 5%
        hintRandomSeed = 42;

        // Default price config (stored as scaled values)
        priceConfig = PriceConfig({
            minPrice: uint64(DEFAULT_MIN_PRICE / 1e15),  // Scale down for storage
            maxPrice: uint64(DEFAULT_MAX_PRICE / 1e15),
            stalenessThreshold: uint32(DEFAULT_STALENESS),
            maxDeviationBps: uint16(DEFAULT_MAX_DEVIATION),
            __gap: 0
        });

        // M-01 FIX: Initialize lastKnownPrice to prevent deviation bypass on first use
        // Only attempt if priceFeed is a contract (not just an address in tests)
        if (address(PRICE_FEED).code.length > 0) {
            try PRICE_FEED.fetchPrice() returns (uint256 initialPrice) {
                if (initialPrice >= DEFAULT_MIN_PRICE && initialPrice <= DEFAULT_MAX_PRICE) {
                    lastKnownPrice = initialPrice;
                }
            } catch {
                // If price fetch fails during init, leave at 0 (will be set on first operation)
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL: PRICE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get current validated price
     * @dev Uses PriceValidator library for all validations
     * @return price Current BTC/USD price
     */
    function _getCurrentPrice() internal virtual returns (uint256 price) {
        // Fetch price with staleness check via latestRoundData
        try PRICE_FEED.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Validate freshness
            PriceValidator.validateFreshness(updatedAt, _getStalenessThreshold());

            // Validate positive answer
            if (answer <= 0) revert PriceFeedFailure();
        } catch {
            // Fallback to fetchPrice without freshness guarantee
        }

        // Fetch final price
        try PRICE_FEED.fetchPrice() returns (uint256 _price) {
            if (_price == 0) revert PriceFeedFailure();
            price = _price;
        } catch {
            revert PriceFeedFailure();
        }

        // Validate bounds
        PriceValidator.validateBounds(price, _getMinPrice(), _getMaxPrice());

        // Validate deviation (skip if first price or emergency)
        if (lastKnownPrice > 0 && !emergencyMode) {
            PriceValidator.validateDeviation(price, lastKnownPrice, _getMaxDeviation());
        }

        // Update last known price
        lastKnownPrice = price;
    }

    /**
     * @notice Calculate MUSD amount based on collateral and LTV
     */
    function _calculateMusdAmount(
        uint256 btcAmount,
        uint256 btcPrice,
        uint256 ltv
    ) internal pure returns (uint256 musdAmount) {
        uint256 collateralValue = PriceValidator.calculateValue(btcAmount, btcPrice);
        musdAmount = (collateralValue * ltv) / BPS;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL: POSITION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Record a deposit for flash loan protection
     */
    function _recordDeposit() internal {
        depositBlock[msg.sender] = block.number;
    }

    /**
     * @notice Update user position (add)
     */
    function _addToPosition(address user, uint256 btcAmount, uint256 musdAmount) internal {
        UserPosition storage position = userPositions[user];
        position.btcCollateral = (uint256(position.btcCollateral) + btcAmount).toUint128();
        position.musdDebt = (uint256(position.musdDebt) + musdAmount).toUint128();

        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;
    }

    /**
     * @notice Update user position (subtract)
     */
    function _subtractFromPosition(address user, uint256 btcAmount, uint256 musdAmount) internal {
        UserPosition storage position = userPositions[user];
        position.btcCollateral = (uint256(position.btcCollateral) - btcAmount).toUint128();
        position.musdDebt = (uint256(position.musdDebt) - musdAmount).toUint128();

        totalBtcDeposited -= btcAmount;
        totalMusdMinted -= musdAmount;
    }

    /**
     * @notice Clear user position entirely
     */
    function _clearPosition(address user) internal {
        UserPosition storage position = userPositions[user];

        totalBtcDeposited -= position.btcCollateral;
        totalMusdMinted -= position.musdDebt;

        position.btcCollateral = 0;
        position.musdDebt = 0;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL: HINT HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get hints for trove insertion
     */
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

    /**
     * @notice Compute Nominal Individual Collateral Ratio
     */
    function _computeNICR(
        uint256 coll,
        uint256 debt,
        uint256 price
    ) internal pure returns (uint256 nicr) {
        if (debt == 0) return type(uint256).max;
        uint256 collValue = PriceValidator.calculateValue(coll, price);
        nicr = (collValue * 1e18) / debt;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL: CONFIG GETTERS
    //////////////////////////////////////////////////////////////*/

    function _getMinPrice() internal view returns (uint256) {
        return uint256(priceConfig.minPrice) * 1e15;  // Scale back up
    }

    function _getMaxPrice() internal view returns (uint256) {
        return uint256(priceConfig.maxPrice) * 1e15;
    }

    function _getStalenessThreshold() internal view returns (uint256) {
        return uint256(priceConfig.stalenessThreshold);
    }

    function _getMaxDeviation() internal view returns (uint256) {
        return uint256(priceConfig.maxDeviationBps);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if user position is healthy
     * @param user Address to check
     * @return healthy True if collateral ratio >= 110%
     */
    function isPositionHealthy(address user) public virtual returns (bool healthy) {
        UserPosition memory position = userPositions[user];
        if (position.musdDebt == 0) return true;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = PriceValidator.calculateValue(position.btcCollateral, price);

        healthy = PriceValidator.isHealthy(collateralValue, position.musdDebt, MIN_COLLATERAL_RATIO);
    }

    /**
     * @notice Get user's collateral ratio
     * @param user Address to query
     * @return ratio Collateral ratio in basis points
     */
    function getCollateralRatio(address user) external virtual returns (uint256 ratio) {
        UserPosition memory position = userPositions[user];
        if (position.musdDebt == 0) return type(uint256).max;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = PriceValidator.calculateValue(position.btcCollateral, price);

        ratio = PriceValidator.calculateCollateralRatio(collateralValue, position.musdDebt);
    }

    /**
     * @notice Get user position
     * @param user Address to query
     * @return btcCollateral BTC collateral amount
     * @return musdDebt MUSD debt amount
     */
    function getUserPosition(address user)
        external
        view
        virtual
        returns (uint256 btcCollateral, uint256 musdDebt)
    {
        UserPosition memory position = userPositions[user];
        return (position.btcCollateral, position.musdDebt);
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Toggle emergency mode
     */
    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
    }

    /**
     * @notice Update target LTV
     * @param newLtv New LTV in basis points (max 80%)
     */
    function setTargetLtv(uint256 newLtv) external onlyOwner {
        if (newLtv == 0 || newLtv > 8000) revert InvalidLtv();
        uint256 oldLtv = targetLtv;
        targetLtv = newLtv;
        emit TargetLtvUpdated(oldLtv, newLtv);
    }

    /**
     * @notice Update max fee percentage
     * @param newFee New fee in basis points (max 10%)
     */
    function setMaxFeePercentage(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert ExcessiveFee();
        uint256 oldFee = maxFeePercentage;
        maxFeePercentage = newFee;
        emit MaxFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update price validation config
     */
    function setPriceConfig(
        uint256 minPrice,
        uint256 maxPrice,
        uint256 staleness,
        uint256 maxDeviation
    ) external onlyOwner {
        priceConfig = PriceConfig({
            minPrice: uint64(minPrice / 1e15),
            maxPrice: uint64(maxPrice / 1e15),
            stalenessThreshold: uint32(staleness),
            maxDeviationBps: uint16(maxDeviation),
            __gap: 0
        });
        emit PriceConfigUpdated(minPrice, maxPrice, staleness, maxDeviation);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                       UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Authorize upgrade (UUPS pattern)
     * @dev L-04 FIX: Added validation for new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        require(newImplementation.code.length > 0, "Not a contract");
    }

    /*//////////////////////////////////////////////////////////////
                           STORAGE GAP
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     *
     * NOTE: OpenZeppelin v5+ uses ERC-7201 namespaced storage pattern.
     * Inherited OZ contracts store state in hash-based slots, not sequential.
     * The gap accounts for THIS contract's state variables (~10 slots):
     *   - MUSD_TOKEN, BORROWER_OPERATIONS, PRICE_FEED, HINT_HELPERS, TROVE_MANAGER (5 slots)
     *   - targetLtv, maxFeePercentage, emergencyMode, lastKnownPrice (4 slots)
     *   - priceConfig, hintRandomSeed (2 slots)
     *   - userPositions, depositBlock (2 slots - mappings)
     *
     * Size: 50 slots - 10 slots used = 40 slots reserved for future state variables
     */
    uint256[40] private __gap;

    /*//////////////////////////////////////////////////////////////
                           RECEIVE ETH
    //////////////////////////////////////////////////////////////*/

    receive() external payable virtual {}
}
