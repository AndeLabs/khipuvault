// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMUSD
 * @notice Mock MUSD token for testing
 * @dev Simple ERC20 implementation with minting capability
 */
contract MockMUSD is ERC20, Ownable {
    constructor() ERC20("Mock MUSD", "MUSD") Ownable(msg.sender) {}

    /**
     * @notice Mint tokens to an address
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @notice Burn tokens from an address
     * @param _from Address to burn from
     * @param _amount Amount to burn
     */
    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }

    /**
     * @notice Allow anyone to mint for testing (unrestricted)
     * @param _amount Amount to mint
     */
    function mintPublic(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }
}
