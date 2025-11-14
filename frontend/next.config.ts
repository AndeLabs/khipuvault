import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Only ignore during development, enforce in production
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  // Production optimizations
  compiler: {
    // Remove console.log in production, keep error and warn
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize package imports for better tree-shaking
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'lucide-react',
      'recharts',
    ],
  },
  // Transpile Mezo Passport and dependencies for Next.js 15
  transpilePackages: [
    '@mezo-org/passport',
    '@mezo-org/orangekit',
    '@mezo-org/orangekit-smart-account',
    '@mezo-org/orangekit-contracts',
  ],
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
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
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
      'react-native-safe-area-context': false,
      'react-native-screens': false,
      'react-native-gesture-handler': false,
      'react-native-reanimated': false,
    };

    // Ignore React Native modules in webpack resolve
    if (!isServer) {
      config.resolve.extensions = config.resolve.extensions.filter(ext => ext !== '.native.js');
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
      config.externals.push('pino-pretty', 'encoding');
    }

    // Production optimizations: Optimize chunk splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Main vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Radix UI components in separate chunk
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/]@radix-ui/,
              chunks: 'all',
              priority: 30,
            },
            // Web3 libraries in separate chunk
            web3: {
              name: 'web3',
              test: /[\\/]node_modules[\\/](wagmi|viem|@mezo-org|sats-connect)/,
              chunks: 'all',
              priority: 30,
            },
            // Charts library separate
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/]recharts/,
              chunks: 'all',
              priority: 25,
            },
            // Common chunks shared between pages
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  images: {
    // Use modern image formats for better performance
    formats: ['image/avif', 'image/webp'],
    // Optimize cache time
    minimumCacheTTL: 60,
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;