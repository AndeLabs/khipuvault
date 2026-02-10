#!/usr/bin/env node
/**
 * Sync ABIs from Forge output to web3 package
 *
 * This script extracts ABIs from the forge output directory and copies them
 * to the web3 package for use in the frontend.
 *
 * Usage: node scripts/sync-abis.js
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONTRACTS_DIR = path.join(__dirname, "..");
const FORGE_OUT_DIR = path.join(CONTRACTS_DIR, "out");
const WEB3_ABIS_DIR = path.join(CONTRACTS_DIR, "..", "web3", "src", "abis");

// Contracts to sync (name as it appears in out/ directory)
const CONTRACTS_TO_SYNC = [
  "IndividualPoolV3",
  "CooperativePoolV3",
  "LotteryPoolV3",
  "YieldAggregatorV3",
  "MezoIntegrationV3",
  "RotatingPool",
];

function extractABI(contractName) {
  const artifactPath = path.join(
    FORGE_OUT_DIR,
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (!fs.existsSync(artifactPath)) {
    console.log(`  [SKIP] ${contractName} - artifact not found`);
    return null;
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return artifact.abi;
  } catch (error) {
    console.log(`  [ERROR] ${contractName} - failed to parse: ${error}`);
    return null;
  }
}

function syncABIs() {
  console.log("\n==============================================");
  console.log("         KHIPUVAULT ABI SYNC SCRIPT          ");
  console.log("==============================================\n");

  // Verify directories exist
  if (!fs.existsSync(FORGE_OUT_DIR)) {
    console.error(
      "ERROR: Forge output directory not found. Run 'forge build' first."
    );
    process.exit(1);
  }

  // Create web3 abis directory if it doesn't exist
  if (!fs.existsSync(WEB3_ABIS_DIR)) {
    fs.mkdirSync(WEB3_ABIS_DIR, { recursive: true });
    console.log(`Created directory: ${WEB3_ABIS_DIR}\n`);
  }

  console.log("Syncing ABIs...\n");

  let syncedCount = 0;
  let skippedCount = 0;

  for (const contractName of CONTRACTS_TO_SYNC) {
    const abi = extractABI(contractName);

    if (abi) {
      const targetPath = path.join(WEB3_ABIS_DIR, `${contractName}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(abi, null, 2));
      console.log(`  [OK] ${contractName}`);
      syncedCount++;
    } else {
      skippedCount++;
    }
  }

  // Generate index.ts barrel file
  console.log("\nGenerating index.ts...");
  const indexContent = generateIndexFile();
  fs.writeFileSync(path.join(WEB3_ABIS_DIR, "index.ts"), indexContent);
  console.log("  [OK] index.ts\n");

  // Summary
  console.log("==============================================");
  console.log("                 SUMMARY                      ");
  console.log("==============================================");
  console.log(`\n  Synced:  ${syncedCount} contracts`);
  console.log(`  Skipped: ${skippedCount} contracts`);
  console.log(`\n  Output: ${WEB3_ABIS_DIR}`);
  console.log("\n[SUCCESS] ABI sync complete!\n");
}

function generateIndexFile() {
  const imports = [];
  const exports = [];

  for (const contractName of CONTRACTS_TO_SYNC) {
    const abiPath = path.join(WEB3_ABIS_DIR, `${contractName}.json`);
    if (fs.existsSync(abiPath)) {
      imports.push(`import ${contractName}ABI from "./${contractName}.json";`);
      exports.push(`  ${contractName}ABI,`);
    }
  }

  return `/**
 * Auto-generated ABI exports
 * Run 'pnpm sync:abis' to regenerate
 */

${imports.join("\n")}

export {
${exports.join("\n")}
};

// Type exports for convenience
export type { Abi } from "viem";
`;
}

// Run sync
syncABIs();
