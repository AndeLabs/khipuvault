/**
 * Distribute Funds to Test Wallets
 *
 * After funding the FAUCET wallet, run this script to distribute
 * BTC to all test user wallets.
 *
 * Usage: node scripts/distribute-funds.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;
const AMOUNT_PER_USER = ethers.parseEther("0.005"); // 0.005 BTC per user

async function distribute() {
  console.log("💸 KhipuVault Fund Distribution Script\n");
  console.log("=".repeat(60));

  // Load wallets
  const walletsPath = path.join(__dirname, "../../contracts/test-wallets/wallets.json");
  if (!fs.existsSync(walletsPath)) {
    console.log("\n❌ Wallets file not found. Please generate wallets first.");
    return;
  }
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));

  // Connect to Mezo Testnet
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  console.log(`\n📡 Connected to Mezo Testnet (Chain ID: ${CHAIN_ID})`);

  // Get faucet wallet
  const faucetWallet = new ethers.Wallet(wallets[0].privateKey, provider);
  const faucetBalance = await provider.getBalance(faucetWallet.address);
  console.log(`\n💰 Faucet Balance: ${ethers.formatEther(faucetBalance)} BTC`);

  if (faucetBalance === 0n) {
    console.log("\n❌ Faucet wallet has no funds!");
    console.log(`   Please fund this address first: ${faucetWallet.address}`);
    return;
  }

  // Calculate total needed
  const userWallets = wallets.slice(2); // Skip FAUCET and DISTRIBUTOR
  const totalNeeded = AMOUNT_PER_USER * BigInt(userWallets.length);
  console.log(`\n📊 Distribution Plan:`);
  console.log(`   Users to fund: ${userWallets.length}`);
  console.log(`   Amount per user: ${ethers.formatEther(AMOUNT_PER_USER)} BTC`);
  console.log(`   Total needed: ${ethers.formatEther(totalNeeded)} BTC`);

  // Check if we have enough
  const gasBuffer = ethers.parseEther("0.001"); // Reserve for gas
  const available = faucetBalance - gasBuffer;
  const actualPerUser = available > totalNeeded ? AMOUNT_PER_USER : available / BigInt(userWallets.length);

  console.log(`   Actual per user: ${ethers.formatEther(actualPerUser)} BTC`);

  // Distribute to each user
  console.log("\n📤 Distributing funds...\n");

  let successCount = 0;
  for (const user of userWallets) {
    try {
      // Check if user already has balance
      const userBalance = await provider.getBalance(user.address);
      if (userBalance >= actualPerUser) {
        console.log(`   ✓ ${user.name}: Already has ${ethers.formatEther(userBalance)} BTC - Skipping`);
        continue;
      }

      // Send funds
      console.log(`   ⏳ ${user.name}: Sending ${ethers.formatEther(actualPerUser)} BTC...`);
      const tx = await faucetWallet.sendTransaction({
        to: user.address,
        value: actualPerUser,
        gasLimit: 21000n,
      });

      await tx.wait();
      console.log(`   ✅ ${user.name}: Confirmed (tx: ${tx.hash.slice(0, 18)}...)`);
      successCount++;

      // Small delay between transactions
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.log(`   ❌ ${user.name}: Failed - ${error.message}`);
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DISTRIBUTION SUMMARY");
  console.log("=".repeat(60));
  console.log(`\n   ✅ Successful: ${successCount}/${userWallets.length}`);

  // Final balances
  console.log("\n💰 Final Balances:");
  for (const wallet of wallets) {
    const balance = await provider.getBalance(wallet.address);
    const status = balance > 0n ? "✓" : "✗";
    console.log(`   ${status} ${wallet.name}: ${ethers.formatEther(balance)} BTC`);
  }

  console.log("\n✅ Distribution complete!");
  console.log("\n🔗 Explorer: https://explorer.test.mezo.org");
}

// Run
distribute().catch(console.error);
