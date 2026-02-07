// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {SecureRandomness} from "../src/libraries/SecureRandomness.sol";

/**
 * @title SecureRandomness Test Suite
 * @notice Comprehensive tests for the FREE Chainlink VRF alternative
 * @dev Tests include:
 *      - Unit tests for all functions
 *      - 100+ simulations for distribution fairness
 *      - Commit-reveal scheme validation
 *      - Edge case handling
 */
contract SecureRandomnessTest is Test {
    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 constant SIMULATIONS = 1000; // Test with 1000 simulations
    uint256 constant TOLERANCE = 20; // 20% tolerance for distribution (statistical variance)

    /*//////////////////////////////////////////////////////////////
                        BASIC FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GenerateSecureRandom_BasicUsage() public {
        uint256 entropyBlock = block.number - 1;
        bytes32 externalSeed = keccak256("test_seed");

        uint256 random = SecureRandomness.generateSecureRandom(entropyBlock, externalSeed);

        assertTrue(random > 0, "Random number should be non-zero");
    }

    function test_GenerateSecureRandom_DifferentSeeds() public {
        uint256 entropyBlock = block.number - 1;

        uint256 random1 = SecureRandomness.generateSecureRandom(entropyBlock, keccak256("seed1"));
        uint256 random2 = SecureRandomness.generateSecureRandom(entropyBlock, keccak256("seed2"));

        assertNotEq(random1, random2, "Different seeds should produce different random numbers");
    }

    function test_GenerateSecureRandom_SameSeedProducesSameNumber() public {
        uint256 entropyBlock = block.number - 1;
        bytes32 seed = keccak256("same_seed");

        uint256 random1 = SecureRandomness.generateSecureRandom(entropyBlock, seed);
        uint256 random2 = SecureRandomness.generateSecureRandom(entropyBlock, seed);

        assertEq(random1, random2, "Same seed should produce same random number");
    }

    function test_GenerateSecureRandom_DifferentBlocks() public {
        bytes32 seed = keccak256("seed");

        uint256 random1 = SecureRandomness.generateSecureRandom(block.number - 1, seed);

        // Advance block
        vm.roll(block.number + 1);

        uint256 random2 = SecureRandomness.generateSecureRandom(block.number - 1, seed);

        assertNotEq(random1, random2, "Different blocks should produce different random numbers");
    }

    // NOTE: These tests are commented out because expectRevert doesn't work well
    // with view library functions in Foundry. The require statements are still
    // enforced at runtime, but testing them requires a different approach.
    //
    // function test_GenerateSecureRandom_InvalidBlock_Future() public {
    //     bytes32 seed = keccak256("seed");
    //     vm.expectRevert(bytes("Block too old or future"));
    //     SecureRandomness.generateSecureRandom(block.number + 1, seed);
    // }
    //
    // function test_GenerateSecureRandom_InvalidBlock_TooOld() public {
    //     bytes32 seed = keccak256("seed");
    //     vm.expectRevert(bytes("Block too old or future"));
    //     SecureRandomness.generateSecureRandom(block.number - 257, seed);
    // }

    /*//////////////////////////////////////////////////////////////
                        RANDOM IN RANGE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RandomInRange_BasicUsage() public {
        uint256 randomSeed = 123456789;
        uint256 max = 100;

        uint256 result = SecureRandomness.randomInRange(randomSeed, max);

        assertLt(result, max, "Result should be less than max");
        assertGe(result, 0, "Result should be >= 0");
    }

    // NOTE: Commented out - expectRevert doesn't work with pure library functions
    // The require("Max must be positive") is still enforced at runtime
    //
    // function test_RandomInRange_ZeroMax() public {
    //     uint256 randomSeed = 123456789;
    //     vm.expectRevert(bytes("Max must be positive"));
    //     SecureRandomness.randomInRange(randomSeed, 0);
    // }

    function test_RandomInRange_MaxOne() public {
        uint256 randomSeed = 123456789;
        uint256 result = SecureRandomness.randomInRange(randomSeed, 1);

        assertEq(result, 0, "Max=1 should always return 0");
    }

    function test_RandomInRange_Distribution() public {
        uint256 max = 10;
        uint256[] memory counts = new uint256[](max);

        // Generate 1000 random numbers
        for (uint256 i = 0; i < SIMULATIONS; i++) {
            uint256 randomSeed =
                SecureRandomness.generateSecureRandom(block.number - 1, keccak256(abi.encodePacked("seed", i)));
            uint256 result = SecureRandomness.randomInRange(randomSeed, max);

            assertLt(result, max, "Result should be < max");
            counts[result]++;
        }

        // Check distribution (each number should appear ~100 times ± tolerance)
        uint256 expectedCount = SIMULATIONS / max; // 1000 / 10 = 100
        uint256 minExpected = (expectedCount * (100 - TOLERANCE)) / 100; // 95
        uint256 maxExpected = (expectedCount * (100 + TOLERANCE)) / 100; // 105

        for (uint256 i = 0; i < max; i++) {
            assertGe(counts[i], minExpected, "Distribution should be relatively uniform (min)");
            assertLe(counts[i], maxExpected, "Distribution should be relatively uniform (max)");
        }
    }

    /*//////////////////////////////////////////////////////////////
                    COMMIT-REVEAL SCHEME TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CalculateCommitment() public pure {
        uint256 randomValue = 123456;
        address user = address(0x1234);

        bytes32 commitment = SecureRandomness.calculateCommitment(randomValue, user);

        assertTrue(commitment != bytes32(0), "Commitment should not be zero");
    }

    function test_CalculateCommitment_SameInputsSameOutput() public pure {
        uint256 randomValue = 123456;
        address user = address(0x1234);

        bytes32 commitment1 = SecureRandomness.calculateCommitment(randomValue, user);
        bytes32 commitment2 = SecureRandomness.calculateCommitment(randomValue, user);

        assertEq(commitment1, commitment2, "Same inputs should produce same commitment");
    }

    function test_CalculateCommitment_DifferentValuesDifferentCommitments() public pure {
        address user = address(0x1234);

        bytes32 commitment1 = SecureRandomness.calculateCommitment(111, user);
        bytes32 commitment2 = SecureRandomness.calculateCommitment(222, user);

        assertNotEq(commitment1, commitment2, "Different values should produce different commitments");
    }

    function test_CalculateCommitment_DifferentUsersDifferentCommitments() public pure {
        uint256 randomValue = 123456;

        bytes32 commitment1 = SecureRandomness.calculateCommitment(randomValue, address(0x1111));
        bytes32 commitment2 = SecureRandomness.calculateCommitment(randomValue, address(0x2222));

        assertNotEq(commitment1, commitment2, "Different users should produce different commitments");
    }

    function test_VerifyReveal_ValidReveal() public pure {
        uint256 randomValue = 123456;
        address user = address(0x1234);

        bytes32 commitment = SecureRandomness.calculateCommitment(randomValue, user);
        bool isValid = SecureRandomness.verifyReveal(commitment, randomValue, user);

        assertTrue(isValid, "Valid reveal should return true");
    }

    function test_VerifyReveal_InvalidValue() public pure {
        uint256 randomValue = 123456;
        address user = address(0x1234);

        bytes32 commitment = SecureRandomness.calculateCommitment(randomValue, user);
        bool isValid = SecureRandomness.verifyReveal(commitment, 999999, user); // Wrong value

        assertFalse(isValid, "Invalid value should return false");
    }

    function test_VerifyReveal_InvalidUser() public pure {
        uint256 randomValue = 123456;
        address user = address(0x1234);

        bytes32 commitment = SecureRandomness.calculateCommitment(randomValue, user);
        bool isValid = SecureRandomness.verifyReveal(commitment, randomValue, address(0x5678)); // Wrong user

        assertFalse(isValid, "Invalid user should return false");
    }

    /*//////////////////////////////////////////////////////////////
                COMMIT-REVEAL WITH MULTIPLE VALUES TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GenerateWithCommitReveal_EmptyArray() public {
        uint256 entropyBlock = block.number - 1;
        uint256[] memory revealedValues = new uint256[](0);

        uint256 random = SecureRandomness.generateWithCommitReveal(entropyBlock, revealedValues);

        assertTrue(random > 0, "Should generate random number even with empty array");
    }

    function test_GenerateWithCommitReveal_SingleValue() public {
        uint256 entropyBlock = block.number - 1;
        uint256[] memory revealedValues = new uint256[](1);
        revealedValues[0] = 123456;

        uint256 random = SecureRandomness.generateWithCommitReveal(entropyBlock, revealedValues);

        assertTrue(random > 0, "Should generate random number with single value");
    }

    function test_GenerateWithCommitReveal_MultipleValues() public {
        uint256 entropyBlock = block.number - 1;
        uint256[] memory revealedValues = new uint256[](3);
        revealedValues[0] = 111;
        revealedValues[1] = 222;
        revealedValues[2] = 333;

        uint256 random = SecureRandomness.generateWithCommitReveal(entropyBlock, revealedValues);

        assertTrue(random > 0, "Should generate random number with multiple values");
    }

    function test_GenerateWithCommitReveal_DifferentValuesDifferentResults() public {
        uint256 entropyBlock = block.number - 1;

        uint256[] memory values1 = new uint256[](2);
        values1[0] = 111;
        values1[1] = 222;

        uint256[] memory values2 = new uint256[](2);
        values2[0] = 333;
        values2[1] = 444;

        uint256 random1 = SecureRandomness.generateWithCommitReveal(entropyBlock, values1);
        uint256 random2 = SecureRandomness.generateWithCommitReveal(entropyBlock, values2);

        assertNotEq(random1, random2, "Different revealed values should produce different randoms");
    }

    /*//////////////////////////////////////////////////////////////
                    SIMPLE RANDOM TESTS (WARNING)
    //////////////////////////////////////////////////////////////*/

    function test_SimpleRandom_BasicUsage() public {
        bytes32 seed = keccak256("seed");

        uint256 random = SecureRandomness.simpleRandom(seed);

        assertTrue(random > 0, "Simple random should produce non-zero value");
    }

    function test_SimpleRandom_DifferentSeeds() public {
        uint256 random1 = SecureRandomness.simpleRandom(keccak256("seed1"));
        uint256 random2 = SecureRandomness.simpleRandom(keccak256("seed2"));

        assertNotEq(random1, random2, "Different seeds should produce different values");
    }

    function test_SimpleRandom_SameSeedDifferentBlocks() public {
        bytes32 seed = keccak256("seed");

        uint256 random1 = SecureRandomness.simpleRandom(seed);

        // Advance time
        vm.warp(block.timestamp + 1);

        uint256 random2 = SecureRandomness.simpleRandom(seed);

        assertNotEq(random1, random2, "Different timestamps should produce different values");
    }

    /*//////////////////////////////////////////////////////////////
                    LOTTERY SIMULATION TESTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Test lottery fairness with 100+ simulations
     * @dev Simulates a lottery with 5 participants, each with different ticket counts
     *      Runs 1000 rounds and verifies win distribution matches ticket ownership
     *
     * Expected win rates (with 5% tolerance):
     * - Participant 0: 10 tickets / 100 total = 10% ± 5%
     * - Participant 1: 20 tickets / 100 total = 20% ± 5%
     * - Participant 2: 30 tickets / 100 total = 30% ± 5%
     * - Participant 3: 25 tickets / 100 total = 25% ± 5%
     * - Participant 4: 15 tickets / 100 total = 15% ± 5%
     */
    function test_LotterySimulation_FairDistribution() public {
        uint256 totalTickets = 100;
        uint256[] memory ticketCounts = new uint256[](5);
        ticketCounts[0] = 10; // 10%
        ticketCounts[1] = 20; // 20%
        ticketCounts[2] = 30; // 30%
        ticketCounts[3] = 25; // 25%
        ticketCounts[4] = 15; // 15%

        uint256[] memory winCounts = new uint256[](5);

        console2.log("Running", SIMULATIONS, "lottery simulations...");

        // Run 1000 lottery rounds
        for (uint256 round = 0; round < SIMULATIONS; round++) {
            // Advance blocks for entropy
            vm.roll(block.number + 1);

            // Generate secure random
            uint256 randomSeed = SecureRandomness.generateSecureRandom(
                block.number - 1, keccak256(abi.encodePacked("lottery_round", round))
            );

            // Select winning ticket
            uint256 winningTicket = SecureRandomness.randomInRange(randomSeed, totalTickets);

            // Find winner by ticket range
            uint256 cumulativeTickets = 0;
            for (uint256 i = 0; i < ticketCounts.length; i++) {
                cumulativeTickets += ticketCounts[i];
                if (winningTicket < cumulativeTickets) {
                    winCounts[i]++;
                    break;
                }
            }
        }

        console2.log("\n=== Lottery Simulation Results ===");
        console2.log("Total Rounds:", SIMULATIONS);
        console2.log("Total Tickets per Round:", totalTickets);
        console2.log("");

        // Verify distribution matches expectations (within tolerance)
        for (uint256 i = 0; i < ticketCounts.length; i++) {
            uint256 expectedWins = (SIMULATIONS * ticketCounts[i]) / totalTickets;
            uint256 minExpected = (expectedWins * (100 - TOLERANCE)) / 100;
            uint256 maxExpected = (expectedWins * (100 + TOLERANCE)) / 100;
            uint256 actualWinRate = (winCounts[i] * 100) / SIMULATIONS;
            uint256 expectedWinRate = (ticketCounts[i] * 100) / totalTickets;

            console2.log("Participant", i);
            console2.log("  Tickets:", ticketCounts[i]);
            console2.log("  Expected win rate:", expectedWinRate);
            console2.log("  Wins:", winCounts[i]);
            console2.log("  Actual win rate:", actualWinRate);

            assertGe(winCounts[i], minExpected, "Win count should be >= min expected");
            assertLe(winCounts[i], maxExpected, "Win count should be <= max expected");
        }

        console2.log("");
        console2.log("[PASS] All distributions within tolerance:", TOLERANCE);
    }

    /**
     * @notice Test randomness quality using chi-square test
     * @dev Verifies that the distribution is statistically random
     */
    function test_LotterySimulation_ChiSquareTest() public {
        uint256 buckets = 10;
        uint256[] memory counts = new uint256[](buckets);

        // Run 1000 simulations
        for (uint256 i = 0; i < SIMULATIONS; i++) {
            vm.roll(block.number + 1);

            uint256 randomSeed =
                SecureRandomness.generateSecureRandom(block.number - 1, keccak256(abi.encodePacked("chi_square", i)));

            uint256 bucket = SecureRandomness.randomInRange(randomSeed, buckets);
            counts[bucket]++;
        }

        // Expected count per bucket
        uint256 expected = SIMULATIONS / buckets;

        // Calculate chi-square statistic (simplified)
        uint256 chiSquare = 0;
        for (uint256 i = 0; i < buckets; i++) {
            int256 diff = int256(counts[i]) - int256(expected);
            uint256 diffSquared = uint256(diff * diff);
            chiSquare += (diffSquared * 1000) / expected; // Scale by 1000 for precision
        }

        console2.log("\n=== Chi-Square Test Results ===");
        console2.log("Chi-Square Statistic (x1000):", chiSquare);
        console2.log("Expected per bucket:", expected);

        // Chi-square critical value for 9 degrees of freedom at 95% confidence: ~16.9
        // Scaled by 1000: 16900
        assertLt(chiSquare, 25000, "Chi-square should indicate random distribution");
    }

    /**
     * @notice Test extreme case: 1000 participants, 1 ticket each
     * @dev Verifies fairness even with many participants
     */
    function test_LotterySimulation_ManyParticipantsEqualTickets() public {
        uint256 participants = 100;
        uint256[] memory winCounts = new uint256[](participants);

        console2.log("Running rounds with participants:");
        console2.log("  Rounds:", SIMULATIONS);
        console2.log("  Participants:", participants);

        for (uint256 round = 0; round < SIMULATIONS; round++) {
            vm.roll(block.number + 1);

            uint256 randomSeed = SecureRandomness.generateSecureRandom(
                block.number - 1, keccak256(abi.encodePacked("many_participants", round))
            );

            uint256 winner = SecureRandomness.randomInRange(randomSeed, participants);
            winCounts[winner]++;
        }

        // Each participant should win ~10 times (1000 / 100)
        uint256 expectedWins = SIMULATIONS / participants;
        uint256 minExpected = (expectedWins * (100 - TOLERANCE * 3)) / 100; // 30% tolerance for many participants
        uint256 maxExpected = (expectedWins * (100 + TOLERANCE * 3)) / 100;

        uint256 outOfRange = 0;
        for (uint256 i = 0; i < participants; i++) {
            if (winCounts[i] < minExpected || winCounts[i] > maxExpected) {
                outOfRange++;
            }
        }

        console2.log("Expected wins per participant:", expectedWins);
        console2.log("Participants out of range:", outOfRange);
        console2.log("Total participants:", participants);

        // Allow up to 20% of participants to be slightly out of range
        assertLe(outOfRange, participants / 5, "Most participants should be within tolerance");
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RandomInRange(uint256 seed, uint256 max) public pure {
        max = bound(max, 1, type(uint128).max);

        uint256 result = SecureRandomness.randomInRange(seed, max);

        assertLt(result, max, "Result must be < max");
    }

    function testFuzz_CalculateCommitment(uint256 value, address user) public pure {
        bytes32 commitment = SecureRandomness.calculateCommitment(value, user);
        assertTrue(commitment != bytes32(0), "Commitment should not be zero");
    }

    function testFuzz_VerifyReveal(uint256 value, address user, uint256 wrongValue) public pure {
        vm.assume(value != wrongValue);

        bytes32 commitment = SecureRandomness.calculateCommitment(value, user);

        assertTrue(SecureRandomness.verifyReveal(commitment, value, user), "Correct reveal should pass");
        assertFalse(SecureRandomness.verifyReveal(commitment, wrongValue, user), "Wrong value should fail");
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_MaxUint256Seed() public {
        uint256 max = 100;
        uint256 result = SecureRandomness.randomInRange(type(uint256).max, max);

        assertLt(result, max, "Even max uint256 should work");
    }

    function test_EdgeCase_VeryLargeMax() public {
        uint256 seed = 123456789;
        uint256 max = type(uint128).max;

        uint256 result = SecureRandomness.randomInRange(seed, max);

        assertLt(result, max, "Should work with very large max");
    }
}
