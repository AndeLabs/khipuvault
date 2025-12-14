// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../../interfaces/IYieldAggregator.sol";

/**
 * @title YieldAggregatorV3 - Production Grade with UUPS Proxy
 * @notice Agregador de yields multi-vault con optimizaciones
 * @dev Features:
 *      ✅ UUPS Upgradeable Pattern
 *      ✅ Storage Packing
 *      ✅ Flash loan protection
 *      ✅ Emergency mode
 *      ✅ Auto-compounding
 *      ✅ Multi-vault support
 * 
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
contract YieldAggregatorV3 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    IYieldAggregator
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                          STRUCTS (OPTIMIZED)
    //////////////////////////////////////////////////////////////*/

    struct VaultInfoPacked {
        uint128 totalDeposited;
        uint128 totalYield;
        uint64 apr;
        uint64 minDeposit;
        YieldStrategy strategy;
        bool active;
        address vaultAddress;
    }

    struct UserPositionPacked {
        uint128 principal;
        uint128 shares;
        uint64 lastUpdateTime;
        uint64 yieldAccrued;
    }

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public MUSD_TOKEN;

    mapping(address => VaultInfoPacked) public vaults;
    address[] public activeVaultsList;
    
    mapping(address => mapping(address => UserPositionPacked)) public userVaultPositions;
    mapping(address => uint256) public userTotalDeposited;

    uint256 public totalValueLocked;
    uint256 public totalYieldGenerated;
    bool public depositsPaused;
    bool public emergencyMode;
    
    mapping(address => bool) public authorizedCallers;

    // H-01 FIX: Block-based flash loan protection
    mapping(address => uint256) public depositBlock;

    uint256 public constant MIN_DEPOSIT = 1e18;
    uint256 public constant MAX_VAULTS = 10;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event EmergencyModeUpdated(bool enabled);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAmount();
    error InvalidVault();
    error VaultAlreadyExists();
    error VaultNotFound();
    error VaultInactive();
    error NoDeposit();
    error DepositsPaused();
    error TooManyVaults();
    error InvalidAddress();
    error FlashLoanDetected();
    error SameBlockWithdrawal();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _musdToken) public initializer {
        if (_musdToken == address(0)) revert InvalidAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        MUSD_TOKEN = IERC20(_musdToken);
    }

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice H-01 FIX: Block-based flash loan protection
     * @dev Uses block.number instead of extcodesize for robust protection
     *      - Deposit operations record the block number
     *      - Withdraw operations require a different block
     *      - Authorized callers (pools) skip this check as they have their own protection
     */
    modifier noFlashLoan() {
        if (!emergencyMode && !authorizedCallers[msg.sender]) {
            // Block-based protection: withdrawals must be in a different block than deposit
            if (depositBlock[msg.sender] == block.number) {
                revert SameBlockWithdrawal();
            }
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deposit(uint256 amount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (address vaultAddress, uint256 shares)
    {
        if (depositsPaused) revert DepositsPaused();
        if (amount < MIN_DEPOSIT) revert InvalidAmount();

        // H-01 FIX: Record deposit block for flash loan protection
        depositBlock[msg.sender] = block.number;

        (vaultAddress, ) = getBestVault();
        if (vaultAddress == address(0)) revert VaultNotFound();

        shares = _depositToVault(msg.sender, vaultAddress, amount);

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    function depositToVault(address vaultAddress, uint256 amount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (depositsPaused) revert DepositsPaused();
        if (amount < MIN_DEPOSIT) revert InvalidAmount();

        // H-01 FIX: Record deposit block for flash loan protection
        depositBlock[msg.sender] = block.number;

        VaultInfoPacked storage vault = vaults[vaultAddress];
        if (!vault.active) revert VaultInactive();

        shares = _depositToVault(msg.sender, vaultAddress, amount);

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function withdraw(uint256 amount)
        external
        override
        nonReentrant
        noFlashLoan
        returns (uint256 totalWithdrawn)
    {
        uint256 userTotal = userTotalDeposited[msg.sender];
        if (userTotal == 0) revert NoDeposit();

        uint256 toWithdraw = amount == 0 ? userTotal : amount;
        if (toWithdraw > userTotal) revert InvalidAmount();

        // CEI Pattern: Update state BEFORE external calls
        userTotalDeposited[msg.sender] -= toWithdraw;

        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            address vaultAddr = activeVaultsList[i];
            UserPositionPacked storage position = userVaultPositions[msg.sender][vaultAddr];

            if (position.principal > 0) {
                uint256 vaultWithdraw = (toWithdraw * uint256(position.principal)) / userTotal;
                uint256 withdrawn = _withdrawFromVault(msg.sender, vaultAddr, vaultWithdraw);
                totalWithdrawn += withdrawn;
            }
        }

        // External call AFTER all state changes (CEI pattern)
        MUSD_TOKEN.safeTransfer(msg.sender, totalWithdrawn);

        emit YieldWithdrawn(msg.sender, address(0), toWithdraw, totalWithdrawn - toWithdraw);
    }

    function withdrawFromVault(address vaultAddress, uint256 shares)
        external
        override
        nonReentrant
        noFlashLoan
        returns (uint256 amount)
    {
        VaultInfoPacked storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        UserPositionPacked storage position = userVaultPositions[msg.sender][vaultAddress];
        if (position.principal == 0) revert NoDeposit();

        uint256 sharesToRedeem = shares == 0 ? position.shares : shares;
        if (sharesToRedeem > position.shares) revert InvalidAmount();

        // CEI Pattern: Calculate and update state BEFORE external calls
        uint256 principalWithdrawn = (uint256(position.principal) * sharesToRedeem) / uint256(position.shares);
        userTotalDeposited[msg.sender] -= principalWithdrawn;

        amount = _withdrawFromVault(msg.sender, vaultAddress, sharesToRedeem);

        // External call AFTER all state changes (CEI pattern)
        MUSD_TOKEN.safeTransfer(msg.sender, amount);

        emit YieldWithdrawn(msg.sender, vaultAddress, principalWithdrawn, amount - principalWithdrawn);
    }

    /*//////////////////////////////////////////////////////////////
                         YIELD FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function claimYield()
        external
        override
        nonReentrant
        noFlashLoan
        returns (uint256 yieldAmount)
    {
        if (userTotalDeposited[msg.sender] == 0) revert NoDeposit();

        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            address vaultAddr = activeVaultsList[i];
            UserPositionPacked storage position = userVaultPositions[msg.sender][vaultAddr];
            
            if (position.principal > 0) {
                uint256 pendingYield = _calculatePendingYield(msg.sender, vaultAddr);
                if (pendingYield > 0) {
                    yieldAmount += pendingYield;
                    position.yieldAccrued = 0;
                    position.lastUpdateTime = uint64(block.timestamp);
                }
            }
        }

        if (yieldAmount == 0) revert InvalidAmount();

        MUSD_TOKEN.safeTransfer(msg.sender, yieldAmount);

        emit YieldClaimed(msg.sender, yieldAmount);
    }

    function compoundYields()
        external
        override
        nonReentrant
        noFlashLoan
        returns (uint256 compoundedAmount)
    {
        if (userTotalDeposited[msg.sender] == 0) revert NoDeposit();

        (address bestVault, ) = getBestVault();
        if (bestVault == address(0)) revert VaultNotFound();

        uint256 totalYield = getPendingYield(msg.sender);
        if (totalYield == 0) revert InvalidAmount();

        compoundedAmount = totalYield;
        
        UserPositionPacked storage position = userVaultPositions[msg.sender][bestVault];
        position.principal = uint128(uint256(position.principal) + compoundedAmount);
        position.yieldAccrued = 0;
        position.lastUpdateTime = uint64(block.timestamp);

        vaults[bestVault].totalDeposited = uint128(uint256(vaults[bestVault].totalDeposited) + compoundedAmount);
        userTotalDeposited[msg.sender] += compoundedAmount;

        emit YieldCompounded(msg.sender, compoundedAmount);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getPendingYield(address user)
        public
        view
        override
        returns (uint256 pendingYield)
    {
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            pendingYield += _calculatePendingYield(user, activeVaultsList[i]);
        }
    }

    function getPendingYieldInVault(address user, address vaultAddress)
        external
        view
        override
        returns (uint256 pendingYield)
    {
        return _calculatePendingYield(user, vaultAddress);
    }

    function getUserPosition(address user)
        external
        view
        override
        returns (uint256 principal, uint256 yields)
    {
        principal = userTotalDeposited[user];
        yields = getPendingYield(user);
    }

    function getUserPositionInVault(address user, address vaultAddress)
        external
        view
        override
        returns (UserPosition memory position)
    {
        UserPositionPacked memory packed = userVaultPositions[user][vaultAddress];
        position = UserPosition({
            principal: packed.principal,
            shares: packed.shares,
            yieldAccrued: packed.yieldAccrued,
            lastUpdateTime: packed.lastUpdateTime
        });
    }

    function getVaultInfo(address vaultAddress)
        external
        view
        override
        returns (VaultInfo memory info)
    {
        VaultInfoPacked memory packed = vaults[vaultAddress];
        info = VaultInfo({
            vaultAddress: packed.vaultAddress,
            strategy: packed.strategy,
            apr: packed.apr,
            totalDeposited: packed.totalDeposited,
            totalYield: packed.totalYield,
            active: packed.active,
            minDeposit: packed.minDeposit,
            maxDeposit: 0
        });
    }

    function getActiveVaults()
        external
        view
        override
        returns (address[] memory)
    {
        return activeVaultsList;
    }

    function getBestVault()
        public
        view
        override
        returns (address vaultAddress, uint256 apr)
    {
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            VaultInfoPacked memory vault = vaults[activeVaultsList[i]];
            if (vault.active && vault.apr > apr) {
                apr = vault.apr;
                vaultAddress = vault.vaultAddress;
            }
        }
    }

    function calculateExpectedYield(
        uint256 amount,
        address vaultAddress,
        uint256 timeInSeconds
    )
        external
        view
        override
        returns (uint256 expectedYield)
    {
        VaultInfoPacked memory vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) return 0;

        expectedYield = (amount * uint256(vault.apr) * timeInSeconds) / (10000 * 365 days);
    }

    function getTotalValueLocked()
        external
        view
        override
        returns (uint256 tvl)
    {
        return totalValueLocked;
    }

    function getAverageApr()
        external
        view
        override
        returns (uint256 avgApr)
    {
        if (totalValueLocked == 0) return 0;

        uint256 weightedSum = 0;
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            VaultInfoPacked memory vault = vaults[activeVaultsList[i]];
            if (vault.active && vault.totalDeposited > 0) {
                weightedSum += (uint256(vault.apr) * uint256(vault.totalDeposited));
            }
        }

        avgApr = weightedSum / totalValueLocked;
    }

    /*//////////////////////////////////////////////////////////////
                       INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _depositToVault(
        address user,
        address vaultAddress,
        uint256 amount
    ) internal returns (uint256 shares) {
        MUSD_TOKEN.safeTransferFrom(user, address(this), amount);

        shares = amount;

        UserPositionPacked storage position = userVaultPositions[user][vaultAddress];
        position.principal = uint128(uint256(position.principal) + amount);
        position.shares = uint128(uint256(position.shares) + shares);
        position.lastUpdateTime = uint64(block.timestamp);

        VaultInfoPacked storage vault = vaults[vaultAddress];
        vault.totalDeposited = uint128(uint256(vault.totalDeposited) + amount);

        userTotalDeposited[user] += amount;
        totalValueLocked += amount;
    }

    function _withdrawFromVault(
        address user,
        address vaultAddress,
        uint256 amount
    ) internal returns (uint256 withdrawn) {
        UserPositionPacked storage position = userVaultPositions[user][vaultAddress];
        VaultInfoPacked storage vault = vaults[vaultAddress];

        uint256 pendingYield = _calculatePendingYield(user, vaultAddress);

        withdrawn = amount + pendingYield;

        position.principal = uint128(uint256(position.principal) - amount);
        uint256 sharesToBurn = (uint256(position.shares) * amount) / (uint256(position.principal) + amount);
        position.shares = uint128(uint256(position.shares) - sharesToBurn);
        position.yieldAccrued = 0;
        position.lastUpdateTime = uint64(block.timestamp);

        vault.totalDeposited = uint128(uint256(vault.totalDeposited) - amount);

        totalValueLocked -= amount;
    }

    function _calculatePendingYield(address user, address vaultAddress)
        internal
        view
        returns (uint256 pendingYield)
    {
        UserPositionPacked memory position = userVaultPositions[user][vaultAddress];
        if (position.principal == 0) return 0;

        VaultInfoPacked memory vault = vaults[vaultAddress];
        if (!vault.active) return 0;

        uint256 timeElapsed = block.timestamp - uint256(position.lastUpdateTime);
        
        pendingYield = (uint256(position.principal) * uint256(vault.apr) * timeElapsed) / (10000 * 365 days);
        
        pendingYield += uint256(position.yieldAccrued);
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }

    function addVault(
        address vaultAddress,
        YieldStrategy strategy,
        uint256 apr
    ) external onlyOwner {
        if (vaultAddress == address(0)) revert InvalidAddress();
        if (vaults[vaultAddress].vaultAddress != address(0)) revert VaultAlreadyExists();
        if (activeVaultsList.length >= MAX_VAULTS) revert TooManyVaults();

        vaults[vaultAddress] = VaultInfoPacked({
            vaultAddress: vaultAddress,
            strategy: strategy,
            apr: uint64(apr),
            totalDeposited: 0,
            totalYield: 0,
            active: true,
            minDeposit: uint64(MIN_DEPOSIT)
        });

        activeVaultsList.push(vaultAddress);

        emit VaultAdded(vaultAddress, strategy, apr);
    }

    function updateVaultApr(address vaultAddress, uint256 newApr) external onlyOwner {
        VaultInfoPacked storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        vault.apr = uint64(newApr);

        emit VaultUpdated(vaultAddress, newApr, vault.active);
    }

    function setVaultActive(address vaultAddress, bool active) external onlyOwner {
        VaultInfoPacked storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        vault.active = active;

        emit VaultUpdated(vaultAddress, vault.apr, active);
    }

    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
    }

    function emergencyWithdrawFromVault(address vaultAddress) external override onlyOwner {
        VaultInfoPacked storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        vault.active = false;

        emit VaultUpdated(vaultAddress, vault.apr, false);
    }

    function pauseDeposits() external override onlyOwner {
        depositsPaused = true;
    }

    function resumeDeposits() external override onlyOwner {
        depositsPaused = false;
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
}
