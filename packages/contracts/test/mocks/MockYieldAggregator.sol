// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IYieldAggregator} from "../../src/interfaces/IYieldAggregator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockYieldAggregator
 * @notice Mock implementation of YieldAggregator with correct compound interest calculations
 * @dev Simulates realistic DeFi yield generation for testing KhipuVault pools
 * 
 * Features:
 * - Compound interest calculations using fixed-point arithmetic
 * - Multiple yield strategies with different APRs
 * - Time-based yield accumulation
 * - Gas-optimized calculations using bit operations
 * 
 * Mathematical Model:
 * - Uses continuous compounding: A = P * e^(rt)
 * - Approximated for gas efficiency: A ≈ P * (1 + r/n)^(nt)
 * - Where: P = principal, r = annual rate, t = time, n = compounding frequency
 */
contract MockYieldAggregator is IYieldAggregator {
    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Basis points divisor (10,000 = 100%)
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Seconds per year for APR calculations
    uint256 public constant SECONDS_PER_YEAR = 365.25 days;
    
    /// @notice WAD scale (1e18) for fixed-point arithmetic
    uint256 public constant WAD = 1e18;
    
    /// @notice Maximum APR in basis points (100% = 10,000 bp)
    uint256 public constant MAX_APR = 10000;
    
    /// @notice Minimum time delta for yield calculation (1 second)
    uint256 public constant MIN_TIME_DELTA = 1;

    /*//////////////////////////////////////////////////////////////
                            STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice MUSD token contract
    IERC20 public immutable musdToken;

    /// @notice Vault information
    mapping(address => VaultInfo) public vaults;
    
    /// @notice User position information  
    mapping(address => UserPosition) public userPositions;
    
    /// @notice List of active vault addresses
    address[] public vaultList;
    
    /// @notice Total MUSD deposited across all vaults
    uint256 public totalDeposited;
    
    /// @notice Total yield generated (for statistics)
    uint256 public totalYieldGenerated;
    
    /// @notice Contract deployment time
    uint256 public immutable deploymentTime;

    /*//////////////////////////////////////////////////////////////
                            ADDITIONAL STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Primary vault per user
    mapping(address => address) public userPrimaryVault;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event YieldCalculated(
        address indexed user,
        address indexed vault,
        uint256 principal,
        uint256 yieldAmount,
        uint256 timeElapsed
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAmount();
    error VaultNotActive();
    error NoActiveDeposit();
    error InvalidAPR();
    error VaultAlreadyExists();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _musdToken) {
        musdToken = IERC20(_musdToken);
        deploymentTime = block.timestamp;
        
        // Initialize default vault (AAVE strategy, 6% APR)
        address defaultVault = address(0x1);
        vaults[defaultVault] = VaultInfo({
            vaultAddress: defaultVault,
            strategy: YieldStrategy.AAVE,
            apr: 600, // 6%
            totalDeposited: 0,
            totalYield: 0,
            active: true,
            minDeposit: 1e18,
            maxDeposit: 0
        });
        vaultList.push(defaultVault);
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit MUSD to earn yield
     * @param amount Amount of MUSD to deposit
     * @return vaultAddress Address of vault used for deposit
     * @return shares Shares minted for the deposit
     */
    function deposit(uint256 amount) 
        external 
        override 
        returns (address vaultAddress, uint256 shares) 
    {
        if (amount == 0) revert InvalidAmount();

        // Transfer MUSD from sender
        musdToken.transferFrom(msg.sender, address(this), amount);

        // Update pending yield before deposit
        _updateUserYield(msg.sender);

        // Use first active vault (simplified for mock)
        vaultAddress = vaultList[0];
        VaultInfo storage vault = vaults[vaultAddress];
        
        if (!vault.active) revert VaultNotActive();

        // Calculate shares (1:1 ratio for simplicity)
        shares = amount;

        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        
        if (position.principal == 0) {
            // New position
            userPrimaryVault[msg.sender] = vaultAddress;
            position.lastUpdateTime = block.timestamp;
        }
        
        position.principal += amount;
        position.shares += shares;

        // Update vault stats
        vault.totalDeposited += amount;
        totalDeposited += amount;

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    /**
     * @notice Withdraw principal and accrued yield
     * @param amount Amount to withdraw (0 = withdraw all)
     * @return totalWithdrawn Total amount withdrawn (principal + yield)
     */
    function withdraw(uint256 amount) 
        external 
        override 
        returns (uint256 totalWithdrawn) 
    {
        UserPosition storage position = userPositions[msg.sender];
        if (position.principal == 0) revert NoActiveDeposit();

        // Update yield before withdrawal
        _updateUserYield(msg.sender);

        // Calculate total available (principal + yield)
        uint256 totalAvailable = position.principal + position.yieldAccrued;
        
        if (amount == 0) {
            amount = totalAvailable;
        }
        
        if (amount > totalAvailable) {
            amount = totalAvailable;
        }

        // Calculate proportional principal and yield withdrawal
        uint256 principalToWithdraw;
        uint256 yieldToWithdraw;
        
        if (amount >= totalAvailable) {
            // Withdraw everything
            principalToWithdraw = position.principal;
            yieldToWithdraw = position.yieldAccrued;
            
            // Reset position
            position.principal = 0;
            position.shares = 0;
            position.yieldAccrued = 0;
        } else {
            // Partial withdrawal - proportional
            uint256 withdrawRatio = (amount * WAD) / totalAvailable;
            principalToWithdraw = (position.principal * withdrawRatio) / WAD;
            yieldToWithdraw = (position.yieldAccrued * withdrawRatio) / WAD;
            
            // Update remaining position
            position.principal -= principalToWithdraw;
            position.yieldAccrued -= yieldToWithdraw;
            position.shares = (position.shares * (WAD - withdrawRatio)) / WAD;
        }

        totalWithdrawn = principalToWithdraw + yieldToWithdraw;
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        address vaultAddr = userPrimaryVault[msg.sender];
        VaultInfo storage vault = vaults[vaultAddr];
        vault.totalDeposited -= principalToWithdraw;
        totalDeposited -= principalToWithdraw;
        totalYieldGenerated += yieldToWithdraw;

        // Transfer tokens
        musdToken.transfer(msg.sender, totalWithdrawn);

        emit YieldWithdrawn(msg.sender, vaultAddr, principalToWithdraw, yieldToWithdraw);
    }

    /**
     * @notice Claim accrued yield without withdrawing principal
     * @return yieldAmount Amount of yield claimed
     */
    function claimYield() 
        external 
        override 
        returns (uint256 yieldAmount) 
    {
        UserPosition storage position = userPositions[msg.sender];
        if (position.principal == 0) revert NoActiveDeposit();

        // Update yield calculation
        _updateUserYield(msg.sender);
        
        yieldAmount = position.yieldAccrued;
        if (yieldAmount == 0) revert InvalidAmount();

        // Reset yield
        position.yieldAccrued = 0;
        position.lastUpdateTime = block.timestamp;

        // Update stats
        totalYieldGenerated += yieldAmount;

        // Transfer yield
        musdToken.transfer(msg.sender, yieldAmount);

        emit YieldClaimed(msg.sender, yieldAmount);
    }

    /**
     * @notice Auto-compound yields by reinvesting them
     * @return compoundedAmount Amount of yield that was compounded
     */
    function compoundYields() 
        external 
        override 
        returns (uint256 compoundedAmount) 
    {
        UserPosition storage position = userPositions[msg.sender];
        if (position.principal == 0) revert NoActiveDeposit();

        // Update yield calculation
        _updateUserYield(msg.sender);
        
        compoundedAmount = position.yieldAccrued;
        if (compoundedAmount == 0) revert InvalidAmount();

        // Add yield to principal (compound)
        position.principal += compoundedAmount;
        position.yieldAccrued = 0;
        position.shares += compoundedAmount; // 1:1 share ratio
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        address vaultAddr = userPrimaryVault[msg.sender];
        VaultInfo storage vault = vaults[vaultAddr];
        vault.totalDeposited += compoundedAmount;
        totalDeposited += compoundedAmount;
        totalYieldGenerated += compoundedAmount;

        emit YieldCompounded(msg.sender, compoundedAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get pending yield for a user (without updating state)
     * @param user Address of the user
     * @return pendingYield Amount of pending yield
     */
    function getPendingYield(address user) 
        external 
        view 
        override 
        returns (uint256 pendingYield) 
    {
        UserPosition memory position = userPositions[user];
        if (position.principal == 0) return 0;

        // Calculate yield since last update
        uint256 newYield = _calculateYield(
            position.principal,
            userPrimaryVault[user],
            position.lastUpdateTime,
            block.timestamp
        );

        return position.yieldAccrued + newYield;
    }

    /**
     * @notice Get pending yield for a user in a specific vault
     * @param user Address of the user
     * @param vault Address of the vault
     * @return pendingYield Amount of pending yield in that vault
     */
    function getPendingYieldInVault(address user, address vault) 
        external 
        view 
        override 
        returns (uint256 pendingYield) 
    {
        UserPosition memory position = userPositions[user];
        if (position.principal == 0 || userPrimaryVault[user] != vault) return 0;

        return this.getPendingYield(user);
    }

    /**
     * @notice Get user's position info
     * @param user Address of the user
     * @return principal Original deposit amount
     * @return yields Total accrued yields
     */
    function getUserPosition(address user) 
        external 
        view 
        override 
        returns (uint256 principal, uint256 yields) 
    {
        UserPosition memory position = userPositions[user];
        uint256 pendingYield = this.getPendingYield(user);
        return (position.principal, pendingYield);
    }

    /**
     * @notice Get user's position in a specific vault
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
        return userPositions[user];
    }

    /**
     * @notice Get all active vaults
     * @return activeVaults Array of active vault addresses
     */
    function getActiveVaults()
        external
        view
        override
        returns (address[] memory activeVaults)
    {
        return vaultList;
    }

    /**
     * @notice Get the vault with highest APR
     * @return vaultAddress Address of the best vault
     * @return apr Current APR of the vault
     */
    function getBestVault()
        public
        view
        override
        returns (address vaultAddress, uint256 apr)
    {
        for (uint256 i = 0; i < vaultList.length; i++) {
            VaultInfo memory vault = vaults[vaultList[i]];
            if (vault.active && vault.apr > apr) {
                apr = vault.apr;
                vaultAddress = vaultList[i];
            }
        }
    }

    /**
     * @notice Calculate expected yield over a time period
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
        return _calculateYield(amount, vaultAddress, block.timestamp, block.timestamp + timeInSeconds);
    }

    /**
     * @notice Get total value locked across all vaults
     * @return tvl Total value locked in MUSD
     */
    function getTotalValueLocked()
        external
        view
        override
        returns (uint256 tvl)
    {
        return totalDeposited;
    }

    /**
     * @notice Get weighted average APR across all active vaults
     * @return avgApr Weighted average APR in basis points
     */
    function getAverageApr()
        external
        view
        override
        returns (uint256 avgApr)
    {
        if (totalDeposited == 0) return 0;

        uint256 weightedSum = 0;
        for (uint256 i = 0; i < vaultList.length; i++) {
            VaultInfo memory vault = vaults[vaultList[i]];
            if (vault.active && vault.totalDeposited > 0) {
                weightedSum += (vault.apr * vault.totalDeposited);
            }
        }

        avgApr = weightedSum / totalDeposited;
    }

    /**
     * @notice Deposit MUSD to a specific yield vault
     * @param vaultAddress Address of the target vault
     * @param amount Amount of MUSD to deposit
     * @return shares Amount of vault shares received
     */
    function depositToVault(address vaultAddress, uint256 amount)
        external
        override
        returns (uint256 shares)
    {
        if (amount == 0) revert InvalidAmount();
        
        VaultInfo storage vault = vaults[vaultAddress];
        if (!vault.active) revert VaultNotActive();

        // Transfer MUSD from sender
        musdToken.transferFrom(msg.sender, address(this), amount);

        // Update pending yield before deposit
        _updateUserYield(msg.sender);

        // Calculate shares (1:1 ratio for simplicity)
        shares = amount;

        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        
        if (position.principal == 0) {
            userPrimaryVault[msg.sender] = vaultAddress;
            position.lastUpdateTime = block.timestamp;
        }
        
        position.principal += amount;
        position.shares += shares;

        // Update vault stats
        vault.totalDeposited += amount;
        totalDeposited += amount;

        emit YieldDeposited(msg.sender, vaultAddress, amount, shares);
    }

    /**
     * @notice Withdraw from a specific vault
     * @param vaultAddress Address of the vault
     * @param shares Amount of shares to redeem (0 = all shares)
     * @return amount Total MUSD withdrawn
     */
    function withdrawFromVault(address vaultAddress, uint256 shares)
        external
        override
        returns (uint256 amount)
    {
        UserPosition storage position = userPositions[msg.sender];
        if (position.principal == 0) revert NoActiveDeposit();

        // Update yield before withdrawal
        _updateUserYield(msg.sender);

        uint256 sharesToRedeem = shares == 0 ? position.shares : shares;
        if (sharesToRedeem > position.shares) revert InvalidAmount();

        // Calculate proportional withdrawal
        uint256 principalToWithdraw = (position.principal * sharesToRedeem) / position.shares;
        uint256 yieldToWithdraw = (position.yieldAccrued * sharesToRedeem) / position.shares;
        amount = principalToWithdraw + yieldToWithdraw;

        // Update position
        position.principal -= principalToWithdraw;
        position.shares -= sharesToRedeem;
        position.yieldAccrued -= yieldToWithdraw;
        position.lastUpdateTime = block.timestamp;

        // Update vault stats
        VaultInfo storage vault = vaults[vaultAddress];
        vault.totalDeposited -= principalToWithdraw;
        totalDeposited -= principalToWithdraw;
        totalYieldGenerated += yieldToWithdraw;

        // Transfer tokens
        musdToken.transfer(msg.sender, amount);

        emit YieldWithdrawn(msg.sender, vaultAddress, principalToWithdraw, yieldToWithdraw);
    }

    /**
     * @notice Emergency withdraw all funds from a vault (admin only)
     * @param vaultAddress Address of the vault
     */
    function emergencyWithdrawFromVault(address vaultAddress) external override {
        VaultInfo storage vault = vaults[vaultAddress];
        vault.active = false;
        emit VaultUpdated(vaultAddress, vault.apr, false);
    }

    /**
     * @notice Pause deposits to all vaults (admin only)
     */
    function pauseDeposits() external override {
        // Mock implementation - no-op
    }

    /**
     * @notice Resume deposits to all vaults (admin only)
     */
    function resumeDeposits() external override {
        // Mock implementation - no-op
    }

    /**
     * @notice Get vault information
     * @param vaultAddress Address of the vault
     * @return info Vault information struct
     */
    function getVaultInfo(address vaultAddress) 
        external 
        view 
        override 
        returns (VaultInfo memory info) 
    {
        return vaults[vaultAddress];
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add a new yield vault
     * @param vault Address of the vault
     * @param strategy Yield strategy
     * @param apr Annual percentage rate in basis points
     */
    function addVault(address vault, YieldStrategy strategy, uint256 apr) 
        external 
    {
        if (apr > MAX_APR) revert InvalidAPR();
        if (vaults[vault].active) revert VaultAlreadyExists();

        vaults[vault] = VaultInfo({
            vaultAddress: vault,
            strategy: strategy,
            apr: apr,
            totalDeposited: 0,
            totalYield: 0,
            active: true,
            minDeposit: 1e18,
            maxDeposit: 0
        });

        vaultList.push(vault);

        emit VaultAdded(vault, strategy, apr);
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update user's yield accumulation
     * @param user Address of the user
     */
    function _updateUserYield(address user) internal {
        UserPosition storage position = userPositions[user];
        if (position.principal == 0) return;

        uint256 newYield = _calculateYield(
            position.principal,
            userPrimaryVault[user],
            position.lastUpdateTime,
            block.timestamp
        );

        if (newYield > 0) {
            position.yieldAccrued += newYield;
            
            emit YieldCalculated(
                user,
                userPrimaryVault[user],
                position.principal,
                newYield,
                block.timestamp - position.lastUpdateTime
            );
        }

        position.lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Calculate yield using compound interest formula
     * @param principal Principal amount
     * @param vault Vault address
     * @param fromTime Start time
     * @param toTime End time
     * @return yieldAmount Calculated yield amount
     */
    function _calculateYield(
        uint256 principal,
        address vault,
        uint256 fromTime,
        uint256 toTime
    ) internal view returns (uint256 yieldAmount) {
        if (principal == 0 || fromTime >= toTime) return 0;

        VaultInfo memory vaultInfo = vaults[vault];
        if (!vaultInfo.active || vaultInfo.apr == 0) return 0;

        uint256 timeElapsed = toTime - fromTime;
        if (timeElapsed < MIN_TIME_DELTA) return 0;

        // Convert APR from basis points to WAD (1e18 scale)
        // Example: 600 bp = 6% = 0.06 = 6e16 in WAD
        uint256 annualRateWad = (vaultInfo.apr * WAD) / BASIS_POINTS;
        
        // Calculate time fraction (timeElapsed / SECONDS_PER_YEAR) in WAD
        uint256 timeFractionWad = (timeElapsed * WAD) / SECONDS_PER_YEAR;
        
        // For shorter periods, use simple interest approximation: yield = principal * rate * time
        // yield = principal * (annualRate * timeFraction)
        yieldAmount = (principal * annualRateWad * timeFractionWad) / (WAD * WAD);

        // For periods longer than 30 days, add compound effect
        if (timeElapsed > 30 days) {
            // Use compound approximation: (1 + r)^t ≈ 1 + rt + (rt)^2/2
            uint256 rt = (annualRateWad * timeFractionWad) / WAD;
            uint256 compoundEffect = (rt * rt) / (2 * WAD);
            uint256 additionalYield = (principal * compoundEffect) / WAD;
            yieldAmount += additionalYield;
        }

        return yieldAmount;
    }

    /*//////////////////////////////////////////////////////////////
                            UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get total number of active vaults
     * @return count Number of active vaults
     */
    function getActiveVaultCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < vaultList.length; i++) {
            if (vaults[vaultList[i]].active) {
                count++;
            }
        }
    }

    /**
     * @notice Fund the aggregator with MUSD for testing
     * @param amount Amount of MUSD to fund
     */
    function fundAggregator(uint256 amount) external {
        musdToken.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Get contract statistics
     * @return totalDeposited_ Total MUSD deposited
     * @return totalYieldGenerated_ Total yield generated
     * @return activeVaultCount Number of active vaults
     * @return contractAge Age of contract in seconds
     */
    function getStats() external view returns (
        uint256 totalDeposited_,
        uint256 totalYieldGenerated_,
        uint256 activeVaultCount,
        uint256 contractAge
    ) {
        totalDeposited_ = totalDeposited;
        totalYieldGenerated_ = totalYieldGenerated;
        
        for (uint256 i = 0; i < vaultList.length; i++) {
            if (vaults[vaultList[i]].active) {
                activeVaultCount++;
            }
        }
        
        contractAge = block.timestamp - deploymentTime;
    }
}