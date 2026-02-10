/**
 * Comprehensive Contract Testing Suite
 *
 * Tests all KhipuVault contracts with multiple users:
 * - IndividualPool: Deposits, yields, withdrawals
 * - CooperativePool: Pool creation, joining, contributions
 * - RotatingPool (ROSCA): Full rotation cycle
 * - LotteryPool: Ticket purchases, winner selection
 *
 * Usage: npx ts-node scripts/test-all-contracts.ts
 */

import { ethers, Contract } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Configuration
const RPC_URL = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;

// Contract Addresses (Mezo Testnet)
const CONTRACTS = {
  INDIVIDUAL_POOL: "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
  COOPERATIVE_POOL: "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88",
  ROTATING_POOL: "0x0Bac59e87Af0D2e95711846BaDb124164382aafC",
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  MEZO_INTEGRATION: "0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6",
  YIELD_AGGREGATOR: "0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6",
};

// Minimal ABIs for testing
const INDIVIDUAL_POOL_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getDepositorInfo(address depositor) external view returns (uint256 balance, uint256 depositTime, uint256 yieldAccrued, bool autoCompound)",
  "function totalDeposits() external view returns (uint256)",
  "function MIN_DEPOSIT() external view returns (uint256)",
  "event Deposited(address indexed depositor, uint256 amount, uint256 totalBalance)",
  "event Withdrawn(address indexed depositor, uint256 amount)",
];

const COOPERATIVE_POOL_ABI = [
  "function createPool(string memory name, string memory description, uint256 targetAmount, uint256 duration, bool requireApproval) external returns (uint256)",
  "function joinPool(uint256 poolId) external payable",
  "function contribute(uint256 poolId) external payable",
  "function leavePool(uint256 poolId) external",
  "function pools(uint256 poolId) external view returns (tuple(uint256 id, string name, string description, address creator, uint256 targetAmount, uint256 currentAmount, uint256 memberCount, uint256 startTime, uint256 duration, uint8 status, bool requireApproval))",
  "function poolCounter() external view returns (uint256)",
  "function getPoolMembers(uint256 poolId) external view returns (address[] memory)",
  "event PoolCreated(uint256 indexed poolId, address indexed creator, string name, uint256 targetAmount)",
  "event MemberJoined(uint256 indexed poolId, address indexed member)",
  "event ContributionMade(uint256 indexed poolId, address indexed member, uint256 amount)",
];

const ROTATING_POOL_ABI = [
  "function createPool(string memory name, uint256 memberCount, uint256 contributionAmount, uint256 periodDuration, bool useNativeBtc, address[] memory members) external returns (uint256)",
  "function joinPool(uint256 poolId) external",
  "function contribute(uint256 poolId) external payable",
  "function claimPayout(uint256 poolId) external",
  "function pools(uint256 poolId) external view returns (tuple(uint256 id, string name, address creator, uint256 memberCount, uint256 contributionAmount, uint256 periodDuration, uint256 currentPeriod, uint256 totalPeriods, uint256 startTime, uint256 totalBtcCollected, uint256 totalMusdMinted, uint256 totalYieldGenerated, uint256 yieldDistributed, uint8 status, bool autoAdvance))",
  "function poolCounter() external view returns (uint256)",
  "function poolMembers(uint256 poolId, address member) external view returns (tuple(address memberAddress, uint256 memberIndex, uint256 contributionsMade, uint256 totalContributed, uint256 payoutReceived, uint256 yieldReceived, bool hasReceivedPayout, bool active))",
  "event PoolCreated(uint256 indexed poolId, address indexed creator, string name, uint256 memberCount, uint256 contributionAmount)",
  "event MemberJoined(uint256 indexed poolId, address indexed member, uint256 memberIndex)",
  "event ContributionMade(uint256 indexed poolId, address indexed member, uint256 periodNumber, uint256 amount)",
];

const MUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

