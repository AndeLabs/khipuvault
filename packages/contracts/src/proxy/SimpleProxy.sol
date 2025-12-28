// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title SimpleProxy - Compatible with older EVM versions
 * @dev Minimal proxy implementation without PUSH0
 * @custom:security-contact security@khipuvault.com
 */
contract SimpleProxy {
    address public implementation;
    address public admin;

    event Upgraded(address indexed newImplementation);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    event EtherWithdrawn(address indexed to, uint256 amount);

    error Unauthorized();
    error InvalidAddress();
    error TransferFailed();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    constructor(address _implementation) {
        if (_implementation == address(0)) revert InvalidAddress();
        implementation = _implementation;
        admin = msg.sender;
    }

    /**
     * @notice Upgrade to a new implementation
     * @param _implementation New implementation address
     */
    function upgrade(address _implementation) external onlyAdmin {
        if (_implementation == address(0)) revert InvalidAddress();
        if (_implementation.code.length == 0) revert InvalidAddress();
        implementation = _implementation;
        emit Upgraded(_implementation);
    }

    /**
     * @notice Change admin address
     * @param _newAdmin New admin address
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert InvalidAddress();
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }

    /**
     * @notice Withdraw any ETH stuck in proxy (locked-ether fix)
     * @param _to Address to send ETH to
     * @param _amount Amount to withdraw (0 = all)
     */
    function withdrawEther(address payable _to, uint256 _amount) external onlyAdmin {
        if (_to == address(0)) revert InvalidAddress();
        uint256 amount = _amount == 0 ? address(this).balance : _amount;
        (bool success, ) = _to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit EtherWithdrawn(_to, amount);
    }

    fallback() external payable {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}