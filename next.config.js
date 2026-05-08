require('./lib/utils/server-browser-globals')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double-invocation of effects that can
  // cause Leaflet to initialize twice on the same container in development.
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
        hostname: 'dweb.link',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.seadn.io',
      },
      // Twitter/X media domains
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'video.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'ton.twimg.com',
      },
      // Discord CDN
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
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

  // Add rewrites to handle WebP requests for map icons by serving PNG versions.
  // `/api/*` remote dev proxying is handled in `middleware.ts` so it can run
  // before App Router API route handlers.
  async rewrites() {
    return [
      {
        source: '/images/mapicons/:path*.webp',
        destination: '/images/mapicons/:path*.png',
      },
      {
        source: '/images/legendicons/:path*.webp',
        destination: '/images/legendicons/:path*.png',
      },
    ]
  },
}

module.exports = nextConfig
