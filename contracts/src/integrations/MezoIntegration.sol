// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMezoIntegration} from "../interfaces/IMezoIntegration.sol";
import {IMezoBorrowerOperations} from "../interfaces/IMezoBorrowerOperations.sol";
import {IMezoPriceFeed} from "../interfaces/IMezoPriceFeed.sol";
import {IMezoHintHelpers} from "../interfaces/IMezoHintHelpers.sol";
import {IMezoTroveManager} from "../interfaces/IMezoTroveManager.sol";

/**
 * @title MezoIntegration
 * @notice Wrapper for Mezo MUSD protocol - Works with NATIVE BTC on Mezo chain
 * @dev Handles native BTC deposits, MUSD minting via Mezo protocol
 *
 * IMPORTANT: On Mezo, BTC is NATIVE (like ETH on Ethereum)
 * - BTC is sent via msg.value (payable functions)
 * - BTC has 18 decimals on Mezo (not 8 like real BTC)
 * - MUSD already exists on Mezo, no need to deploy
 * 
 * Architecture:
 * - Integrates with official Mezo MUSD contracts on testnet/mainnet
 * - Uses Mezo price feeds for BTC/USD pricing
 * - Implements Trove management (CDP) for collateralized MUSD minting
 * - Provides hint system for gas optimization
 */
