// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title UUPSProxy - Production-grade UUPS Proxy
 * @notice EIP-1967 compliant upgradeable proxy with EVM London compatibility
 * @dev Based on OpenZeppelin but optimized for older EVM versions
 * 
 * Features:
 * - EIP-1967 storage slots for implementation and admin
 * - Compatible with EVM London (no PUSH0)
 * - Delegate call forwarding to implementation
 * - Event emissions for transparency
 * - Admin-only upgrade pattern
 */
contract UUPSProxy {
    /**
     * @dev Storage slot with the address of the current implementation.
     * This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1
     */
    bytes32 internal constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /**
     * @dev Storage slot with the admin of the contract.
     * This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1
     */
    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    /**
     * @dev Emitted when the implementation is upgraded.
     */
    event Upgraded(address indexed implementation);

    /**
     * @dev Emitted when the admin account has changed.
     */
    event AdminChanged(address previousAdmin, address newAdmin);

    /**
     * @notice Constructor to initialize the proxy
     * @param _implementation Address of the initial implementation
     * @param _data Initialization data to call on implementation
     */
    constructor(address _implementation, bytes memory _data) payable {
        _setAdmin(msg.sender);
        _setImplementation(_implementation);
        
        if (_data.length > 0) {
            (bool success, ) = _implementation.delegatecall(_data);
            require(success, "Initialization failed");
        }
    }

    /**
     * @dev Modifier to check caller is the admin
     */
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "UUPSProxy: caller is not admin");
        _;
    }

    /**
     * @notice Upgrade the implementation
     * @param newImplementation Address of the new implementation
     */
    function upgradeTo(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), "UUPSProxy: new implementation is zero address");
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
     * @notice Change the admin of the proxy
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "UUPSProxy: new admin is zero address");
        address previousAdmin = _getAdmin();
        _setAdmin(newAdmin);
        emit AdminChanged(previousAdmin, newAdmin);
    }

    /**
     * @notice Get current implementation address
     * @return impl Implementation address
     */
    function implementation() external view returns (address impl) {
        impl = _getImplementation();
    }

    /**
     * @notice Get current admin address
     * @return adm Admin address
     */
    function admin() external view returns (address adm) {
        adm = _getAdmin();
    }

    /**
     * @dev Fallback function that delegates calls to the implementation.
     * Will run if no other function in the contract matches the call data.
     */
    fallback() external payable {
        _delegate(_getImplementation());
    }

    /**
     * @dev Receive function for plain ether transfers
     */
    receive() external payable {
        _delegate(_getImplementation());
    }

    /**
     * @dev Delegates the current call to implementation.
     * This function does not return to its internal call site, it will return directly to the external caller.
     */
    function _delegate(address impl) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Returns the current implementation address.
     */
    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    /**
     * @dev Stores a new address in the EIP1967 implementation slot.
     */
    function _setImplementation(address newImplementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }

    /**
     * @dev Returns the current admin.
     */
    function _getAdmin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }

    /**
     * @dev Stores a new address in the EIP1967 admin slot.
     */
    function _setAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }
}
