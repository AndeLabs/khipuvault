#!/bin/bash

# ============================================================================
# KhipuVault Complete Deployment Script - Mezo Testnet
# ============================================================================
# Este script despliega TODOS los contratos automáticamente
# 
# USO:
# chmod +x DEPLOY_ALL.sh
# ./DEPLOY_ALL.sh
# ============================================================================

set -e

echo "🚀 INICIANDO DEPLOYMENT COMPLETO A MEZO TESTNET"
echo "=============================================="
echo ""

# Configuración
RPC_URL="https://rpc.test.mezo.org"
CHAIN_ID=31611

# Cargar variables de .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Verificar que tenemos DEPLOYER_PRIVATE_KEY
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ ERROR: DEPLOYER_PRIVATE_KEY no está configurada"
    echo "   Configura en .env antes de continuar"
    exit 1
fi

echo "📝 Configuración:"
echo "   RPC: $RPC_URL"
echo "   Chain ID: $CHAIN_ID"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo ""

# ============================================================================
# PASO 1: Compilar
# ============================================================================

echo "🔨 PASO 1: Compilando contratos..."
echo "===================================="

if forge build; then
    echo "✅ Compilación exitosa"
else
    echo "❌ Error en compilación"
    exit 1
fi

echo ""

# ============================================================================
# PASO 2: Desplegar Tokens
# ============================================================================

echo "💰 PASO 2: Desplegando Tokens (WBTC, MUSD)..."
echo "=============================================="

TOKENS_OUTPUT=$(forge script script/01_DeployTokens.s.sol:DeployTokens \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvv 2>&1)

echo "$TOKENS_OUTPUT"

# Extraer direcciones
WBTC_ADDRESS=$(echo "$TOKENS_OUTPUT" | grep "WBTC deployed at:" | awk '{print $NF}' | head -1)
MUSD_ADDRESS=$(echo "$TOKENS_OUTPUT" | grep "MUSD deployed at:" | awk '{print $NF}' | head -1)

if [ -z "$WBTC_ADDRESS" ] || [ -z "$MUSD_ADDRESS" ]; then
    echo "❌ Error: No se pudieron extraer direcciones de tokens"
    echo "   Verifica el output anterior"
    exit 1
fi

echo ""
echo "✅ Tokens desplegados:"
echo "   WBTC: $WBTC_ADDRESS"
echo "   MUSD: $MUSD_ADDRESS"
echo ""

# ============================================================================
# PASO 3: Desplegar Integraciones
# ============================================================================

echo "🔗 PASO 3: Desplegando MezoIntegration..."
echo "=========================================="

INTEGRATION_OUTPUT=$(forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvv 2>&1)

echo "$INTEGRATION_OUTPUT"

# Extraer dirección
MEZO_INTEGRATION=$(echo "$INTEGRATION_OUTPUT" | grep "MezoIntegration deployed at:" | awk '{print $NF}' | head -1)

if [ -z "$MEZO_INTEGRATION" ]; then
    echo "❌ Error: No se pudo extraer dirección de MezoIntegration"
    exit 1
fi

echo ""
echo "✅ MezoIntegration desplegado:"
echo "   Dirección: $MEZO_INTEGRATION"
echo ""

# ============================================================================
# PASO 4: Desplegar Pools
# ============================================================================

echo "🏊 PASO 4: Desplegando Pools..."
echo "==============================="

POOLS_OUTPUT=$(forge script script/03_DeployPools.s.sol:DeployPools \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvv 2>&1)

echo "$POOLS_OUTPUT"

# Extraer direcciones de pools
INDIVIDUAL_POOL=$(echo "$POOLS_OUTPUT" | grep "IndividualPool deployed at:" | awk '{print $NF}' | head -1)
COOPERATIVE_POOL=$(echo "$POOLS_OUTPUT" | grep "CooperativePool deployed at:" | awk '{print $NF}' | head -1)
ROTATING_POOL=$(echo "$POOLS_OUTPUT" | grep "RotatingPool deployed at:" | awk '{print $NF}' | head -1)
LOTTERY_POOL=$(echo "$POOLS_OUTPUT" | grep "LotteryPool deployed at:" | awk '{print $NF}' | head -1)

echo ""
echo "✅ Pools desplegados:"
echo "   IndividualPool: $INDIVIDUAL_POOL"
echo "   CooperativePool: $COOPERATIVE_POOL"
echo "   RotatingPool: $ROTATING_POOL"
echo "   LotteryPool: $LOTTERY_POOL"
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              🎉 DEPLOYMENT EXITOSO 🎉                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 CONTRATOS DESPLEGADOS EN MEZO TESTNET:"
echo "========================================="
echo ""
echo "TOKENS:"
echo "  WBTC:  $WBTC_ADDRESS"
echo "  MUSD:  $MUSD_ADDRESS"
echo ""
echo "INTEGRACIONES:"
echo "  MezoIntegration: $MEZO_INTEGRATION"
echo ""
echo "POOLS:"
echo "  IndividualPool:   $INDIVIDUAL_POOL"
echo "  CooperativePool:  $COOPERATIVE_POOL"
echo "  RotatingPool:     $ROTATING_POOL"
echo "  LotteryPool:      $LOTTERY_POOL"
echo ""
echo "🔗 EXPLORER:"
echo "  https://explorer.test.mezo.org"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Copia todas las direcciones anteriores"
echo "2. Actualiza frontend/src/lib/web3/contracts.ts"
echo "3. Verifica cada contrato en el explorer"
echo "4. Prueba la integración en el frontend"
echo ""

# ============================================================================
# GUARDAR DIRECCIONES EN ARCHIVO
# ============================================================================

DEPLOYMENT_FILE="./deployments/ADDRESSES_MEZO_TESTNET.json"

mkdir -p deployments

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "Mezo Testnet",
  "chainId": 31611,
  "rpcUrl": "$RPC_URL",
  "explorer": "https://explorer.test.mezo.org",
  "deployer": "$DEPLOYER_ADDRESS",
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tokens": {
    "wbtc": "$WBTC_ADDRESS",
    "musd": "$MUSD_ADDRESS"
  },
  "integrations": {
    "mezoIntegration": "$MEZO_INTEGRATION"
  },
  "pools": {
    "individualPool": "$INDIVIDUAL_POOL",
    "cooperativePool": "$COOPERATIVE_POOL",
    "rotatingPool": "$ROTATING_POOL",
    "lotteryPool": "$LOTTERY_POOL"
  }
}
EOF

echo "✅ Direcciones guardadas en: $DEPLOYMENT_FILE"
echo ""
