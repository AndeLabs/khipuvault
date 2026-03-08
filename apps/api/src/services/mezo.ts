import { prisma, TroveStatus } from "@khipu/database";

import { AppError } from "../middleware/error-handler";
import { logger } from "../lib/logger";

/**
 * Mezo Protocol Service
 * Handles queries for:
 * - Troves (borrowing positions)
 * - Stability Pool deposits
 * - Liquidation events
 * - Price snapshots
 * - System-wide statistics
 */
export class MezoService {
  // ============================================================================
  // SYSTEM STATISTICS
  // ============================================================================

  /**
   * Get current system-wide Mezo protocol statistics
   */
  async getSystemStats() {
    // Get the most recent stats snapshot
    const stats = await prisma.mezoSystemStats.findFirst({
      orderBy: { timestamp: "desc" },
    });

    if (!stats) {
      logger.warn("No Mezo system stats found in database");
      return {
        totalTroves: 0,
        activeTroves: 0,
        totalCollateral: "0",
        totalDebt: "0",
        totalCollateralRatio: null,
        totalSpDeposits: "0",
        spDepositorCount: 0,
        btcPrice: "0",
        btcPriceUsd: null,
        mcr: "110",
        ccr: "150",
        isRecoveryMode: false,
        lastUpdate: new Date(),
      };
    }

    return {
      totalTroves: stats.totalTroves,
      activeTroves: stats.activeTroves,
      totalCollateral: stats.totalCollateral,
      totalDebt: stats.totalDebt,
      totalCollateralRatio: stats.totalCollateralRatio,
      totalSpDeposits: stats.totalSpDeposits,
      spDepositorCount: stats.spDepositorCount,
      btcPrice: stats.btcPrice,
      btcPriceUsd: stats.btcPriceUsd,
      mcr: stats.mcr,
      ccr: stats.ccr,
      isRecoveryMode: stats.isRecoveryMode,
      lastUpdate: stats.timestamp,
    };
  }

  // ============================================================================
  // TROVE QUERIES
  // ============================================================================

