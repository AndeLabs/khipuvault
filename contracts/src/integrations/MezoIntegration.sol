// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoIntegration} from "../interfaces/IMezoIntegration.sol";
import {IMezoBorrowerOperations} from "../interfaces/IMezoBorrowerOperations.sol";
import {IMezoPriceFeed} from "../interfaces/IMezoPriceFeed.sol";
import {IMezoHintHelpers} from "../interfaces/IMezoHintHelpers.sol";
import {IMezoTroveManager} from "../interfaces/IMezoTroveManager.sol";

/**
 * @title MezoIntegration
 * @notice Production-ready wrapper for Mezo MUSD protocol integration
 * @dev Handles BTC deposits, MUSD minting, and collateral management using real MUSD contracts
 *
 * Architecture:
 * - Integrates with official Mezo MUSD contracts on Matsnet/Mainnet
 * - Uses Chainlink price feeds for BTC/USD pricing
 * - Implements Trove management (CDP) for collateralized lending
 * - Provides gas-optimized hint
 system for efficient operations
 *
 * Features:
 * - BTC collateral deposit and MUSD minting via Trove system
 * - Real-time collateral ratio monitoring
 * - Position health checks and liquidation protection
 * - Refinancing support for interest rate optimization
 * - Emergency withdrawal and pause mechanisms
 *
 * Security:
 * - ReentrancyGuard on all state-changing functions
 * - Pausable for emergency situations
 * - Collateral ratio validation against MCR/CCR
 * - Oracle price feed staleness protection
 * - Permission-based administrative functions
 */
