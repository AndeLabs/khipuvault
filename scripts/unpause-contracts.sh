#!/bin/bash

# Script to unpause IndividualPool, CooperativePool, and YieldAggregator
# Required environment variables:
#   - DEPLOYER_PRIVATE_KEY: Private key of contract owner/deployer
#   - MEZO_TESTNET_RPC: RPC URL for Mezo Testnet

set -e

echo "========================================"
echo "🔓 Unpausing KhipuVault Contracts"
echo "========================================"

# Check environment variables
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ Error: DEPLOYER_PRIVATE_KEY not set"
    echo "   Set it with: export DEPLOYER_PRIVATE_KEY=<your_private_key>"
    exit 1
fi

if [ -z "$MEZO_TESTNET_RPC" ]; then
    echo "⚠️  MEZO_TESTNET_RPC not set, using default: https://testnet-rpc.mezo.org"
    export MEZO_TESTNET_RPC="https://testnet-rpc.mezo.org"
fi

echo ""
echo "Configuration:"
echo "  RPC: $MEZO_TESTNET_RPC"
echo "  Deployer: $(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)"
echo ""

# Change to contracts directory
cd "$(dirname "$0")/../contracts" || exit 1

echo "Running unpause script..."
echo ""

# Run the unpause script
forge script script/UnpauseContracts.s.sol:UnpauseContracts \
    --rpc-url "$MEZO_TESTNET_RPC" \
    --broadcast \
    -vvv

echo ""
echo "========================================"
echo "✅ Unpause operation completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Verify contracts are unpaused in explorer"
echo "2. Try depositing MUSD again in the frontend"
echo "3. Check browser console for any remaining errors"
echo ""
