#!/usr/bin/env node
import 'dotenv/config'
import { startIndexer } from './index'

const command = process.argv[2]

async function main() {
  switch (command) {
    case 'start':
      await startIndexer()
      break

    case 'help':
    case '--help':
    case '-h':
      console.log(`
🌐 KhipuVault Blockchain Indexer CLI

Usage:
  pnpm index start    Start the blockchain event indexer
  pnpm index help     Show this help message

Environment Variables:
  DATABASE_URL                 PostgreSQL connection string (required)
  RPC_URL                      Blockchain RPC endpoint (default: Mezo Testnet)
  INDIVIDUAL_POOL_ADDRESS      IndividualPool contract address
  COOPERATIVE_POOL_ADDRESS     CooperativePool contract address

Examples:
  # Start indexer
  pnpm index start

  # Start with custom RPC
  RPC_URL=https://custom-rpc.com pnpm index start
      `)
      break

    default:
      console.error(`❌ Unknown command: ${command}`)
      console.log('Run "pnpm index help" for usage information')
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