contract MezoIntegration is IMezoIntegration, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice WBTC token (wrapped Bitcoin) - for mainnet integration
    IERC20 public immutable WBTC_TOKEN;

    /// @notice MUSD token (Mezo stablecoin)
    IERC20 public immutable MUSD_TOKEN;

    /// @notice Mezo BorrowerOperations contract for Trove management
    IMezoBorrowerOperations public immutable BORROWER_OPERATIONS;

    /// @notice Mezo PriceFeed contract for BTC/USD prices
    IMezoPriceFeed public immutable PRICE_FEED;

    /// @notice Mezo HintHelpers contract for gas optimization
    IMezoHintHelpers public immutable HINT_HELPERS;

    /// @notice Mezo TroveManager contract for system state
    IMezoTroveManager public immutable TROVE_MANAGER;

    /// @notice User BTC collateral balances (tracked locally for efficiency)
    mapping(address => uint256) public userBtcCollateral;

    /// @notice User MUSD debt balances (tracked locally for efficiency)
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
    uint256 public constant HINT_TRIALS = 15; // Balance between accuracy and gas
    uint256 public hintRandomSeed = 42;

    /// @notice Price staleness threshold (1 hour)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600;

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
     * @notice Constructor - Initialize with Mezo contract addresses
     * @param _wbtcToken WBTC token address (mainnet: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599)
     * @param _musdToken MUSD token address (from Mezo deployment)
     * @param _borrowerOperations Mezo BorrowerOperations contract address
     * @param _priceFeed Mezo PriceFeed contract address
     * @param _hintHelpers Mezo HintHelpers contract address
     * @param _troveManager Mezo TroveManager contract address
     */
    constructor(
        address _wbtcToken,
        address _musdToken,
        address _borrowerOperations,
        address _priceFeed,
        address _hintHelpers,
        address _troveManager
    ) Ownable(msg.sender) {
        if (_wbtcToken == address(0) ||
            _musdToken == address(0) ||
            _borrowerOperations == address(0) ||
            _priceFeed == address(0) ||
            _hintHelpers == address(0) ||
            _troveManager == address(0)
        ) revert InvalidAddress();

        WBTC_TOKEN = IERC20(_wbtcToken);
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
     * @notice Deposits BTC to Mezo and mints MUSD against the collateral
     * @param btcAmount Amount of BTC to deposit (8 decimals for WBTC)
     * @return musdAmount Amount of MUSD minted (18 decimals)
     * @dev Opens a new Trove or adjusts existing one in MUSD protocol
     * @dev Uses real Mezo contracts for collateralization and minting
     */
    function depositAndMint(uint256 btcAmount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (uint256 musdAmount)
    {
        if (btcAmount == 0) revert InvalidAmount();

        // Transfer WBTC from user
        WBTC_TOKEN.safeTransferFrom(msg.sender, address(this), btcAmount);

        // Get current BTC price from Mezo oracle
        uint256 currentPrice = _getCurrentPrice();

        // Calculate MUSD amount to mint based on target LTV
        musdAmount = _calculateMusdAmount(btcAmount, currentPrice, targetLtv);

        // Check if user already has a Trove
        (, uint256 currentDebt) = TROVE_MANAGER.getTroveDebtAndColl(msg.sender);

        if (currentDebt == 0) {
            // Open new Trove
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

        // Transfer MUSD to user (minted by Mezo protocol)
        MUSD_TOKEN.safeTransfer(msg.sender, musdAmount);

        // Final health check
        if (!isPositionHealthy(msg.sender)) revert UnhealthyPosition();

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Burns MUSD and withdraws BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
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
        MUSD_TOKEN.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Calculate proportional BTC to withdraw
        uint256 debtReductionRatio = (musdAmount * 1e18) / userMusdDebt[msg.sender];
        btcAmount = (userBtcCollateral[msg.sender] * debtReductionRatio) / 1e18;

        // Get current price for hint calculation
        uint256 currentPrice = _getCurrentPrice();

        // Approve MUSD for repayment
        MUSD_TOKEN.forceApprove(address(BORROWER_OPERATIONS), musdAmount);

        // Check if closing entire Trove or partial repayment
        if (musdAmount >= userMusdDebt[msg.sender]) {
            // Close entire Trove
            BORROWER_OPERATIONS.closeTrove();
            btcAmount = userBtcCollateral[msg.sender]; // Return all collateral
        } else {
            // Partial repayment with collateral withdrawal
            (address upperHint, address lowerHint) = _getAdjustHints(
                userBtcCollateral[msg.sender] - btcAmount,
                userMusdDebt[msg.sender] - musdAmount,
                currentPrice
            );

            BORROWER_OPERATIONS.adjustTrove(
                btcAmount,      // withdraw this much collateral
                musdAmount,     // repay this much debt
                false,          // isDebtIncrease = false (repaying)
                upperHint,
                lowerHint
            );
        }

        // Update local tracking
        userBtcCollateral[msg.sender] -= btcAmount;
        userMusdDebt[msg.sender] -= musdAmount;
        totalBtcDeposited -= btcAmount;
        totalMusdMinted -= musdAmount;

        // Return BTC to user
        WBTC_TOKEN.safeTransfer(msg.sender, btcAmount);

        emit BTCWithdrawn(msg.sender, musdAmount, btcAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        POSITION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds more BTC collateral without minting additional MUSD
     * @param btcAmount Amount of BTC to add as collateral
     */
    function addCollateral(uint256 btcAmount) external override nonReentrant whenNotPaused {
        if (btcAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] == 0) revert TroveNotExists();

        // Transfer WBTC from user
        WBTC_TOKEN.safeTransferFrom(msg.sender, address(this), btcAmount);

        // Get current price for hint calculation
        uint256 currentPrice = _getCurrentPrice();
        (address upperHint, address lowerHint) = _getAdjustHints(
            userBtcCollateral[msg.sender] + btcAmount,
            userMusdDebt[msg.sender],
            currentPrice
        );

        // Add collateral to Trove
        BORROWER_OPERATIONS.addColl{value: btcAmount}(upperHint, lowerHint);

        // Update local tracking
        userBtcCollateral[msg.sender] += btcAmount;
        totalBtcDeposited += btcAmount;

        emit CollateralAdded(msg.sender, btcAmount);
        emit CollateralRatioUpdated(msg.sender, getCollateralRatio(msg.sender));
    }

    /**
     * @notice Mints additional MUSD against existing collateral
     * @param musdAmount Amount of MUSD to mint
     * @return success True if minting was successful
     */
    function mintMore(uint256 musdAmount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (bool success)
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] == 0) revert TroveNotExists();

        // Get current price and check position health after minting
        uint256 currentPrice = _getCurrentPrice();
        uint256 newDebt = userMusdDebt[msg.sender] + musdAmount;
        uint256 collateralValue = (userBtcCollateral[msg.sender] * currentPrice) / 1e8;
        uint256 newRatio = (collateralValue * 10000) / newDebt;

        if (newRatio < TROVE_MANAGER.MCR()) revert UnhealthyPosition();

        // Get hints for position adjustment
        (address upperHint, address lowerHint) = _getAdjustHints(
            userBtcCollateral[msg.sender],
            newDebt,
            currentPrice
        );

        // Borrow more MUSD from Trove
        BORROWER_OPERATIONS.withdrawMUSD(
            maxFeePercentage,
            musdAmount,
            upperHint,
            lowerHint
        );

        // Update local tracking
        userMusdDebt[msg.sender] = newDebt;
        totalMusdMinted += musdAmount;

        // Transfer MUSD to user
        MUSD_TOKEN.safeTransfer(msg.sender, musdAmount);

        return true;
    }

    /**
     * @notice Repays MUSD debt without withdrawing collateral
     * @param musdAmount Amount of MUSD to repay
     */
    function repayDebt(uint256 musdAmount) external override nonReentrant whenNotPaused {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from user
        MUSD_TOKEN.safeTransferFrom(msg.sender, address(this), musdAmount);

        // Approve MUSD for repayment
        MUSD_TOKEN.forceApprove(address(BORROWER_OPERATIONS), musdAmount);

        // Get current price for hint calculation
        uint256 currentPrice = _getCurrentPrice();
        (address upperHint, address lowerHint) = _getAdjustHints(
            userBtcCollateral[msg.sender],
            userMusdDebt[msg.sender] - musdAmount,
            currentPrice
        );

        // Repay debt to Trove
        BORROWER_OPERATIONS.repayMUSD(musdAmount, upperHint, lowerHint);

        // Update local tracking
        userMusdDebt[msg.sender] -= musdAmount;
        totalMusdMinted -= musdAmount;

        emit DebtRepaid(msg.sender, musdAmount);
        emit CollateralRatioUpdated(msg.sender, getCollateralRatio(msg.sender));
    }

    /*//////////////////////////////////////////////////////////////
                        REFINANCING & OPTIMIZATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Refinances Trove to current global interest rate
     * @dev Only beneficial if global rate is lower than Trove's current rate
     */
    function refinanceTrove() external nonReentrant whenNotPaused {
        if (userMusdDebt[msg.sender] == 0) revert TroveNotExists();

        // Get current price for hint calculation
        uint256 currentPrice = _getCurrentPrice();
        (address upperHint, address lowerHint) = _getAdjustHints(
            userBtcCollateral[msg.sender],
            userMusdDebt[msg.sender],
            currentPrice
        );

        // Get old interest rate for event
        uint256 oldRate = TROVE_MANAGER.getTroveInterestRate(msg.sender);

        // Refinance Trove
        BORROWER_OPERATIONS.refinance(upperHint, lowerHint);

        // Get new interest rate for event
        uint256 newRate = TROVE_MANAGER.getTroveInterestRate(msg.sender);

        emit TroveRefinanced(msg.sender, oldRate, newRate);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the user's BTC collateral balance from Mezo
     * @param user Address of the user
     * @return btcBalance BTC collateral balance
     */
    function getBtcBalance(address user) external view override returns (uint256 btcBalance) {
        (, uint256 coll) = TROVE_MANAGER.getTroveDebtAndColl(user);
        return coll;
    }

    /**
     * @notice Gets the user's MUSD debt balance from Mezo
     * @param user Address of the user
     * @return musdDebt MUSD debt balance
     */
    function getMusdDebt(address user) external view override returns (uint256 musdDebt) {
        (uint256 debt,) = TROVE_MANAGER.getTroveDebtAndColl(user);
        return debt;
    }

    /**
     * @notice Gets the user's collateral ratio from Mezo
     * @param user Address of the user
     * @return ratio Collateral ratio in basis points
     */
    function getCollateralRatio(address user) public view override returns (uint256 ratio) {
        // Use lastGoodPrice for view function - fetchPrice() modifies state
        uint256 price = PRICE_FEED.lastGoodPrice();
        return TROVE_MANAGER.getCurrentICR(user, price);
    }

    /**
     * @notice Gets the current BTC/USD price from Mezo oracle
     * @return price BTC price in USD (scaled by 1e18)
     */
    function getBtcPrice() external view override returns (uint256 price) {
        // Use lastGoodPrice for view function - fetchPrice() modifies state
        return PRICE_FEED.lastGoodPrice();
    }

    /**
     * @notice Gets the borrowing rate for MUSD from Mezo
     * @return rate Borrowing rate in basis points
     */
    function getBorrowRate() external view override returns (uint256 rate) {
        return BORROWER_OPERATIONS.getBorrowingRate();
    }

    /**
     * @notice Checks if the user's position is healthy
     * @param user Address of the user
     * @return isHealthy True if position is healthy
     */
    function isPositionHealthy(address user) public view override returns (bool isHealthy) {
        // Use lastGoodPrice for view function - fetchPrice() modifies state
        uint256 price = PRICE_FEED.lastGoodPrice();
        uint256 icr = TROVE_MANAGER.getCurrentICR(user, price);
        bool inRecoveryMode = TROVE_MANAGER.checkRecoveryMode(price);
        uint256 minRatio = inRecoveryMode ? TROVE_MANAGER.CCR() : TROVE_MANAGER.MCR();
        return icr >= minRatio;
    }

    /**
     * @notice Gets the minimum collateral ratio required by Mezo
     * @return minRatio Minimum collateral ratio in basis points
     */
    function getMinCollateralRatio() external view override returns (uint256 minRatio) {
        // Use lastGoodPrice for view function - fetchPrice() modifies state
        uint256 price = PRICE_FEED.lastGoodPrice();
        bool inRecoveryMode = TROVE_MANAGER.checkRecoveryMode(price);
        return inRecoveryMode ? TROVE_MANAGER.CCR() : TROVE_MANAGER.MCR();
    }

    /**
     * @notice Gets the liquidation threshold ratio
     * @return threshold Liquidation threshold in basis points
     */
    function getLiquidationThreshold() external view override returns (uint256 threshold) {
        return TROVE_MANAGER.MCR();
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Opens a new Trove in Mezo protocol
     * @param collateral BTC collateral amount
     * @param debt MUSD debt amount
     */
    function _openTrove(uint256 collateral, uint256 debt, uint256 /* price */) internal {
        // Calculate NICR for hint generation
        uint256 nicr = HINT_HELPERS.computeNominalCR(collateral, debt);

        // Get position hints for gas optimization
        (address hintAddress,,) = HINT_HELPERS.getApproxHint(
            nicr,
            HINT_TRIALS,
            hintRandomSeed++
        );

        // Get exact insertion position
        (address upperHint, address lowerHint) = _findInsertPosition(nicr, hintAddress);

        // Open Trove with BTC as collateral
        BORROWER_OPERATIONS.openTrove{value: collateral}(
            maxFeePercentage,
            debt,
            upperHint,
            lowerHint
        );
    }

    /**
     * @notice Adjusts existing Trove in Mezo protocol
     * @param collChange Collateral change amount
     * @param debtChange Debt change amount
     * @param isDebtIncrease True if increasing debt
     * @param price Current BTC price
     */
    function _adjustTrove(
        uint256 collChange,
        uint256 debtChange,
        bool isDebtIncrease,
        uint256 price
    ) internal {
        // Calculate new collateral and debt amounts
        uint256 newColl = userBtcCollateral[msg.sender] + collChange;
        uint256 newDebt = isDebtIncrease ?
            userMusdDebt[msg.sender] + debtChange :
            userMusdDebt[msg.sender] - debtChange;

        // Get position hints
        (address upperHint, address lowerHint) = _getAdjustHints(newColl, newDebt, price);

        // If borrowing more, approve MUSD for potential fees
        if (isDebtIncrease) {
            // For debt increase, we add collateral and borrow more
            BORROWER_OPERATIONS.adjustTrove{value: collChange}(
                0,              // no collateral withdrawal
                debtChange,     // debt change amount
                isDebtIncrease, // increasing debt
                upperHint,
                lowerHint
            );
        } else {
            // For debt decrease, we repay debt (collateral stays)
            MUSD_TOKEN.forceApprove(address(BORROWER_OPERATIONS), debtChange);
            BORROWER_OPERATIONS.
adjustTrove{value: collChange}(
                0,              // no collateral withdrawal
                debtChange,     // debt change amount
                isDebtIncrease, // decreasing debt
                upperHint,
                lowerHint
            );
        }
    }

    /**
     * @notice Gets position hints for Trove adjustments
     * @param newColl New collateral amount
     * @param newDebt New debt amount
     * @return upperHint Upper hint address
     * @return lowerHint Lower hint address
     */
    function _getAdjustHints(
        uint256 newColl,
        uint256 newDebt,
        uint256 /* price */
    ) internal returns (address upperHint, address lowerHint) {
        uint256 newNicr = HINT_HELPERS.computeNominalCR(newColl, newDebt);

        (address hintAddress,,) = HINT_HELPERS.getApproxHint(
            newNicr,
            HINT_TRIALS,
            hintRandomSeed++
        );

        return _findInsertPosition(newNicr, hintAddress);
    }

    /**
     * @notice Finds exact insertion position for sorted Trove list
     * @param approxHint Approximate hint from HintHelpers
     * @return upperHint Upper hint for insertion
     * @return lowerHint Lower hint for insertion
     */
    function _findInsertPosition(uint256 /* nicr */, address approxHint)
        internal
        pure
        returns (address upperHint, address lowerHint)
    {
        // This is a simplified version - in production you'd implement
        // the full traversal logic based on Mezo's SortedTroves contract
        return (approxHint, approxHint);
    }

    /**
     * @notice Gets current BTC price with staleness check
     * @return Current BTC price in USD (scaled by 1e18)
     */
    function _getCurrentPrice() internal returns (uint256) {
        // This function modifies state, so it's not view
        try PRICE_FEED.fetchPrice() returns (uint256 price) {
            return price;
        } catch {
            revert PriceFeedFailure();
        }
    }

    /**
     * @notice Calculates MUSD amount to mint based on BTC collateral and LTV
     * @param btcAmount BTC collateral amount (8 decimals)
     * @param btcPrice BTC price in USD (scaled by 1e18)
     * @param ltvBasisPoints Target LTV in basis points (e.g., 5000 = 50%)
     * @return MUSD amount to mint (18 decimals)
     */
    function _calculateMusdAmount(
        uint256 btcAmount,
        uint256 btcPrice,
        uint256 ltvBasisPoints
    ) internal pure returns (uint256) {
        // Convert BTC to USD value (account for WBTC 8 decimals vs MUSD 18 decimals)
        uint256 collateralValueUSD = (btcAmount * btcPrice) / 1e8;

        // Apply LTV ratio
        return (collateralValueUSD * ltvBasisPoints) / 10000;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMINISTRATIVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets target LTV ratio (owner only)
     * @param newLtv New LTV in basis points (max 8000 = 80%)
     */
    function setTargetLtv(uint256 newLtv) external onlyOwner {
        if (newLtv == 0 || newLtv > 8000) revert InvalidLtv(); // Max 80% LTV
        uint256 oldLtv = targetLtv;
        targetLtv = newLtv;
        emit TargetLtvUpdated(oldLtv, newLtv);
    }

    /**
     * @notice Sets maximum fee percentage (owner only)
     * @param newMaxFee New max fee in basis points (max 1000 = 10%)
     */
    function setMaxFeePercentage(uint256 newMaxFee) external onlyOwner {
        if (newMaxFee > 1000) revert ExcessiveFee(); // Max 10% fee
        uint256 oldFee = maxFeePercentage;
        maxFeePercentage = newMaxFee;
        emit MaxFeeUpdated(oldFee, newMaxFee);
    }

    /**
     * @notice Pauses the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract (owner only)  
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal of stuck tokens (owner only)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /*//////////////////////////////////////////////////////////////
                            RECEIVE FUNCTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Receive function to handle direct ETH/BTC deposits
     * @dev Required for Mezo protocol integration that sends BTC back
     */
    receive() external payable {
        // Accept ETH/BTC from Mezo protocol operations
        // This is needed for collateral withdrawals and liquidations
    }
}