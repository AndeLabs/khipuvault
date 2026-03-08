import { test as base, Page } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { IndividualSavingsPage } from "./pages/individual-savings.page";

/**
 * Mock wallet for testing Web3 interactions without real wallet
 */
export class MockWallet {
  private page: Page;
  public address: string;
  public chainId: number;
  public isConnected: boolean;

  constructor(page: Page) {
    this.page = page;
    this.address = "0x1234567890123456789012345678901234567890";
    this.chainId = 31611; // Mezo testnet
    this.isConnected = false;
  }

  /**
   * Mock wallet connection by injecting ethereum provider
   */
  async connect(): Promise<void> {
    await this.page.addInitScript(() => {
      // Mock ethereum provider
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === "eth_requestAccounts") {
            return ["0x1234567890123456789012345678901234567890"];
          }
          if (method === "eth_accounts") {
            return ["0x1234567890123456789012345678901234567890"];
          }
          if (method === "eth_chainId") {
            return "0x7b6b"; // 31611 in hex
          }
          if (method === "wallet_switchEthereumChain") {
            return null;
          }
          if (method === "personal_sign") {
            return "0xmockedsignature";
          }
          if (method === "eth_sendTransaction") {
            return "0xmockedtxhash";
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    this.isConnected = true;
  }

  /**
   * Mock wallet disconnection
   */
  async disconnect(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).ethereum = undefined;
    });
    this.isConnected = false;
  }

  /**
   * Change the mocked chain ID
   */
  async switchChain(chainId: number): Promise<void> {
    this.chainId = chainId;
    await this.page.evaluate((id) => {
      if ((window as any).ethereum) {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === "eth_chainId") {
            return `0x${id.toString(16)}`;
          }
          return null;
        };
      }
    }, chainId);
  }

  /**
   * Mock a successful transaction
   */
  async mockTransaction(hash: string = "0xmockedtxhash"): Promise<string> {
    await this.page.evaluate((txHash) => {
      if ((window as any).ethereum) {
        const originalRequest = (window as any).ethereum.request;
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === "eth_sendTransaction") {
            return txHash;
          }
          return originalRequest({ method });
        };
      }
    }, hash);
    return hash;
  }
}

/**
 * Extended test fixtures with page objects and mock wallet
 */
type TestFixtures = {
  dashboardPage: DashboardPage;
  individualSavingsPage: IndividualSavingsPage;
  mockWallet: MockWallet;
};

/**
 * Custom test with fixtures
 */
export const test = base.extend<TestFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  individualSavingsPage: async ({ page }, use) => {
    const individualSavingsPage = new IndividualSavingsPage(page);
    await use(individualSavingsPage);
  },

  mockWallet: async ({ page }, use) => {
    const wallet = new MockWallet(page);
    await wallet.connect();
    await use(wallet);
    await wallet.disconnect();
  },
});

export { expect } from "@playwright/test";

/**
 * Helper to wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
}

/**
 * Helper to wait for hydration (Next.js specific)
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("load");
  // Wait a bit for React hydration
  await page.waitForTimeout(500);
}

/**
 * Helper to mock API responses
 */
export async function mockApiResponse(
  page: Page,
  endpoint: string,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(`**/api/${endpoint}`, (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper to take accessible screenshot with name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `./test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}
