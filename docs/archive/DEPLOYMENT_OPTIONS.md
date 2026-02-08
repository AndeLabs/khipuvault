# 🚀 OPCIONES DE DEPLOYMENT - KHIPUVAULT

## 📋 RESUMEN RÁPIDO

**¿Necesito servidor propio?** ❌ NO

**¿Puedo hostear gratis?** ✅ SÍ

**¿Qué necesito?** Solo cuentas gratuitas en servicios cloud

---

## 🏗️ ARQUITECTURA DE DEPLOYMENT

```
┌─────────────────────────────────────────────────────────┐
│                    KHIPUVAULT                           │
└─────────────────────────────────────────────────────────┘
              │
              ├─── 📱 FRONTEND (apps/web)
              │    └─ Vercel / Netlify (GRATIS)
              │       └─ Deploy automático desde GitHub
              │
              ├─── 🔧 BACKEND API (apps/api)
              │    └─ Railway / Render (GRATIS hasta cierto uso)
              │       └─ Node.js app
              │
              ├─── 🗄️ DATABASE (PostgreSQL)
              │    └─ Supabase / Neon / Railway (GRATIS)
              │       └─ PostgreSQL managed
              │
              └─── ⛓️ INDEXER (packages/blockchain)
                   └─ Railway / Render (GRATIS)
                      └─ Background worker
```

---

## 🆓 OPCIONES GRATUITAS POR COMPONENTE

### 1. 📱 **FRONTEND (Next.js)**

#### ✅ **Opción 1: Vercel (RECOMENDADO)**

**Plan Gratuito**:

- ✅ Despliegue ilimitado
- ✅ Deploy automático desde GitHub
- ✅ Preview deploys para PRs
- ✅ SSL gratis
- ✅ CDN global
- ✅ Dominio personalizado
- ✅ 100GB bandwidth/mes

**Cómo usar**:

```bash
# 1. Conectar repo GitHub con Vercel
# 2. Importar proyecto
# 3. Seleccionar apps/web
# 4. Deploy automático ✅

# O desde CLI:
cd apps/web
npm i -g vercel
vercel --prod
```

**Link**: https://vercel.com

---

#### ✅ **Opción 2: Netlify**

**Plan Gratuito**:

- ✅ 100GB bandwidth/mes
- ✅ Deploy automático
- ✅ SSL gratis
- ✅ Dominio personalizado

**Cómo usar**:

```bash
# 1. Conectar GitHub
# 2. Build command: cd apps/web && pnpm build
# 3. Publish directory: apps/web/.next
```

**Link**: https://netlify.com

---

### 2. 🔧 **BACKEND API (Express.js)**

#### ✅ **Opción 1: Railway (RECOMENDADO)**

**Plan Gratuito**:

- ✅ $5 crédito mensual gratis
- ✅ Suficiente para API pequeña/mediana
- ✅ PostgreSQL incluido
- ✅ Deploy desde GitHub
- ✅ Variables de entorno
- ✅ Logs en tiempo real

**Cómo usar**:

```bash
# 1. Crear cuenta en railway.app
# 2. New Project → Deploy from GitHub
# 3. Seleccionar repo
# 4. Configurar:
#    - Root Directory: apps/api
#    - Build Command: pnpm install && pnpm build
#    - Start Command: pnpm start
# 5. Agregar variables de entorno:
#    DATABASE_URL=postgresql://...
#    PORT=3001
#    NODE_ENV=production
```

**Link**: https://railway.app

**Límites**:

- $5/mes gratis
- ~500 horas/mes de runtime
- Suficiente para desarrollo y MVP

---

#### ✅ **Opción 2: Render**

**Plan Gratuito**:

- ✅ Completamente gratis (con limitaciones)
- ⚠️ Se duerme después de 15 min sin uso
- ⚠️ Tarda 30-60s en despertar
- ✅ 750 horas/mes

**Cómo usar**:

```bash
# 1. Crear cuenta en render.com
# 2. New → Web Service
# 3. Conectar GitHub
# 4. Configurar:
#    - Root Directory: apps/api
#    - Build Command: pnpm install && pnpm --filter @khipu/api build
#    - Start Command: pnpm --filter @khipu/api start
#    - Environment: Node
```

