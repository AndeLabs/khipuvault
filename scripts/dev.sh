#!/bin/bash

# Development script for KhipuVault monorepo

echo "🚀 Starting KhipuVault development environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL)..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm --filter @khipu/database db:generate

# Push schema to database
echo "🗄️  Pushing Prisma schema to database..."
pnpm --filter @khipu/database db:push

# Seed database
echo "🌱 Seeding database..."
pnpm --filter @khipu/database db:seed

echo ""
echo "✅ Database ready!"
echo ""
echo "🎯 Starting development servers..."
echo ""
echo "Available commands:"
echo "  pnpm dev              - Start all services"
echo "  pnpm dev:web          - Start frontend only"
echo "  pnpm dev:api          - Start backend only"
echo "  pnpm dev:indexer      - Start blockchain indexer"
echo ""

# Start all services in development mode
pnpm dev
