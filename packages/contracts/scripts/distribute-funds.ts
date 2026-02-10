/**
 * Distribute Funds to Test Wallets
 *
 * After funding the FAUCET wallet from Mezo testnet faucet,
 * run this script to distribute BTC to all test user wallets.
 *
 * Usage: npx ts-node scripts/distribute-funds.ts
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Configuration
const RPC_URL = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;
const AMOUNT_PER_USER = ethers.parseEther("0.01"); // 0.01 BTC per user

interface WalletInfo {
  name: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function distribute() {
  console.log("💸 KhipuVault Fund Distribution Script\n");
  console.log("=".repeat(60));

  // Load wallets
  const walletsPath = path.join(__dirname, "../test-wallets/wallets.json");
  const wallets: WalletInfo[] = JSON.parse(fs.readFileSync(walletsPath, "utf8"));

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
    console.log(`   Mezo Faucet: https://faucet.mezo.org/`);
    return;
  }

  // Calculate total needed
  const userWallets = wallets.slice(2); // Skip FAUCET and DISTRIBUTOR
  const totalNeeded = AMOUNT_PER_USER * BigInt(userWallets.length);
  console.log(`\n📊 Distribution Plan:`);
  console.log(`   Users to fund: ${userWallets.length}`);
  console.log(`   Amount per user: ${ethers.formatEther(AMOUNT_PER_USER)} BTC`);
  console.log(`   Total needed: ${ethers.formatEther(totalNeeded)} BTC`);

  if (faucetBalance < totalNeeded) {
    console.log("\n⚠️  Insufficient funds for full distribution");
    console.log(`   Available: ${ethers.formatEther(faucetBalance)} BTC`);
    console.log(`   Needed: ${ethers.formatEther(totalNeeded)} BTC`);
    console.log(`   Will distribute what's available...`);
  }

  // Get gas price
  const feeData = await provider.getFeeData();
  console.log(`\n⛽ Gas Price: ${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`);

  // Distribute to each user
  console.log("\n📤 Distributing funds...\n");

  for (const user of userWallets) {
    try {
      // Check if user already has balance
      const userBalance = await provider.getBalance(user.address);
      if (userBalance > 0n) {
        console.log(
          `   ✓ ${user.name}: Already has ${ethers.formatEther(userBalance)} BTC - Skipping`
        );
        continue;
      }

      // Send funds
      const tx = await faucetWallet.sendTransaction({
        to: user.address,
        value: AMOUNT_PER_USER,
        gasLimit: 21000n,
      });

      console.log(`   ⏳ ${user.name}: Sending ${ethers.formatEther(AMOUNT_PER_USER)} BTC...`);
      await tx.wait();
      console.log(`   ✅ ${user.name}: Confirmed (${tx.hash.slice(0, 10)}...)`);
    } catch (error: any) {
      console.log(`   ❌ ${user.name}: Failed - ${error.message}`);
    }
  }

  // Final balances
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL BALANCES");
  console.log("=".repeat(60) + "\n");

  for (const wallet of wallets) {
    const balance = await provider.getBalance(wallet.address);
    console.log(`   ${wallet.name}: ${ethers.formatEther(balance)} BTC`);
  }

  console.log("\n✅ Distribution complete!");
}

// Run
distribute().catch(console.error);