**Link**: https://render.com

**Consideraciones**:

- ✅ Gratis 100%
- ⚠️ Cold starts (30-60s)
- ✅ Bueno para prototipos

---

#### ✅ **Opción 3: Fly.io**

**Plan Gratuito**:

- ✅ 3 VMs pequeñas gratis
- ✅ No se duerme
- ✅ Deploy rápido

**Link**: https://fly.io

---

### 3. 🗄️ **DATABASE (PostgreSQL)**

#### ✅ **Opción 1: Neon (RECOMENDADO)**

**Plan Gratuito**:

- ✅ 512MB storage
- ✅ PostgreSQL serverless
- ✅ No se duerme
- ✅ Branching (dev/staging/prod)
- ✅ 100 horas compute/mes

**Cómo usar**:

```bash
# 1. Crear cuenta en neon.tech
# 2. Create Project
# 3. Copiar connection string:
#    postgresql://user:pass@ep-xxx.neon.tech/neondb
# 4. Agregar a .env y servicios
```

**Link**: https://neon.tech

---

#### ✅ **Opción 2: Supabase**

**Plan Gratuito**:

- ✅ 500MB database
- ✅ PostgreSQL completo
- ✅ No se duerme
- ✅ API REST automática
- ✅ Realtime subscriptions

**Cómo usar**:

```bash
# 1. Crear cuenta en supabase.com
# 2. New project
# 3. Obtener connection string desde Settings → Database
# 4. Usar en DATABASE_URL
```

**Link**: https://supabase.com

---

#### ✅ **Opción 3: Railway PostgreSQL**

**Plan Gratuito**:

- ✅ Incluido en crédito de $5/mes
- ✅ Mismo proyecto que API
- ✅ Simple de conectar

**Link**: https://railway.app

---

### 4. ⛓️ **BLOCKCHAIN INDEXER**

#### ✅ **Opción 1: Railway Worker (RECOMENDADO)**

**Cómo usar**:

```bash
# 1. En Railway, mismo proyecto de API
# 2. New Service → Deploy from GitHub
# 3. Configurar:
#    - Root Directory: packages/blockchain
#    - Build Command: pnpm install && pnpm build
#    - Start Command: pnpm start
# 4. Variables:
#    DATABASE_URL=postgresql://...
#    RPC_URL=https://rpc.test.mezo.org
#    INDIVIDUAL_POOL_ADDRESS=0xdfB...
#    COOPERATIVE_POOL_ADDRESS=0x323...
```

---

#### ✅ **Opción 2: Render Background Worker**

**Cómo usar**:

```bash
# 1. New → Background Worker
# 2. Conectar GitHub
# 3. Configurar build/start commands
# 4. Variables de entorno
```

---

## 🎯 CONFIGURACIÓN RECOMENDADA (100% GRATIS)

```
┌─────────────────────────────────────────────────────────┐
│              SETUP COMPLETO GRATUITO                    │
└─────────────────────────────────────────────────────────┘

📱 Frontend:     Vercel (gratis ilimitado)
🔧 Backend API:  Railway ($5/mes gratis)
⛓️ Indexer:      Railway (mismo crédito)
🗄️ Database:     Neon (gratis hasta 512MB)

💰 Costo Total: $0/mes
```

---

## 📝 GUÍA PASO A PASO DE DEPLOYMENT

### **PASO 1: Preparar Código**

```bash
# 1. Push código a GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Asegurar que todos los packages compilan
pnpm build

# 3. Verificar variables de entorno
# Revisar .env.example en cada package
```

---

### **PASO 2: Deploy Frontend (Vercel)**

```bash
# Opción A: Desde dashboard web
1. Ir a vercel.com
2. New Project → Import from GitHub
3. Seleccionar KhipuVault repo
4. Framework: Next.js
5. Root Directory: apps/web
6. Environment Variables:
   NEXT_PUBLIC_API_URL=https://tu-api.railway.app/api
   NEXT_PUBLIC_CHAIN_ID=31611
   NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
   NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd...
   NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0x323FcA...
7. Deploy ✅

# Opción B: Desde CLI
cd apps/web
npx vercel --prod
```

**Resultado**: Tu frontend estará en `https://khipuvault.vercel.app`

