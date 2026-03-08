# PWA Module

Progressive Web App utilities for KhipuVault. Complements next-pwa configuration.

## Features

- **Service Worker Configuration**: Caching strategies and runtime configuration
- **Offline Storage**: IndexedDB for persistent offline data
- **Push Notifications**: Browser notifications for transactions and events
- **Install Prompt**: Custom install experience with hook

## Quick Start

### Initialize PWA

```tsx
// In your app layout or provider
import { useEffect } from "react";
import { initializePWA } from "@/lib/pwa";

function App() {
  useEffect(() => {
    initializePWA({
      enableAutoSync: true,
      requestNotifications: false, // Ask on user action, not on load
    });
  }, []);
}
```

### Install Prompt

```tsx
"use client";

import { useInstallPrompt } from "@/lib/pwa";
import { Button } from "@khipu/ui/components/button";

export function InstallButton() {
  const { canInstall, promptInstall, platform } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button onClick={promptInstall}>
      Install App {platform === "ios" && "(Add to Home Screen)"}
    </Button>
  );
}
```

### Offline Storage

```tsx
import { saveOfflineData, getOfflineData, addToSyncQueue } from "@/lib/pwa";

// Save data for offline access
await saveOfflineData("user-deposits", deposits);

// Retrieve offline data
const cachedDeposits = await getOfflineData("user-deposits");

// Queue action for sync when online
await addToSyncQueue({
  type: "transaction",
  data: { hash, amount },
  timestamp: Date.now(),
  retries: 0,
});
```

### Push Notifications

```tsx
import { requestNotificationPermission, notifyTransaction, sendLocalNotification } from "@/lib/pwa";

// Request permission
const permission = await requestNotificationPermission();

// Send transaction notification
await notifyTransaction("deposit", "success");

// Send custom notification
await sendLocalNotification({
  title: "Pool Update",
  body: "Your turn in ROSCA pool is coming up!",
  tag: "rosca-reminder",
});
```

### Cache Management

```tsx
import { clearCache, getCacheSize, CACHE_NAMES } from "@/lib/pwa";

// Clear specific cache
await clearCache(CACHE_NAMES.API);

// Get total cache size
const size = await getCacheSize();
console.log(`Cache has ${size} entries`);
```

## Cache Strategies

- **Network-First**: API calls, dynamic content (tries network, fallback to cache)
- **Cache-First**: Static assets, images (serve from cache, update in background)
- **Stale-While-Revalidate**: Semi-dynamic content (serve cache, update async)

## API Reference

### Service Worker Config

- `CACHE_STRATEGIES` - Predefined caching strategies
- `CACHEABLE_ROUTES` - Routes with cache configuration
- `CACHE_NAMES` - Cache identifiers
- `clearAllCaches()` - Clear all caches
- `clearCache(name)` - Clear specific cache
- `getCacheSize()` - Get cache entry count

### Offline Storage

- `openDatabase()` - Open IndexedDB
- `saveOfflineData(key, value)` - Save data
- `getOfflineData(key)` - Get data
- `clearOfflineData()` - Clear all offline data
- `addToSyncQueue(item)` - Queue for sync
- `syncWhenOnline(onSync)` - Sync when connection restored
- `setupAutoSync(onSync)` - Auto-sync on reconnect

### Push Notifications

- `requestNotificationPermission()` - Request permission
- `subscribeToPush()` - Subscribe to push
- `sendLocalNotification(options)` - Local notification
- `notifyTransaction(type, status)` - Transaction notification
- `notifyLottery(event)` - Lottery notification
- `notifyROSCA(event)` - ROSCA notification

### Install Prompt

- `useInstallPrompt()` - React hook for install UI
- `isStandalone()` - Check if running as installed app
- `isInstallable()` - Check if PWA can be installed
- `checkPWASupport()` - Check browser support

## Best Practices

1. **Initialize once** - Call `initializePWA()` in root layout
2. **Request permissions on user action** - Don't auto-request on load
3. **Handle offline gracefully** - Show offline indicators
4. **Clear old caches** - Implement cache cleanup strategy
5. **Test on real devices** - PWA features vary by browser

## Browser Support

- Chrome/Edge: Full support
- Firefox: Partial (no install prompt)
- Safari iOS: Manual installation only
- Safari Desktop: Limited support
