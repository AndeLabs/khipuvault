// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoSortedTroves
 * @notice Interface for Mezo MUSD SortedTroves contract
 * @dev Maintains a doubly linked list of Troves sorted by their nominal ICR
 * @dev Based on official MUSD protocol documentation from mezo-org/musd
 */
interface IMezoSortedTroves {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event NodeAdded(address indexed _id, uint _NICR);
    event NodeRemoved(address indexed _id);

    /*//////////////////////////////////////////////////////////////
                        INSERTION & REMOVAL
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Inserts a Trove into the sorted list
     * @param _id Address of the Trove to insert
     * @param _NICR Nominal Individual Collateral Ratio of the Trove
     * @param _prevId Address hint for the Trove that should be before this one
     * @param _nextId Address hint for the Trove that should be after this one
     * @dev Only callable by BorrowerOperations or TroveManager
     * @dev Reverts if hints are invalid or _id already exists
     */
    function insert(
        address _id,
        uint256 _NICR,
        address _prevId,
        address _nextId
    ) external;

    /**
     * @notice Removes a Trove from the sorted list
     * @param _id Address of the Trove to remove
     * @dev Only callable by BorrowerOperations or TroveManager
     * @dev Does nothing if _id doesn't exist in list
     */
    function remove(address _id) external;

    /**
     * @notice Re-inserts a Trove at new position after NICR change
     * @param _id Address of the Trove to reinsert
     * @param _newNICR New Nominal Individual Collateral Ratio
     * @param _prevId Address hint for new position before
     * @param _nextId Address hint for new position after
     * @dev Only callable by BorrowerOperations or TroveManager
     * @dev More gas efficient than remove + insert
     */
    function reInsert(
        address _id,
        uint256 _newNICR,
        address _prevId,
        address _nextId
    ) external;

    /*//////////////////////////////////////////////////////////////
                        POSITION FINDING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Finds correct insertion position for a given NICR
     * @param _NICR Nominal Individual Collateral Ratio to insert
     * @param _prevId Starting point hint for search (address before)
     * @param _nextId Starting point hint for search (address after)
     * @return prevId Correct address that should be before the new Trove
     * @return nextId Correct address that should be after the new Trove
     * @dev This is the KEY function for gas-efficient Trove operations
     * @dev Returns exact positions for insert/reInsert operations
     * @dev If hints are good, traversal is minimal; if bad, searches entire list
     */
    function findInsertPosition(
        uint256 _NICR,
        address _prevId,
        address _nextId
    ) external view returns (address prevId, address nextId);

    /*//////////////////////////////////////////////////////////////
                        LIST NAVIGATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the address of the first Trove in the list (lowest NICR)
     * @return First Trove address, or zero address if list is empty
     * @dev Lowest NICR = most at-risk of liquidation
     */
    function getFirst() external view returns (address);

    /**
     * @notice Gets the address of the last Trove in the list (highest NICR)
     * @return Last Trove address, or zero address if list is empty
     * @dev Highest NICR = safest collateralization
     */
    function getLast() external view returns (address);

    /**
     * @notice Gets the next Trove in the list (higher NICR)
     * @param _id Current Trove address
     * @return Next Trove address, or zero address if this is the last
     */
    function getNext(address _id) external view returns (address);

    /**
     * @notice Gets the previous Trove in the list (lower NICR)
     * @param _id Current Trove address
     * @return Previous Trove address, or zero address if this is the first
     */
    function getPrev(address _id) external view returns (address);

    /*//////////////////////////////////////////////////////////////
                        LIST STATE QUERIES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if a Trove exists in the sorted list
     * @param _id Trove address to check
     * @return True if Trove is in the list, false otherwise
     * @dev Useful for validating Trove status before operations
     */
    function contains(address _id) external view returns (bool);

    /**
     * @notice Checks if the sorted list is empty
     * @return True if no Troves in list, false otherwise
     */
    function isEmpty() external view returns (bool);

    /**
     * @notice Gets the total number of Troves in the list
     * @return Number of active Troves
     * @dev Useful for system monitoring and statistics
     */
    function getSize() external view returns (uint256);

    /**
     * @notice Gets the maximum size the list has reached
     * @return Maximum historical size of the list
     */
    function getMaxSize() external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                        VALIDATION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validates that insert position hints are correct
     * @param _NICR Nominal ICR to insert
     * @param _prevId Proposed previous Trove address
     * @param _nextId Proposed next Trove address
     * @return True if hints are valid for this NICR, false otherwise
     * @dev Useful for frontend validation before submitting transaction
     */
    function validInsertPosition(
        uint256 _NICR,
        address _prevId,
        address _nextId
    ) external view returns (bool);

    /*//////////////////////////////////////////////////////////////
                        BATCH QUERIES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets multiple Troves starting from a given address
     * @param _startId Starting Trove address
     * @param _maxCount Maximum number of Troves to return
     * @return troves Array of Trove addresses in sorted order
     * @dev Useful for frontend pagination and batch operations
     * @dev Returns fewer than _maxCount if end of list is reached
     */
    function getTroves(address _startId, uint256 _maxCount)
        external
        view
        returns (address[] memory troves);

    /*//////////////////////////////////////////////////////////////
                        CONTRACT REFERENCES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the TroveManager contract address
     * @return Address of TroveManager contract
     */
    function troveManager() external view returns (address);

    /**
     * @notice Gets the BorrowerOperations contract address
     * @return Address of BorrowerOperations contract
     */
    function borrowerOperationsAddress() external view returns (address);

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    error SortedTroves__CallerNotAuthorized();
    error SortedTroves__TroveAlreadyExists();
    error SortedTroves__TroveNotFound();
    error SortedTroves__InvalidHints();
    error SortedTroves__ListIsFull();
}