---

### **PASO 3: Deploy Database (Neon)**

```bash
# 1. Ir a neon.tech
# 2. Sign up → Create Project
# 3. Project name: khipuvault
# 4. Region: Elegir más cercano
# 5. PostgreSQL version: 16 (latest)
# 6. Create Project

# 7. Copiar connection string:
postgresql://user:password@ep-xxx-123.neon.tech/neondb?sslmode=require

# 8. Guardar para usar en API y Indexer
```

---

### **PASO 4: Deploy Backend API (Railway)**

```bash
# 1. Ir a railway.app
# 2. New Project → Deploy from GitHub repo
# 3. Seleccionar KhipuVault
# 4. Add Service → From GitHub
# 5. Configure:

# Build Settings:
Root Directory: apps/api
Build Command: pnpm install && pnpm --filter @khipu/api build
Start Command: node apps/api/dist/index.js
Watch Paths: apps/api/**,packages/database/**

# Environment Variables:
DATABASE_URL=postgresql://... (de Neon)
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://khipuvault.vercel.app

# 6. Deploy ✅
```

**Resultado**: API estará en `https://khipuvault-api.railway.app`

---

### **PASO 5: Ejecutar Migraciones**

```bash
# En Railway, ir a tu API service
# Settings → Variables → Add Variable:
DATABASE_URL=postgresql://...

# Ejecutar migraciones:
# Opción 1: Desde local
DATABASE_URL="postgresql://..." pnpm --filter @khipu/database prisma migrate deploy

# Opción 2: Desde Railway CLI
railway run pnpm --filter @khipu/database prisma migrate deploy
```

---

### **PASO 6: Deploy Indexer (Railway)**

```bash
# 1. En el mismo proyecto de Railway
# 2. New Service → From GitHub repo
# 3. Seleccionar mismo repo
# 4. Configure:

# Build Settings:
Root Directory: packages/blockchain
Build Command: pnpm install && pnpm --filter @khipu/blockchain build
Start Command: node packages/blockchain/dist/index.js
Watch Paths: packages/blockchain/**,packages/database/**

# Environment Variables:
DATABASE_URL=postgresql://... (mismo que API)
RPC_URL=https://rpc.test.mezo.org
INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
COOPERATIVE_POOL_ADDRESS=0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88
NODE_ENV=production

# 5. Deploy ✅
```

---

### **PASO 7: Actualizar Frontend con URL de API**

```bash
# En Vercel:
# 1. Project Settings → Environment Variables
# 2. Actualizar:
NEXT_PUBLIC_API_URL=https://khipuvault-api.railway.app/api

# 3. Redeploy:
# Deployments → Latest → Redeploy
```

---

### **PASO 8: Verificar Todo Funciona**

```bash
# Frontend
curl https://khipuvault.vercel.app
# Debería cargar la página

# API Health
curl https://khipuvault-api.railway.app/health
# Debería retornar: {"status":"healthy",...}

# API Pools
curl https://khipuvault-api.railway.app/api/pools
# Debería retornar array (vacío o con datos)

# Verificar logs del indexer en Railway
# Services → Indexer → Logs
# Debería ver eventos siendo indexados
```

---

## 💰 COSTOS ESTIMADOS

### **Plan Gratuito Total**:

```
✅ Vercel (Frontend):         $0/mes
✅ Railway (API + Indexer):   $0/mes (primeros $5 gratis)
✅ Neon (Database):           $0/mes
✅ Mezo RPC:                  $0/mes (público)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL:                     $0/mes
```

### **Cuando Escales** (más tráfico):

```
📱 Vercel Pro:                $20/mes (opcional, si necesitas más)
🔧 Railway Pro:               $5/mes (cuando uses > $5 crédito)
🗄️ Neon Scale:                $19/mes (si necesitas > 512MB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL:                     ~$44/mes (solo si creces mucho)
```

---

## ⚙️ ALTERNATIVA: DOCKER COMPOSE (Si tienes VPS)

Si tienes un VPS propio (DigitalOcean, Hetzner, etc.):

