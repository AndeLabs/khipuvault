// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockIndividualPool
 * @notice Mock implementation for testing Individual Pool without Mezo dependencies
 * @dev Simplified version that mints fake MUSD for deposits and tracks yields
 */
contract MockIndividualPool is Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct UserDeposit {
        uint256 btcAmount;           // BTC depositado
        uint256 musdMinted;          // MUSD minted
        uint256 musdDeposited;       // MUSD depositado directamente
        uint256 yieldAccrued;        // Yields acumulados
        uint256 depositTimestamp;    // Timestamp del depósito
        uint256 lastYieldUpdate;     // Última actualización
        bool active;                 // Estado activo
        bool isRecoveryModeDeposit;  // Depósito en Recovery Mode
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable MUSD_TOKEN;
    
    mapping(address => UserDeposit) public userDeposits;
    
    uint256 public totalBtcDeposited;
    uint256 public totalMusdMinted;
    uint256 public totalMusdDeposited;
    uint256 public totalYieldsGenerated;
    
    uint256 public constant MIN_DEPOSIT = 0.001 ether;
    uint256 public constant MAX_DEPOSIT = 10 ether;
    uint256 public performanceFee = 100; // 1%
    address public feeCollector;

    // Mock yield rate: 6.5% APR in basis points per second
    uint256 public constant MOCK_YIELD_RATE_PER_SECOND = 206018518; // ~6.5% APR
    
    // Mock: System in Recovery Mode or not
    bool public inRecovery = false;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(address indexed user, uint256 btcAmount, uint256 musdAmount, uint256 timestamp);
    event MusdDeposited(address indexed user, uint256 musdAmount, uint256 timestamp);
    event YieldClaimed(address indexed user, uint256 yieldAmount, uint256 feeAmount);
    event Withdrawn(address indexed user, uint256 btcAmount, uint256 musdAmount, uint256 yieldAmount);
    event YieldUpdated(address indexed user, uint256 newYieldAmount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InsufficientBalance();
    error NoActiveDeposit();
    error MinimumDepositNotMet();
    error MaximumDepositExceeded();
    error InvalidAmount();
    error InvalidAddress();
    error DepositAlreadyExists();
    error RecoveryModeActive(string message);
    error NotInRecoveryMode(string message);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _musd, address _feeCollector) Ownable(msg.sender) {
        if (_musd == address(0) || _feeCollector == address(0)) revert InvalidAddress();
        MUSD_TOKEN = IERC20(_musd);
        feeCollector = _feeCollector;
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mock deposit - accepts BTC and "mints" MUSD internally
     * @dev In real contract, this interacts with Mezo. Here we just track state.
     */
    function deposit() external payable {
        if (inRecovery) revert RecoveryModeActive("Use depositMUSD() instead");
        
        uint256 btcAmount = msg.value;
        if (btcAmount < MIN_DEPOSIT) revert MinimumDepositNotMet();
        if (btcAmount > MAX_DEPOSIT) revert MaximumDepositExceeded();
        if (userDeposits[msg.sender].active) revert DepositAlreadyExists();

        // Mock: Calculate MUSD to mint (assume 200:1 ratio for simplicity)
        // 1 BTC = 100,000 MUSD (mocked price)
        uint256 musdAmount = (btcAmount * 100000) / 1e18;

        // Mock: Mint MUSD to this contract (in real version, comes from Mezo)
        // For testing, we assume contract already has MUSD or we transfer from a faucet
        
        // Save user deposit
        userDeposits[msg.sender] = UserDeposit({
            btcAmount: btcAmount,
            musdMinted: musdAmount,
            musdDeposited: 0,
            yieldAccrued: 0,
            depositTimestamp: block.timestamp,
            lastYieldUpdate: block.timestamp,
            active: true,
            isRecoveryModeDeposit: false
        });

        totalBtcDeposited += btcAmount;
        totalMusdMinted += musdAmount;

        emit Deposited(msg.sender, btcAmount, musdAmount, block.timestamp);
    }

    /**
     * @notice Mock deposit MUSD directly (Recovery Mode)
     */
    function depositMUSD(uint256 musdAmount) external {
        if (!inRecovery) revert NotInRecoveryMode("Use deposit() instead");
        if (musdAmount < 1000e18) revert MinimumDepositNotMet();
        if (userDeposits[msg.sender].active) revert DepositAlreadyExists();

        // Transfer MUSD from user
        MUSD_TOKEN.safeTransferFrom(msg.sender, address(this), musdAmount);

        userDeposits[msg.sender] = UserDeposit({
            btcAmount: 0,
            musdMinted: 0,
            musdDeposited: musdAmount,
            yieldAccrued: 0,
            depositTimestamp: block.timestamp,
            lastYieldUpdate: block.timestamp,
            active: true,
            isRecoveryModeDeposit: true
        });

        totalMusdDeposited += musdAmount;

        emit MusdDeposited(msg.sender, musdAmount, block.timestamp);
    }

    /**
     * @notice Calculate pending yield based on time elapsed
     */
    function calculateYield(address user) public view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active) return 0;

        uint256 timeElapsed = block.timestamp - userDeposit.lastYieldUpdate;
        uint256 principal = userDeposit.musdMinted + userDeposit.musdDeposited;
        
        // Mock yield: principal * rate * time
        uint256 pendingYield = (principal * MOCK_YIELD_RATE_PER_SECOND * timeElapsed) / 1e18;
        
        return userDeposit.yieldAccrued + pendingYield;
    }

    /**
     * @notice Update yield for user
     */
    function updateYield() external {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        uint256 pendingYield = calculateYield(msg.sender) - userDeposit.yieldAccrued;
        
        if (pendingYield > 0) {
            userDeposit.yieldAccrued += pendingYield;
            userDeposit.lastYieldUpdate = block.timestamp;
            totalYieldsGenerated += pendingYield;

            emit YieldUpdated(msg.sender, userDeposit.yieldAccrued);
        }
    }

    /**
     * @notice Claim yields only
     */
    function claimYield() external returns (uint256 yieldAmount) {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        uint256 totalYield = calculateYield(msg.sender);
        if (totalYield == 0) revert InvalidAmount();

        uint256 feeAmount = (totalYield * performanceFee) / 10000;
        yieldAmount = totalYield - feeAmount;

        userDeposit.yieldAccrued = 0;
        userDeposit.lastYieldUpdate = block.timestamp;

        // Mock: Transfer MUSD yield (assume contract has balance)
        MUSD_TOKEN.safeTransfer(msg.sender, yieldAmount);
        if (feeAmount > 0) {
            MUSD_TOKEN.safeTransfer(feeCollector, feeAmount);
        }

        emit YieldClaimed(msg.sender, yieldAmount, feeAmount);
    }

    /**
     * @notice Withdraw all (principal + yields)
     */
    function withdraw() external returns (uint256 btcAmount, uint256 yieldAmount) {
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        if (!userDeposit.active) revert NoActiveDeposit();

        btcAmount = userDeposit.btcAmount;
        uint256 totalYield = calculateYield(msg.sender);

        uint256 feeAmount = (totalYield * performanceFee) / 10000;
        yieldAmount = totalYield - feeAmount;

        // Update state
        userDeposit.active = false;
        totalBtcDeposited -= btcAmount;
        totalMusdMinted -= userDeposit.musdMinted;

        // Mock: Return BTC to user
        (bool success, ) = msg.sender.call{value: btcAmount}("");
        require(success, "BTC transfer failed");

        // Transfer yields if any
        if (yieldAmount > 0) {
            MUSD_TOKEN.safeTransfer(msg.sender, yieldAmount);
        }
        if (feeAmount > 0) {
            MUSD_TOKEN.safeTransfer(feeCollector, feeAmount);
        }

        emit Withdrawn(msg.sender, btcAmount, userDeposit.musdMinted, yieldAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getUserInfo(address user) 
        external 
        view 
        returns (
            UserDeposit memory userDeposit,
            uint256 currentYield,
            uint256 netYield
        ) 
    {
        userDeposit = userDeposits[user];
        currentYield = calculateYield(user);
        
        uint256 feeAmount = (currentYield * performanceFee) / 10000;
        netYield = currentYield - feeAmount;
    }

    function getUserRoi(address user) external view returns (uint256 roi) {
        UserDeposit memory userDeposit = userDeposits[user];
        if (!userDeposit.active || userDeposit.musdMinted == 0) return 0;

        uint256 totalYield = calculateYield(user);
        roi = (totalYield * 10000) / userDeposit.musdMinted;
    }

    function getPoolStats() 
        external 
        view
        returns (
            uint256 totalBtc,
            uint256 totalMusd,
            uint256 totalMusdDeposited_,
            uint256 totalYields,
            uint256 avgApr,
            bool isRecoveryMode
        ) 
    {
        totalBtc = totalBtcDeposited;
        totalMusd = totalMusdMinted;
        totalMusdDeposited_ = totalMusdDeposited;
        totalYields = totalYieldsGenerated;
        avgApr = 650; // 6.5% in basis points
        isRecoveryMode = inRecovery;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setRecoveryMode(bool _inRecovery) external onlyOwner {
        inRecovery = _inRecovery;
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Max 10%");
        performanceFee = newFee;
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }

    // Allow contract to receive BTC
    receive() external payable {}
}
