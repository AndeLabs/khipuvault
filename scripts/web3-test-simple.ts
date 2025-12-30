/**
 * Simple Web3 E2E Test - Direct provider injection for Wagmi/RainbowKit
 */

import { chromium } from "playwright";
import { Wallet, JsonRpcProvider } from "ethers";

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const MEZO_RPC = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;

async function main() {
  console.log("🚀 Starting Web3 E2E Test\n");

  const wallet = new Wallet(TEST_PRIVATE_KEY);
  const address = wallet.address;
  console.log(`Test Wallet: ${address}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject mock ethereum provider before page loads
  await page.addInitScript(`
    window.ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      chainId: '0x${CHAIN_ID.toString(16)}',
      networkVersion: '${CHAIN_ID}',
      selectedAddress: '${address}',
      _metamask: {
        isUnlocked: () => Promise.resolve(true),
      },
      request: async ({ method, params }) => {
        console.log('[Mock Wallet] Request:', method, params);

        switch (method) {
          case 'eth_chainId':
            return '0x${CHAIN_ID.toString(16)}';
          case 'net_version':
            return '${CHAIN_ID}';
          case 'eth_accounts':
          case 'eth_requestAccounts':
            return ['${address}'];
          case 'wallet_switchEthereumChain':
            return null;
          case 'eth_getBalance':
            // Fetch real balance from RPC
            const balResp = await fetch('${MEZO_RPC}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [params[0], 'latest'],
                id: 1
              })
            });
            const balData = await balResp.json();
            return balData.result;
          case 'eth_call':
          case 'eth_estimateGas':
          case 'eth_getTransactionCount':
          case 'eth_getBlockByNumber':
          case 'eth_blockNumber':
            // Forward to real RPC
            const resp = await fetch('${MEZO_RPC}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: Date.now()
              })
            });
            const data = await resp.json();
            return data.result;
          case 'eth_sendTransaction':
            console.log('[Mock Wallet] Would send transaction:', params);
            // Return a mock tx hash for testing UI flow
            return '0x' + '0'.repeat(64);
          case 'personal_sign':
          case 'eth_signTypedData_v4':
            console.log('[Mock Wallet] Would sign:', params);
            // Return mock signature
            return '0x' + '0'.repeat(130);
          default:
            console.warn('[Mock Wallet] Unhandled method:', method);
            throw new Error('Method not supported: ' + method);
        }
      },
      on: (event, callback) => {
        console.log('[Mock Wallet] Event listener:', event);
        if (event === 'accountsChanged') {
          setTimeout(() => callback(['${address}']), 100);
        }
        if (event === 'chainChanged') {
          setTimeout(() => callback('0x${CHAIN_ID.toString(16)}'), 100);
        }
      },
      removeListener: () => {},
      emit: () => {},
    };

    // Also set window.web3 for legacy support
    window.web3 = { currentProvider: window.ethereum };

    console.log('[Mock Wallet] Injected! Address:', '${address}');
  `);

  console.log("\n📱 Navigating to dashboard...");
  await page.goto("http://localhost:9002/dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: ".playwright-mcp/e2e-01-dashboard.png" });
  console.log("📸 Screenshot saved: e2e-01-dashboard.png");

  // Try to connect
  console.log("\n🔗 Clicking Connect Wallet...");
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible()) {
    await connectBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ".playwright-mcp/e2e-02-wallet-options.png",
    });
    console.log("📸 Screenshot saved: e2e-02-wallet-options.png");

    // Look for injected wallet option or MetaMask
    const injectedOption = page.locator("text=MetaMask").first();
    if (await injectedOption.isVisible()) {
      console.log("  Found MetaMask option, clicking...");
      await injectedOption.click();
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: ".playwright-mcp/e2e-03-after-connect.png" });
  console.log("📸 Screenshot saved: e2e-03-after-connect.png");

  // Check console for wallet activity
  page.on("console", (msg) => {
    if (msg.text().includes("[Mock Wallet]")) {
      console.log("  " + msg.text());
    }
  });

  // Navigate to Individual Savings
  console.log("\n💰 Going to Individual Savings...");
  await page.goto("http://localhost:9002/dashboard/individual-savings");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: ".playwright-mcp/e2e-04-individual-savings.png",
  });
  console.log("📸 Screenshot saved: e2e-04-individual-savings.png");

  // Navigate to Prize Pool
  console.log("\n🎟️ Going to Prize Pool...");
  await page.goto("http://localhost:9002/dashboard/prize-pool");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".playwright-mcp/e2e-05-prize-pool.png" });
  console.log("📸 Screenshot saved: e2e-05-prize-pool.png");

  console.log("\n✅ Test complete! Check screenshots in .playwright-mcp/");
  console.log("Browser stays open for 20 seconds...\n");

  await page.waitForTimeout(20000);
  await browser.close();
}

main().catch(console.error);