```bash
# 1. En tu VPS (Ubuntu/Debian):
sudo apt update
sudo apt install docker docker-compose

# 2. Clonar repo
git clone https://github.com/tu-user/KhipuVault.git
cd KhipuVault

# 3. Configurar .env
cp .env.example .env
# Editar .env con tus valores

# 4. Levantar servicios
docker-compose up -d

# 5. Ejecutar migraciones
docker-compose exec api pnpm --filter @khipu/database prisma migrate deploy

# 6. Ver logs
docker-compose logs -f
```

**Costos VPS más baratos**:

- Hetzner: $4.50/mes (2GB RAM)
- DigitalOcean: $6/mes (1GB RAM)
- Vultr: $5/mes (1GB RAM)

---

## 🎯 RECOMENDACIÓN FINAL

### **Para MVP / Prototipo** (GRATIS):

```
✅ Frontend: Vercel
✅ Backend: Railway
✅ Database: Neon
✅ Indexer: Railway
```

### **Para Producción** (cuando tengas usuarios):

```
✅ Frontend: Vercel Pro ($20/mes)
✅ Backend: Railway Pro ($20/mes)
✅ Database: Supabase Pro ($25/mes)
✅ Indexer: Railway (incluido)
✅ Monitoring: Sentry (gratis hasta 5k eventos)

💰 Total: ~$65/mes
```

### **Para Gran Escala** (muchos usuarios):

```
✅ Frontend: Vercel Enterprise
✅ Backend: AWS/GCP con auto-scaling
✅ Database: AWS RDS PostgreSQL
✅ Monitoring: Datadog
✅ CDN: CloudFlare

💰 Total: Variable según uso
```

---

## 📊 COMPARACIÓN DE OPCIONES

| Servicio     | Plan Gratuito | Cold Starts    | Deploy Time | Límites         |
| ------------ | ------------- | -------------- | ----------- | --------------- |
| **Vercel**   | ✅ Ilimitado  | ❌ No          | ~30s        | 100GB bandwidth |
| **Railway**  | ⚠️ $5/mes     | ❌ No          | ~2min       | 500 horas       |
| **Render**   | ✅ Ilimitado  | ⚠️ Sí (30-60s) | ~5min       | 750 horas       |
| **Fly.io**   | ⚠️ 3 VMs      | ❌ No          | ~1min       | 3 instancias    |
| **Neon**     | ✅ Sí         | ❌ No          | Instant     | 512MB + 100h    |
| **Supabase** | ✅ Sí         | ❌ No          | Instant     | 500MB           |

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ "Build failed on Railway"

```bash
# Solución: Verificar package.json scripts
# Asegurar que existe:
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### ❌ "Database connection failed"

```bash
# Solución: Verificar connection string
# Formato correcto:
postgresql://user:password@host:5432/database?sslmode=require

# Probar conexión:
psql "postgresql://..."
```

### ❌ "API returns 502 Bad Gateway"

```bash
# Solución: Verificar PORT variable
# Railway asigna PORT automáticamente
# Asegurar que tu app escucha en process.env.PORT
```

### ❌ "CORS error en frontend"

```bash
# Solución: Agregar dominio de Vercel a CORS_ORIGIN
CORS_ORIGIN=https://khipuvault.vercel.app,https://*.vercel.app
```

---

## 📚 RECURSOS ADICIONALES

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Neon Docs](https://neon.tech/docs)
- [Render Docs](https://render.com/docs)

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Código pusheado a GitHub
- [ ] Todos los packages compilan (`pnpm build`)
- [ ] Variables de entorno configuradas
- [ ] Frontend deployado en Vercel
- [ ] Database creada en Neon
- [ ] Migraciones ejecutadas
- [ ] Backend API deployado en Railway
- [ ] Indexer deployado en Railway
- [ ] Frontend apunta a API correcta
- [ ] Tested endpoints de API
- [ ] Verificado logs del indexer
- [ ] Documentación actualizada

---

## 🎉 RESUMEN

**NO NECESITAS SERVIDOR PROPIO** ✅

Puedes hospedar **TODO GRATIS** con:

- Vercel (frontend)
- Railway (backend + indexer)
- Neon (database)

**Tiempo estimado de setup**: 1-2 horas

**Costo**: $0/mes (hasta que crezcas mucho)

---

**¿Listo para deployar?** 🚀
