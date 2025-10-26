#!/bin/bash

RPC="https://rpc.test.mezo.org"

echo "🔍 CONTROL DE CALIDAD - KhipuVault Contracts"
echo "=============================================="
echo ""

# Individual Pool
INDIVIDUAL_POOL="0xC2c7c8E1325Ec049302F225c8A0151E561F446Ed"
echo "💡 INDIVIDUAL SAVINGS POOL"
echo "Address: $INDIVIDUAL_POOL"
echo -n "  ├─ Paused: "
cast call $INDIVIDUAL_POOL "paused()(bool)" --rpc-url $RPC
echo -n "  ├─ Total Deposits: "
cast call $INDIVIDUAL_POOL "totalDeposits()(uint256)" --rpc-url $RPC
echo -n "  └─ Depositor Count: "
cast call $INDIVIDUAL_POOL "depositorCount()(uint256)" --rpc-url $RPC
echo ""

# Cooperative Pool
COOPERATIVE_POOL="0xDDe8c75271E454075BD2f348213A66B142BB8906"
echo "🤝 COOPERATIVE SAVINGS POOL"
echo "Address: $COOPERATIVE_POOL"
echo -n "  ├─ Paused: "
cast call $COOPERATIVE_POOL "paused()(bool)" --rpc-url $RPC
echo -n "  ├─ Pool Counter: "
cast call $COOPERATIVE_POOL "poolCounter()(uint256)" --rpc-url $RPC
echo -n "  └─ Min Contribution: "
cast call $COOPERATIVE_POOL "MIN_CONTRIBUTION()(uint256)" --rpc-url $RPC
echo ""

# Lottery Pool
LOTTERY_POOL="0x3e5d272321e28731844c20e0a0c725a97301f83a"
echo "🎁 PRIZE POOL (LOTTERY)"
echo "Address: $LOTTERY_POOL"
echo -n "  ├─ Current Round ID: "
cast call $LOTTERY_POOL "currentRoundId()(uint256)" --rpc-url $RPC
echo -n "  ├─ Round Counter: "
cast call $LOTTERY_POOL "roundCounter()(uint256)" --rpc-url $RPC
echo -n "  └─ Min Ticket Price: "
cast call $LOTTERY_POOL "MIN_TICKET_PRICE()(uint256)" --rpc-url $RPC
echo ""

# Mezo Integration
MEZO_INTEGRATION="0x9AC6249d2f2E3cbAAF34E114EdF1Cb7519AF04C2"
echo "🔗 MEZO INTEGRATION"
echo "Address: $MEZO_INTEGRATION"
echo -n "  ├─ Paused: "
cast call $MEZO_INTEGRATION "paused()(bool)" --rpc-url $RPC
echo -n "  └─ MUSD Token: "
cast call $MEZO_INTEGRATION "MUSD()(address)" --rpc-url $RPC
echo ""

# Yield Aggregator
YIELD_AGGREGATOR="0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c"
echo "📊 YIELD AGGREGATOR"
echo "Address: $YIELD_AGGREGATOR"
echo -n "  ├─ Paused: "
cast call $YIELD_AGGREGATOR "paused()(bool)" --rpc-url $RPC
echo -n "  └─ Total Assets: "
cast call $YIELD_AGGREGATOR "totalAssets()(uint256)" --rpc-url $RPC
echo ""

echo "✅ Contract Status Check Complete"
