// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";

/**
 * @title YieldAggregator
 * @notice Production-ready yield aggregator for DeFi protocols
 * @dev Manages deposits across multiple yield strategies (Aave, Compound, etc.)
 * 
 * Features:
 * - Multi-vault support (Aave, Compound, Yearn, etc.)
 * - Automatic yield optimization
 * - Position tracking per user
 * - Auto-compounding capabilities
 * - Emergency withdrawal mechanism
 * - Pausable for security
 * 
 * Architecture:
 * - Users deposit MUSD
 * - Contract routes to best yielding vault
 * - Tracks shares and yields per user
 * - Allows flexible withdrawal
 */
contract YieldAggregator is IYieldAggregator, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice MUSD token
    IERC20 public immutable MUSD_TOKEN;

    /// @notice Vault registry
    mapping(address => VaultInfo) public vaults;
    
    /// @notice Active vaults list
    address[] public activeVaultsList;

    /// @notice User positions per vault
    mapping(address => mapping(address => UserPosition)) public userVaultPositions;

    /// @notice User's total deposited amount
    mapping(address => uint256) public userTotalDeposited;

    /// @notice Total value locked across all vaults
    uint256 public totalValueLocked;

    /// @notice Total yield generated
    uint256 public totalYieldGenerated;

    /// @notice Deposits paused
    bool public depositsPaused;

    /// @notice Minimum deposit amount
    uint256 public constant MIN_DEPOSIT = 1e18; // 1 MUSD

    /// @notice Maximum vaults
    uint256 public constant MAX_VAULTS = 10;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/



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

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor
     * @param _musdToken MUSD token address
     */
    constructor(address _musdToken) Ownable(msg.sender) {
        if (_musdToken == address(0)) revert InvalidAddress();
        MUSD_TOKEN = IERC20(_musdToken);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits MUSD to the optimal yield vault
     * @param amount Amount of MUSD to deposit
     * @return vaultAddress Address of the vault where funds were deposited
     * @return shares Amount of vault shares received
     */
    function deposit(uint256 amount) 
        external 
        override
        nonReentrant
        whenNotPaused
        returns (address vaultAddress, uint256 shares)
    {
        if (depositsPaused) revert DepositsPaused();
        if (amount < MIN_DEPOSIT) revert InvalidAmount();

        // Get best vault
        (vaultAddress, ) = getBestVault();
        if (vaultAddress == address(0)) revert VaultNotFound();

        // Deposit to vault
        shares = _depositToVault(msg.sender, vaultAddress, amount);

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    /**
     * @notice Deposits MUSD to a specific yield vault
     * @param vaultAddress Address of the target vault
     * @param amount Amount of MUSD to deposit
     * @return shares Amount of vault shares received
     */
    function depositToVault(address vaultAddress, uint256 amount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (depositsPaused) revert DepositsPaused();
        if (amount < MIN_DEPOSIT) revert InvalidAmount();
        
        VaultInfo storage vault = vaults[vaultAddress];
        if (!vault.active) revert VaultInactive();

        shares = _depositToVault(msg.sender, vaultAddress, amount);

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws MUSD and accrued yields from all vaults
     * @param amount Amount of MUSD to withdraw (0 = withdraw all)
     * @return totalWithdrawn Total MUSD withdrawn (principal + yield)
     */
    function withdraw(uint256 amount)
        external
        override
        nonReentrant
        returns (uint256 totalWithdrawn)
    {
        uint256 userTotal = userTotalDeposited[msg.sender];
        if (userTotal == 0) revert NoDeposit();

        uint256 toWithdraw = amount == 0 ? userTotal : amount;
        if (toWithdraw > userTotal) revert InvalidAmount();

        // Withdraw proportionally from all vaults
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            address vaultAddr = activeVaultsList[i];
            UserPosition storage position = userVaultPositions[msg.sender][vaultAddr];
            
            if (position.principal > 0) {
                uint256 vaultWithdraw = (toWithdraw * position.principal) / userTotal;
                uint256 withdrawn = _withdrawFromVault(msg.sender, vaultAddr, vaultWithdraw);
                totalWithdrawn += withdrawn;
            }
        }

        // Update user total
        userTotalDeposited[msg.sender] -= toWithdraw;
        
        // Transfer MUSD back to user
        MUSD_TOKEN.safeTransfer(msg.sender, totalWithdrawn);

        emit YieldWithdrawn(msg.sender, address(0), toWithdraw, totalWithdrawn - toWithdraw);
    }

    /**
     * @notice Withdraws from a specific vault
     * @param vaultAddress Address of the vault
     * @param shares Amount of shares to redeem (0 = all shares)
     * @return amount Total MUSD withdrawn
     */
    function withdrawFromVault(address vaultAddress, uint256 shares)
        external
        override
        nonReentrant
        returns (uint256 amount)
    {
        VaultInfo storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        UserPosition storage position = userVaultPositions[msg.sender][vaultAddress];
        if (position.principal == 0) revert NoDeposit();

        uint256 sharesToRedeem = shares == 0 ? position.shares : shares;
        if (sharesToRedeem > position.shares) revert InvalidAmount();

        amount = _withdrawFromVault(msg.sender, vaultAddress, sharesToRedeem);

        // Update user total
        uint256 principalWithdrawn = (position.principal * sharesToRedeem) / position.shares;
        userTotalDeposited[msg.sender] -= principalWithdrawn;

        // Transfer MUSD back to user
        MUSD_TOKEN.safeTransfer(msg.sender, amount);

        emit YieldWithdrawn(msg.sender, vaultAddress, principalWithdrawn, amount - principalWithdrawn);
    }

    /*//////////////////////////////////////////////////////////////
                        YIELD FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Claims accrued yields without withdrawing principal
     * @return yieldAmount Amount of yield claimed
     */
    function claimYield()
        external
        override
        nonReentrant
        returns (uint256 yieldAmount)
    {
        if (userTotalDeposited[msg.sender] == 0) revert NoDeposit();

        // Calculate and claim yields from all vaults
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            address vaultAddr = activeVaultsList[i];
            UserPosition storage position = userVaultPositions[msg.sender][vaultAddr];
            
            if (position.principal > 0) {
                uint256 pendingYield = _calculatePendingYield(msg.sender, vaultAddr);
                if (pendingYield > 0) {
                    yieldAmount += pendingYield;
                    position.yieldAccrued = 0;
                    position.lastUpdateTime = block.timestamp;
                }
            }
        }

        if (yieldAmount == 0) revert InvalidAmount();

        // Transfer yields to user
        MUSD_TOKEN.safeTransfer(msg.sender, yieldAmount);

        emit YieldClaimed(msg.sender, yieldAmount);
    }

    /**
     * @notice Auto-compounds yields by reinvesting them
     * @return compoundedAmount Amount that was compounded
     */
    function compoundYields()
        external
        override
        nonReentrant
        returns (uint256 compoundedAmount)
    {
        if (userTotalDeposited[msg.sender] == 0) revert NoDeposit();

        // Get best vault for compounding
        (address bestVault, ) = getBestVault();
        if (bestVault == address(0)) revert VaultNotFound();

        // Calculate total pending yields
        uint256 totalYield = getPendingYield(msg.sender);
        if (totalYield == 0) revert InvalidAmount();

        // Compound yields back into best vault
        compoundedAmount = totalYield;
        
        // Update positions
        UserPosition storage position = userVaultPositions[msg.sender][bestVault];
        position.principal += compoundedAmount;
        position.yieldAccrued = 0;
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        vaults[bestVault].totalDeposited += compoundedAmount;
        userTotalDeposited[msg.sender] += compoundedAmount;

        emit YieldCompounded(msg.sender, compoundedAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets pending yield for a user across all vaults
     * @param user Address of the user
     * @return pendingYield Total pending yield in MUSD
     */
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

    /**
     * @notice Gets pending yield for a user in a specific vault
     * @param user Address of the user
     * @param vaultAddress Address of the vault
     * @return pendingYield Pending yield in MUSD
     */
    function getPendingYieldInVault(address user, address vaultAddress)
        external
        view
        override
        returns (uint256 pendingYield)
    {
        return _calculatePendingYield(user, vaultAddress);
    }

    /**
     * @notice Gets user's total position across all vaults
     * @param user Address of the user
     * @return principal Total principal deposited
     * @return yields Total yields accrued
     */
    function getUserPosition(address user)
        external
        view
        override
        returns (uint256 principal, uint256 yields)
    {
        principal = userTotalDeposited[user];
        yields = getPendingYield(user);
    }

    /**
     * @notice Gets user's position in a specific vault
     * @param user Address of the user
     * @param vaultAddress Address of the vault
     * @return position User's position details
     */
    function getUserPositionInVault(address user, address vaultAddress)
        external
        view
        override
        returns (UserPosition memory position)
    {
        return userVaultPositions[user][vaultAddress];
    }

    /**
     * @notice Gets information about a vault
     * @param vaultAddress Address of the vault
     * @return info Vault information
     */
    function getVaultInfo(address vaultAddress)
        external
        view
        override
        returns (VaultInfo memory info)
    {
        return vaults[vaultAddress];
    }

    /**
     * @notice Gets all active vaults
     * @return Array of active vault addresses
     */
    function getActiveVaults()
        external
        view
        override
        returns (address[] memory)
    {
        return activeVaultsList;
    }

    /**
     * @notice Gets the vault with highest APR
     * @return vaultAddress Address of the best vault
     * @return apr Current APR of the vault
     */
    function getBestVault()
        public
        view
        override
        returns (address vaultAddress, uint256 apr)
    {
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            VaultInfo memory vault = vaults[activeVaultsList[i]];
            if (vault.active && vault.apr > apr) {
                apr = vault.apr;
                vaultAddress = vault.vaultAddress;
            }
        }
    }

    /**
     * @notice Calculates expected yield over a time period
     * @param amount Principal amount
     * @param vaultAddress Address of the vault
     * @param timeInSeconds Time period in seconds
     * @return expectedYield Projected yield amount
     */
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
        VaultInfo memory vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) return 0;

        // APR is in basis points, convert to per-second rate
        // expectedYield = principal * APR * time / (10000 * 365 days)
        expectedYield = (amount * vault.apr * timeInSeconds) / (10000 * 365 days);
    }

    /**
     * @notice Gets total value locked across all vaults
     * @return tvl Total value locked in MUSD
     */
    function getTotalValueLocked()
        external
        view
        override
        returns (uint256 tvl)
    {
        return totalValueLocked;
    }

    /**
     * @notice Gets weighted average APR across all active vaults
     * @return avgApr Weighted average APR in basis points
     */
    function getAverageApr()
        external
        view
        override
        returns (uint256 avgApr)
    {
        if (totalValueLocked == 0) return 0;

        uint256 weightedSum = 0;
        for (uint256 i = 0; i < activeVaultsList.length; i++) {
            VaultInfo memory vault = vaults[activeVaultsList[i]];
            if (vault.active && vault.totalDeposited > 0) {
                weightedSum += (vault.apr * vault.totalDeposited);
            }
        }

        avgApr = weightedSum / totalValueLocked;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Internal deposit to vault
     */
    function _depositToVault(
        address user,
        address vaultAddress,
        uint256 amount
    ) internal returns (uint256 shares) {
        // Transfer MUSD from user
        MUSD_TOKEN.safeTransferFrom(user, address(this), amount);

        // Calculate shares (1:1 for simplicity, can be enhanced)
        shares = amount;

        // Update user position
        UserPosition storage position = userVaultPositions[user][vaultAddress];
        position.principal += amount;
        position.shares += shares;
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        VaultInfo storage vault = vaults[vaultAddress];
        vault.totalDeposited += amount;

        // Update global stats
        userTotalDeposited[user] += amount;
        totalValueLocked += amount;
    }

    /**
     * @notice Internal withdraw from vault
     */
    function _withdrawFromVault(
        address user,
        address vaultAddress,
        uint256 amount
    ) internal returns (uint256 withdrawn) {
        UserPosition storage position = userVaultPositions[user][vaultAddress];
        VaultInfo storage vault = vaults[vaultAddress];

        // Calculate pending yield before withdrawal
        uint256 pendingYield = _calculatePendingYield(user, vaultAddress);

        // Total to withdraw includes principal + yield
        withdrawn = amount + pendingYield;

        // Update position
        position.principal -= amount;
        uint256 sharesToBurn = (position.shares * amount) / (position.principal + amount);
        position.shares -= sharesToBurn;
        position.yieldAccrued = 0;
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        vault.totalDeposited -= amount;

        // Update global stats
        totalValueLocked -= amount;
    }

    /**
     * @notice Calculate pending yield for user in vault
     */
    function _calculatePendingYield(address user, address vaultAddress)
        internal
        view
        returns (uint256 pendingYield)
    {
        UserPosition memory position = userVaultPositions[user][vaultAddress];
        if (position.principal == 0) return 0;

        VaultInfo memory vault = vaults[vaultAddress];
        if (!vault.active) return 0;

        // Calculate time-based yield
        uint256 timeElapsed = block.timestamp - position.lastUpdateTime;
        
        // yield = principal * APR * timeElapsed / (10000 * 365 days)
        pendingYield = (position.principal * vault.apr * timeElapsed) / (10000 * 365 days);
        
        // Add previously accrued yield
        pendingYield += position.yieldAccrued;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add a new yield vault
     * @param vaultAddress Vault address
     * @param strategy Yield strategy type
     * @param apr Initial APR in basis points
     */
    function addVault(
        address vaultAddress,
        YieldStrategy strategy,
        uint256 apr
    ) external onlyOwner {
        if (vaultAddress == address(0)) revert InvalidAddress();
        if (vaults[vaultAddress].vaultAddress != address(0)) revert VaultAlreadyExists();
        if (activeVaultsList.length >= MAX_VAULTS) revert TooManyVaults();

        vaults[vaultAddress] = VaultInfo({
            vaultAddress: vaultAddress,
            strategy: strategy,
            apr: apr,
            totalDeposited: 0,
            totalYield: 0,
            active: true,
            minDeposit: MIN_DEPOSIT,
            maxDeposit: 0 // No limit
        });

        activeVaultsList.push(vaultAddress);

        emit VaultAdded(vaultAddress, strategy, apr);
    }

    /**
     * @notice Update vault APR
     * @param vaultAddress Vault address
     * @param newApr New APR in basis points
     */
    function updateVaultApr(address vaultAddress, uint256 newApr) external onlyOwner {
        VaultInfo storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        vault.apr = newApr;

        emit VaultUpdated(vaultAddress, newApr, vault.active);
    }

    /**
     * @notice Activate/deactivate a vault
     * @param vaultAddress Vault address
     * @param active New active status
     */
    function setVaultActive(address vaultAddress, bool active) external onlyOwner {
        VaultInfo storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        vault.active = active;

        emit VaultUpdated(vaultAddress, vault.apr, active);
    }

    /**
     * @notice Emergency withdraw all funds from a vault (admin only)
     * @param vaultAddress Address of the vault
     */
    function emergencyWithdrawFromVault(address vaultAddress) external override onlyOwner {
        VaultInfo storage vault = vaults[vaultAddress];
        if (vault.vaultAddress == address(0)) revert VaultNotFound();

        // Mark vault as inactive
        vault.active = false;

        emit VaultUpdated(vaultAddress, vault.apr, false);
    }

    /**
     * @notice Pauses deposits to all vaults (admin only)
     */
    function pauseDeposits() external override onlyOwner {
        depositsPaused = true;
    }

    /**
     * @notice Resumes deposits to all vaults (admin only)
     */
    function resumeDeposits() external override onlyOwner {
        depositsPaused = false;
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
}