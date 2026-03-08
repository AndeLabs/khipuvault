import { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Individual Savings page object
 */
export class IndividualSavingsPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly depositCard: Locator;
  readonly withdrawCard: Locator;
  readonly positionCard: Locator;
  readonly statisticsSection: Locator;

  // Deposit form
  readonly depositAmountInput: Locator;
  readonly depositButton: Locator;
  readonly maxDepositButton: Locator;
  readonly musdBalance: Locator;

  // Withdraw form
  readonly withdrawAmountInput: Locator;
  readonly withdrawButton: Locator;
  readonly maxWithdrawButton: Locator;
  readonly depositedBalance: Locator;

  // Position card
  readonly totalDeposited: Locator;
  readonly totalYield: Locator;
  readonly healthScore: Locator;

  // Statistics
  readonly totalValueLocked: Locator;
  readonly averageAPY: Locator;
  readonly totalUsers: Locator;

  // Actions
  readonly getMusdButton: Locator;
  readonly autoCompoundToggle: Locator;

  constructor(page: any) {
    super(page);

    // Page elements
    this.pageTitle = this.getByRole("heading", { name: /individual savings/i });
    this.depositCard = this.page.locator('[data-testid="deposit-card"]');
    this.withdrawCard = this.page.locator('[data-testid="withdraw-card"]');
    this.positionCard = this.page.locator('[data-testid="position-card"]');
    this.statisticsSection = this.page.locator('[data-testid="pool-statistics"]');

    // Deposit form
    this.depositAmountInput = this.getByPlaceholder(/enter amount|0\.00/i);
    this.depositButton = this.getByRole("button", { name: /^deposit$/i });
    this.maxDepositButton = this.getByRole("button", { name: /max/i });
    this.musdBalance = this.page.locator('[data-testid="musd-balance"]');

    // Withdraw form
    this.withdrawAmountInput = this.withdrawCard.locator(
      'input[type="text"], input[type="number"]'
    );
    this.withdrawButton = this.getByRole("button", { name: /^withdraw$/i });
    this.maxWithdrawButton = this.withdrawCard.locator("button").filter({ hasText: /max/i });
    this.depositedBalance = this.page.locator('[data-testid="deposited-balance"]');

    // Position card
    this.totalDeposited = this.page.locator('[data-testid="total-deposited"]');
    this.totalYield = this.page.locator('[data-testid="total-yield"]');
    this.healthScore = this.page.locator('[data-testid="health-score"]');

    // Statistics
    this.totalValueLocked = this.page.locator('[data-testid="pool-tvl"]');
    this.averageAPY = this.page.locator('[data-testid="pool-apy"]');
    this.totalUsers = this.page.locator('[data-testid="pool-users"]');

    // Actions
    this.getMusdButton = this.getByRole("button", { name: /get musd/i });
    this.autoCompoundToggle = this.page.locator('[data-testid="auto-compound-toggle"]');
  }

  /**
   * Navigate to Individual Savings page
   */
  async navigate(): Promise<void> {
    await this.goto("/dashboard/individual-savings");
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await this.waitForVisible(this.pageTitle);
    await this.waitForLoadingToFinish();
  }

  /**
   * Fill deposit amount
   */
  async fillDepositAmount(amount: string): Promise<void> {
    await this.depositAmountInput.fill(amount);
  }

  /**
   * Click max deposit button
   */
  async clickMaxDeposit(): Promise<void> {
    await this.maxDepositButton.click();
  }

  /**
   * Submit deposit form
   */
  async submitDeposit(): Promise<void> {
    await this.depositButton.click();
  }

  /**
   * Perform deposit with amount
   */
  async deposit(amount: string): Promise<void> {
    await this.fillDepositAmount(amount);
    await this.submitDeposit();
    await this.waitForToast(/deposit successful|transaction submitted/i);
  }

  /**
   * Fill withdraw amount
   */
  async fillWithdrawAmount(amount: string): Promise<void> {
    await this.withdrawAmountInput.fill(amount);
  }

  /**
   * Click max withdraw button
   */
  async clickMaxWithdraw(): Promise<void> {
    await this.maxWithdrawButton.click();
  }

  /**
   * Submit withdraw form
   */
  async submitWithdraw(): Promise<void> {
    await this.withdrawButton.click();
  }

  /**
   * Perform withdrawal with amount
   */
  async withdraw(amount: string): Promise<void> {
    await this.fillWithdrawAmount(amount);
    await this.submitWithdraw();
    await this.waitForToast(/withdraw successful|transaction submitted/i);
  }

  /**
   * Get MUSD balance
   */
  async getMusdBalance(): Promise<string | null> {
    if (await this.musdBalance.isVisible()) {
      return await this.getText(this.musdBalance);
    }
    return null;
  }

  /**
   * Get deposited balance
   */
  async getDepositedBalance(): Promise<string | null> {
    if (await this.depositedBalance.isVisible()) {
      return await this.getText(this.depositedBalance);
    }
    return null;
  }

  /**
   * Get total deposited from position card
   */
  async getTotalDeposited(): Promise<string | null> {
    if (await this.totalDeposited.isVisible()) {
      return await this.getText(this.totalDeposited);
    }
    return null;
  }

  /**
   * Get total yield from position card
   */
  async getTotalYield(): Promise<string | null> {
    if (await this.totalYield.isVisible()) {
      return await this.getText(this.totalYield);
    }
    return null;
  }

  /**
   * Get health score
   */
  async getHealthScore(): Promise<string | null> {
    if (await this.healthScore.isVisible()) {
      return await this.getText(this.healthScore);
    }
    return null;
  }

  /**
   * Check if deposit button is enabled
   */
  async isDepositButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.depositButton);
  }

  /**
   * Check if withdraw button is enabled
   */
  async isWithdrawButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.withdrawButton);
  }

  /**
   * Get deposit form validation error
   */
  async getDepositError(): Promise<string | null> {
    const errorMessage = this.depositCard.locator(
      '[role="alert"], .error-message, .text-destructive'
    );
    if (await errorMessage.isVisible()) {
      return await this.getText(errorMessage);
    }
    return null;
  }

  /**
   * Get withdraw form validation error
   */
  async getWithdrawError(): Promise<string | null> {
    const errorMessage = this.withdrawCard.locator(
      '[role="alert"], .error-message, .text-destructive'
    );
    if (await errorMessage.isVisible()) {
      return await this.getText(errorMessage);
    }
    return null;
  }

  /**
   * Click Get MUSD button
   */
  async clickGetMusd(): Promise<void> {
    await this.getMusdButton.click();
  }

  /**
   * Toggle auto-compound
   */
  async toggleAutoCompound(): Promise<void> {
    await this.autoCompoundToggle.click();
  }

  /**
   * Check if auto-compound is enabled
   */
  async isAutoCompoundEnabled(): Promise<boolean> {
    const checked = await this.getAttribute(this.autoCompoundToggle, "aria-checked");
    return checked === "true";
  }

  /**
   * Get pool statistics
   */
  async getPoolStatistics(): Promise<{
    tvl?: string;
    apy?: string;
    users?: string;
  }> {
    const stats: any = {};

    if (await this.totalValueLocked.isVisible()) {
      stats.tvl = await this.getText(this.totalValueLocked);
    }

    if (await this.averageAPY.isVisible()) {
      stats.apy = await this.getText(this.averageAPY);
    }

    if (await this.totalUsers.isVisible()) {
      stats.users = await this.getText(this.totalUsers);
    }

    return stats;
  }

  /**
   * Verify deposit card is visible
   */
  async isDepositCardVisible(): Promise<boolean> {
    return await this.depositCard.isVisible();
  }

  /**
   * Verify withdraw card is visible
   */
  async isWithdrawCardVisible(): Promise<boolean> {
    return await this.withdrawCard.isVisible();
  }

  /**
   * Verify position card is visible
   */
  async isPositionCardVisible(): Promise<boolean> {
    return await this.positionCard.isVisible();
  }

  /**
   * Verify statistics section is visible
   */
  async isStatisticsSectionVisible(): Promise<boolean> {
    return await this.statisticsSection.isVisible();
  }

  /**
   * Wait for deposit transaction to complete
   */
  async waitForDepositComplete(): Promise<void> {
    await this.waitForToast(/deposit successful|confirmed/i, 30000);
    await this.waitForLoadingToFinish();
  }

  /**
   * Wait for withdrawal transaction to complete
   */
  async waitForWithdrawComplete(): Promise<void> {
    await this.waitForToast(/withdraw successful|confirmed/i, 30000);
    await this.waitForLoadingToFinish();
  }
}
