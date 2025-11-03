#!/bin/bash

# ============================================================================
# KhipuVault Deployment Setup Script - Mezo Testnet
# ============================================================================
# Este script configura todo lo necesario para desplegar a Mezo Testnet
# 
# USO: 
# chmod +x DEPLOYMENT_SETUP.sh
# ./DEPLOYMENT_SETUP.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 KhipuVault Deployment Setup"
echo "================================"
echo ""

# ============================================================================
# 1. Verificar Requisitos
# ============================================================================

echo "✓ Verificando requisitos..."

# Verificar Foundry
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry no está instalado"
    echo "Instala con: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

echo "✓ Foundry instalado: $(forge --version)"

# Verificar que estamos en la carpeta contracts
if [ ! -f "foundry.toml" ]; then
    echo "❌ foundry.toml no encontrado"
    echo "Asegúrate de estar en la carpeta contracts/"
    exit 1
fi

echo "✓ foundry.toml encontrado"

# ============================================================================
# 2. Crear archivo .env si no existe
# ============================================================================

if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  Archivo .env no encontrado"
    echo "Creando .env desde .env.example..."
    cp .env.example .env
    echo "✓ .env creado (edita con tus valores)"
else
    echo "✓ .env ya existe"
fi

# ============================================================================
# 3. Verificar variables de entorno críticas
# ============================================================================

echo ""
echo "📋 Verificando variables en .env..."

source .env 2>/dev/null || true

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ DEPLOYER_PRIVATE_KEY no está configurada en .env"
    echo "   Edita .env y añade tu clave privada"
    exit 1
fi

echo "✓ DEPLOYER_PRIVATE_KEY configurada"

# ============================================================================
# 4. Compilar contratos
# ============================================================================

echo ""
echo "🔨 Compilando contratos..."

if forge build 2>&1 | head -20; then
    echo "✓ Compilación exitosa"
else
    echo "❌ Error durante compilación"
    echo "   Usa: forge build -vvvv para más detalles"
    exit 1
fi

# ============================================================================
# 5. Crear carpeta deployments
# ============================================================================

if [ ! -d "deployments" ]; then
    mkdir -p deployments
    echo "✓ Carpeta deployments creada"
else
    echo "✓ Carpeta deployments existe"
fi

# ============================================================================
# 6. Mostrar configuración
# ============================================================================

echo ""
echo "🎯 Configuración lista para deployment:"
echo "========================================"
echo ""
echo "Red: Mezo Testnet"
echo "Chain ID: 31611"
echo "RPC: https://rpc.test.mezo.org"
echo "Explorer: https://explorer.test.mezo.org"
echo ""
echo "Deployer (desde DEPLOYER_PRIVATE_KEY):"
# Extrae la dirección del private key (no muestra la clave)
echo "  (mostrado en el siguiente paso)"
echo ""

# ============================================================================
# 7. Próximos pasos
# ============================================================================

echo "📝 Próximos pasos:"
echo "================="
echo ""
echo "1️⃣  VERIFICAR BALANCE:"
echo "   - Ve a: https://explorer.test.mezo.org"
echo "   - Busca tu dirección (0x...)"
echo "   - Deberías tener al menos 0.5 BTC"
echo "   - Si no, ve al faucet: https://faucet.test.mezo.org"
echo ""
echo "2️⃣  DESPLEGAR TOKENS:"
echo "   forge script script/01_DeployTokens.s.sol:DeployTokens \\"
echo "   --rpc-url https://rpc.test.mezo.org --broadcast -vvvv"
echo ""
echo "3️⃣  GUARDAR DIRECCIONES en .env:"
echo "   WBTC_ADDRESS=0x..."
echo "   MUSD_ADDRESS=0x..."
echo ""
echo "4️⃣  DESPLEGAR INTEGRACIONES:"
echo "   forge script script/02_DeployIntegrations.s.sol \\"
echo "   --rpc-url https://rpc.test.mezo.org --broadcast -vvvv"
echo ""
echo "5️⃣  DESPLEGAR POOLS:"
echo "   forge script script/03_DeployPools.s.sol \\"
echo "   --rpc-url https://rpc.test.mezo.org --broadcast -vvvv"
echo ""
echo "6️⃣  ACTUALIZAR FRONTEND:"
echo "   Copia todas las direcciones a:"
echo "   frontend/src/lib/web3/contracts.ts"
echo ""

echo "✅ Setup completado!"
echo ""
echo "Para desplegar, ejecuta los comandos anteriores"
echo "o lee DEPLOYMENT_MANUAL.md para más detalles"
echo ""
