#!/bin/bash

# Clean script for KhipuVault monorepo

echo "🧹 Cleaning KhipuVault monorepo..."

# Stop Docker services
echo "🛑 Stopping Docker services..."
docker-compose down

# Remove node_modules
echo "🗑️  Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove build artifacts
echo "🗑️  Removing build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "out" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +

# Remove Prisma generated client
echo "🗑️  Removing Prisma generated files..."
rm -rf packages/database/node_modules/.prisma

echo ""
echo "✅ Clean complete!"
echo ""
echo "🔄 To reinstall and setup:"
echo "   ./scripts/setup.sh"
echo ""
