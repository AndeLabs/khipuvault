import { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Dashboard page object
 */
export class DashboardPage extends BasePage {
  // Navigation selectors
  readonly sidebar: Locator;
  readonly individualSavingsLink: Locator;
  readonly cooperativeSavingsLink: Locator;
  readonly rotatingPoolLink: Locator;
  readonly prizePoolLink: Locator;
  readonly portfolioLink: Locator;
  readonly mezoIntegrationLink: Locator;

  // Header selectors
  readonly connectWalletButton: Locator;
  readonly walletAddress: Locator;
  readonly networkIndicator: Locator;

  // Content selectors
  readonly dashboardHeader: Locator;
  readonly platformStats: Locator;
  readonly userBalance: Locator;

  constructor(page: any) {
    super(page);

    // Navigation
    this.sidebar = this.page.locator('[role="navigation"]').first();
    this.individualSavingsLink = this.getByRole("link", { name: /individual savings/i });
    this.cooperativeSavingsLink = this.getByRole("link", { name: /cooperative savings/i });
    this.rotatingPoolLink = this.getByRole("link", { name: /rotating pool|rosca/i });
    this.prizePoolLink = this.getByRole("link", { name: /prize pool|lottery/i });
    this.portfolioLink = this.getByRole("link", { name: /portfolio/i });
    this.mezoIntegrationLink = this.getByRole("link", { name: /mezo/i });

    // Header
    this.connectWalletButton = this.getByRole("button", { name: /connect wallet/i });
    this.walletAddress = this.page.locator('[data-testid="wallet-address"]');
    this.networkIndicator = this.page.locator('[data-testid="network-indicator"]');

    // Content
    this.dashboardHeader = this.getByRole("heading", { name: /dashboard/i });
    this.platformStats = this.page.locator('[data-testid="platform-stats"]');
    this.userBalance = this.page.locator('[data-testid="user-balance"]');
  }

  /**
   * Navigate to dashboard page
   */
  async navigate(): Promise<void> {
    await this.goto("/dashboard");
  }

  /**
   * Connect wallet using mock provider
   */
  async connectWallet(): Promise<void> {
    await this.connectWalletButton.click();
    await this.waitForToast(/connected/i);
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(): Promise<boolean> {
    return await this.walletAddress.isVisible();
  }

  /**
   * Navigate to Individual Savings page
   */
  async goToIndividualSavings(): Promise<void> {
    await this.clickAndWait(this.individualSavingsLink, true);
  }

  /**
   * Navigate to Cooperative Savings page
   */
  async goToCooperativeSavings(): Promise<void> {
    await this.clickAndWait(this.cooperativeSavingsLink, true);
  }

  /**
   * Navigate to Rotating Pool page
   */
  async goToRotatingPool(): Promise<void> {
    await this.clickAndWait(this.rotatingPoolLink, true);
  }

  /**
   * Navigate to Prize Pool page
   */
  async goToPrizePool(): Promise<void> {
    await this.clickAndWait(this.prizePoolLink, true);
  }

  /**
   * Navigate to Portfolio page
   */
  async goToPortfolio(): Promise<void> {
    await this.clickAndWait(this.portfolioLink, true);
  }

  /**
   * Navigate to Mezo Integration page
   */
  async goToMezoIntegration(): Promise<void> {
    await this.clickAndWait(this.mezoIntegrationLink, true);
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<{
    totalValueLocked?: string;
    totalUsers?: string;
    totalYield?: string;
  }> {
    const stats: any = {};

    const tvl = this.page.locator('[data-testid="stat-tvl"]');
    if (await tvl.isVisible()) {
      stats.totalValueLocked = await this.getText(tvl);
    }

    const users = this.page.locator('[data-testid="stat-users"]');
    if (await users.isVisible()) {
      stats.totalUsers = await this.getText(users);
    }

    const yield_ = this.page.locator('[data-testid="stat-yield"]');
    if (await yield_.isVisible()) {
      stats.totalYield = await this.getText(yield_);
    }

    return stats;
  }

  /**
   * Get user balance
   */
  async getUserBalance(): Promise<string | null> {
    if (await this.userBalance.isVisible()) {
      return await this.getText(this.userBalance);
    }
    return null;
  }

  /**
   * Check if sidebar is visible
   */
  async isSidebarVisible(): Promise<boolean> {
    return await this.sidebar.isVisible();
  }

  /**
   * Toggle mobile menu (if on mobile viewport)
   */
  async toggleMobileMenu(): Promise<void> {
    const menuButton = this.getByRole("button", { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  }

  /**
   * Verify dashboard is loaded correctly
   */
  async verifyDashboardLoaded(): Promise<void> {
    await this.waitForVisible(this.dashboardHeader);
    await this.waitForLoadingToFinish();
  }

  /**
   * Get current network name
   */
  async getCurrentNetwork(): Promise<string | null> {
    if (await this.networkIndicator.isVisible()) {
      return await this.getText(this.networkIndicator);
    }
    return null;
  }

  /**
   * Switch network (mock interaction)
   */
  async switchNetwork(networkName: string): Promise<void> {
    // Click network indicator
    await this.networkIndicator.click();

    // Select network from dropdown
    const networkOption = this.getByRole("menuitem", { name: new RegExp(networkName, "i") });
    await networkOption.click();

    // Wait for network switch
    await this.waitForToast(/network switched/i, 5000).catch(() => {
      // Ignore if toast doesn't appear
    });
  }

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    const userMenuButton = this.page.locator('[data-testid="user-menu-button"]');
    await userMenuButton.click();
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    await this.openUserMenu();
    const disconnectButton = this.getByRole("menuitem", { name: /disconnect/i });
    await disconnectButton.click();
  }

  /**
   * Check for active navigation item
   */
  async getActiveNavItem(): Promise<string | null> {
    const activeLink = this.sidebar.locator('[aria-current="page"]');
    if (await activeLink.isVisible()) {
      return await this.getText(activeLink);
    }
    return null;
  }
}
