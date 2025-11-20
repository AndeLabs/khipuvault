// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IMezoPriceFeed
 * @notice Interface for Mezo MUSD PriceFeed contract
 * @dev Based on official MUSD protocol documentation from mezo-org/musd
 * @dev Provides BTC/USD price data with freshness checks
 */
interface IMezoPriceFeed {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event LastGoodPriceUpdated(uint _lastGoodPrice);
    event PriceFeedStatusChanged(Status newStatus);

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum Status {
        chainlinkWorking,
        usingChainlinkFallback,
        bothOraclesUntrusted,
        usingChainlinkFrozen,
        usingFallbackChainlinkUntrusted,
        usingFallbackChainlinkFrozen
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fetches the current BTC/USD price
     * @return Current BTC price in USD (scaled by 1e18)
     * @dev Includes freshness check (must be updated within last 60 seconds)
     * @dev Reverts if price data is stale or invalid
     * @dev Uses Chainlink as primary oracle with fallback mechanisms
     */
    function fetchPrice() external returns (uint);

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the last good price recorded
     * @return Last valid BTC price in USD (scaled by 1e18)
     * @dev This price is cached and used when fresh data is unavailable
     */
    function lastGoodPrice() external view returns (uint);

    /**
     * @notice Gets the current status of the price feed
     * @return Current status enum indicating oracle health
     */
    function status() external view returns (Status);

    /**
     * @notice Checks if the price feed is working correctly
     * @return True if price feed is operational and providing fresh data
     */
    function isWorking() external view returns (bool);

    /**
     * @notice Gets the maximum allowed price deviation percentage
     * @return Maximum deviation in basis points (e.g., 500 = 5%)
     */
    function maxPriceDeviation() external view returns (uint);

    /**
     * @notice Gets the price staleness threshold
     * @return Maximum age of price data in seconds (typically 3600 = 1 hour)
     */
    function priceStaleThreshold() external view returns (uint);

    /**
     * @notice Gets the Chainlink aggregator address
     * @return Address of the Chainlink BTC/USD price aggregator
     */
    function chainlinkAggregator() external view returns (address);

    /**
     * @notice Gets the fallback oracle address (if any)
     * @return Address of the fallback price oracle
     */
    function fallbackOracle() external view returns (address);

    /**
     * @notice Gets the minimum price change required for update
     * @return Minimum price change in basis points
     */
    function minPriceChangeForUpdate() external view returns (uint);

    /*//////////////////////////////////////////////////////////////
                        CHAINLINK INTEGRATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets the latest round data from Chainlink
     * @return roundId The round ID
     * @return answer The price answer (BTC/USD)
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round ID of the round in which the answer was computed
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    /**
     * @notice Gets price data from a specific round
     * @param _roundId The round ID to query
     * @return roundId The round ID
     * @return answer The price answer for that round
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round ID of the round in which the answer was computed
     */
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    /*//////////////////////////////////////////////////////////////
                         PRICE VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validates if a price is within acceptable bounds
     * @param _price Price to validate (scaled by 1e18)
     * @return True if price is valid and within bounds
     */
    function isPriceValid(uint _price) external view returns (bool);

    /**
     * @notice Checks if price data is fresh (not stale)
     * @param _timestamp Timestamp to check against current time
     * @return True if timestamp is within staleness threshold
     */
    function isPriceFresh(uint _timestamp) external view returns (bool);

    /**
     * @notice Calculates percentage difference between two prices
     * @param _price1 First price for comparison
     * @param _price2 Second price for comparison
     * @return Percentage difference in basis points
     */
    function calculatePriceDeviation(uint _price1, uint _price2) external pure returns (uint);

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emergency function to set price manually (owner only)
     * @param _price Price to set (scaled by 1e18)
     * @dev Only callable in emergency situations
     * @dev Restricted to contract owner/governance
     */
    function setPrice(uint _price) external;

    /**
     * @notice Pauses the price feed (owner only)
     * @dev Emergency function to stop price updates
     */
    function pausePriceFeed() external;

    /**
     * @notice Unpauses the price feed (owner only)
     * @dev Restores normal price feed operation
     */
    function unpausePriceFeed() external;

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    error PriceIsStale();
    error PriceIsInvalid();
    error PriceDeviationTooHigh();
    error OracleNotWorking();
    error PriceFeedPaused();
    error InvalidPriceValue();
    error UnauthorizedAccess();
}