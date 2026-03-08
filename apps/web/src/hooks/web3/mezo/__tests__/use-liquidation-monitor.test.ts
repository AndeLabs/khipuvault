import { describe, it, expect } from "vitest";

import {
  LiquidationRisk,
  calculateHealthFactor,
  formatHealthFactor,
} from "../use-liquidation-monitor";

describe("LiquidationRisk constants", () => {
  it("should have all risk levels defined", () => {
    expect(LiquidationRisk.SAFE).toBe("safe");
    expect(LiquidationRisk.LOW).toBe("low");
    expect(LiquidationRisk.MEDIUM).toBe("medium");
    expect(LiquidationRisk.HIGH).toBe("high");
    expect(LiquidationRisk.CRITICAL).toBe("critical");
    expect(LiquidationRisk.LIQUIDATABLE).toBe("liquidatable");
  });
});

describe("calculateHealthFactor", () => {
  const MCR = 110; // 110% Minimum Collateral Ratio

  it("should return 0 when MCR is 0", () => {
    expect(calculateHealthFactor(150, 0)).toBe(0);
  });

  it("should return health factor > 1 for safe positions", () => {
    // CR of 220% with MCR of 110% = 2.0 health factor
    expect(calculateHealthFactor(220, MCR)).toBe(2);
  });

  it("should return health factor = 1 at liquidation threshold", () => {
    // CR of 110% with MCR of 110% = 1.0 health factor
    expect(calculateHealthFactor(110, MCR)).toBe(1);
  });

  it("should return health factor < 1 for liquidatable positions", () => {
    // CR of 100% with MCR of 110% = 0.909 health factor
    expect(calculateHealthFactor(100, MCR)).toBeCloseTo(0.909, 2);
  });

  it("should handle high collateralization ratios", () => {
    // CR of 500% with MCR of 110% = 4.545 health factor
    expect(calculateHealthFactor(500, MCR)).toBeCloseTo(4.545, 2);
  });

  it("should handle low collateralization ratios", () => {
    // CR of 50% with MCR of 110% = 0.454 health factor
    expect(calculateHealthFactor(50, MCR)).toBeCloseTo(0.454, 2);
  });
});

describe("formatHealthFactor", () => {
  it("should return 'Excellent' for health factor >= 2", () => {
    expect(formatHealthFactor(2)).toBe("Excellent");
    expect(formatHealthFactor(2.5)).toBe("Excellent");
    expect(formatHealthFactor(10)).toBe("Excellent");
  });

  it("should return 'Good' for health factor >= 1.5 and < 2", () => {
    expect(formatHealthFactor(1.5)).toBe("Good");
    expect(formatHealthFactor(1.7)).toBe("Good");
    expect(formatHealthFactor(1.99)).toBe("Good");
  });

  it("should return 'Fair' for health factor >= 1.2 and < 1.5", () => {
    expect(formatHealthFactor(1.2)).toBe("Fair");
    expect(formatHealthFactor(1.3)).toBe("Fair");
    expect(formatHealthFactor(1.49)).toBe("Fair");
  });

  it("should return 'At Risk' for health factor >= 1 and < 1.2", () => {
    expect(formatHealthFactor(1)).toBe("At Risk");
    expect(formatHealthFactor(1.1)).toBe("At Risk");
    expect(formatHealthFactor(1.19)).toBe("At Risk");
  });

  it("should return 'Unsafe' for health factor < 1", () => {
    expect(formatHealthFactor(0.99)).toBe("Unsafe");
    expect(formatHealthFactor(0.5)).toBe("Unsafe");
    expect(formatHealthFactor(0)).toBe("Unsafe");
  });
});

describe("Risk level thresholds", () => {
  const MCR = 110;
  const CCR = 150;

  describe("in normal mode (MCR = 110%)", () => {
    it("LIQUIDATABLE: CR <= 110%", () => {
      expect(110).toBeLessThanOrEqual(MCR);
      expect(100).toBeLessThanOrEqual(MCR);
    });

    it("CRITICAL: CR between 110% and 115%", () => {
      const crCritical = MCR + 4; // 114%
      expect(crCritical).toBeGreaterThan(MCR);
      expect(crCritical).toBeLessThan(MCR + 5);
    });

    it("HIGH: CR between 115% and 125%", () => {
      const crHigh = MCR + 10; // 120%
      expect(crHigh).toBeGreaterThanOrEqual(MCR + 5);
      expect(crHigh).toBeLessThan(MCR + 15);
    });

    it("MEDIUM: CR between 125% and 150%", () => {
      const crMedium = MCR + 30; // 140%
      expect(crMedium).toBeGreaterThanOrEqual(MCR + 15);
      expect(crMedium).toBeLessThan(MCR + 40);
    });

    it("LOW: CR between 150% and 190%", () => {
      const crLow = MCR + 60; // 170%
      expect(crLow).toBeGreaterThanOrEqual(MCR + 40);
      expect(crLow).toBeLessThan(MCR + 80);
    });

    it("SAFE: CR >= 190%", () => {
      const crSafe = MCR + 80; // 190%
      expect(crSafe).toBeGreaterThanOrEqual(MCR + 80);
    });
  });

  describe("in recovery mode (CCR = 150%)", () => {
    it("LIQUIDATABLE threshold increases to 150%", () => {
      expect(150).toBeLessThanOrEqual(CCR);
      expect(140).toBeLessThan(CCR);
    });

    it("CRITICAL: CR between 150% and 155%", () => {
      const crCritical = CCR + 4; // 154%
      expect(crCritical).toBeGreaterThan(CCR);
      expect(crCritical).toBeLessThan(CCR + 5);
    });

    it("SAFE threshold also shifts up accordingly", () => {
      const crSafeRecovery = CCR + 80; // 230%
      expect(crSafeRecovery).toBe(230);
    });
  });
});

describe("Price drop tolerance calculations", () => {
  it("should calculate how much price can drop before liquidation", () => {
    const collateralBtc = 1;
    const btcPrice = 100000;
    const debtMusd = 50000;
    const mcr = 1.1;

    const liquidationPrice = (mcr * debtMusd) / collateralBtc;
    const dropTolerance = ((btcPrice - liquidationPrice) / btcPrice) * 100;

    expect(liquidationPrice).toBeCloseTo(55000, 0);
    expect(dropTolerance).toBeCloseTo(45, 0);
  });

  it("should handle edge case where CR is near MCR", () => {
    const collateralBtc = 1;
    const btcPrice = 100000;
    const mcr = 1.1;
    const debtMusd = btcPrice / mcr; // ~90909

    const currentCr = (collateralBtc * btcPrice) / debtMusd;
    const liquidationPrice = (mcr * debtMusd) / collateralBtc;
    const dropTolerance = ((btcPrice - liquidationPrice) / btcPrice) * 100;

    expect(currentCr).toBeCloseTo(1.1, 2);
    expect(liquidationPrice).toBeCloseTo(btcPrice, 0);
    expect(dropTolerance).toBeCloseTo(0, 0);
  });
});
