#!/bin/bash
# Quick deployment script for RotatingPool

set -e

echo "🚀 RotatingPool Deployment Script"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo ""
    echo "Please create .env from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Add your DEPLOYER_PRIVATE_KEY"
    echo ""
    exit 1
fi

# Source .env
source .env

# Check if DEPLOYER_PRIVATE_KEY is set
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ Error: DEPLOYER_PRIVATE_KEY not set in .env"
    echo ""
    echo "Edit .env and add your private key:"
    echo "  DEPLOYER_PRIVATE_KEY=your_key_here"
    echo ""
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Compile contracts
echo "📦 Compiling contracts..."
forge build --force
echo "✅ Compilation successful"
echo ""

# Deploy
echo "🚀 Deploying RotatingPool to Mezo testnet..."
echo ""

RPC_URL="${MEZO_TESTNET_RPC:-https://rpc.test.mezo.org}"

forge script script/DeployRotatingPool.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the contract address from the output above"
echo "2. Update frontend addresses (see ROTATING_POOL_DEPLOYMENT.md)"
echo "3. Test in UI: http://localhost:9002/dashboard/rotating-pool"
echo ""
