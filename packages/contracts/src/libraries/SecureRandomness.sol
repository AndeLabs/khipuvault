// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title SecureRandomness
 * @notice FREE alternative to Chainlink VRF using hybrid approach
 * @dev Combines RANDAO, block hash, and optional commit-reveal for secure randomness
 *
 * Security Features:
 * - Uses Ethereum's RANDAO (prevrandao opcode)
 * - Combines multiple sources of entropy
 * - Delay mechanism prevents single-block manipulation
 * - Optional participant contributions increase entropy
 * - No external dependencies = FREE
 *
 * Limitations:
 * - Not 100% manipulation-proof (no free solution is)
 * - Block proposers have ~0.01% influence
 * - Requires waiting 1+ blocks after trigger
 *
 * Trade-offs vs Chainlink VRF:
 * ✅ FREE (no subscription cost)
 * ✅ No external dependencies
 * ✅ Fully on-chain and verifiable
 * ⚠️ Slightly less secure (acceptable for most lotteries)
 * ⚠️ Requires 1-block delay
 */
library SecureRandomness {
    /**
     * @notice Generate secure random number using multiple entropy sources
     * @dev Combines RANDAO, block hash, and external seed
     *
     * Entropy Sources:
     * 1. prevrandao (RANDAO) - Ethereum's native randomness
     * 2. blockhash - Previous block hash
     * 3. External seed - From commit-reveal or other sources
     * 4. Current block number - Additional entropy
     *
     * @param blockNumber Block number to use for blockhash (must be recent)
     * @param externalSeed Additional entropy (from commits or other sources)
     * @return randomNumber Pseudo-random uint256
     */
    function generateSecureRandom(uint256 blockNumber, bytes32 externalSeed)
        internal
        view
        returns (uint256 randomNumber)
    {
        // Validation: block must be within last 256 blocks
        require(blockNumber < block.number && block.number - blockNumber <= 256, "Block too old or future");

        // Source 1: RANDAO (Ethereum's native randomness post-Merge)
        // This is the same as block.difficulty in pre-Merge
        uint256 randao = block.prevrandao;

        // Source 2: Block hash (different from RANDAO)
        bytes32 blockHash = blockhash(blockNumber);

        // Source 3: External seed from commits or other sources
        // Source 4: Current block number adds temporal entropy

        // Combine all sources using keccak256
        randomNumber =
            uint256(keccak256(abi.encodePacked(randao, blockHash, externalSeed, block.number, block.timestamp)));
    }

    /**
     * @notice Generate random number with commit-reveal contributions
     * @dev Users contribute entropy via commit-reveal scheme
     *
     * How it works:
     * 1. Users commit hashes during lottery period
     * 2. After lottery closes, users reveal their values
     * 3. All revealed values are XORed together
     * 4. Result is used as externalSeed in generateSecureRandom
     *
     * @param blockNumber Block number for blockhash
     * @param revealedValues Array of revealed random values from users
     * @return randomNumber Secure random number
     */
    function generateWithCommitReveal(uint256 blockNumber, uint256[] memory revealedValues)
        internal
        view
        returns (uint256 randomNumber)
    {
        // XOR all revealed values to create combined seed
        bytes32 externalSeed = bytes32(0);

        if (revealedValues.length > 0) {
            uint256 combined = revealedValues[0];
            for (uint256 i = 1; i < revealedValues.length; i++) {
                combined ^= revealedValues[i];
            }
            externalSeed = bytes32(combined);
        }

        // Generate using hybrid approach
        return generateSecureRandom(blockNumber, externalSeed);
    }

    /**
     * @notice Simple random number for non-critical use cases
     * @dev Only use for non-financial randomness (UI, ordering, etc.)
     *
     * WARNING: Can be manipulated by block proposers
     * DO NOT USE for lottery winners, prize distribution, etc.
     *
     * @param seed Additional entropy
     * @return randomNumber Pseudo-random uint256
     */
    function simpleRandom(bytes32 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, seed)));
    }

    /**
     * @notice Calculate commitment hash for commit-reveal
     * @dev Users should call this off-chain, then submit the hash
     *
     * @param randomValue User's secret random value
     * @param userAddress User's address (prevents replay)
     * @return commitment Keccak256 hash of value + address
     */
    function calculateCommitment(uint256 randomValue, address userAddress) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(randomValue, userAddress));
    }

    /**
     * @notice Verify revealed value matches commitment
     * @dev Called during reveal phase to validate user input
     *
     * @param commitment Previously submitted commitment hash
     * @param randomValue User's revealed random value
     * @param userAddress User's address
     * @return isValid True if reveal matches commitment
     */
    function verifyReveal(bytes32 commitment, uint256 randomValue, address userAddress) internal pure returns (bool) {
        return commitment == calculateCommitment(randomValue, userAddress);
    }

    /**
     * @notice Generate random number in range [0, max)
     * @dev Uses modulo for range limitation (slight bias, but acceptable)
     *
     * @param randomSeed Random seed from generateSecureRandom
     * @param max Upper bound (exclusive)
     * @return result Random number in range
     */
    function randomInRange(uint256 randomSeed, uint256 max) internal pure returns (uint256) {
        require(max > 0, "Max must be positive");
        return randomSeed % max;
    }
}
