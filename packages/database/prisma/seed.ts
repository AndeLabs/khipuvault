import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create example pool
  // IMPORTANT: Always use lowercase for Ethereum addresses to match Prisma queries
  const pool = await prisma.pool.upsert({
    where: { contractAddress: "0xdfbed2d3efbd2071fd407bf169b5e5533ea90393" },
    update: {},
    create: {
      contractAddress: "0xdfbed2d3efbd2071fd407bf169b5e5533ea90393",
      poolType: "INDIVIDUAL",
      name: "Individual Savings Pool",
      description: "Personal savings with auto-yield optimization",
      tvl: "0",
      apr: 6.2,
      totalUsers: 0,
      totalDeposits: 0,
      status: "ACTIVE",
    },
  });

  console.log("✅ Created pool:", pool.name);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
