import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create example pool
  const pool = await prisma.pool.upsert({
    where: { contractAddress: '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393' },
    update: {},
    create: {
      contractAddress: '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393',
      poolType: 'individual',
      name: 'Individual Savings Pool',
      description: 'Personal savings with auto-yield optimization',
      tvl: '0',
      apr: 6.2,
      totalUsers: 0,
      totalDeposits: 0,
      status: 'active',
    },
  })

  console.log('✅ Created pool:', pool.name)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