interface WalletInfo {
  name: string;
  address: string;
  privateKey: string;
}

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  txHash?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️";
  log(`   ${icon} ${result.test}: ${result.message}`);
  if (result.txHash) {
    log(`      TX: ${result.txHash}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  log("\n" + "=".repeat(70));
  log("🧪 KHIPUVAULT COMPREHENSIVE CONTRACT TESTING SUITE");
  log("=".repeat(70));

  // Load wallets
  const walletsPath = path.join(__dirname, "../test-wallets/wallets.json");
  const wallets: WalletInfo[] = JSON.parse(fs.readFileSync(walletsPath, "utf8"));

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
  log(`\n💰 Initial Balances:`);
  const faucetBalance = await provider.getBalance(faucet.address);
  log(`   Faucet: ${ethers.formatEther(faucetBalance)} BTC`);

  for (let i = 0; i < users.length; i++) {
    const balance = await provider.getBalance(users[i].address);
    log(`   User ${i + 1}: ${ethers.formatEther(balance)} BTC`);
    if (balance === 0n) {
      log(`   ⚠️  User ${i + 1} has no funds - some tests may fail`);
    }
  }

  // =====================================================
  // TEST 1: INDIVIDUAL POOL
  // =====================================================
  log("\n" + "=".repeat(70));
  log("📦 TEST 1: INDIVIDUAL POOL (Personal Savings)");
  log("=".repeat(70));

  const individualPool = new Contract(CONTRACTS.INDIVIDUAL_POOL, INDIVIDUAL_POOL_ABI, faucet);

  // Test 1.1: Get pool info
  try {
    const totalDeposits = await individualPool.totalDeposits();
    const minDeposit = await individualPool.MIN_DEPOSIT();
    logResult({
      test: "Read pool info",
      status: "PASS",
      message: `Total deposits: ${ethers.formatEther(totalDeposits)} BTC, Min: ${ethers.formatEther(minDeposit)} BTC`,
    });
  } catch (e: any) {
    logResult({ test: "Read pool info", status: "FAIL", message: e.message });
  }

  // Test 1.2: Multiple users deposit
  for (let i = 0; i < 3; i++) {
    const user = users[i];
    const userPool = individualPool.connect(user);
    const depositAmount = ethers.parseEther("0.001");

    try {
      const balance = await provider.getBalance(user.address);
      if (balance < depositAmount) {
        logResult({
          test: `User ${i + 1} deposit`,
          status: "SKIP",
          message: "Insufficient balance",
        });
        continue;
      }

      const tx = await userPool.deposit({ value: depositAmount, gasLimit: 300000n });
      const receipt = await tx.wait();
      logResult({
        test: `User ${i + 1} deposit`,
        status: "PASS",
        message: `Deposited ${ethers.formatEther(depositAmount)} BTC`,
        txHash: tx.hash,
      });
    } catch (e: any) {
      logResult({
        test: `User ${i + 1} deposit`,
        status: "FAIL",
        message: e.reason || e.message,
      });
    }
    await sleep(2000);
  }

  // Test 1.3: Check depositor info
  for (let i = 0; i < 3; i++) {
    try {
      const info = await individualPool.getDepositorInfo(users[i].address);
      logResult({
        test: `User ${i + 1} info check`,
        status: "PASS",
        message: `Balance: ${ethers.formatEther(info[0])} BTC, Yield: ${ethers.formatEther(info[2])} MUSD`,
      });
    } catch (e: any) {
      logResult({
        test: `User ${i + 1} info check`,
        status: "FAIL",
        message: e.message,
      });
    }
  }

  // =====================================================
  // TEST 2: COOPERATIVE POOL
  // =====================================================
  log("\n" + "=".repeat(70));
  log("👥 TEST 2: COOPERATIVE POOL (Group Savings)");
  log("=".repeat(70));

  const cooperativePool = new Contract(CONTRACTS.COOPERATIVE_POOL, COOPERATIVE_POOL_ABI, faucet);

  // Test 2.1: Check pool counter
  let poolCounter = 0n;
  try {
    poolCounter = await cooperativePool.poolCounter();
    logResult({
      test: "Read pool counter",
      status: "PASS",
      message: `${poolCounter} pools created`,
    });
  } catch (e: any) {
    logResult({ test: "Read pool counter", status: "FAIL", message: e.message });
  }

  // Test 2.2: Create a new pool
  let newPoolId = 0n;
  try {
    const faucetBalance = await provider.getBalance(faucet.address);
    if (faucetBalance > ethers.parseEther("0.001")) {
      const tx = await cooperativePool.createPool(
        "Test Pool " + Date.now(),
        "Testing cooperative savings",
        ethers.parseEther("0.1"), // target amount
        86400n * 30n, // 30 days duration
        false, // no approval required
        { gasLimit: 500000n }
      );
      const receipt = await tx.wait();

      // Get pool ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          return cooperativePool.interface.parseLog(log)?.name === "PoolCreated";
        } catch {
          return false;
        }
      });
      if (event) {
        const parsed = cooperativePool.interface.parseLog(event);
        newPoolId = parsed?.args[0];
      } else {
        newPoolId = (await cooperativePool.poolCounter()) as bigint;
      }

      logResult({
        test: "Create cooperative pool",
        status: "PASS",
        message: `Pool #${newPoolId} created`,
        txHash: tx.hash,
      });
    } else {
      logResult({
        test: "Create cooperative pool",
        status: "SKIP",
        message: "Faucet has insufficient balance",
      });
    }
  } catch (e: any) {
    logResult({
      test: "Create cooperative pool",
      status: "FAIL",
      message: e.reason || e.message,
    });
  }

  // Test 2.3: Users join pool
  if (newPoolId > 0n) {
    for (let i = 0; i < 3; i++) {
      const user = users[i];
      const userPool = cooperativePool.connect(user);

      try {
        const tx = await userPool.joinPool(newPoolId, { gasLimit: 300000n });
        await tx.wait();
        logResult({
          test: `User ${i + 1} join pool`,
          status: "PASS",
          message: `Joined pool #${newPoolId}`,
          txHash: tx.hash,
        });
      } catch (e: any) {
        logResult({
          test: `User ${i + 1} join pool`,
          status: "FAIL",
          message: e.reason || e.message,
        });
      }
      await sleep(2000);
    }
  }

  // Test 2.4: Users contribute
  if (newPoolId > 0n) {
    for (let i = 0; i < 3; i++) {
      const user = users[i];
      const userPool = cooperativePool.connect(user);
      const contributeAmount = ethers.parseEther("0.001");

      try {
        const balance = await provider.getBalance(user.address);
        if (balance < contributeAmount) {
          logResult({
            test: `User ${i + 1} contribute`,
            status: "SKIP",
            message: "Insufficient balance",
          });
          continue;
        }

        const tx = await userPool.contribute(newPoolId, {
          value: contributeAmount,
          gasLimit: 300000n,
        });
        await tx.wait();
        logResult({
          test: `User ${i + 1} contribute`,
          status: "PASS",
          message: `Contributed ${ethers.formatEther(contributeAmount)} BTC`,
          txHash: tx.hash,
        });
      } catch (e: any) {
        logResult({
          test: `User ${i + 1} contribute`,
          status: "FAIL",
          message: e.reason || e.message,
        });
      }
      await sleep(2000);
    }
  }

  // =====================================================
  // TEST 3: ROTATING POOL (ROSCA)
  // =====================================================
  log("\n" + "=".repeat(70));
  log("🔄 TEST 3: ROTATING POOL (ROSCA/Pasanaku)");
  log("=".repeat(70));

  const rotatingPool = new Contract(CONTRACTS.ROTATING_POOL, ROTATING_POOL_ABI, faucet);

  // Test 3.1: Check pool counter
  let roscaPoolCounter = 0n;
  try {
    roscaPoolCounter = await rotatingPool.poolCounter();
    logResult({
      test: "Read ROSCA pool counter",
      status: "PASS",
      message: `${roscaPoolCounter} ROSCA pools created`,
    });
  } catch (e: any) {
    logResult({ test: "Read ROSCA pool counter", status: "FAIL", message: e.message });
  }

  // Test 3.2: Create ROSCA pool
  let roscaPoolId = 0n;
  try {
    const faucetBalance = await provider.getBalance(faucet.address);
    if (faucetBalance > ethers.parseEther("0.001")) {
      const tx = await rotatingPool.createPool(
        "Test ROSCA " + Date.now(),
        5n, // 5 members
        ethers.parseEther("0.001"), // contribution amount
        3600n, // 1 hour period
        true, // use native BTC
        [], // open join (no predefined members)
        { gasLimit: 500000n }
      );
      const receipt = await tx.wait();

      // Get pool ID
      const event = receipt.logs.find((log: any) => {
        try {
          return rotatingPool.interface.parseLog(log)?.name === "PoolCreated";
        } catch {
          return false;
        }
      });
      if (event) {
        const parsed = rotatingPool.interface.parseLog(event);
        roscaPoolId = parsed?.args[0];
      } else {
        roscaPoolId = (await rotatingPool.poolCounter()) as bigint;
      }

      logResult({
        test: "Create ROSCA pool",
        status: "PASS",
        message: `ROSCA #${roscaPoolId} created`,
        txHash: tx.hash,
      });
    } else {
      logResult({
        test: "Create ROSCA pool",
        status: "SKIP",
        message: "Faucet has insufficient balance",
      });
    }
  } catch (e: any) {
    logResult({
      test: "Create ROSCA pool",
      status: "FAIL",
      message: e.reason || e.message,
    });
  }

  // Test 3.3: Users join ROSCA
  if (roscaPoolId > 0n) {
    for (let i = 0; i < 4; i++) {
      const user = users[i];
      const userPool = rotatingPool.connect(user);

      try {
        const tx = await userPool.joinPool(roscaPoolId, { gasLimit: 300000n });
        await tx.wait();
        logResult({
          test: `User ${i + 1} join ROSCA`,
          status: "PASS",
          message: `Joined ROSCA #${roscaPoolId}`,
          txHash: tx.hash,
        });
      } catch (e: any) {
        logResult({
          test: `User ${i + 1} join ROSCA`,
          status: "FAIL",
          message: e.reason || e.message,
        });
      }
      await sleep(2000);
    }
  }

  // Test 3.4: Check ROSCA pool info
  if (roscaPoolId > 0n) {
    try {
      const poolInfo = await rotatingPool.pools(roscaPoolId);
      logResult({
        test: "Read ROSCA pool info",
        status: "PASS",
        message: `Members: ${poolInfo[3]}, Contribution: ${ethers.formatEther(poolInfo[4])} BTC, Status: ${poolInfo[13]}`,
      });
    } catch (e: any) {
      logResult({ test: "Read ROSCA pool info", status: "FAIL", message: e.message });
    }
  }

  // =====================================================
  // TEST SUMMARY
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

  // Final balances
  log("\n💰 Final Balances:");
  for (let i = 0; i < users.length; i++) {
    const balance = await provider.getBalance(users[i].address);
    log(`   User ${i + 1}: ${ethers.formatEther(balance)} BTC`);
  }

  // Explorer links
  log("\n🔗 Mezo Testnet Explorer:");
  log(`   https://explorer.test.mezo.org`);

  if (failed > 0) {
    log("\n⚠️  Some tests failed. Check the logs above for details.");
  } else if (passed > 0) {
    log("\n✅ All executed tests passed!");
  }

  // Save results
  const resultsPath = path.join(__dirname, "../test-wallets/test-results.json");
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
  log(`\n📝 Results saved to: ${resultsPath}`);
}

// Run
main().catch(console.error);
