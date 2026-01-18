/**
 * @fileoverview KhipuVault Contract ABIs
 * @module @khipu/web3/abis
 *
 * Exports all contract ABIs for use in frontend and backend.
 * ABIs are extracted from Forge build output.
 */

// V3 Pool Contracts
import IndividualPoolV3ABI from "./IndividualPoolV3.json";
import CooperativePoolV3ABI from "./CooperativePoolV3.json";
import LotteryPoolV3ABI from "./LotteryPoolV3.json";

// Core Infrastructure
import YieldAggregatorV3ABI from "./YieldAggregatorV3.json";
import MezoIntegrationV3ABI from "./MezoIntegrationV3.json";

// Type-safe exports
export const INDIVIDUAL_POOL_V3_ABI = IndividualPoolV3ABI as readonly unknown[];
export const COOPERATIVE_POOL_V3_ABI = CooperativePoolV3ABI as readonly unknown[];
export const LOTTERY_POOL_V3_ABI = LotteryPoolV3ABI as readonly unknown[];
export const YIELD_AGGREGATOR_V3_ABI = YieldAggregatorV3ABI as readonly unknown[];
export const MEZO_INTEGRATION_V3_ABI = MezoIntegrationV3ABI as readonly unknown[];

// Re-export for convenience
export {
  IndividualPoolV3ABI,
  CooperativePoolV3ABI,
  LotteryPoolV3ABI,
  YieldAggregatorV3ABI,
  MezoIntegrationV3ABI,
};

// Default exports for common use cases
export default {
  IndividualPoolV3: INDIVIDUAL_POOL_V3_ABI,
  CooperativePoolV3: COOPERATIVE_POOL_V3_ABI,
  LotteryPoolV3: LOTTERY_POOL_V3_ABI,
  YieldAggregatorV3: YIELD_AGGREGATOR_V3_ABI,
  MezoIntegrationV3: MEZO_INTEGRATION_V3_ABI,
};