  /**
   * Get all troves with pagination and filtering
   */
  async getAllTroves(options: {
    limit: number;
    offset: number;
    status?: string;
    minCollateralRatio?: number;
    maxCollateralRatio?: number;
  }) {
    const { limit, offset, status, minCollateralRatio, maxCollateralRatio } = options;

    // Build where clause
    const where: {
      status?: TroveStatus;
      collateralRatio?: {
        gte?: number;
        lte?: number;
      };
    } = {};

    if (status) {
      where.status = status as TroveStatus;
    }

    if (minCollateralRatio !== undefined || maxCollateralRatio !== undefined) {
      where.collateralRatio = {};
      if (minCollateralRatio !== undefined) {
        where.collateralRatio.gte = minCollateralRatio;
      }
      if (maxCollateralRatio !== undefined) {
        where.collateralRatio.lte = maxCollateralRatio;
      }
    }

    const [troves, total] = await Promise.all([
      prisma.mezoTrove.findMany({
        where,
        orderBy: [
          { status: "asc" }, // ACTIVE first
          { collateralRatio: "asc" }, // Riskiest first
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          ownerAddress: true,
          status: true,
          collateral: true,
          debt: true,
          stake: true,
          collateralRatio: true,
          pendingBtcReward: true,
          pendingMusdReward: true,
          lastUpdateAt: true,
        },
      }),
      prisma.mezoTrove.count({ where }),
    ]);

    return {
      troves,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get trove by owner address
   */
  async getTroveByAddress(ownerAddress: string, includeHistory = false) {
    const normalizedAddress = ownerAddress.toLowerCase();

    const trove = await prisma.mezoTrove.findUnique({
      where: { ownerAddress: normalizedAddress },
      include: {
        snapshots: includeHistory
          ? {
              orderBy: { timestamp: "desc" },
              take: 100, // Last 100 snapshots
            }
          : false,
        transactions: includeHistory
          ? {
              orderBy: { timestamp: "desc" },
              take: 50, // Last 50 transactions
            }
          : false,
      },
    });

    if (!trove) {
      throw new AppError(404, "Trove not found for this address");
    }

    return trove;
  }

  // ============================================================================
  // STABILITY POOL QUERIES
  // ============================================================================

  /**
   * Get stability pool statistics
   */
  async getStabilityPoolStats() {
    const [depositCount, stats] = await Promise.all([
      // Count active deposits
      prisma.mezoStabilityDeposit.count({
        where: {
          compoundedDeposit: {
            not: "0",
          },
        },
      }),
      // Get latest system stats for context
      prisma.mezoSystemStats.findFirst({
        orderBy: { timestamp: "desc" },
        select: {
          totalSpDeposits: true,
          spDepositorCount: true,
        },
      }),
    ]);

    // Get total amounts from all deposits (simple query)
    const deposits = await prisma.mezoStabilityDeposit.findMany({
      where: {
        compoundedDeposit: {
          not: "0",
        },
      },
      select: {
        compoundedDeposit: true,
        totalDeposited: true,
        totalWithdrawn: true,
        totalBtcClaimed: true,
        totalMusdClaimed: true,
      },
    });

    // Calculate totals
    let totalCompoundedDeposit = BigInt(0);
    let totalDeposited = BigInt(0);
    let totalWithdrawn = BigInt(0);
    let totalBtcClaimed = BigInt(0);
    let totalMusdClaimed = BigInt(0);

    for (const deposit of deposits) {
      totalCompoundedDeposit += BigInt(deposit.compoundedDeposit);
      totalDeposited += BigInt(deposit.totalDeposited);
      totalWithdrawn += BigInt(deposit.totalWithdrawn);
      totalBtcClaimed += BigInt(deposit.totalBtcClaimed);
      totalMusdClaimed += BigInt(deposit.totalMusdClaimed);
    }

    return {
      totalDeposits: totalCompoundedDeposit.toString(),
      totalDeposited: totalDeposited.toString(),
      totalWithdrawn: totalWithdrawn.toString(),
      totalBtcClaimed: totalBtcClaimed.toString(),
      totalMusdClaimed: totalMusdClaimed.toString(),
      activeDepositors: depositCount,
      systemTotalDeposits: stats?.totalSpDeposits || "0",
      systemDepositorCount: stats?.spDepositorCount || 0,
    };
  }

  /**
   * Get user's stability pool deposit
   */
  async getStabilityDepositByAddress(userAddress: string, includeHistory = false) {
    const normalizedAddress = userAddress.toLowerCase();

    const deposit = await prisma.mezoStabilityDeposit.findUnique({
      where: { userAddress: normalizedAddress },
      include: {
        transactions: includeHistory
          ? {
              orderBy: { timestamp: "desc" },
              take: 50, // Last 50 transactions
            }
          : false,
      },
    });

    if (!deposit) {
      throw new AppError(404, "Stability pool deposit not found for this address");
    }

    return deposit;
  }

  // ============================================================================
  // LIQUIDATION QUERIES
  // ============================================================================

  /**
   * Get recent liquidations with optional filtering
   */
  async getLiquidations(limit: number, offset: number, liquidatedAddress?: string) {
    const where = liquidatedAddress ? { liquidatedAddress: liquidatedAddress.toLowerCase() } : {};

    const [liquidations, total] = await Promise.all([
      prisma.mezoLiquidation.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.mezoLiquidation.count({ where }),
    ]);

    return {
      liquidations,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  // ============================================================================
  // PRICE QUERIES
  // ============================================================================

  /**
   * Get BTC price history for the specified time period
   */
  async getPriceHistory(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prices = await prisma.mezoPriceSnapshot.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: "asc" },
      select: {
        price: true,
        priceUsd: true,
        source: true,
        blockNumber: true,
        timestamp: true,
      },
    });

    return {
      prices,
      count: prices.length,
      startDate,
      endDate: new Date(),
    };
  }

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  /**
   * Get trove statistics for risk analysis
   */
  async getTroveRiskAnalysis() {
    const troves = await prisma.mezoTrove.findMany({
      where: {
        status: "ACTIVE",
        collateralRatio: {
          not: null,
        },
      },
      select: {
        collateralRatio: true,
        collateral: true,
        debt: true,
      },
    });

    // Calculate risk buckets
    const riskBuckets = {
      critical: 0, // < 110%
      high: 0, // 110-125%
      medium: 0, // 125-150%
      low: 0, // > 150%
    };

    let totalCollateral = BigInt(0);
    let totalDebt = BigInt(0);

    for (const trove of troves) {
      totalCollateral += BigInt(trove.collateral);
      totalDebt += BigInt(trove.debt);

      if (!trove.collateralRatio) continue;

      const cr = Number(trove.collateralRatio);
      if (cr < 110) {
        riskBuckets.critical++;
      } else if (cr < 125) {
        riskBuckets.high++;
      } else if (cr < 150) {
        riskBuckets.medium++;
      } else {
        riskBuckets.low++;
      }
    }

    return {
      totalTroves: troves.length,
      riskBuckets,
      totalCollateral: totalCollateral.toString(),
      totalDebt: totalDebt.toString(),
    };
  }

  /**
   * Get stability pool deposit history
   */
  async getStabilityPoolHistory(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const deposits = await prisma.mezoStabilityDeposit.findMany({
      where: {
        lastUpdateAt: {
          gte: startDate,
        },
      },
      orderBy: { lastUpdateAt: "desc" },
      select: {
        userAddress: true,
        compoundedDeposit: true,
        totalDeposited: true,
        totalWithdrawn: true,
        lastUpdateAt: true,
      },
    });

    return deposits;
  }
}
