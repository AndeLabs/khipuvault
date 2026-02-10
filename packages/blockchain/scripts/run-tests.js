/**
 * Comprehensive Contract Testing Suite (JavaScript version)
 *
 * Tests all KhipuVault contracts with multiple users on Mezo Testnet.
 *
 * Usage: node scripts/run-tests.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;

// Contract Addresses (Mezo Testnet)
const CONTRACTS = {
  INDIVIDUAL_POOL: "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
  COOPERATIVE_POOL: "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88",
  ROTATING_POOL: "0x0Bac59e87Af0D2e95711846BaDb124164382aafC",
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
};

// Minimal ABIs for testing
const INDIVIDUAL_POOL_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getDepositorInfo(address depositor) external view returns (uint256 balance, uint256 depositTime, uint256 yieldAccrued, bool autoCompound)",
  "function totalDeposits() external view returns (uint256)",
  "function MIN_DEPOSIT() external view returns (uint256)",
];

const COOPERATIVE_POOL_ABI = [
  "function createPool(string memory name, string memory description, uint256 targetAmount, uint256 duration, bool requireApproval) external returns (uint256)",
  "function joinPool(uint256 poolId) external payable",
  "function contribute(uint256 poolId) external payable",
  "function pools(uint256 poolId) external view returns (uint256, string, string, address, uint256, uint256, uint256, uint256, uint256, uint8, bool)",
  "function poolCounter() external view returns (uint256)",
];

const ROTATING_POOL_ABI = [
  "function createPool(string memory name, uint256 memberCount, uint256 contributionAmount, uint256 periodDuration, bool useNativeBtc, address[] memory members) external returns (uint256)",
  "function joinPool(uint256 poolId) external",
  "function contribute(uint256 poolId) external payable",
  "function pools(uint256 poolId) external view returns (uint256, string, address, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint8, bool)",
  "function poolCounter() external view returns (uint256)",
];

const results = [];

function log(msg) {
  console.log(msg);
}

function logResult(result) {
  results.push(result);
  const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️";
  log(`   ${icon} ${result.test}: ${result.message}`);
  if (result.txHash) {
    log(`      TX: https://explorer.test.mezo.org/tx/${result.txHash}`);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  log("\n" + "=".repeat(70));
  log("🧪 KHIPUVAULT COMPREHENSIVE CONTRACT TESTING SUITE");
  log("=".repeat(70));

  // Load wallets
  const walletsPath = path.join(__dirname, "../../contracts/test-wallets/wallets.json");
  if (!fs.existsSync(walletsPath)) {
    log("\n❌ Wallets file not found. Please run generate-test-wallets.ts first.");
    return;
  }
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));

  // Connect to Mezo Testnet
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  log(`\n📡 Connected to Mezo Testnet (Chain ID: ${CHAIN_ID})`);

  // Setup signers
  const faucet = new ethers.Wallet(wallets[0].privateKey, provider);
  const users = wallets.slice(2, 7).map((w) => new ethers.Wallet(w.privateKey, provider));

  log(`\n👥 Test Accounts:`);
  log(`   Faucet: ${faucet.address}`);
  users.forEach((u, i) => log(`   User ${i + 1}: ${u.address}`));

  // Check balances
  log(`\n💰 Checking Balances...`);
  const faucetBalance = await provider.getBalance(faucet.address);
  log(`   Faucet: ${ethers.formatEther(faucetBalance)} BTC`);

  let usersWithFunds = 0;
  for (let i = 0; i < users.length; i++) {
    const balance = await provider.getBalance(users[i].address);
    log(`   User ${i + 1}: ${ethers.formatEther(balance)} BTC`);
    if (balance > 0n) usersWithFunds++;
  }

  if (faucetBalance === 0n && usersWithFunds === 0) {
    log("\n" + "=".repeat(70));
    log("⚠️  NO FUNDS AVAILABLE - PLEASE FUND THESE WALLETS:");
    log("=".repeat(70));
    log(`\n1. FAUCET (Primary - Fund this first):`);
    log(`   Address: ${wallets[0].address}`);
    log(`\n2. DISTRIBUTOR (Backup):`);
    log(`   Address: ${wallets[1].address}`);
    log(`\n📱 Mezo Testnet Faucet: https://faucet.mezo.org/`);
    log(`\nAfter funding, run this script again.`);
    return;
  }

  // =====================================================
  // TEST 1: INDIVIDUAL POOL
  // =====================================================
  log("\n" + "=".repeat(70));
  log("📦 TEST 1: INDIVIDUAL POOL (Personal Savings)");
  log("=".repeat(70));

  const individualPool = new ethers.Contract(CONTRACTS.INDIVIDUAL_POOL, INDIVIDUAL_POOL_ABI, faucet);

  // Test 1.1: Get pool info
  try {
    const totalDeposits = await individualPool.totalDeposits();
    const minDeposit = await individualPool.MIN_DEPOSIT();
    logResult({
      test: "Read pool info",
      status: "PASS",
      message: `Total: ${ethers.formatEther(totalDeposits)} BTC, Min: ${ethers.formatEther(minDeposit)} BTC`,
    });
  } catch (e) {
    logResult({ test: "Read pool info", status: "FAIL", message: e.message });
  }

  // Test 1.2: Faucet deposits
  if (faucetBalance > ethers.parseEther("0.001")) {
    try {
      const depositAmount = ethers.parseEther("0.001");
      const tx = await individualPool.deposit({ value: depositAmount, gasLimit: 300000n });
      await tx.wait();
      logResult({
        test: "Faucet deposit",
        status: "PASS",
        message: `Deposited ${ethers.formatEther(depositAmount)} BTC`,
        txHash: tx.hash,
      });
    } catch (e) {
      logResult({
        test: "Faucet deposit",
        status: "FAIL",
        message: e.reason || e.message,
      });
    }
  } else {
    logResult({
      test: "Faucet deposit",
      status: "SKIP",
      message: "Insufficient faucet balance",
    });
  }

  // Test 1.3: Check depositor info
  try {
    const info = await individualPool.getDepositorInfo(faucet.address);
    logResult({
      test: "Check deposit info",
      status: "PASS",
      message: `Balance: ${ethers.formatEther(info[0])} BTC, Yield: ${ethers.formatEther(info[2])} MUSD`,
    });
  } catch (e) {
    logResult({ test: "Check deposit info", status: "FAIL", message: e.message });
  }

  await sleep(2000);

  // =====================================================
  // TEST 2: COOPERATIVE POOL
  // =====================================================
  log("\n" + "=".repeat(70));
  log("👥 TEST 2: COOPERATIVE POOL (Group Savings)");
  log("=".repeat(70));

  const cooperativePool = new ethers.Contract(CONTRACTS.COOPERATIVE_POOL, COOPERATIVE_POOL_ABI, faucet);

  // Test 2.1: Check pool counter
  try {
    const poolCounter = await cooperativePool.poolCounter();
    logResult({
      test: "Read pool counter",
      status: "PASS",
      message: `${poolCounter} pools exist`,
    });
  } catch (e) {
    logResult({ test: "Read pool counter", status: "FAIL", message: e.message });
  }

  // Test 2.2: Create pool
  let coopPoolId = null;
  if (faucetBalance > ethers.parseEther("0.001")) {
    try {
      const tx = await cooperativePool.createPool(
        "Test Pool " + Date.now(),
        "Automated testing pool",
        ethers.parseEther("0.1"),
        86400n * 30n,
        false,
        { gasLimit: 500000n }
      );
      const receipt = await tx.wait();

      // Get new pool counter
      coopPoolId = await cooperativePool.poolCounter();

      logResult({
        test: "Create cooperative pool",
        status: "PASS",
        message: `Pool #${coopPoolId} created`,
        txHash: tx.hash,
      });
    } catch (e) {
      logResult({
        test: "Create cooperative pool",
        status: "FAIL",
        message: e.reason || e.message,
      });
    }
  }

  await sleep(2000);

  // =====================================================
  // TEST 3: ROTATING POOL (ROSCA)
  // =====================================================
  log("\n" + "=".repeat(70));
  log("🔄 TEST 3: ROTATING POOL (ROSCA/Pasanaku)");
  log("=".repeat(70));

  const rotatingPool = new ethers.Contract(CONTRACTS.ROTATING_POOL, ROTATING_POOL_ABI, faucet);

  // Test 3.1: Check pool counter
  try {
    const poolCounter = await rotatingPool.poolCounter();
    logResult({
      test: "Read ROSCA counter",
      status: "PASS",
      message: `${poolCounter} ROSCA pools exist`,
    });
  } catch (e) {
    logResult({ test: "Read ROSCA counter", status: "FAIL", message: e.message });
  }

  // Test 3.2: Create ROSCA
  if (faucetBalance > ethers.parseEther("0.001")) {
    try {
      const tx = await rotatingPool.createPool(
        "Test ROSCA " + Date.now(),
        5n,
        ethers.parseEther("0.001"),
        3600n,
        true,
        [],
        { gasLimit: 500000n }
      );
      const receipt = await tx.wait();

      const roscaPoolId = await rotatingPool.poolCounter();

      logResult({
        test: "Create ROSCA pool",
        status: "PASS",
        message: `ROSCA #${roscaPoolId} created`,
        txHash: tx.hash,
      });
    } catch (e) {
      logResult({
        test: "Create ROSCA pool",
        status: "FAIL",
        message: e.reason || e.message,
      });
    }
  }

  // =====================================================
  // SUMMARY
  // =====================================================
  log("\n" + "=".repeat(70));
  log("📊 TEST SUMMARY");
  log("=".repeat(70));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  log(`\n   ✅ Passed:  ${passed}`);
  log(`   ❌ Failed:  ${failed}`);
  log(`   ⏭️  Skipped: ${skipped}`);
  log(`   📝 Total:   ${results.length}`);

  log("\n🔗 Explorer: https://explorer.test.mezo.org");

  // Save results
  const resultsPath = path.join(__dirname, "../../contracts/test-wallets/test-results.json");
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        network: "Mezo Testnet",
        chainId: CHAIN_ID,
        summary: { passed, failed, skipped, total: results.length },
        results,
      },
      null,
      2
    )
  );
  log(`\n📝 Results saved to test-wallets/test-results.json`);

  if (failed === 0 && passed > 0) {
    log("\n✅ All executed tests passed!");
  }
}

main().catch(console.error);
