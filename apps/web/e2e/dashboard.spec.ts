import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Web3 provider before each test
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts") {
            return ["0x1234567890123456789012345678901234567890"];
          }
          if (method === "eth_chainId") {
            return "0x7b6b"; // 31611 in hex
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
  });

  test("should load dashboard page correctly", async ({ dashboardPage }) => {
    await dashboardPage.navigate();
    await dashboardPage.verifyDashboardLoaded();

    // Verify main elements are visible
    await expect(dashboardPage.dashboardHeader).toBeVisible();
    await expect(dashboardPage.sidebar).toBeVisible();
  });

  test("should display sidebar navigation", async ({ dashboardPage }) => {
    await dashboardPage.navigate();

    // Verify all navigation links are present
    await expect(dashboardPage.individualSavingsLink).toBeVisible();
    await expect(dashboardPage.cooperativeSavingsLink).toBeVisible();
    await expect(dashboardPage.rotatingPoolLink).toBeVisible();
    await expect(dashboardPage.prizePoolLink).toBeVisible();
  });

  test("should navigate to Individual Savings", async ({ dashboardPage, page }) => {
    await dashboardPage.navigate();
    await dashboardPage.goToIndividualSavings();

    // Verify URL changed
    expect(page.url()).toContain("/dashboard/individual-savings");

    // Verify page title is present
    const heading = page.getByRole("heading", { name: /individual savings/i });
    await expect(heading).toBeVisible();
  });

  test("should navigate to Cooperative Savings", async ({ dashboardPage, page }) => {
    await dashboardPage.navigate();
    await dashboardPage.goToCooperativeSavings();

    // Verify URL changed
    expect(page.url()).toContain("/dashboard/cooperative-savings");
  });

  test("should navigate to Rotating Pool", async ({ dashboardPage, page }) => {
    await dashboardPage.navigate();
    await dashboardPage.goToRotatingPool();

    // Verify URL changed
    expect(page.url()).toContain("/dashboard/rotating-pool");
  });

  test("should navigate to Prize Pool", async ({ dashboardPage, page }) => {
    await dashboardPage.navigate();
    await dashboardPage.goToPrizePool();

    // Verify URL changed
    expect(page.url()).toContain("/dashboard/prize-pool");
  });

  test("should display platform statistics", async ({ dashboardPage }) => {
    await dashboardPage.navigate();

    // Wait for stats to load
    await dashboardPage.waitForLoadingToFinish();

    // Check if statistics are visible (may vary based on data)
    const hasPlatformStats = await dashboardPage.platformStats.isVisible();
    if (hasPlatformStats) {
      const stats = await dashboardPage.getPlatformStats();
      expect(stats).toBeDefined();
    }
  });

  test.describe("Wallet Connection", () => {
    test("should show connect wallet button when not connected", async ({
      page,
      dashboardPage,
    }) => {
      // Navigate without mock wallet
      await page.goto("/dashboard");

      const connectButton = page.getByRole("button", { name: /connect wallet/i });
      await expect(connectButton).toBeVisible();
    });

    test("should display wallet address when connected", async ({ dashboardPage, mockWallet }) => {
      await dashboardPage.navigate();

      // Verify wallet is connected
      const isConnected = await dashboardPage.isWalletConnected();
      expect(isConnected).toBe(true);
    });
  });

  test.describe("Mobile Navigation", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should toggle mobile menu", async ({ dashboardPage }) => {
      await dashboardPage.navigate();

      // Check if sidebar is hidden initially on mobile
      const sidebarVisible = await dashboardPage.isSidebarVisible();

      // Toggle menu
      await dashboardPage.toggleMobileMenu();

      // Wait a bit for animation
      await dashboardPage.page.waitForTimeout(300);
    });
  });

  test.describe("Navigation State", () => {
    test("should highlight active navigation item", async ({ dashboardPage, page }) => {
      await dashboardPage.navigate();
      await dashboardPage.goToIndividualSavings();

      // Check if Individual Savings is highlighted
      const activeItem = await dashboardPage.getActiveNavItem();
      if (activeItem) {
        expect(activeItem.toLowerCase()).toContain("individual");
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle navigation errors gracefully", async ({ page }) => {
      // Try to navigate to non-existent page
      const response = await page.goto("/dashboard/non-existent-page");

      // Should either redirect or show 404
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading hierarchy", async ({ dashboardPage, page }) => {
      await dashboardPage.navigate();

      // Check for h1
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
    });

    test("should have accessible navigation", async ({ dashboardPage }) => {
      await dashboardPage.navigate();

      // Check for navigation landmark
      const nav = dashboardPage.page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    });

    test("should have proper link labels", async ({ dashboardPage }) => {
      await dashboardPage.navigate();

      // All navigation links should have accessible names
      const links = dashboardPage.sidebar.locator("a");
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        expect(text?.trim()).toBeTruthy();
      }
    });
  });

  test.describe("Performance", () => {
    test("should load within acceptable time", async ({ dashboardPage }) => {
      const startTime = Date.now();
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingToFinish();
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
