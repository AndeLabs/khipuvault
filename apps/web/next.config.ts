import path from "path";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWAInit from "next-pwa";

import type { NextConfig } from "next";

// CRITICAL: Polyfill localStorage for SSR before any other imports
// MetaMask SDK and some dependencies try to access localStorage during module initialization
if (typeof globalThis.localStorage === "undefined") {
  const storage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (index: number) => Array.from(storage.keys())[index] || null,
  };
  (globalThis as any).sessionStorage = (globalThis as any).localStorage;
}

const nextConfig: NextConfig = {
  // CRITICAL: Set output file tracing root to monorepo root for proper dependency resolution
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    // Enable type checking during builds for production safety
    ignoreBuildErrors: process.env.NODE_ENV !== "production",
  },
  eslint: {
    // Enable linting during builds for code quality
    ignoreDuringBuilds: process.env.NODE_ENV !== "production",
  },
  // Security headers for production
  headers: async () => {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // DNS prefetch control
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Enable HSTS (HTTP Strict Transport Security)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Permissions Policy (disable unused features)
          // Note: interest-cohort is deprecated, removed to avoid browser warnings
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy - Allow wallet connections and essential resources
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self, inline (needed for Next.js), and eval (needed for wagmi/viem)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.metamask.io https://*.privy.io",
              // Styles: self and inline (needed for Tailwind)
              "style-src 'self' 'unsafe-inline'",
              // Images: self, data URIs, and common image hosts
              "img-src 'self' data: blob: https: http:",
              // Fonts: self and data URIs
              "font-src 'self' data:",
              // Connect: Allow RPC, API, and wallet connections (MetaMask SDK and analytics)
              // In development: also allow localhost:3001 for backend API
              `connect-src 'self' ${process.env.NODE_ENV === "development" ? "http://localhost:3001 http://127.0.0.1:3001" : ""} https://rpc.test.mezo.org https://rpc.mezo.org wss://rpc.test.mezo.org wss://rpc.mezo.org https://explorer.test.mezo.org https://api.coingecko.com https://*.metamask.io https://*.cx.metamask.io https://mm-sdk-analytics.api.cx.metamask.io https://mm-sdk.metamask.io`,
              // Frame: Allow wallet popups and iframes
              "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://*.metamask.io https://*.coinbase.com https://verify.walletconnect.com https://verify.walletconnect.org https://*.privy.io https://*.rainbow.me",
              // Object: Disallow plugins
              "object-src 'none'",
              // Base: self
              "base-uri 'self'",
              // Form action: self
              "form-action 'self'",
              // Frame ancestors: none (prevent framing)
              "frame-ancestors 'none'",
              // Upgrade insecure requests in production
              ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Transpile Mezo Passport and dependencies for Next.js 15
  // NOTE: Internal @khipu/* packages are pre-built with tsup, not transpiled
  transpilePackages: [
    "@mezo-org/passport",
    "@mezo-org/orangekit",
    "@mezo-org/orangekit-smart-account",
    "@mezo-org/orangekit-contracts",
  ],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };

    // Fix for Mezo Passport modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Always ignore React Native modules (for both server and client)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "react-native": false,
      "react-native-safe-area-context": false,
      "react-native-screens": false,
      "react-native-gesture-handler": false,
      "react-native-reanimated": false,
    };

    // Ignore React Native modules in webpack resolve
    if (!isServer) {
      config.resolve.extensions = config.resolve.extensions.filter(
        (ext: string) => ext !== ".native.js"
      );
    }

    // Suppress MetaMask SDK warnings about missing React Native modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
    ];

    // External node modules for server-side
    if (isServer) {
      config.externals.push("pino-pretty", "encoding");
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

/**
 * PWA Configuration
 * Enables Progressive Web App features for mobile installation
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Don't precache API routes or dynamic pages
  buildExcludes: [/middleware-manifest\.json$/],
  // Runtime caching for blockchain data
  runtimeCaching: [
    {
      // Cache RPC responses briefly
      urlPattern: /^https:\/\/rpc\.test\.mezo\.org\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "rpc-cache",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60, // 1 minute
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // Cache static assets
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
  ],
});

/**
 * Bundle Analyzer Configuration
 * Enables webpack bundle analysis when ANALYZE=true environment variable is set
 * Usage: ANALYZE=true next build
 */
const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyzeBundles(withPWA(nextConfig));
