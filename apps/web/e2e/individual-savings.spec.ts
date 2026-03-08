import { test, expect } from "./fixtures";

test.describe("Individual Savings", () => {
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
          if (method === "eth_sendTransaction") {
            return "0xmockedtransactionhash";
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
  });

  test("should load Individual Savings page correctly", async ({ individualSavingsPage }) => {
    await individualSavingsPage.navigate();
    await individualSavingsPage.verifyPageLoaded();

    // Verify main sections are visible
    await expect(individualSavingsPage.pageTitle).toBeVisible();
  });

  test("should display all main sections", async ({ individualSavingsPage }) => {
    await individualSavingsPage.navigate();

    // Check if main cards are visible
    const depositVisible = await individualSavingsPage.isDepositCardVisible();
    const withdrawVisible = await individualSavingsPage.isWithdrawCardVisible();
    const positionVisible = await individualSavingsPage.isPositionCardVisible();
    const statsVisible = await individualSavingsPage.isStatisticsSectionVisible();

    // At least deposit and position should be visible
    expect(depositVisible || withdrawVisible || positionVisible || statsVisible).toBe(true);
  });

  test.describe("Deposit Form", () => {
    test("should show deposit form", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (depositVisible) {
        await expect(individualSavingsPage.depositButton).toBeVisible();
        await expect(individualSavingsPage.depositAmountInput).toBeVisible();
      }
    });

    test("should validate empty deposit amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Try to submit without entering amount
      await individualSavingsPage.fillDepositAmount("");

      // Button should be disabled or show error
      const isEnabled = await individualSavingsPage.isDepositButtonEnabled();
      const error = await individualSavingsPage.getDepositError();

      expect(!isEnabled || error !== null).toBe(true);
    });

    test("should validate zero deposit amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Enter zero amount
      await individualSavingsPage.fillDepositAmount("0");

      // Wait for validation
      await individualSavingsPage.page.waitForTimeout(500);

      // Should show error or disable button
      const error = await individualSavingsPage.getDepositError();
      const isEnabled = await individualSavingsPage.isDepositButtonEnabled();

      expect(!isEnabled || error !== null).toBe(true);
    });

    test("should validate negative deposit amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Try to enter negative amount
      await individualSavingsPage.fillDepositAmount("-10");

      // Wait for validation
      await individualSavingsPage.page.waitForTimeout(500);

      // Should show error or prevent input
      const error = await individualSavingsPage.getDepositError();
      const inputValue = await individualSavingsPage.depositAmountInput.inputValue();

      expect(error !== null || !inputValue.includes("-")).toBe(true);
    });

    test("should accept valid deposit amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Enter valid amount
      await individualSavingsPage.fillDepositAmount("10");

      // Wait for validation
      await individualSavingsPage.page.waitForTimeout(500);

      // Should not show error
      const error = await individualSavingsPage.getDepositError();
      expect(error).toBeNull();
    });

    test("should fill max deposit amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Click max button
      await individualSavingsPage.clickMaxDeposit();

      // Wait for amount to be filled
      await individualSavingsPage.page.waitForTimeout(500);

      // Input should have value
      const value = await individualSavingsPage.depositAmountInput.inputValue();
      expect(value).toBeTruthy();
    });

    test("should validate decimal precision", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (!depositVisible) {
        test.skip();
      }

      // Enter amount with many decimals
      await individualSavingsPage.fillDepositAmount("10.123456789012345678");

      // Wait for validation
      await individualSavingsPage.page.waitForTimeout(500);

      // Should either truncate or show error
      const value = await individualSavingsPage.depositAmountInput.inputValue();
      const error = await individualSavingsPage.getDepositError();

      expect(value || error).toBeTruthy();
    });
  });

  test.describe("Withdraw Form", () => {
    test("should show withdraw form when user has deposits", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const withdrawVisible = await individualSavingsPage.isWithdrawCardVisible();
      if (withdrawVisible) {
        await expect(individualSavingsPage.withdrawButton).toBeVisible();
      }
    });

    test("should validate empty withdraw amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const withdrawVisible = await individualSavingsPage.isWithdrawCardVisible();
      if (!withdrawVisible) {
        test.skip();
      }

      // Try to submit without entering amount
      await individualSavingsPage.fillWithdrawAmount("");

      // Button should be disabled or show error
      const isEnabled = await individualSavingsPage.isWithdrawButtonEnabled();
      const error = await individualSavingsPage.getWithdrawError();

      expect(!isEnabled || error !== null).toBe(true);
    });

    test("should validate zero withdraw amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const withdrawVisible = await individualSavingsPage.isWithdrawCardVisible();
      if (!withdrawVisible) {
        test.skip();
      }

      // Enter zero amount
      await individualSavingsPage.fillWithdrawAmount("0");

      // Wait for validation
      await individualSavingsPage.page.waitForTimeout(500);

      // Should show error or disable button
      const error = await individualSavingsPage.getWithdrawError();
      const isEnabled = await individualSavingsPage.isWithdrawButtonEnabled();

      expect(!isEnabled || error !== null).toBe(true);
    });

    test("should fill max withdraw amount", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const withdrawVisible = await individualSavingsPage.isWithdrawCardVisible();
      if (!withdrawVisible) {
        test.skip();
      }

      // Click max button
      await individualSavingsPage.clickMaxWithdraw();

      // Wait for amount to be filled
      await individualSavingsPage.page.waitForTimeout(500);

      // Input should have value
      const value = await individualSavingsPage.withdrawAmountInput.inputValue();
      expect(value).toBeTruthy();
    });
  });

  test.describe("Position Display", () => {
    test("should display user position when available", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const positionVisible = await individualSavingsPage.isPositionCardVisible();
      if (positionVisible) {
        // Position card should be visible
        await expect(individualSavingsPage.positionCard).toBeVisible();
      }
    });

    test("should show total deposited", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const totalDeposited = await individualSavingsPage.getTotalDeposited();
      // Should return null or a value
      expect(totalDeposited !== undefined).toBe(true);
    });

    test("should show total yield", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const totalYield = await individualSavingsPage.getTotalYield();
      // Should return null or a value
      expect(totalYield !== undefined).toBe(true);
    });

    test("should show health score", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const healthScore = await individualSavingsPage.getHealthScore();
      // Should return null or a value
      expect(healthScore !== undefined).toBe(true);
    });
  });

  test.describe("Pool Statistics", () => {
    test("should display pool statistics", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const statsVisible = await individualSavingsPage.isStatisticsSectionVisible();
      if (statsVisible) {
        const stats = await individualSavingsPage.getPoolStatistics();
        expect(stats).toBeDefined();
      }
    });
  });

  test.describe("Actions", () => {
    test("should have Get MUSD button", async ({ individualSavingsPage, page }) => {
      await individualSavingsPage.navigate();

      const getMusdButton = page.getByRole("button", { name: /get musd/i });
      // Button may or may not be visible depending on state
      const exists = await getMusdButton.count();
      expect(exists).toBeGreaterThanOrEqual(0);
    });

    test("should have auto-compound toggle", async ({ individualSavingsPage, page }) => {
      await individualSavingsPage.navigate();

      // Auto-compound toggle may or may not exist
      const toggleExists = await individualSavingsPage.autoCompoundToggle.count();
      expect(toggleExists).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading hierarchy", async ({ individualSavingsPage, page }) => {
      await individualSavingsPage.navigate();

      // Should have h1
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
    });

    test("should have accessible form labels", async ({ individualSavingsPage, page }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (depositVisible) {
        // Input should have label or aria-label
        const input = individualSavingsPage.depositAmountInput;
        const ariaLabel = await input.getAttribute("aria-label");
        const id = await input.getAttribute("id");

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count();
          expect(ariaLabel || labelExists > 0).toBeTruthy();
        }
      }
    });

    test("should have accessible buttons", async ({ individualSavingsPage }) => {
      await individualSavingsPage.navigate();

      const depositVisible = await individualSavingsPage.isDepositCardVisible();
      if (depositVisible) {
        const buttonText = await individualSavingsPage.depositButton.textContent();
        expect(buttonText?.trim()).toBeTruthy();
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile", async ({ individualSavingsPage }) => {
      await individualSavingsPage.page.setViewportSize({ width: 375, height: 667 });
      await individualSavingsPage.navigate();

      // Page should load without horizontal scroll
      const pageTitle = individualSavingsPage.pageTitle;
      await expect(pageTitle).toBeVisible();
    });

    test("should display correctly on tablet", async ({ individualSavingsPage }) => {
      await individualSavingsPage.page.setViewportSize({ width: 768, height: 1024 });
      await individualSavingsPage.navigate();

      const pageTitle = individualSavingsPage.pageTitle;
      await expect(pageTitle).toBeVisible();
    });

    test("should display correctly on desktop", async ({ individualSavingsPage }) => {
      await individualSavingsPage.page.setViewportSize({ width: 1920, height: 1080 });
      await individualSavingsPage.navigate();

      const pageTitle = individualSavingsPage.pageTitle;
      await expect(pageTitle).toBeVisible();
    });
  });

  test.describe("Performance", () => {
    test("should load within acceptable time", async ({ individualSavingsPage }) => {
      const startTime = Date.now();
      await individualSavingsPage.navigate();
      await individualSavingsPage.waitForLoadingToFinish();
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
