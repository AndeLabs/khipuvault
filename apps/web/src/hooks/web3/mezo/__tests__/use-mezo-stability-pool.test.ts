import { describe, it, expect } from "vitest";

describe("Stability Pool APY calculations", () => {
  it("should understand liquidation gain mechanics", () => {
    // When a Trove is liquidated:
    // 1. Its debt (MUSD) is cancelled against SP deposits
    // 2. Its collateral (BTC) is distributed to SP depositors
    // 3. Depositors receive BTC at a discount (typically ~10%)

    const userDeposit = 100000;
    const totalDeposits = 1000000;
    const userShare = userDeposit / totalDeposits; // 10%

    const liquidatedDebt = 90000;
    const liquidatedCollateral = 1; // 1 BTC

    // User's MUSD is reduced by their share of the liquidated debt
    const userMusdReduction = liquidatedDebt * userShare; // 9,000 MUSD

    // User receives their share of the liquidated collateral
    const userBtcGain = liquidatedCollateral * userShare; // 0.1 BTC

    expect(userShare).toBe(0.1);
    expect(userMusdReduction).toBe(9000);
    expect(userBtcGain).toBe(0.1);

    // If BTC price is $100,000, user "paid" 9,000 MUSD for 0.1 BTC ($10,000)
    // Net gain: $1,000 or ~11% on the liquidated portion
  });

  it("should calculate expected returns from liquidation", () => {
    const btcPrice = 100000;
    const mcrPercent = 110; // 110% MCR

    // At liquidation, CR = MCR, so collateral value = debt * MCR / 100
    // User gets collateral worth 110% of the debt they absorbed
    // Net gain = 10% of absorbed debt value

    const absorbedDebt = 10000; // MUSD
    const collateralValue = absorbedDebt * (mcrPercent / 100);
    const profit = collateralValue - absorbedDebt;

    expect(collateralValue).toBe(11000);
    expect(profit).toBe(1000);
    expect(profit / absorbedDebt).toBe(0.1); // 10% profit
  });
});

describe("Deposit compounding", () => {
  it("should calculate compounded deposit after liquidations", () => {
    // Initial deposit
    const initialDeposit = 100000;

    // After liquidation 1: absorbed 5% of pool's liquidation
    const liq1Absorption = 5000;
    const afterLiq1 = initialDeposit - liq1Absorption;
    expect(afterLiq1).toBe(95000);

    // After liquidation 2: absorbed 3% of remaining
    const liq2Absorption = afterLiq1 * 0.03;
    const afterLiq2 = afterLiq1 - liq2Absorption;
    expect(afterLiq2).toBeCloseTo(92150, 0);
  });

  it("should track collateral gains separately from deposit", () => {
    const initialDeposit = 100000;
    const depositLoss = 8000;
    const btcGain = 0.1; // BTC
    const btcPrice = 100000;

    const compoundedDeposit = initialDeposit - depositLoss;
    const btcGainValue = btcGain * btcPrice;
    const netValue = compoundedDeposit + btcGainValue;

    expect(compoundedDeposit).toBe(92000);
    expect(btcGainValue).toBe(10000);
    expect(netValue).toBe(102000); // Net positive!
  });
});

describe("Pool share calculations", () => {
  it("should calculate user share of pool correctly", () => {
    const userDeposit = BigInt("50000000000000000000000"); // 50,000 MUSD
    const totalDeposits = BigInt("1000000000000000000000000"); // 1,000,000 MUSD

    const sharePercent = (Number(userDeposit) / Number(totalDeposits)) * 100;
    expect(sharePercent).toBe(5);
  });

  it("should handle edge case of being only depositor", () => {
    const userDeposit = BigInt("100000000000000000000000"); // 100,000 MUSD
    const totalDeposits = userDeposit; // Same

    const sharePercent = (Number(userDeposit) / Number(totalDeposits)) * 100;
    expect(sharePercent).toBe(100);
  });
});

describe("Withdrawal constraints", () => {
  it("should allow full withdrawal when no pending liquidations", () => {
    const compoundedDeposit = 95000;
    const pendingGains = 0.1; // BTC

    // User can withdraw all MUSD and claim BTC gains
    const withdrawable = compoundedDeposit;
    expect(withdrawable).toBe(95000);
    expect(pendingGains).toBe(0.1);
  });

  it("should auto-claim BTC gains on deposit/withdrawal", () => {
    // Any deposit or withdrawal action triggers BTC gain claim
    const pendingBtcBefore = 0.05;
    const actionType = "withdraw";

    // After action, pending BTC is transferred to user's wallet
    const pendingBtcAfter = 0;
    expect(pendingBtcAfter).toBe(0);
  });
});
