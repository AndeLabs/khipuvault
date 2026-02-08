import { PrismaClient } from "@khipu/database";

const prisma = new PrismaClient();

async function gatherMetrics() {
  console.log("📊 Gathering KhipuVault Testnet Metrics...\n");

  try {
    // 1. Unique Users
    const uniqueUsers = await prisma.user.count();
    console.log(`👥 Unique Users: ${uniqueUsers}`);

    // 2. Total Pools
    const totalPools = await prisma.pool.count();
    const poolsByType = await prisma.pool.groupBy({
      by: ["poolType"],
      _count: true,
    });
    console.log(`\n🏊 Total Pools: ${totalPools}`);
    poolsByType.forEach((pool) => {
      console.log(`   - ${pool.poolType}: ${pool._count}`);
    });

    // 3. Active Pools (not paused/closed)
    const activePools = await prisma.pool.count({
      where: {
        status: "ACTIVE",
        isPaused: false,
      },
    });
    console.log(`   - Active Pools: ${activePools}`);

    // 4. Total Deposits
    const totalDeposits = await prisma.deposit.count({
      where: {
        type: "DEPOSIT",
        status: "CONFIRMED",
      },
    });
    console.log(`\n💰 Total Confirmed Deposits: ${totalDeposits}`);

    // 5. Total Withdrawals
    const totalWithdrawals = await prisma.deposit.count({
      where: {
        type: "WITHDRAW",
        status: "CONFIRMED",
      },
    });
    console.log(`💸 Total Confirmed Withdrawals: ${totalWithdrawals}`);

    // 6. Total Transactions
    const totalTransactions = await prisma.deposit.count({
      where: {
        status: "CONFIRMED",
      },
    });
    console.log(`📝 Total Confirmed Transactions: ${totalTransactions}`);

    // 7. TVL by Pool Type
    console.log(`\n📈 TVL by Pool Type:`);
    const poolsWithTVL = await prisma.pool.findMany({
      select: {
        poolType: true,
        tvl: true,
        name: true,
        totalUsers: true,
      },
    });

    let totalTVL = BigInt(0);
    const tvlByType: Record<string, bigint> = {};

    poolsWithTVL.forEach((pool) => {
      const tvl = BigInt(pool.tvl);
      totalTVL += tvl;
      tvlByType[pool.poolType] = (tvlByType[pool.poolType] || BigInt(0)) + tvl;

      if (tvl > 0) {
        console.log(`   - ${pool.name} (${pool.poolType}): ${formatMUSD(tvl)} MUSD`);
      }
    });

    console.log(`\n💎 Total TVL: ${formatMUSD(totalTVL)} MUSD`);
    Object.entries(tvlByType).forEach(([type, tvl]) => {
      if (tvl > 0) {
        console.log(`   - ${type}: ${formatMUSD(tvl)} MUSD`);
      }
    });

    // 8. Transaction Volume
    const deposits = await prisma.deposit.findMany({
      where: {
        type: "DEPOSIT",
        status: "CONFIRMED",
      },
      select: {
        amount: true,
      },
    });

    const depositVolume = deposits.reduce((sum, d) => sum + BigInt(d.amount), BigInt(0));
    console.log(`\n📊 Total Deposit Volume: ${formatMUSD(depositVolume)} MUSD`);

    const withdrawals = await prisma.deposit.findMany({
      where: {
        type: "WITHDRAW",
        status: "CONFIRMED",
      },
      select: {
        amount: true,
      },
    });

    const withdrawVolume = withdrawals.reduce((sum, w) => sum + BigInt(w.amount), BigInt(0));
    console.log(`💸 Total Withdrawal Volume: ${formatMUSD(withdrawVolume)} MUSD`);

    // 9. Active Users (users with deposits)
    const activeUsers = await prisma.user.count({
      where: {
        deposits: {
          some: {
            status: "CONFIRMED",
          },
        },
      },
    });
    console.log(`\n👤 Active Users (with transactions): ${activeUsers}`);

    // 10. Average deposits per user
    if (activeUsers > 0) {
      const avgDeposits = (totalDeposits / activeUsers).toFixed(2);
      console.log(`📊 Average Deposits per Active User: ${avgDeposits}`);
    }

    // 11. Recent Activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await prisma.deposit.count({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
        },
        status: "CONFIRMED",
      },
    });

    const recentUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    console.log(`\n📅 Last 7 Days Activity:`);
    console.log(`   - Transactions: ${recentTransactions}`);
    console.log(`   - Active Users: ${recentUsers}`);

    // 12. Lottery Stats (if any)
    const lotteryRounds = await prisma.lotteryRound.count();
    const completedRounds = await prisma.lotteryRound.count({
      where: {
        status: "COMPLETED",
      },
    });
    const totalTickets = await prisma.lotteryTicket.count();

    if (lotteryRounds > 0) {
      console.log(`\n🎰 Lottery Stats:`);
      console.log(`   - Total Rounds: ${lotteryRounds}`);
      console.log(`   - Completed Rounds: ${completedRounds}`);
      console.log(`   - Total Tickets Sold: ${totalTickets}`);
    }

    // 13. Indexer Health
    const indexerStates = await prisma.indexerState.findMany({
      select: {
        contractName: true,
        lastIndexedBlock: true,
        isHealthy: true,
        totalEvents: true,
        eventsProcessed: true,
        lastIndexedAt: true,
      },
    });

    console.log(`\n🔄 Indexer Health:`);
    indexerStates.forEach((state) => {
      console.log(`   - ${state.contractName}:`);
      console.log(`     • Last Block: ${state.lastIndexedBlock}`);
      console.log(`     • Healthy: ${state.isHealthy ? "✅" : "❌"}`);
      console.log(`     • Events Processed: ${state.eventsProcessed}/${state.totalEvents}`);
      if (state.lastIndexedAt) {
        console.log(`     • Last Sync: ${state.lastIndexedAt.toISOString()}`);
      }
    });

    // Summary for audit
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📋 SUMMARY FOR AUDIT SUBMISSION`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Total Unique Wallets: ${uniqueUsers}`);
    console.log(`Total Pools Created: ${totalPools} (${activePools} active)`);
    console.log(`Total Transactions: ${totalTransactions}`);
    console.log(`Total Value Locked: ${formatMUSD(totalTVL)} MUSD`);
    console.log(`Deposit Volume: ${formatMUSD(depositVolume)} MUSD`);
    console.log(`Active Users (7d): ${recentUsers}`);
    console.log(`Recent Transactions (7d): ${recentTransactions}`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.error("❌ Error gathering metrics:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function formatMUSD(weiAmount: bigint): string {
  // Convert wei to MUSD (assuming 18 decimals)
  const musd = Number(weiAmount) / 1e18;
  return musd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

gatherMetrics();
