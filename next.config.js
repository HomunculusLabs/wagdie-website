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
    ],
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
}

module.exports = nextConfig
