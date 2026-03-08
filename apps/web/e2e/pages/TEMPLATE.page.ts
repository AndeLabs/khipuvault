import { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Template Page Object
 *
 * Copy this file and rename it to create new page objects.
 * Example: prize-pool.page.ts, cooperative-savings.page.ts
 */
export class TemplatePage extends BasePage {
  // Page-specific locators
  readonly pageTitle: Locator;
  readonly mainContent: Locator;

  // Form elements
  readonly inputField: Locator;
  readonly submitButton: Locator;

  // Cards/Sections
  readonly infoCard: Locator;
  readonly statsSection: Locator;

  constructor(page: any) {
    super(page);

    // Initialize locators
    this.pageTitle = this.getByRole("heading", { name: /page title/i });
    this.mainContent = this.page.locator('[data-testid="main-content"]');

    // Form elements
    this.inputField = this.getByPlaceholder(/enter value/i);
    this.submitButton = this.getByRole("button", { name: /submit/i });

    // Cards/Sections
    this.infoCard = this.page.locator('[data-testid="info-card"]');
    this.statsSection = this.page.locator('[data-testid="stats"]');
  }

  /**
   * Navigate to this page
   */
  async navigate(): Promise<void> {
    await this.goto("/dashboard/your-page-path");
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await this.waitForVisible(this.pageTitle);
    await this.waitForLoadingToFinish();
  }

  /**
   * Fill a form field
   */
  async fillInputField(value: string): Promise<void> {
    await this.fillAndWait(this.inputField, value);
  }

  /**
   * Submit a form
   */
  async submitForm(): Promise<void> {
    await this.clickAndWait(this.submitButton);
  }

  /**
   * Complete action (fill + submit)
   */
  async performAction(value: string): Promise<void> {
    await this.fillInputField(value);
    await this.submitForm();
    await this.waitForToast(/success/i);
  }

  /**
   * Get data from the page
   */
  async getData(): Promise<string | null> {
    if (await this.mainContent.isVisible()) {
      return await this.getText(this.mainContent);
    }
    return null;
  }

  /**
   * Check if element is visible
   */
  async isInfoCardVisible(): Promise<boolean> {
    return await this.infoCard.isVisible();
  }

  /**
   * Get validation error
   */
  async getFormError(): Promise<string | null> {
    const errorMessage = this.page.locator('[role="alert"], .error-message');
    if (await errorMessage.isVisible()) {
      return await this.getText(errorMessage);
    }
    return null;
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.submitButton);
  }

  /**
   * Wait for action to complete
   */
  async waitForActionComplete(): Promise<void> {
    await this.waitForToast(/completed|success/i, 30000);
    await this.waitForLoadingToFinish();
  }
}

/**
 * Usage in tests:
 *
 * import { test, expect } from '../fixtures';
 * import { TemplatePage } from './template.page';
 *
 * test('example test', async ({ page }) => {
 *   const templatePage = new TemplatePage(page);
 *   await templatePage.navigate();
 *   await templatePage.verifyPageLoaded();
 *
 *   await templatePage.performAction('value');
 *   const data = await templatePage.getData();
 *   expect(data).toBeTruthy();
 * });
 */
