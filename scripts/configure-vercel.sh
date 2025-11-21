#!/bin/bash

# Vercel Configuration Script
# Configures Vercel project for monorepo deployment

set -e

PROJECT_ID="prj_V49boyIaFdRMATHCJLATUY0sXSyg"
VERCEL_TOKEN="t09or30LxhivYow9GQlny2AI"

echo "🚀 Configurando proyecto Vercel para monorepo..."

# 1. Update project settings
echo ""
echo "📝 Actualizando configuración del proyecto..."
curl -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rootDirectory": "apps/web",
    "framework": "nextjs",
    "buildCommand": "pnpm build",
    "installCommand": "pnpm install",
    "outputDirectory": ".next"
  }' 2>/dev/null | python3 -m json.tool || echo "⚠️  Error actualizando configuración"

echo ""
echo "🔧 Agregando variables de entorno..."

# 2. Add environment variables
# ENABLE_EXPERIMENTAL_COREPACK
curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ENABLE_EXPERIMENTAL_COREPACK",
    "value": "1",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }' 2>/dev/null | python3 -m json.tool > /dev/null && echo "✅ ENABLE_EXPERIMENTAL_COREPACK agregado"

# NODE_OPTIONS
curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NODE_OPTIONS",
    "value": "--max-old-space-size=4096",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }' 2>/dev/null | python3 -m json.tool > /dev/null && echo "✅ NODE_OPTIONS agregado"

# NEXT_TELEMETRY_DISABLED
curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_TELEMETRY_DISABLED",
    "value": "1",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }' 2>/dev/null | python3 -m json.tool > /dev/null && echo "✅ NEXT_TELEMETRY_DISABLED agregado"

# NEXT_PUBLIC_CHAIN_ID
curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_CHAIN_ID",
    "value": "31611",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }' 2>/dev/null | python3 -m json.tool > /dev/null && echo "✅ NEXT_PUBLIC_CHAIN_ID agregado"

echo ""
echo "✨ Configuración completada!"
echo ""
echo "📋 Resumen:"
echo "  - Root Directory: apps/web"
echo "  - Build Command: pnpm build"
echo "  - Install Command: pnpm install"
echo "  - Framework: Next.js"
echo ""
echo "⚠️  IMPORTANTE: Aún necesitas agregar estas variables manualmente en Vercel Dashboard:"
echo "  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (no la tengo)"
echo "  - NEXT_PUBLIC_ALCHEMY_API_KEY (no la tengo)"
echo ""
echo "🌐 Dashboard: https://vercel.com/dashboard"
echo ""
echo "🚀 Próximo paso: Vercel re-deployará automáticamente"
