import "dotenv/config";
import { IndexerOrchestrator } from "./indexer/orchestrator";
import { IndividualPoolListener } from "./listeners/individual-pool";
import { CooperativePoolListener } from "./listeners/cooperative-pool";
import { shutdownProvider, getProviderHealth } from "./provider";

// Contract addresses (from env or hardcoded testnet addresses)
const INDIVIDUAL_POOL_ADDRESS =
  process.env.INDIVIDUAL_POOL_ADDRESS ||
  "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393";
const COOPERATIVE_POOL_ADDRESS =
  process.env.COOPERATIVE_POOL_ADDRESS ||
  "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88";

export async function startIndexer() {
  console.log("🌐 KhipuVault Blockchain Indexer");
  console.log("================================");

  const orchestrator = new IndexerOrchestrator();

  // Add listeners
  orchestrator.addListener(
    "IndividualPool",
    new IndividualPoolListener(INDIVIDUAL_POOL_ADDRESS),
  );

  orchestrator.addListener(
    "CooperativePool",
    new CooperativePoolListener(COOPERATIVE_POOL_ADDRESS),
  );

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
