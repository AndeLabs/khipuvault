import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Transpile Mezo Passport and dependencies for Next.js 15
  transpilePackages: [
    '@mezo-org/passport',
    '@mezo-org/orangekit',
    '@mezo-org/orangekit-smart-account',
    '@mezo-org/orangekit-contracts',
  ],
  webpack: (config, { isServer }) => {
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
    
    // Ignore React Native modules in browser build
    if (!isServer) {
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
      config.resolve.extensions = config.resolve.extensions.filter(ext => ext !== '.native.js');
    }
    
    // External node modules for server-side
    if (isServer) {
      config.externals.push('pino-pretty', 'encoding');
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;