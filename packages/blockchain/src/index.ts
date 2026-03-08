import "dotenv/config";
import { IndexerOrchestrator } from "./indexer/orchestrator";
import { IndividualPoolListener } from "./listeners/individual-pool";
import { CooperativePoolListener } from "./listeners/cooperative-pool";
import { LotteryPoolListener } from "./listeners/lottery-pool";
import { RotatingPoolListener } from "./listeners/rotating-pool";
import { MezoTroveManagerListener } from "./listeners/mezo-trove-manager";
import { MezoStabilityPoolListener } from "./listeners/mezo-stability-pool";
import { shutdownProvider, getProviderHealth } from "./provider";

// Import addresses from centralized source (@khipu/shared)
import { getAddressOrUndefined, isAddressConfigured, ZERO_ADDRESS } from "@khipu/shared";

// Get contract addresses from @khipu/shared (Single Source of Truth)
// Environment variables can override for development/testing
const INDIVIDUAL_POOL_ADDRESS =
  process.env.INDIVIDUAL_POOL_ADDRESS || getAddressOrUndefined("INDIVIDUAL_POOL") || "";
const COOPERATIVE_POOL_ADDRESS =
  process.env.COOPERATIVE_POOL_ADDRESS || getAddressOrUndefined("COOPERATIVE_POOL") || "";
const LOTTERY_POOL_ADDRESS =
  process.env.LOTTERY_POOL_ADDRESS || getAddressOrUndefined("LOTTERY_POOL") || "";
const ROTATING_POOL_ADDRESS =
  process.env.ROTATING_POOL_ADDRESS || getAddressOrUndefined("ROTATING_POOL") || "";

// Mezo Protocol addresses (external)
const MEZO_TROVE_MANAGER_ADDRESS =
  process.env.MEZO_TROVE_MANAGER_ADDRESS || getAddressOrUndefined("TROVE_MANAGER") || "";
const MEZO_STABILITY_POOL_ADDRESS =
  process.env.MEZO_STABILITY_POOL_ADDRESS || getAddressOrUndefined("STABILITY_POOL") || "";

/**
 * Check if an address is valid (non-empty and non-zero)
 */
function isValidContractAddress(address: string): boolean {
  return (
    Boolean(address) &&
    address.toLowerCase() !== ZERO_ADDRESS.toLowerCase() &&
    /^0x[a-fA-F0-9]{40}$/.test(address)
  );
}

export async function startIndexer() {
  console.log("🌐 KhipuVault Blockchain Indexer");
  console.log("================================");

  const orchestrator = new IndexerOrchestrator();

  // Add listeners
  orchestrator.addListener("IndividualPool", new IndividualPoolListener(INDIVIDUAL_POOL_ADDRESS));

  orchestrator.addListener(
    "CooperativePool",
    new CooperativePoolListener(COOPERATIVE_POOL_ADDRESS)
  );

  // Add lottery listener only if contract is deployed
  if (isValidContractAddress(LOTTERY_POOL_ADDRESS)) {
    orchestrator.addListener("LotteryPool", new LotteryPoolListener(LOTTERY_POOL_ADDRESS));
    console.log("🎰 Lottery Pool listener enabled");
  } else {
    console.log("⚠️ Lottery Pool not deployed, skipping listener");
  }

  // Add rotating pool (ROSCA) listener
  if (isValidContractAddress(ROTATING_POOL_ADDRESS)) {
    orchestrator.addListener("RotatingPool", new RotatingPoolListener(ROTATING_POOL_ADDRESS));
    console.log("🔄 Rotating Pool (ROSCA) listener enabled");
  } else {
    console.log("⚠️ Rotating Pool not deployed, skipping listener");
  }

  // Add Mezo Protocol listeners
  if (isValidContractAddress(MEZO_TROVE_MANAGER_ADDRESS)) {
    orchestrator.addListener(
      "MezoTroveManager",
      new MezoTroveManagerListener(MEZO_TROVE_MANAGER_ADDRESS)
    );
    console.log("🏦 Mezo TroveManager listener enabled");
  } else {
    console.log("⚠️ Mezo TroveManager not configured, skipping listener");
  }

  if (isValidContractAddress(MEZO_STABILITY_POOL_ADDRESS)) {
    orchestrator.addListener(
      "MezoStabilityPool",
      new MezoStabilityPoolListener(MEZO_STABILITY_POOL_ADDRESS)
    );
    console.log("💎 Mezo StabilityPool listener enabled");
  } else {
    console.log("⚠️ Mezo StabilityPool not configured, skipping listener");
  }

  // Start indexing
  await orchestrator.start();

  // Log provider health
  const health = getProviderHealth();
  console.log("📡 Provider Health:", {
    isHealthy: health.isHealthy,
    blockNumber: health.blockNumber,
    latency: health.latency ? `${health.latency}ms` : "N/A",
  });

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

    // Stop indexer
    orchestrator.stop();

    // Shutdown provider
    await shutdownProvider();

    console.log("✅ Shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    shutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  });

  return orchestrator;
}

// Export all public APIs
export { IndexerOrchestrator } from "./indexer/orchestrator";
export { IndividualPoolListener } from "./listeners/individual-pool";
export { CooperativePoolListener } from "./listeners/cooperative-pool";
export { LotteryPoolListener } from "./listeners/lottery-pool";
export { RotatingPoolListener } from "./listeners/rotating-pool";
export { MezoTroveManagerListener } from "./listeners/mezo-trove-manager";
export { MezoStabilityPoolListener } from "./listeners/mezo-stability-pool";
export { BaseEventListener } from "./listeners/base";
export { getProvider, getCurrentBlock, getBlockTimestamp } from "./provider";
export { retryWithBackoff, batchProcess } from "./utils/retry";

// Run if executed directly
if (require.main === module) {
  startIndexer().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
