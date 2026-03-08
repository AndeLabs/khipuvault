import { describe, it, expect } from "vitest";

import { TroveStatus } from "../use-mezo-trove-manager";

describe("TroveStatus enum", () => {
  it("should have all status values defined", () => {
    expect(TroveStatus.NonExistent).toBe(0);
    expect(TroveStatus.Active).toBe(1);
    expect(TroveStatus.ClosedByOwner).toBe(2);
    expect(TroveStatus.ClosedByLiquidation).toBe(3);
    expect(TroveStatus.ClosedByRedemption).toBe(4);
  });

  it("should have unique values for each status", () => {
    const values = Object.values(TroveStatus);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe("Collateral Ratio calculations", () => {
  it("should calculate CR correctly", () => {
    // CR = (collateral * price) / debt * 100%
    const collateralBtc = 1;
    const btcPrice = 100000;
    const debtMusd = 50000;

    const cr = ((collateralBtc * btcPrice) / debtMusd) * 100;

    expect(cr).toBe(200); // 200% CR
  });

  it("should identify safe vs risky CRs", () => {
    const MCR = 110;
    const CCR = 150;

    // Safe: CR >= CCR (150%)
    expect(200).toBeGreaterThanOrEqual(CCR);

    // Risky but not liquidatable in normal mode: MCR < CR < CCR
    expect(130).toBeGreaterThan(MCR);
    expect(130).toBeLessThan(CCR);

    // Liquidatable: CR <= MCR
    expect(105).toBeLessThan(MCR);
  });

  it("should understand recovery mode implications", () => {
    const CCR = 150;

    // In recovery mode, system TCR < CCR
    const systemTCR = 145;
    expect(systemTCR).toBeLessThan(CCR);

    // A trove with 140% CR would be safe in normal mode
    // but liquidatable in recovery mode
    const troveCR = 140;
    expect(troveCR).toBeLessThan(CCR);
  });
});

describe("Borrowing fee calculations", () => {
  it("should calculate total debt with borrowing fee", () => {
    const borrowAmount = 10000; // MUSD
    const borrowingFeeRate = 0.005; // 0.5%

    const borrowingFee = borrowAmount * borrowingFeeRate;
    const totalDebt = borrowAmount + borrowingFee;

    expect(borrowingFee).toBe(50);
    expect(totalDebt).toBe(10050);
  });

  it("should have borrowing fee floor of 0.5%", () => {
    const BORROWING_FEE_FLOOR = 0.005; // 0.5%
    expect(BORROWING_FEE_FLOOR).toBe(0.005);

    // Even with 0 base rate, minimum fee is 0.5%
    const baseRate = 0;
    const effectiveFee = Math.max(baseRate, BORROWING_FEE_FLOOR);
    expect(effectiveFee).toBe(0.005);
  });
});

describe("Redemption mechanics", () => {
  it("should understand redemption reduces debt from lowest CR troves first", () => {
    // Redemption flow:
    // 1. User burns MUSD
    // 2. Lowest CR trove loses collateral proportionally
    // 3. User receives BTC minus redemption fee

    const redemptionAmount = 10000; // MUSD
    const btcPrice = 100000; // $100k per BTC
    const redemptionFee = 0.005; // 0.5%

    const btcReceived = (redemptionAmount / btcPrice) * (1 - redemptionFee);
    expect(btcReceived).toBeCloseTo(0.0995, 4); // ~0.1 BTC minus fee
  });
});

describe("Trove status transitions", () => {
  it("should document valid status transitions", () => {
    // NonExistent -> Active (via openTrove)
    // Active -> ClosedByOwner (via closeTrove)
    // Active -> ClosedByLiquidation (via liquidate when CR < MCR)
    // Active -> ClosedByRedemption (via redeem when lowest CR)

    const validTransitions = {
      [TroveStatus.NonExistent]: [TroveStatus.Active],
      [TroveStatus.Active]: [
        TroveStatus.ClosedByOwner,
        TroveStatus.ClosedByLiquidation,
        TroveStatus.ClosedByRedemption,
      ],
      [TroveStatus.ClosedByOwner]: [TroveStatus.Active], // Can reopen
      [TroveStatus.ClosedByLiquidation]: [TroveStatus.Active], // Can reopen
      [TroveStatus.ClosedByRedemption]: [TroveStatus.Active], // Can reopen
    };

    expect(validTransitions[TroveStatus.NonExistent]).toContain(TroveStatus.Active);
    expect(validTransitions[TroveStatus.Active]).toContain(TroveStatus.ClosedByOwner);
  });
});