contract MezoIntegration is IMezoIntegration, Ownable, ReentrancyGuard, Pausable {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice MUSD token (Mezo native stablecoin - already deployed on chain)
    IERC20 public immutable MUSD_TOKEN;

    /// @notice Mezo BorrowerOperations contract for Trove management
    IMezoBorrowerOperations public immutable BORROWER_OPERATIONS;

    /// @notice Mezo PriceFeed contract for BTC/USD prices
    IMezoPriceFeed public immutable PRICE_FEED;

    /// @notice Mezo HintHelpers contract for gas optimization
    IMezoHintHelpers public immutable HINT_HELPERS;

    /// @notice Mezo TroveManager contract for system state
    IMezoTroveManager public immutable TROVE_MANAGER;

    /// @notice User BTC collateral balances (in 18 decimals)
    mapping(address => uint256) public userBtcCollateral;

    /// @notice User MUSD debt balances (in 18 decimals)
    mapping(address => uint256) public userMusdDebt;

    /// @notice Total BTC deposited through this contract
    uint256 public totalBtcDeposited;

    /// @notice Total MUSD minted through this contract
    uint256 public totalMusdMinted;

    /// @notice Target LTV ratio (basis points) - 50% = 5000
    uint256 public targetLtv = 5000; // 50% LTV

    /// @notice Maximum borrowing fee tolerance (basis points) - 5% = 500
    uint256 public maxFeePercentage = 500; // 5%

    /// @notice Hint computation parameters
    uint256 public constant HINT_TRIALS = 15;
    uint256 public hintRandomSeed = 42;

    /// @notice Price staleness threshold (1 hour)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600;

    /// @notice Minimum BTC deposit (0.001 BTC in 18 decimals)
    uint256 public constant MIN_BTC_DEPOSIT = 0.001 ether;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TargetLtvUpdated(uint256 oldLtv, uint256 newLtv);
    event MaxFeeUpdated(uint256 oldFee, uint256 newFee);
    event TroveRefinanced(address indexed user, uint256 oldRate, uint256 newRate);
    event CollateralAdded(address indexed user, uint256 amount);
    event DebtRepaid(address indexed user, uint256 amount);

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

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor - Initialize with Mezo protocol addresses
     * @param _musdToken MUSD token address (Mezo native stablecoin)
     * @param _borrowerOperations Mezo BorrowerOperations contract
     * @param _priceFeed Mezo PriceFeed contract
     * @param _hintHelpers Mezo HintHelpers contract
     * @param _troveManager Mezo TroveManager contract
     */
    constructor(
        address _musdToken,
        address _borrowerOperations,
        address _priceFeed,
        address _hintHelpers,
        address _troveManager
    ) Ownable(msg.sender) {
        if (_musdToken == address(0) ||
            _borrowerOperations == address(0) ||
            _priceFeed == address(0) ||
            _hintHelpers == address(0) ||
            _troveManager == address(0)
        ) revert InvalidAddress();

        MUSD_TOKEN = IERC20(_musdToken);
        BORROWER_OPERATIONS = IMezoBorrowerOperations(_borrowerOperations);
        PRICE_FEED = IMezoPriceFeed(_priceFeed);
        HINT_HELPERS = IMezoHintHelpers(_hintHelpers);
        TROVE_MANAGER = IMezoTroveManager(_troveManager);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT & MINT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits NATIVE BTC to Mezo and mints MUSD
     * @dev Accepts BTC via msg.value (payable function)
     * @dev Opens a new Trove or adjusts existing one in MUSD protocol
     * @return musdAmount Amount of MUSD minted (18 decimals)
     */
    function depositAndMintNative()
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 musdAmount)
    {
        uint256 btcAmount = msg.value;
        if (btcAmount < MIN_BTC_DEPOSIT) revert InvalidAmount();

        // Get current BTC price from Mezo oracle
        uint256 currentPrice = _getCurrentPrice();

        // Calculate MUSD amount to mint based on target LTV
        musdAmount = _calculateMusdAmount(btcAmount, currentPrice, targetLtv);

        // Check if user already has a Trove
        (, uint256 currentDebt) = TROVE_MANAGER.getTroveDebtAndColl(msg.sender);

        if (currentDebt == 0) {
            // Open new Trove with native BTC
            _openTrove(btcAmount, musdAmount, currentPrice);
        } else {
            // Adjust existing Trove (add collateral and borrow more)
            _adjustTrove(btcAmount, musdAmount, true, currentPrice);
        }

        // Update local tracking
        userBtcCollateral[msg.sender] += btcAmount;
        userMusdDebt[msg.sender] += musdAmount;
        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        // Transfer MUSD to caller
        require(MUSD_TOKEN.transfer(msg.sender, musdAmount), "MUSD transfer failed");

        // Final health check
        if (!isPositionHealthy(msg.sender)) revert UnhealthyPosition();

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Legacy function for compatibility - redirects to depositAndMintNative
     * @dev This is for backward compatibility with existing code
     */
    function depositAndMint(uint256) 
        external 
        pure
        returns (uint256)
    {
        revert("Use depositAndMintNative() with payable BTC");
    }

    /**
     * @notice Burns MUSD and withdraws BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned to user
     * @dev Repays debt and withdraws collateral from Mezo Trove
     */
    function burnAndWithdraw(uint256 musdAmount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (uint256 btcAmount)
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from user for burning
        require(MUSD_TOKEN.transferFrom(msg.sender, address(this), musdAmount), "MUSD transfer failed");

        // Calculate proportional BTC to withdraw
        uint256 debtReductionRatio = (musdAmount * 1e18) / userMusdDebt[msg.sender];
        btcAmount = (userBtcCollateral[msg.sender] * debtReductionRatio) / 1e18;

        // Get current price for hint calculation
        uint256 currentPrice = _getCurrentPrice();

        // Approve MUSD for repayment
        require(MUSD_TOKEN.approve(address(BORROWER_OPERATIONS), musdAmount), "MUSD approve failed");

        // Check if closing entire Trove or partial repayment
        if (musdAmount >= userMusdDebt[msg.sender]) {
            // Close entire Trove - returns all BTC collateral
            BORROWER_OPERATIONS.closeTrove();
            btcAmount = userBtcCollateral[msg.sender];
            
            // Update tracking
            totalBtcDeposited -= userBtcCollateral[msg.sender];
            totalMusdMinted -= userMusdDebt[msg.sender];
            userBtcCollateral[msg.sender] = 0;
            userMusdDebt[msg.sender] = 0;
        } else {
            // Partial repayment with collateral withdrawal
            (address upperHint, address lowerHint) = _getAdjustHints(
                userBtcCollateral[msg.sender] - btcAmount,
                userMusdDebt[msg.sender] - musdAmount,
                currentPrice
            );

            BORROWER_OPERATIONS.adjustTrove{value: 0}(
                btcAmount, // collateral withdrawal
                musdAmount, // debt repayment
                false, // not adding debt (repaying)
                upperHint,
                lowerHint
            );

            // Update tracking
            userBtcCollateral[msg.sender] -= btcAmount;
            userMusdDebt[msg.sender] -= musdAmount;
            totalBtcDeposited -= btcAmount;
            totalMusdMinted -= musdAmount;
        }

        // Transfer BTC back to user
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        emit BTCWithdrawn(msg.sender, btcAmount, musdAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if user's position is healthy
     * @param user User address
     * @return healthy True if position is above minimum collateral ratio
     */
    function isPositionHealthy(address user) public override returns (bool healthy) {
        if (userMusdDebt[user] == 0) return true;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = (userBtcCollateral[user] * price) / 1e18;
        uint256 collateralRatio = (collateralValue * 10000) / userMusdDebt[user];

        // Minimum collateral ratio is 110% (11000 basis points)
        return collateralRatio >= 11000;
    }

    /**
     * @notice Get user's collateral ratio
     * @param user User address
     * @return ratio Collateral ratio in basis points (110% = 11000)
     */
    function getCollateralRatio(address user) external override returns (uint256 ratio) {
        if (userMusdDebt[user] == 0) return type(uint256).max;

        uint256 price = _getCurrentPrice();
        uint256 collateralValue = (userBtcCollateral[user] * price) / 1e18;
        ratio = (collateralValue * 10000) / userMusdDebt[user];
    }

    /**
     * @notice Get user's position info
     * @param user User address
     * @return btcCollateral BTC collateral amount
     * @return musdDebt MUSD debt amount
     */
    function getUserPosition(address user) 
        external 
        view 
        override 
        returns (uint256 btcCollateral, uint256 musdDebt) 
    {
        return (userBtcCollateral[user], userMusdDebt[user]);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get current BTC price from Mezo oracle
     * @return price BTC price in USD (18 decimals)
     */
    function _getCurrentPrice() internal returns (uint256 price) {
        try PRICE_FEED.fetchPrice() returns (uint256 _price) {
            if (_price == 0) revert PriceFeedFailure();
            price = _price;
        } catch {
            revert PriceFeedFailure();
        }
    }

    /**
     * @notice Calculate MUSD amount based on BTC and target LTV
     * @param btcAmount BTC amount (18 decimals)
     * @param btcPrice BTC price in USD (18 decimals)
     * @param ltv Target LTV in basis points
     * @return musdAmount MUSD to mint (18 decimals)
     */
    function _calculateMusdAmount(
        uint256 btcAmount,
        uint256 btcPrice,
        uint256 ltv
    ) internal pure returns (uint256 musdAmount) {
        // collateralValue = btcAmount * btcPrice / 1e18
        // musdAmount = collateralValue * ltv / 10000
        uint256 collateralValue = (btcAmount * btcPrice) / 1e18;
        musdAmount = (collateralValue * ltv) / 10000;
    }

    /**
     * @notice Opens a new Trove in Mezo protocol
     * @param btcAmount BTC collateral amount
     * @param musdAmount MUSD to borrow
     * @param currentPrice Current BTC price
     */
    function _openTrove(
        uint256 btcAmount,
        uint256 musdAmount,
        uint256 currentPrice
    ) internal {
        // Get hints for insertion position
        (address upperHint, address lowerHint) = _getInsertHints(
            btcAmount,
            musdAmount,
            currentPrice
        );

        // Open Trove with native BTC
        BORROWER_OPERATIONS.openTrove{value: btcAmount}(
            maxFeePercentage,
            musdAmount,
            upperHint,
            lowerHint
        );
    }

    /**
     * @notice Adjusts an existing Trove
     * @param btcAmount BTC to add as collateral
     * @param musdAmount MUSD to borrow
     * @param isDebtIncrease True if borrowing more
     * @param currentPrice Current BTC price
     */
    function _adjustTrove(
        uint256 btcAmount,
        uint256 musdAmount,
        bool isDebtIncrease,
        uint256 currentPrice
    ) internal {
        uint256 newCollateral = userBtcCollateral[msg.sender] + btcAmount;
        uint256 newDebt = isDebtIncrease 
            ? userMusdDebt[msg.sender] + musdAmount
            : userMusdDebt[msg.sender] - musdAmount;

        (address upperHint, address lowerHint) = _getAdjustHints(
            newCollateral,
            newDebt,
            currentPrice
        );

        BORROWER_OPERATIONS.adjustTrove{value: btcAmount}(
            0, // no collateral withdrawal
            musdAmount,
            isDebtIncrease,
            upperHint,
            lowerHint
        );
    }

    /**
     * @notice Get hints for opening a new Trove
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
     * @notice Get hints for adjusting an existing Trove
     */
    function _getAdjustHints(
        uint256 newColl,
        uint256 newDebt,
        uint256 price
    ) internal view returns (address upperHint, address lowerHint) {
        return _getInsertHints(newColl, newDebt, price);
    }

    /**
     * @notice Compute NICR (Nominal Individual Collateral Ratio)
     * @param coll Collateral amount
     * @param debt Debt amount
     * @param price BTC price
     * @return nicr NICR value
     */
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

    /**
     * @notice Set target LTV
     * @param newLtv New LTV in basis points (max 80% = 8000)
     */
    function setTargetLtv(uint256 newLtv) external onlyOwner {
        if (newLtv == 0 || newLtv > 8000) revert InvalidLtv();
        uint256 oldLtv = targetLtv;
        targetLtv = newLtv;
        emit TargetLtvUpdated(oldLtv, newLtv);
    }

    /**
     * @notice Set max fee percentage
     * @param newFee New fee in basis points (max 10% = 1000)
     */
    function setMaxFeePercentage(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert ExcessiveFee();
        uint256 oldFee = maxFeePercentage;
        maxFeePercentage = newFee;
        emit MaxFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Receive function to accept BTC
     */
    receive() external payable {}
}
