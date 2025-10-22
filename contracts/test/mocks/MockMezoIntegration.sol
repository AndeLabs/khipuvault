// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoIntegration} from "../../src/interfaces/IMezoIntegration.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMezoIntegration
 * @notice Mock implementation of Mezo Integration for testing
 * @dev Simulates BTC deposits, MUSD minting, and collateral management
 */
contract MockMezoIntegration is IMezoIntegration {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable btcToken;
    IERC20 public immutable musdToken;

    // User collateral tracking
    mapping(address => uint256) public userBtcCollateral;
    mapping(address => uint256) public userMusdDebt;

    // Mock parameters
    uint256 public constant LTV_RATIO = 5000; // 50% LTV
    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD = 12000; // 120%
    uint256 public constant BORROW_RATE = 100; // 1% APR
    uint256 public btcPrice = 60000e8; // $60,000 per BTC (scaled by 1e8)

    // Total stats
    uint256 public totalBtcDeposited;
    uint256 public totalMusdMinted;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MockBtcPriceUpdated(uint256 newPrice);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InsufficientCollateral();
    error InsufficientBalance();
    error UnhealthyPosition();
    error InvalidAmount();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _btcToken, address _musdToken) {
        btcToken = IERC20(_btcToken);
        musdToken = IERC20(_musdToken);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits BTC and mints MUSD against it
     * @param btcAmount Amount of BTC to deposit
     * @return musdAmount Amount of MUSD minted
     */
    function depositAndMint(uint256 btcAmount) 
        external 
        override 
        returns (uint256 musdAmount) 
    {
        if (btcAmount == 0) revert InvalidAmount();

        // Transfer BTC from sender
        btcToken.transferFrom(msg.sender, address(this), btcAmount);

        // Calculate MUSD to mint (50% LTV)
        musdAmount = (btcAmount * btcPrice * LTV_RATIO) / (1e8 * 10000);

        // Update user position
        userBtcCollateral[msg.sender] += btcAmount;
        userMusdDebt[msg.sender] += musdAmount;

        // Update totals
        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        // Mint MUSD to sender
        // In real implementation, this would call MUSD contract's mint
        // For mock, we assume this contract has MUSD to transfer
        musdToken.transfer(msg.sender, musdAmount);

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Burns MUSD and withdraws BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
     */
    function burnAndWithdraw(uint256 musdAmount) 
        external 
        override 
        returns (uint256 btcAmount) 
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from sender (to burn)
        musdToken.transferFrom(msg.sender, address(this), musdAmount);

        // Calculate BTC to return based on debt reduction
        uint256 debtReductionRatio = (musdAmount * 1e18) / userMusdDebt[msg.sender];
        btcAmount = (userBtcCollateral[msg.sender] * debtReductionRatio) / 1e18;

        // Update user position
        userBtcCollateral[msg.sender] -= btcAmount;
        userMusdDebt[msg.sender] -= musdAmount;

        // Update totals
        totalBtcDeposited -= btcAmount;
        totalMusdMinted -= musdAmount;

        // Return BTC to sender
        btcToken.transfer(msg.sender, btcAmount);

        emit BTCWithdrawn(msg.sender, musdAmount, btcAmount);
    }

    /**
     * @notice Gets user's BTC collateral balance
     */
    function getBtcBalance(address user) 
        external 
        view 
        override 
        returns (uint256 btcBalance) 
    {
        return userBtcCollateral[user];
    }

    /**
     * @notice Gets user's MUSD debt balance
     */
    function getMusdDebt(address user) 
        external 
        view 
        override 
        returns (uint256 musdDebt) 
    {
        return userMusdDebt[user];
    }

    /**
     * @notice Gets user's collateral ratio
     * @return ratio Collateral ratio in basis points
     */
    function getCollateralRatio(address user) 
        external 
        view 
        override 
        returns (uint256 ratio) 
    {
        if (userMusdDebt[user] == 0) return type(uint256).max;
        
        uint256 collateralValue = (userBtcCollateral[user] * btcPrice) / 1e8;
        ratio = (collateralValue * 10000) / userMusdDebt[user];
    }

    /**
     * @notice Gets current BTC/USD price
     */
    function getBtcPrice() 
        external 
        view 
        override 
        returns (uint256 price) 
    {
        return btcPrice;
    }

    /**
     * @notice Gets borrowing rate for MUSD
     */
    function getBorrowRate() 
        external 
        pure 
        override 
        returns (uint256 rate) 
    {
        return BORROW_RATE;
    }

    /**
     * @notice Checks if user's position is healthy
     */
    function isPositionHealthy(address user) 
        external 
        view 
        override 
        returns (bool isHealthy) 
    {
        if (userMusdDebt[user] == 0) return true;
        
        uint256 collateralValue = (userBtcCollateral[user] * btcPrice) / 1e8;
        uint256 ratio = (collateralValue * 10000) / userMusdDebt[user];
        
        return ratio >= MIN_COLLATERAL_RATIO;
    }

    /**
     * @notice Gets minimum collateral ratio
     */
    function getMinCollateralRatio() 
        external 
        pure 
        override 
        returns (uint256 minRatio) 
    {
        return MIN_COLLATERAL_RATIO;
    }

    /**
     * @notice Gets liquidation threshold
     */
    function getLiquidationThreshold() 
        external 
        pure 
        override 
        returns (uint256 threshold) 
    {
        return LIQUIDATION_THRESHOLD;
    }

    /**
     * @notice Adds more BTC collateral without minting
     */
    function addCollateral(uint256 btcAmount) external override {
        if (btcAmount == 0) revert InvalidAmount();

        btcToken.transferFrom(msg.sender, address(this), btcAmount);
        userBtcCollateral[msg.sender] += btcAmount;
        totalBtcDeposited += btcAmount;

        emit CollateralRatioUpdated(msg.sender, this.getCollateralRatio(msg.sender));
    }

    /**
     * @notice Mints additional MUSD against existing collateral
     */
    function mintMore(uint256 musdAmount) 
        external 
        override 
        returns (bool success) 
    {
        if (musdAmount == 0) revert InvalidAmount();

        // Check if position will remain healthy
        uint256 newDebt = userMusdDebt[msg.sender] + musdAmount;
        uint256 collateralValue = (userBtcCollateral[msg.sender] * btcPrice) / 1e8;
        uint256 newRatio = (collateralValue * 10000) / newDebt;

        if (newRatio < MIN_COLLATERAL_RATIO) revert UnhealthyPosition();

        // Update debt
        userMusdDebt[msg.sender] = newDebt;
        totalMusdMinted += musdAmount;

        // Transfer MUSD
        musdToken.transfer(msg.sender, musdAmount);

        return true;
    }

    /**
     * @notice Repays MUSD debt without withdrawing collateral
     */
    function repayDebt(uint256 musdAmount) external override {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from sender
        musdToken.transferFrom(msg.sender, address(this), musdAmount);

        // Reduce debt
        userMusdDebt[msg.sender] -= musdAmount;
        totalMusdMinted -= musdAmount;
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates BTC price (for testing price fluctuations)
     */
    function setBtcPrice(uint256 newPrice) external {
        btcPrice = newPrice;
        emit MockBtcPriceUpdated(newPrice);
    }

    /**
     * @notice Funds the mock with MUSD for testing
     */
    function fundMusd(uint256 amount) external {
        musdToken.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Gets total BTC deposited
     */
    function getTotalBtcDeposited() external view returns (uint256) {
        return totalBtcDeposited;
    }

    /**
     * @notice Gets total MUSD minted
     */
    function getTotalMusdMinted() external view returns (uint256) {
        return totalMusdMinted;
    }
}