/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double-invocation of effects that can
  // cause Leaflet to initialize twice on the same container in development.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
    ],
    // Enable optimization for character images (Leaflet uses direct URLs, not Next/Image)
  },
  webpack: (config, { isServer }) => {
    // Suppress MetaMask SDK React Native dependency warnings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
      }
    }

    // Ignore specific module warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { message: /@react-native-async-storage\/async-storage/ },
    ]

    return config
  },

  // Add rewrites to handle WebP requests for map icons by serving PNG versions
  async rewrites() {
    return [
      {
        source: '/images/mapicons/:path*.webp',
        destination: '/images/mapicons/:path*.png'
      },
      {
        source: '/images/legendicons/:path*.webp',
        destination: '/images/legendicons/:path*.png'
      }
    ]
  },
}

module.exports = nextConfig
