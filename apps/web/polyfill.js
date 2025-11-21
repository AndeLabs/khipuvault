/**
 * Global localStorage polyfill for Node.js SSR
 * Loaded via NODE_OPTIONS before Next.js starts
 * This ensures localStorage is available before any dependencies try to access it
 */

// Only polyfill if we're in Node.js (not browser)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  const storage = new Map();

  const mockStorage = {
    getItem: function(key) {
      const value = storage.get(key);
      console.log(`[polyfill] localStorage.getItem("${key}") => ${value}`);
      return value || null;
    },
    setItem: function(key, value) {
      console.log(`[polyfill] localStorage.setItem("${key}", "${value}")`);
      storage.set(key, value);
    },
    removeItem: function(key) {
      console.log(`[polyfill] localStorage.removeItem("${key}")`);
      storage.delete(key);
    },
    clear: function() {
      console.log(`[polyfill] localStorage.clear()`);
      storage.clear();
    },
    get length() {
      return storage.size;
    },
    key: function(index) {
      return Array.from(storage.keys())[index] || null;
    }
  };

  // Apply to global
  global.localStorage = mockStorage;
  global.sessionStorage = mockStorage;

  // Also apply to globalThis
  if (typeof globalThis !== 'undefined') {
    globalThis.localStorage = mockStorage;
    globalThis.sessionStorage = mockStorage;
  }

  console.log('✓ [polyfill] localStorage/sessionStorage polyfilled globally for Node.js SSR');

  // Track what's trying to access it
  const originalGetItem = mockStorage.getItem;
  mockStorage.getItem = function(key) {
    const stack = new Error().stack;
    if (stack && stack.includes('node_modules')) {
      const lines = stack.split('\n');
      for (const line of lines) {
        if (line.includes('node_modules') && !line.includes('polyfill.js')) {
          console.log(`[polyfill] ⚠️  localStorage accessed from: ${line.trim()}`);
          break;
        }
      }
    }
    return originalGetItem.call(this, key);
  };
}
