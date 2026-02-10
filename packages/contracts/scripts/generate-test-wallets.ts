/**
 * Generate Test Wallets for Multi-User Testing
 *
 * This script creates multiple wallets for testing:
 * - 1 Faucet wallet (to receive testnet BTC and distribute)
 * - 10 Test user wallets
 *
 * IMPORTANT: Keep these keys secure! They are for testnet only.
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface WalletInfo {
  name: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function generateWallets() {
  console.log("🔐 Generating Test Wallets for KhipuVault Testing\n");
  console.log("=".repeat(60));

  const wallets: WalletInfo[] = [];

  // Generate Faucet Wallet (for receiving and distributing funds)
  console.log("\n📦 Creating Faucet Wallet...");
  const faucetWallet = ethers.Wallet.createRandom();
  wallets.push({
    name: "FAUCET",
    address: faucetWallet.address,
    privateKey: faucetWallet.privateKey,
    mnemonic: faucetWallet.mnemonic?.phrase,
  });
  console.log(`   Address: ${faucetWallet.address}`);

  // Generate Distributor Wallet (backup faucet)
  console.log("\n📦 Creating Distributor Wallet...");
  const distributorWallet = ethers.Wallet.createRandom();
  wallets.push({
    name: "DISTRIBUTOR",
    address: distributorWallet.address,
    privateKey: distributorWallet.privateKey,
    mnemonic: distributorWallet.mnemonic?.phrase,
  });
  console.log(`   Address: ${distributorWallet.address}`);

  // Generate 10 Test User Wallets
  console.log("\n👥 Creating Test User Wallets...\n");
  for (let i = 1; i <= 10; i++) {
    const wallet = ethers.Wallet.createRandom();
    const name = `USER_${i.toString().padStart(2, "0")}`;
    wallets.push({
      name,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    });
    console.log(`   ${name}: ${wallet.address}`);
  }

  // Save to secure file
  const outputPath = path.join(__dirname, "../test-wallets/wallets.json");
  const envPath = path.join(__dirname, "../test-wallets/.env.test-wallets");

  // JSON format (full details)
  fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2));
  console.log(`\n✅ Wallets saved to: ${outputPath}`);

  // ENV format (for easy loading)
  let envContent = `# KhipuVault Test Wallets
# Generated: ${new Date().toISOString()}
# Network: Mezo Testnet (Chain ID: 31611)
#
# ⚠️  THESE ARE TESTNET KEYS ONLY - NEVER USE FOR MAINNET
# ⚠️  DO NOT COMMIT THIS FILE TO GIT
#

`;

  wallets.forEach((w) => {
    envContent += `# ${w.name}\n`;
    envContent += `${w.name}_ADDRESS=${w.address}\n`;
    envContent += `${w.name}_PRIVATE_KEY=${w.privateKey}\n`;
    if (w.mnemonic) {
      envContent += `${w.name}_MNEMONIC="${w.mnemonic}"\n`;
    }
    envContent += "\n";
  });

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ ENV file saved to: ${envPath}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 WALLET SUMMARY");
  console.log("=".repeat(60));
  console.log("\n🔴 WALLETS THAT NEED FUNDING FROM MEZO FAUCET:");
  console.log("\n1. FAUCET Wallet (Primary - Fund this one):");
  console.log(`   Address: ${wallets[0].address}`);
  console.log("\n2. DISTRIBUTOR Wallet (Backup):");
  console.log(`   Address: ${wallets[1].address}`);
  console.log("\n" + "-".repeat(60));
  console.log("\n📝 After funding, run the distribute script to send");
  console.log("   BTC to all test user wallets.");
  console.log("\n" + "=".repeat(60));

  // Create gitignore for wallets directory
  const gitignorePath = path.join(__dirname, "../test-wallets/.gitignore");
  fs.writeFileSync(
    gitignorePath,
    `# Ignore all wallet files
*
!.gitignore
`
  );
  console.log(`\n✅ Created .gitignore to protect wallet files`);

  return wallets;
}

// Run
generateWallets().catch(console.error);
