// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title PriceValidator
 * @notice Library for validating oracle price data
 * @dev Provides reusable price validation logic for all integrations
 * @custom:security-contact security@khipuvault.com
 * @author KhipuVault Team
 */
library PriceValidator {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Price is below minimum bound
    error PriceTooLow(uint256 price, uint256 minPrice);

    /// @notice Price is above maximum bound
    error PriceTooHigh(uint256 price, uint256 maxPrice);

    /// @notice Price deviation from reference exceeds threshold
    error PriceDeviationTooHigh(uint256 price, uint256 refPrice, uint256 deviation, uint256 maxDeviation);

    /// @notice Price data is stale
    error PriceStale(uint256 updatedAt, uint256 threshold);

    /// @notice Price is zero or negative
    error InvalidPrice();

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Basis points denominator (100% = 10000)
    uint256 internal constant BPS = 10000;

    /*//////////////////////////////////////////////////////////////
                        VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate price is within bounds
     * @param price Price to validate
     * @param minPrice Minimum acceptable price
     * @param maxPrice Maximum acceptable price
     */
    function validateBounds(
        uint256 price,
        uint256 minPrice,
        uint256 maxPrice
    ) internal pure {
        if (price == 0) revert InvalidPrice();
        if (price < minPrice) revert PriceTooLow(price, minPrice);
        if (price > maxPrice) revert PriceTooHigh(price, maxPrice);
    }

    /**
     * @notice Validate price deviation from reference
     * @param price Current price
     * @param referencePrice Reference price to compare against
     * @param maxDeviationBps Maximum allowed deviation in basis points
     * @return deviation The calculated deviation in basis points
     */
    function validateDeviation(
        uint256 price,
        uint256 referencePrice,
        uint256 maxDeviationBps
    ) internal pure returns (uint256 deviation) {
        if (referencePrice == 0) return 0; // Skip check if no reference

        deviation = calculateDeviation(price, referencePrice);

        if (deviation > maxDeviationBps) {
            revert PriceDeviationTooHigh(price, referencePrice, deviation, maxDeviationBps);
        }
    }

    /**
     * @notice Validate price freshness
     * @param updatedAt Timestamp of last price update
     * @param stalenessThreshold Maximum allowed age in seconds
     */
    function validateFreshness(
        uint256 updatedAt,
        uint256 stalenessThreshold
    ) internal view {
        if (block.timestamp - updatedAt > stalenessThreshold) {
            revert PriceStale(updatedAt, stalenessThreshold);
        }
    }

    /**
     * @notice Full validation: bounds, deviation, and freshness
     * @param price Current price
     * @param minPrice Minimum acceptable price
     * @param maxPrice Maximum acceptable price
     * @param referencePrice Reference price for deviation check
     * @param maxDeviationBps Maximum deviation in basis points
     * @param updatedAt Timestamp of price update
     * @param stalenessThreshold Maximum age in seconds
     */
    function validateFull(
        uint256 price,
        uint256 minPrice,
        uint256 maxPrice,
        uint256 referencePrice,
        uint256 maxDeviationBps,
        uint256 updatedAt,
        uint256 stalenessThreshold
    ) internal view {
        validateBounds(price, minPrice, maxPrice);
        validateDeviation(price, referencePrice, maxDeviationBps);
        validateFreshness(updatedAt, stalenessThreshold);
    }

    /*//////////////////////////////////////////////////////////////
                        CALCULATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate percentage deviation between two prices
     * @param price1 First price
     * @param price2 Second price
     * @return deviation Deviation in basis points
     */
    function calculateDeviation(
        uint256 price1,
        uint256 price2
    ) internal pure returns (uint256 deviation) {
        if (price1 == 0 || price2 == 0) return BPS; // 100% deviation if either is 0

        uint256 diff = price1 > price2 ? price1 - price2 : price2 - price1;
        deviation = (diff * BPS) / price1;
    }

    /**
     * @notice Calculate value based on amount and price
     * @param amount Amount in token units
     * @param price Price per token (18 decimals)
     * @return value Calculated value (same decimals as amount)
     */
    function calculateValue(
        uint256 amount,
        uint256 price
    ) internal pure returns (uint256 value) {
        value = (amount * price) / 1e18;
    }

    /**
     * @notice Calculate amount based on value and price
     * @param value Target value
     * @param price Price per token (18 decimals)
     * @return amount Calculated amount (same decimals as value)
     */
    function calculateAmount(
        uint256 value,
        uint256 price
    ) internal pure returns (uint256 amount) {
        if (price == 0) revert InvalidPrice();
        amount = (value * 1e18) / price;
    }

    /**
     * @notice Calculate collateral ratio
     * @param collateralValue Value of collateral
     * @param debt Debt amount
     * @return ratio Collateral ratio in basis points
     */
    function calculateCollateralRatio(
        uint256 collateralValue,
        uint256 debt
    ) internal pure returns (uint256 ratio) {
        if (debt == 0) return type(uint256).max;
        ratio = (collateralValue * BPS) / debt;
    }

    /**
     * @notice Check if collateral ratio meets minimum threshold
     * @param collateralValue Value of collateral
     * @param debt Debt amount
     * @param minRatio Minimum required ratio in basis points
     * @return healthy True if ratio >= minRatio
     */
    function isHealthy(
        uint256 collateralValue,
        uint256 debt,
        uint256 minRatio
    ) internal pure returns (bool healthy) {
        if (debt == 0) return true;
        uint256 ratio = calculateCollateralRatio(collateralValue, debt);
        healthy = ratio >= minRatio;
    }
}
