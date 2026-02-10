import "dotenv/config";
import { IndexerOrchestrator } from "./indexer/orchestrator";
import { IndividualPoolListener } from "./listeners/individual-pool";
import { CooperativePoolListener } from "./listeners/cooperative-pool";
import { LotteryPoolListener } from "./listeners/lottery-pool";
import { RotatingPoolListener } from "./listeners/rotating-pool";
import { shutdownProvider, getProviderHealth } from "./provider";

// Contract addresses (from env or hardcoded testnet addresses)
// Using working deployment with deployer ownership
const INDIVIDUAL_POOL_ADDRESS =
  process.env.INDIVIDUAL_POOL_ADDRESS || "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393";
const COOPERATIVE_POOL_ADDRESS =
  process.env.COOPERATIVE_POOL_ADDRESS || "0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F";
const LOTTERY_POOL_ADDRESS =
  process.env.LOTTERY_POOL_ADDRESS || "0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4";
const ROTATING_POOL_ADDRESS =
  process.env.ROTATING_POOL_ADDRESS || "0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04";

// Zero address constant for validation
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Check if an address is valid (non-empty and non-zero)
 */
function isValidContractAddress(address: string): boolean {
  return Boolean(address) && address !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(address);
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
