import { Page, Locator, expect } from "@playwright/test";

/**
 * Base page object with common functionality for all pages
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || "http://localhost:3000";
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = "/"): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("load");
    // Wait for Next.js hydration
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout });
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(
    role: Parameters<Page["getByRole"]>[0],
    options?: Parameters<Page["getByRole"]>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text);
  }

  /**
   * Get element by label
   */
  getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Click element with loading state handling
   */
  async clickAndWait(locator: Locator, waitForNavigation: boolean = false): Promise<void> {
    if (waitForNavigation) {
      await Promise.all([this.page.waitForLoadState("networkidle"), locator.click()]);
    } else {
      await locator.click();
    }
  }

  /**
   * Fill input and wait for debounce
   */
  async fillAndWait(locator: Locator, value: string, debounceMs: number = 300): Promise<void> {
    await locator.fill(value);
    await this.page.waitForTimeout(debounceMs);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: "hidden", timeout });
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(locator: Locator): Promise<boolean> {
    return await locator.isEnabled();
  }

  /**
   * Get element text content
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || "";
  }

  /**
   * Get element attribute
   */
  async getAttribute(locator: Locator, name: string): Promise<string | null> {
    return await locator.getAttribute(name);
  }

  /**
   * Take screenshot with name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `./test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for toast message to appear
   */
  async waitForToast(message?: string | RegExp, timeout: number = 5000): Promise<void> {
    const toast = message
      ? this.page.locator('[role="status"], [role="alert"]').filter({ hasText: message })
      : this.page.locator('[role="status"], [role="alert"]').first();

    await toast.waitFor({ state: "visible", timeout });
  }

  /**
   * Close toast if visible
   */
  async closeToast(): Promise<void> {
    const closeButton = this.page.locator('[role="status"] button, [role="alert"] button');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoadingToFinish(): Promise<void> {
    const spinner = this.page.locator('[data-loading="true"], .loading, .spinner');
    await spinner.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
      // Ignore if spinner doesn't exist
    });
  }

  /**
   * Check for error messages on page
   */
  async hasError(): Promise<boolean> {
    const errorLocator = this.page.locator('[role="alert"]').filter({ hasText: /error|failed/i });
    return await errorLocator.isVisible().catch(() => false);
  }

  /**
   * Expect no console errors (excluding specific patterns)
   */
  async expectNoConsoleErrors(excludePatterns: RegExp[] = []): Promise<void> {
    const errors: string[] = [];

    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        const shouldExclude = excludePatterns.some((pattern) => pattern.test(text));
        if (!shouldExclude) {
          errors.push(text);
        }
      }
    });

    // Wait a bit for any console errors
    await this.page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  }

  /**
   * Mock window.ethereum (Web3 provider)
   */
  async mockWeb3Provider(
    address: string = "0x1234567890123456789012345678901234567890"
  ): Promise<void> {
    await this.page.addInitScript((addr) => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts") {
            return [addr];
          }
          if (method === "eth_chainId") {
            return "0x7b6b"; // 31611
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    }, address);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.waitForPageLoad();
  }
}
