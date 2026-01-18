import { prisma } from "@khipu/database";

import { AppError } from "../middleware/error-handler";

/**
 * Lottery Service - Handles lottery pool queries
 * - Rounds management
 * - Ticket queries
 * - Winner history
 * - User stats
 */
export class LotteryService {
  /**
   * Get all lottery rounds with pagination
   */
  async getAllRounds(limit: number = 20, offset: number = 0) {
    const [rounds, total] = await Promise.all([
      prisma.lotteryRound.findMany({
        orderBy: { roundId: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { tickets: true },
          },
        },
      }),
      prisma.lotteryRound.count(),
    ]);

    return {
      rounds: rounds.map((round) => ({
        ...round,
        participantCount: round._count.tickets,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get active/open rounds
   */
  async getActiveRounds() {
    const rounds = await prisma.lotteryRound.findMany({
      where: {
        status: { in: ["OPEN", "COMMIT", "REVEAL"] },
      },
      orderBy: { endTime: "asc" },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    return rounds.map((round) => ({
      ...round,
      participantCount: round._count.tickets,
    }));
  }

  /**
   * Get round by ID with tickets
   */
  async getRoundById(roundId: number) {
    const round = await prisma.lotteryRound.findUnique({
      where: { roundId },
      include: {
        tickets: {
          orderBy: { ticketCount: "desc" },
          take: 100, // Top 100 participants
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!round) {
      throw new AppError(404, "Round not found");
    }

    return {
      ...round,
      participantCount: round._count.tickets,
    };
  }

  /**
   * Get user's tickets for a specific round
   */
  async getUserTickets(userAddress: string, roundId: number) {
    const normalizedAddress = userAddress.toLowerCase();

    const ticket = await prisma.lotteryTicket.findUnique({
      where: {
        roundId_userAddress: {
          roundId,
          userAddress: normalizedAddress,
        },
      },
      include: {
        round: {
          select: {
            status: true,
            winnerAddress: true,
            winnerPrize: true,
            ticketPrice: true,
            totalTicketsSold: true,
          },
        },
      },
    });

    if (!ticket) {
      return null;
    }

    return ticket;
  }

  /**
   * Get all user's lottery participation
   */
  async getUserLotteryHistory(userAddress: string, limit: number = 20, offset: number = 0) {
    const normalizedAddress = userAddress.toLowerCase();

    const [tickets, total] = await Promise.all([
      prisma.lotteryTicket.findMany({
        where: { userAddress: normalizedAddress },
        orderBy: { roundId: "desc" },
        take: limit,
        skip: offset,
        include: {
          round: {
            select: {
              status: true,
              winnerAddress: true,
              winnerPrize: true,
              ticketPrice: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.lotteryTicket.count({
        where: { userAddress: normalizedAddress },
      }),
    ]);

    return {
      tickets,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get user's lottery stats across all rounds
   */
  async getUserStats(userAddress: string) {
    const normalizedAddress = userAddress.toLowerCase();

    const [tickets, wins] = await Promise.all([
      // All user tickets
      prisma.lotteryTicket.findMany({
        where: { userAddress: normalizedAddress },
        include: {
          round: {
            select: {
              status: true,
              winnerPrize: true,
            },
          },
        },
      }),
      // Count wins
      prisma.lotteryTicket.count({
        where: {
          userAddress: normalizedAddress,
          isWinner: true,
        },
      }),
    ]);

    // Calculate stats
    let totalTicketsPurchased = 0;
    let totalMusdInvested = BigInt(0);
    let totalPrizesWon = BigInt(0);
    let totalRefundsClaimed = BigInt(0);
    let roundsParticipated = 0;
    let activeRounds = 0;
    let pendingClaims = 0;

    for (const ticket of tickets) {
      roundsParticipated++;
      totalTicketsPurchased += ticket.ticketCount;
      totalMusdInvested += BigInt(ticket.musdContributed);

      if (ticket.isWinner && ticket.claimedAmount) {
        totalPrizesWon += BigInt(ticket.claimedAmount);
      } else if (!ticket.isWinner && ticket.claimed && ticket.claimedAmount) {
        totalRefundsClaimed += BigInt(ticket.claimedAmount);
      }

      if (ticket.round.status === "OPEN" || ticket.round.status === "COMMIT") {
        activeRounds++;
      }

      if (ticket.round.status === "COMPLETED" && !ticket.claimed) {
        pendingClaims++;
      }
    }

    return {
      address: normalizedAddress,
      totalRoundsParticipated: roundsParticipated,
      totalTicketsPurchased,
      totalMusdInvested: totalMusdInvested.toString(),
      totalWins: wins,
      totalPrizesWon: totalPrizesWon.toString(),
      totalRefundsClaimed: totalRefundsClaimed.toString(),
      activeRounds,
      pendingClaims,
      winRate: roundsParticipated > 0 ? (wins / roundsParticipated) * 100 : 0,
    };
  }

  /**
   * Get completed rounds with winners (draw history)
   */
  async getDrawHistory(limit: number = 20, offset: number = 0) {
    const [rounds, total] = await Promise.all([
      prisma.lotteryRound.findMany({
        where: { status: "COMPLETED" },
        orderBy: { roundId: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { tickets: true },
          },
        },
      }),
      prisma.lotteryRound.count({
        where: { status: "COMPLETED" },
      }),
    ]);

    return {
      draws: rounds.map((round) => ({
        roundId: round.roundId,
        winnerAddress: round.winnerAddress,
        winnerPrize: round.winnerPrize,
        winningTicket: round.winningTicket,
        totalTicketsSold: round.totalTicketsSold,
        totalMusd: round.totalMusd,
        participantCount: round._count.tickets,
        endTime: round.endTime,
        completedBlock: round.completedBlock,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get top winners by total prizes won
   */
  async getTopWinners(limit: number = 10) {
    // Get all winning tickets with claimed amounts
    const winningTickets = await prisma.lotteryTicket.findMany({
      where: { isWinner: true },
      select: {
        userAddress: true,
        claimedAmount: true,
      },
    });

    // Group by address and calculate totals
    const winnerMap = new Map<string, { wins: number; totalPrizes: bigint }>();

    for (const ticket of winningTickets) {
      const existing = winnerMap.get(ticket.userAddress);
      const prizeAmount = ticket.claimedAmount ? BigInt(ticket.claimedAmount) : BigInt(0);

      if (existing) {
        existing.wins += 1;
        existing.totalPrizes += prizeAmount;
      } else {
        winnerMap.set(ticket.userAddress, {
          wins: 1,
          totalPrizes: prizeAmount,
        });
      }
    }

    // Convert to array and sort by wins
    const winners = Array.from(winnerMap.entries())
      .map(([address, data]) => ({
        address,
        totalWins: data.wins,
        totalPrizes: data.totalPrizes.toString(),
      }))
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, limit);

    return winners;
  }

  /**
   * Get lottery pool statistics
   */
  async getPoolStats() {
    const [totalRounds, completedRounds, totalTickets, completedRoundsList] = await Promise.all([
      prisma.lotteryRound.count(),
      prisma.lotteryRound.count({ where: { status: "COMPLETED" } }),
      prisma.lotteryTicket.aggregate({
        _sum: { ticketCount: true },
      }),
      // Get all completed rounds to sum totalMusd (string field)
      prisma.lotteryRound.findMany({
        where: { status: "COMPLETED" },
        select: { totalMusd: true },
      }),
    ]);

    // Calculate total MUSD collected (sum of string values)
    const totalMusdCollected = completedRoundsList.reduce((sum, round) => {
      return sum + BigInt(round.totalMusd || "0");
    }, BigInt(0));

    // Get active round
    const activeRound = await prisma.lotteryRound.findFirst({
      where: { status: "OPEN" },
      orderBy: { endTime: "asc" },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    // Get unique participants
    const uniqueParticipants = await prisma.lotteryTicket.groupBy({
      by: ["userAddress"],
    });

    return {
      totalRounds,
      completedRounds,
      activeRound: activeRound
        ? {
            roundId: activeRound.roundId,
            ticketPrice: activeRound.ticketPrice,
            maxTickets: activeRound.maxTickets,
            totalTicketsSold: activeRound.totalTicketsSold,
            participantCount: activeRound._count.tickets,
            endTime: activeRound.endTime,
            status: activeRound.status,
          }
        : null,
      totalTicketsSold: totalTickets._sum.ticketCount || 0,
      totalMusdCollected: totalMusdCollected.toString(),
      uniqueParticipants: uniqueParticipants.length,
    };
  }
}
