/**
 * Web3 E2E Testing Script with Headless Wallet Provider
 * Tests KhipuVault dApp interactions without requiring MetaMask extension
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { injectHeadlessWeb3Provider } from "headless-web3-provider";

// Test wallet - using a known test private key
// This is a TEST wallet on Mezo Testnet only
const TEST_PRIVATE_KEY =
  process.env.TEST_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil default #0
const TEST_ADDRESS = "0xB4d5B9a6e744A3c5fdBE2726f469e878e319a8D8";

// Mezo Testnet config
const MEZO_TESTNET = {
  chainId: 31611,
  rpcUrl: "https://rpc.test.mezo.org",
  chainName: "Mezo Testnet",
};

// Contract addresses
const CONTRACTS = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  IndividualPool: "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
  LotteryPool: "0x...", // Add actual address
};

async function setupWeb3Browser(): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  const browser = await chromium.launch({
    headless: false, // Set to true for CI
    slowMo: 500, // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject headless Web3 provider
  await injectHeadlessWeb3Provider(
    page,
    [TEST_PRIVATE_KEY],
    MEZO_TESTNET.chainId,
    MEZO_TESTNET.rpcUrl,
  );

  return { context, page };
}

async function testWalletConnection(page: Page): Promise<boolean> {
  console.log("\n📱 Testing Wallet Connection...");

  await page.goto("http://localhost:9002/dashboard");
  await page.waitForLoadState("networkidle");

  // Click connect wallet
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  await connectBtn.click();

  // Wait for wallet options
  await page.waitForTimeout(1000);

  // The injected provider should auto-connect
  // Check if we see the connected state
  const isConnected = await page
    .getByText(TEST_ADDRESS.slice(0, 6))
    .isVisible()
    .catch(() => false);

  if (isConnected) {
    console.log("✅ Wallet connected successfully!");
    return true;
  } else {
    console.log("❌ Wallet connection failed");
    return false;
  }
}

async function testIndividualSavingsDeposit(page: Page): Promise<boolean> {
  console.log("\n💰 Testing Individual Savings Deposit...");

  await page.goto("http://localhost:9002/dashboard/individual-savings");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: ".playwright-mcp/e2e-individual-savings.png" });

  // Look for deposit input
  const depositInput = page
    .locator('input[placeholder*="amount" i], input[type="number"]')
    .first();
  if (await depositInput.isVisible()) {
    await depositInput.fill("1"); // Deposit 1 MUSD
    console.log("  Entered deposit amount: 1 MUSD");

    // Look for deposit button
    const depositBtn = page.getByRole("button", { name: /deposit/i });
    if (await depositBtn.isVisible()) {
      await depositBtn.click();
      console.log("  Clicked deposit button");

      // Wait for transaction
      await page.waitForTimeout(5000);

      console.log("✅ Deposit initiated!");
      return true;
    }
  }

  console.log("⚠️ Could not find deposit UI elements");
  return false;
}

async function testPrizePoolTickets(page: Page): Promise<boolean> {
  console.log("\n🎟️ Testing Prize Pool Ticket Purchase...");

  await page.goto("http://localhost:9002/dashboard/prize-pool");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: ".playwright-mcp/e2e-prize-pool.png" });

  // Look for buy tickets button
  const buyBtn = page.getByRole("button", { name: /buy.*ticket/i });
  if (await buyBtn.isVisible()) {
    await buyBtn.click();
    console.log("  Clicked buy tickets button");

    await page.waitForTimeout(3000);
    console.log("✅ Ticket purchase flow initiated!");
    return true;
  }

  console.log("⚠️ Could not find buy tickets button");
  return false;
}

async function runE2ETests() {
  console.log("🚀 Starting KhipuVault E2E Web3 Tests");
  console.log("==========================================");
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log(`Network: Mezo Testnet (${MEZO_TESTNET.chainId})`);
  console.log("==========================================\n");

  const { context, page } = await setupWeb3Browser();

  const results = {
    walletConnection: false,
    individualDeposit: false,
    prizePoolTickets: false,
  };

  try {
    results.walletConnection = await testWalletConnection(page);

    if (results.walletConnection) {
      results.individualDeposit = await testIndividualSavingsDeposit(page);
      results.prizePoolTickets = await testPrizePoolTickets(page);
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }

  // Summary
  console.log("\n==========================================");
  console.log("📊 Test Results Summary:");
  console.log(`  Wallet Connection: ${results.walletConnection ? "✅" : "❌"}`);
  console.log(
    `  Individual Deposit: ${results.individualDeposit ? "✅" : "❌"}`,
  );
  console.log(
    `  Prize Pool Tickets: ${results.prizePoolTickets ? "✅" : "❌"}`,
  );
  console.log("==========================================\n");

  // Keep browser open for inspection
  console.log("Browser will stay open for 30 seconds for inspection...");
  await page.waitForTimeout(30000);

  await context.close();
}

// Run tests
runE2ETests().catch(console.error);
