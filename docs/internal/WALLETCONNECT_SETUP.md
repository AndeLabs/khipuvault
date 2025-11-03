# WalletConnect Project ID - Guía de Configuración

## ¿Qué es WalletConnect Project ID?

WalletConnect es un protocolo que permite que las aplicaciones web (dApps) se conecten con wallets de criptomonedas de manera segura. El Project ID es una clave que identifica tu aplicación en la red de WalletConnect.

## ¿Por qué lo necesitas?

Tu frontend de KhipuVault usa RainbowKit, que a su vez usa WalletConnect para permitir que los usuarios conecten diferentes tipos de wallets (MetaMask, Trust Wallet, etc.) a tu aplicación.

Sin el Project ID, los usuarios no podrán conectar sus wallets usando WalletConnect.

## Cómo Obtener tu Project ID (GRATIS)

### Paso 1: Crear Cuenta
1. Ve a: https://cloud.walletconnect.com
2. Click en "Sign Up" o "Get Started"
3. Regístrate con tu email o GitHub

### Paso 2: Crear un Proyecto
1. Una vez dentro, click en "Create Project" o "New Project"
2. Completa la información:
   - **Project Name**: KhipuVault
   - **Homepage URL**: https://khipuvault.vercel.app
   - **Description**: Bitcoin savings platform on Mezo Network
   - **Project Type**: dApp

### Paso 3: Obtener tu Project ID
1. Una vez creado el proyecto, verás tu **Project ID**
2. Se ve algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
3. Cópialo

### Paso 4: Agregar a Vercel
1. Ve a Vercel Dashboard
2. Tu Proyecto > Settings > Environment Variables
3. Agrega nueva variable:
   - **Name**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - **Value**: Tu Project ID copiado
   - **Environment**: Production, Preview, Development

### Paso 5: Redeploy
1. Guarda las variables
2. Ve a Deployments
3. Click en el último deployment > "Redeploy"

## Alternativa: Sin WalletConnect (Solo MetaMask)

Si no quieres usar WalletConnect por ahora, puedes:

1. Usar solo MetaMask para testing
2. Los usuarios pueden conectar MetaMask directamente sin WalletConnect
3. Agregar WalletConnect más tarde cuando necesites soportar más wallets

## Verificar que Funciona

Después de agregar el Project ID:

1. Ve a https://khipuvault.vercel.app
2. Click en "Connect Wallet"
3. Deberías ver opciones como:
   - MetaMask
   - WalletConnect
   - Coinbase Wallet
   - Trust Wallet
   - etc.

Si no agregaste el Project ID, solo verás MetaMask.

## Es Gratis?

✅ SÍ - WalletConnect Cloud es GRATIS para:
- Hasta 1 millón de requests al mes
- Proyectos pequeños y medianos
- Testing y desarrollo

Solo pagas si excedes ese límite (muy poco probable en testnet).

## FAQ

**P: ¿Es obligatorio?**
R: No es obligatorio, pero es muy recomendado. Sin él, solo funcionará MetaMask.

**P: ¿Es seguro?**
R: Sí, es el estándar de la industria. Usado por Uniswap, Aave, etc.

**P: ¿Puedo cambiarlo después?**
R: Sí, puedes actualizar el Project ID en cualquier momento en Vercel.

**P: ¿Funciona en testnet?**
R: Sí, funciona perfectamente en Mezo Testnet.

## Resumen Rápido

```bash
1. Ir a: https://cloud.walletconnect.com
2. Sign Up (gratis)
3. Create Project > KhipuVault
4. Copiar Project ID
5. Agregar a Vercel como NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
6. Redeploy
7. ✅ Listo!
```

---

**Nota**: Por ahora puedes usar `your_project_id_here` como placeholder, la app funcionará con MetaMask. Pero para producción real, necesitas tu propio Project ID.
