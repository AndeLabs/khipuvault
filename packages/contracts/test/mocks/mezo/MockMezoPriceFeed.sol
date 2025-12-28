// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMezoPriceFeed} from "../../../src/interfaces/IMezoPriceFeed.sol";

/**
 * @title MockMezoPriceFeed
 * @notice Comprehensive mock for Mezo PriceFeed - supports all testing scenarios
 * @dev Configurable price, staleness, and failure modes for thorough testing
 * @author KhipuVault Team
 */
contract MockMezoPriceFeed is IMezoPriceFeed {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    uint256 private _price;
    uint256 private _lastGoodPrice;
    uint256 private _updatedAt;
    Status private _status;
    bool private _paused;

    // Failure simulation
    bool public shouldRevertOnFetch;
    bool public shouldReturnZero;
    bool public shouldReturnStaleData;
    uint256 public stalenessThreshold = 3600; // 1 hour default

    // Round data simulation
    uint80 private _roundId;
    int256 private _answer;

    // Configuration
    uint256 public constant MIN_PRICE = 1_000 * 1e18;     // $1,000
    uint256 public constant MAX_PRICE = 1_000_000 * 1e18; // $1,000,000
    uint256 private _maxPriceDeviation = 5000; // 50%

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MockPriceUpdated(uint256 newPrice, uint256 timestamp);
    event MockFailureModeSet(string mode, bool enabled);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(uint256 initialPrice) {
        _price = initialPrice;
        _lastGoodPrice = initialPrice;
        _updatedAt = block.timestamp;
        _status = Status.chainlinkWorking;
        _roundId = 1;
        _answer = int256(initialPrice);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS (IMezoPriceFeed)
    //////////////////////////////////////////////////////////////*/

    function fetchPrice() external override returns (uint256) {
        if (shouldRevertOnFetch) {
            revert OracleNotWorking();
        }
        if (shouldReturnZero) {
            return 0;
        }
        if (_paused) {
            revert PriceFeedPaused();
        }

        emit LastGoodPriceUpdated(_price);
        return _price;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function lastGoodPrice() external view override returns (uint256) {
        return _lastGoodPrice;
    }

    function status() external view override returns (Status) {
        return _status;
    }

    function isWorking() external view override returns (bool) {
        return _status == Status.chainlinkWorking && !_paused;
    }

    function maxPriceDeviation() external view override returns (uint256) {
        return _maxPriceDeviation;
    }

    function priceStaleThreshold() external view override returns (uint256) {
        return stalenessThreshold;
    }

    function chainlinkAggregator() external pure override returns (address) {
        return address(0);
    }

    function fallbackOracle() external pure override returns (address) {
        return address(0);
    }

    function minPriceChangeForUpdate() external pure override returns (uint256) {
        return 100; // 1%
    }

    /*//////////////////////////////////////////////////////////////
                        CHAINLINK INTEGRATION
    //////////////////////////////////////////////////////////////*/

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        uint256 effectiveUpdatedAt = shouldReturnStaleData
            ? block.timestamp - stalenessThreshold - 1
            : _updatedAt;

        return (
            _roundId,
            _answer,
            _updatedAt,
            effectiveUpdatedAt,
            _roundId
        );
    }

    function getRoundData(uint80 _targetRoundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _targetRoundId,
            _answer,
            _updatedAt,
            _updatedAt,
            _targetRoundId
        );
    }

    /*//////////////////////////////////////////////////////////////
                        PRICE VALIDATION
    //////////////////////////////////////////////////////////////*/

    function isPriceValid(uint256 _priceToCheck) external pure override returns (bool) {
        return _priceToCheck >= MIN_PRICE && _priceToCheck <= MAX_PRICE;
    }

    function isPriceFresh(uint256 _timestamp) external view override returns (bool) {
        return block.timestamp - _timestamp <= stalenessThreshold;
    }

    function calculatePriceDeviation(uint256 _price1, uint256 _price2) external pure override returns (uint256) {
        if (_price1 == 0 || _price2 == 0) return type(uint256).max;

        uint256 diff = _price1 > _price2 ? _price1 - _price2 : _price2 - _price1;
        return (diff * 10000) / _price1;
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPrice(uint256 _newPrice) external override {
        _price = _newPrice;
        _lastGoodPrice = _newPrice;
        _answer = int256(_newPrice);
        _updatedAt = block.timestamp;
        _roundId++;
        emit MockPriceUpdated(_newPrice, block.timestamp);
    }

    function pausePriceFeed() external override {
        _paused = true;
    }

    function unpausePriceFeed() external override {
        _paused = false;
    }

    /*//////////////////////////////////////////////////////////////
                        MOCK HELPERS (Testing Only)
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set price with custom timestamp
     * @param newPrice New price value
     * @param timestamp Custom timestamp
     */
    function setMockPrice(uint256 newPrice, uint256 timestamp) external {
        _price = newPrice;
        _lastGoodPrice = newPrice;
        _answer = int256(newPrice);
        _updatedAt = timestamp;
        _roundId++;
        emit MockPriceUpdated(newPrice, timestamp);
    }

    /**
     * @notice Configure failure mode for testing
     * @param mode "revert", "zero", or "stale"
     * @param enabled Whether to enable the failure mode
     */
    function setFailureMode(string calldata mode, bool enabled) external {
        bytes32 modeHash = keccak256(bytes(mode));

        if (modeHash == keccak256("revert")) {
            shouldRevertOnFetch = enabled;
        } else if (modeHash == keccak256("zero")) {
            shouldReturnZero = enabled;
        } else if (modeHash == keccak256("stale")) {
            shouldReturnStaleData = enabled;
        }

        emit MockFailureModeSet(mode, enabled);
    }

    /**
     * @notice Set staleness threshold for testing
     * @param threshold New threshold in seconds
     */
    function setStalenessThreshold(uint256 threshold) external {
        stalenessThreshold = threshold;
    }

    /**
     * @notice Set oracle status for testing
     * @param newStatus New status
     */
    function setStatus(Status newStatus) external {
        _status = newStatus;
        emit PriceFeedStatusChanged(newStatus);
    }

    /**
     * @notice Reset all failure modes
     */
    function resetFailureModes() external {
        shouldRevertOnFetch = false;
        shouldReturnZero = false;
        shouldReturnStaleData = false;
        _paused = false;
        _status = Status.chainlinkWorking;
    }

    /**
     * @notice Get current mock state for debugging
     */
    function getMockState() external view returns (
        uint256 price,
        uint256 lastGood,
        uint256 updated,
        Status currentStatus,
        bool paused,
        bool revertMode,
        bool zeroMode,
        bool staleMode
    ) {
        return (
            _price,
            _lastGoodPrice,
            _updatedAt,
            _status,
            _paused,
            shouldRevertOnFetch,
            shouldReturnZero,
            shouldReturnStaleData
        );
    }
}
