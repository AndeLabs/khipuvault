/**
 * Bundle Analyzer Configuration
 * Run with: ANALYZE=true npm run build
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Import the main next.config.ts
const nextConfig = require('./next.config.ts')

module.exports = withBundleAnalyzer(nextConfig.default || nextConfig)
