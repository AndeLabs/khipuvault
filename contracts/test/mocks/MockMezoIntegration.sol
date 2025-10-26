// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoIntegration} from "../../src/interfaces/IMezoIntegration.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMezoIntegration
 * @notice Mock implementation for testing - NATIVE BTC version
 * @dev Simulates native BTC deposits and MUSD minting
 */
contract MockMezoIntegration is IMezoIntegration {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable musdToken;

    // User position tracking
    mapping(address => uint256) public userBtcCollateral;
    mapping(address => uint256) public userMusdDebt;

    // Mock parameters
    uint256 public constant LTV_RATIO = 5000; // 50% LTV
    uint256 public constant MIN_COLLATERAL_RATIO = 11000; // 110% (Mezo minimum)
    uint256 public btcPrice = 60000e18; // $60,000 per BTC (18 decimals)

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

    constructor(address _musdToken) {
        musdToken = IERC20(_musdToken);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits NATIVE BTC and mints MUSD (PAYABLE)
     * @return musdAmount Amount of MUSD minted
     */
    function depositAndMintNative() 
        external 
        payable
        returns (uint256 musdAmount) 
    {
        uint256 btcAmount = msg.value;
        if (btcAmount == 0) revert InvalidAmount();

        // Calculate MUSD to mint based on LTV
        // btcAmount is in 18 decimals (native BTC on Mezo)
        // btcPrice is in 18 decimals
        // musdAmount should be in 18 decimals
        musdAmount = (btcAmount * btcPrice * LTV_RATIO) / (1e18 * 10000);

        // Update user position
        userBtcCollateral[msg.sender] += btcAmount;
        userMusdDebt[msg.sender] += musdAmount;

        // Update totals
        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        // Transfer MUSD to sender
        require(musdToken.transfer(msg.sender, musdAmount), "MUSD transfer failed");

        emit BTCDeposited(msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Legacy function - reverts
     */
    function depositAndMint(uint256) 
        external 
        pure
        returns (uint256) 
    {
        revert("Use depositAndMintNative() with payable BTC");
    }

    /**
     * @notice Burns MUSD and withdraws NATIVE BTC collateral
     * @param musdAmount Amount of MUSD to burn
     * @return btcAmount Amount of BTC returned
     */
    function burnAndWithdraw(uint256 musdAmount) 
        external 
        returns (uint256 btcAmount) 
    {
        if (musdAmount == 0) revert InvalidAmount();
        if (userMusdDebt[msg.sender] < musdAmount) revert InsufficientBalance();

        // Transfer MUSD from sender to burn
        require(musdToken.transferFrom(msg.sender, address(this), musdAmount), "MUSD transfer failed");

        // Calculate proportional BTC to return
        uint256 debtRatio = (musdAmount * 1e18) / userMusdDebt[msg.sender];
        btcAmount = (userBtcCollateral[msg.sender] * debtRatio) / 1e18;

        // Update user position
        userBtcCollateral[msg.sender] -= btcAmount;
        userMusdDebt[msg.sender] -= musdAmount;

        // Update totals
        totalBtcDeposited -= btcAmount;
        totalMusdMinted -= musdAmount;

        // Transfer native BTC back to sender
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        emit BTCWithdrawn(msg.sender, btcAmount, musdAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets user position
     */
    function getUserPosition(address user) 
        external 
        view 
        returns (uint256 btcCollateral, uint256 musdDebt) 
    {
        return (userBtcCollateral[user], userMusdDebt[user]);
    }

    /**
     * @notice Gets collateral ratio for a user
     * @return ratio Collateral ratio in basis points
     */
    function getCollateralRatio(address user) 
        external 
        view 
        returns (uint256 ratio) 
    {
        if (userMusdDebt[user] == 0) return type(uint256).max;

        uint256 collateralValue = (userBtcCollateral[user] * btcPrice) / 1e18;
        ratio = (collateralValue * 10000) / userMusdDebt[user];
    }

    /**
     * @notice Checks if position is healthy
     */
    function isPositionHealthy(address user) 
        external 
        view 
        returns (bool healthy) 
    {
        if (userMusdDebt[user] == 0) return true;

        uint256 collateralValue = (userBtcCollateral[user] * btcPrice) / 1e18;
        uint256 ratio = (collateralValue * 10000) / userMusdDebt[user];

        return ratio >= MIN_COLLATERAL_RATIO;
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates mock BTC price (for testing)
     */
    function setMockBtcPrice(uint256 newPrice) external {
        btcPrice = newPrice;
        emit MockBtcPriceUpdated(newPrice);
    }

    /**
     * @notice Allows contract to receive native BTC
     */
    receive() external payable {}
}
