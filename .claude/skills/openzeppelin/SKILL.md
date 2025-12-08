---
name: openzeppelin
description: OpenZeppelin smart contract security patterns - access control, upgradeable contracts, reentrancy guards, and security best practices
---

# OpenZeppelin Security Patterns

This skill provides expertise in using OpenZeppelin contracts for secure smart contract development.

## Access Control

### Ownable (Simple)

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    constructor() Ownable(msg.sender) {}

    function adminFunction() external onlyOwner {
        // Only owner can call
    }
}
```

### AccessControl (Role-Based)

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function adminFunction() external onlyRole(ADMIN_ROLE) {
        // Only admins
    }

    function operatorFunction() external onlyRole(OPERATOR_ROLE) {
        // Only operators
    }
}
```

## Reentrancy Protection

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        // CEI Pattern: Checks-Effects-Interactions
        balances[msg.sender] = 0;  // Effect first

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

## Pausable

```solidity
import "@openzeppelin/contracts/utils/Pausable.sol";

contract MyContract is Pausable, Ownable {
    function deposit() external payable whenNotPaused {
        // Can only deposit when not paused
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

## Upgradeable Contracts (UUPS)

### Implementation Contract

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContractV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function setValue(uint256 _value) external {
        value = _value;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```

### Deployment with Foundry

```solidity
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Deploy implementation
MyContractV1 implementation = new MyContractV1();

// Deploy proxy
bytes memory data = abi.encodeCall(MyContractV1.initialize, ());
ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), data);

// Use proxy
MyContractV1 myContract = MyContractV1(address(proxy));
```

## Safe Math & Overflow

Solidity 0.8+ has built-in overflow checks. For unchecked operations:

```solidity
// Use unchecked only when you're certain overflow won't happen
function increment(uint256 i) internal pure returns (uint256) {
    unchecked {
        return i + 1;  // Gas optimization for counters
    }
}
```

## ERC20 Token Interactions

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyContract {
    using SafeERC20 for IERC20;

    function deposit(IERC20 token, uint256 amount) external {
        // Safe transfer that handles non-standard tokens
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(IERC20 token, uint256 amount) external {
        token.safeTransfer(msg.sender, amount);
    }
}
```

## Common Patterns for KhipuVault

### Pool Contract Pattern

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Pool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    mapping(address => uint256) public deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(IERC20 _token) Ownable(msg.sender) {
        depositToken = _token;
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");

        deposits[msg.sender] += amount;
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "Insufficient balance");

        deposits[msg.sender] -= amount;
        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

## Security Checklist

- [ ] Use `Ownable` or `AccessControl` for admin functions
- [ ] Apply `nonReentrant` to all external functions with transfers
- [ ] Use `SafeERC20` for token interactions
- [ ] Implement `Pausable` for emergency stops
- [ ] Follow CEI pattern (Checks-Effects-Interactions)
- [ ] Emit events for all state changes
- [ ] Use `immutable` for values set once in constructor
- [ ] Validate all inputs with `require` statements
