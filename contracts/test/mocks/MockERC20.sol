// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 mock for testing purposes
 * @dev Allows anyone to mint tokens for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from any address (for testing)
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    /**
     * @notice Mint tokens to msg.sender (convenience function)
     */
    function mintSelf(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}