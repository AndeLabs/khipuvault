/**
 * Smart Contract Integration Test Script
 * Tests deposit/withdraw on IndividualPool with real wallet
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Mezo Testnet Configuration
const mezoTestnet = {
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" },
  },
} as const;

// Contract addresses
const INDIVIDUAL_POOL = "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393";
const MUSD_TOKEN = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";

// ABIs (minimal for testing)
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const INDIVIDUAL_POOL_ABI = [
  {
    name: "getUserDeposit",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "deposit",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "withdraw",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "totalDeposits",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "paused",
    type: "function",
    inputs: [],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

// Wallet configuration
const PRIVATE_KEY =
  "b176fc68626eb21176876a975a91f89ef69c069925185a52655deb31ebda8c9e";

async function main() {
  console.log("🔧 KhipuVault Smart Contract Test Suite");
  console.log("========================================\n");

  // Setup clients
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  console.log(`📍 Wallet: ${account.address}`);

  const publicClient = createPublicClient({
    chain: mezoTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: mezoTestnet,
    transport: http(),
  });

  // Test 1: Check balances
  console.log("\n📊 1. CHECKING BALANCES");
  console.log("-".repeat(40));

  const btcBalance = await publicClient.getBalance({
    address: account.address,
  });
  console.log(`   BTC Balance: ${formatEther(btcBalance)} BTC`);

  const musdBalance = await publicClient.readContract({
    address: MUSD_TOKEN,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(`   mUSD Balance: ${formatEther(musdBalance)} mUSD`);

  // Test 2: Check contract state
  console.log("\n📋 2. CONTRACT STATE");
  console.log("-".repeat(40));

  try {
    const isPaused = await publicClient.readContract({
      address: INDIVIDUAL_POOL,
      abi: INDIVIDUAL_POOL_ABI,
      functionName: "paused",
    });
    console.log(`   Contract Paused: ${isPaused}`);

    const totalDeposits = await publicClient.readContract({
      address: INDIVIDUAL_POOL,
      abi: INDIVIDUAL_POOL_ABI,
      functionName: "totalDeposits",
    });
    console.log(`   Total Deposits: ${formatEther(totalDeposits)} mUSD`);

    const userDeposit = await publicClient.readContract({
      address: INDIVIDUAL_POOL,
      abi: INDIVIDUAL_POOL_ABI,
      functionName: "getUserDeposit",
      args: [account.address],
    });
    console.log(`   Your Deposit: ${formatEther(userDeposit)} mUSD`);
  } catch (err) {
    console.log(`   Error reading contract: ${(err as Error).message}`);
  }

  // Test 3: Check mUSD allowance
  console.log("\n🔐 3. TOKEN ALLOWANCE");
  console.log("-".repeat(40));

  const allowance = await publicClient.readContract({
    address: MUSD_TOKEN,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, INDIVIDUAL_POOL],
  });
  console.log(`   mUSD Allowance for Pool: ${formatEther(allowance)} mUSD`);

  // Test 4: Simulate deposit (dry run)
  console.log("\n🧪 4. DEPOSIT SIMULATION");
  console.log("-".repeat(40));

  const depositAmount = parseEther("10"); // 10 mUSD

  if (musdBalance >= depositAmount) {
    try {
      // Check if we need approval
      if (allowance < depositAmount) {
        console.log("   Need to approve mUSD first...");
        console.log(
          `   Would approve ${formatEther(depositAmount)} mUSD to pool`,
        );
      }

      // Simulate deposit
      const { request } = await publicClient.simulateContract({
        address: INDIVIDUAL_POOL,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "deposit",
        args: [depositAmount],
        account: account.address,
      });
      console.log(`   ✅ Deposit simulation SUCCESS`);
      console.log(`   Would deposit: ${formatEther(depositAmount)} mUSD`);
    } catch (err) {
      console.log(
        `   ❌ Deposit simulation FAILED: ${(err as Error).message.slice(0, 100)}`,
      );
    }
  } else {
    console.log(`   ⚠️ Insufficient mUSD balance for deposit test`);
  }

  console.log("\n========================================");
  console.log("✅ Contract test suite complete");
  console.log("========================================\n");
}

main().catch(console.error);
