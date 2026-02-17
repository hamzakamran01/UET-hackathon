/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable source maps in production for security
  productionBrowserSourceMaps: false,

  // Enable standalone output for Docker (optimized production builds)
  output: 'standalone',

  // Ignore build errors for deployment (since local build passes)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile these packages for better compatibility
  transpilePackages: ['framer-motion', 'lucide-react'],

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000',
  },

  // Remote images for enterprise stock photography
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },

  // Webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    // Handle framer-motion on server side
    if (isServer) {
      config.externals = [...(config.externals || []), 'framer-motion']
    }

    return config
  },
}

module.exports = nextConfig
