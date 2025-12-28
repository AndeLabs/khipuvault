// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BasePoolV3
 * @notice Abstract base contract for all KhipuVault pool types
 * @dev Provides common functionality: flash loan protection, fee management, pause mechanism
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
abstract contract BasePoolV3 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MAX_PERFORMANCE_FEE = 2000; // 20% max
    uint256 public constant FEE_DENOMINATOR = 10000;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public MUSD;
    address public feeCollector;
    uint256 public performanceFee;
    bool public emergencyMode;

    // Flash loan protection - maps user address to block number
    mapping(address => uint256) public depositBlock;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event EmergencyModeUpdated(bool enabled);
    event FeesCollected(address indexed collector, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidFee();
    error ZeroAddress();
    error SameBlockWithdrawal();
    error EmergencyModeActive();

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Prevents flash loan attacks by blocking same-block withdrawals
     * @dev H-01 FIX: Uses block.number instead of extcodesize for robust protection
     *      - Deposits record the block number
     *      - Withdrawals require a different block than deposit
     *      - This prevents single-transaction flash loan attacks
     *      - Emergency mode can bypass this protection for emergency withdrawals
     */
    modifier noFlashLoan() virtual {
        if (!emergencyMode) {
            // H-01 FIX: Block-based protection - withdrawals must be in different block
            if (depositBlock[msg.sender] == block.number) {
                revert SameBlockWithdrawal();
            }
        }
        _;
    }

    /**
     * @notice Blocks operations during emergency mode
     */
    modifier notInEmergency() {
        if (emergencyMode) {
            revert EmergencyModeActive();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize base pool state
     * @param _musd Address of MUSD token
     * @param _feeCollector Address to receive fees
     * @param _performanceFee Initial performance fee in basis points
     */
    function __BasePool_init(
        address _musd,
        address _feeCollector,
        uint256 _performanceFee
    ) internal onlyInitializing {
        if (_musd == address(0)) revert ZeroAddress();
        if (_feeCollector == address(0)) revert ZeroAddress();
        if (_performanceFee > MAX_PERFORMANCE_FEE) revert InvalidFee();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        MUSD = IERC20(_musd);
        feeCollector = _feeCollector;
        performanceFee = _performanceFee;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update performance fee
     * @param newFee New fee in basis points (max 2000 = 20%)
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_PERFORMANCE_FEE) revert InvalidFee();
        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update fee collector address
     * @param newCollector New fee collector address
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert ZeroAddress();
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Toggle emergency mode
     * @dev Disables flash loan protection and may enable emergency withdrawals
     */
    function setEmergencyMode(bool _enabled) external onlyOwner {
        emergencyMode = _enabled;
        emit EmergencyModeUpdated(_enabled);
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
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate fee amount from yield
     * @param yieldAmount Total yield to calculate fee from
     * @return feeAmount Amount of fee to collect
     * @return netYield Yield after fee deduction
     */
    function _calculateFee(uint256 yieldAmount) internal view returns (uint256 feeAmount, uint256 netYield) {
        if (emergencyMode || performanceFee == 0) {
            return (0, yieldAmount);
        }
        feeAmount = (yieldAmount * performanceFee) / FEE_DENOMINATOR;
        netYield = yieldAmount - feeAmount;
    }

    /**
     * @notice Record deposit block for flash loan protection
     */
    function _recordDeposit() internal {
        depositBlock[msg.sender] = block.number;
    }

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
     * Inherited OZ contracts (Ownable, ReentrancyGuard, Pausable, UUPS) store
     * their state in hash-based slots, not sequential slots. Therefore, the gap
     * only needs to account for THIS contract's state variables (5 slots):
     *   - MUSD (1 slot)
     *   - feeCollector (1 slot)
     *   - performanceFee (1 slot)
     *   - emergencyMode (1 slot)
     *   - depositBlock mapping (1 slot)
     *
     * Size: 50 slots - 5 slots used = 45 slots reserved for future state variables
     */
    uint256[45] private __gap;
}
