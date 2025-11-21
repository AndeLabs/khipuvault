#!/bin/bash

# Setup script for KhipuVault monorepo

echo "🏗️  Setting up KhipuVault monorepo..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@9.0.0
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy .env.example files
echo "📝 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created root .env"
fi

if [ ! -f packages/database/.env ]; then
    cp packages/database/.env.example packages/database/.env
    echo "✅ Created database .env"
fi

if [ ! -f packages/blockchain/.env ]; then
    cp packages/blockchain/.env.example packages/blockchain/.env
    echo "✅ Created blockchain .env"
fi

if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created API .env"
fi

if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created web .env"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Generate Prisma client
echo "🔨 Generating Prisma client..."
pnpm --filter @khipu/database db:generate

# Push schema
echo "🗄️  Pushing database schema..."
pnpm --filter @khipu/database db:push

# Seed database
echo "🌱 Seeding database..."
pnpm --filter @khipu/database db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   pnpm dev"
echo ""
echo "📚 Read the documentation:"
echo "   - Root README.md for monorepo overview"
echo "   - apps/web/ARCHITECTURE.md for frontend architecture"
echo "   - Individual package READMEs for specific details"
echo ""
