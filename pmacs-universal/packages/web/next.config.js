/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pmacs/core'],
  optimizeFonts: false, // Disable font optimization to avoid SSL issues
  serverComponentsExternalPackages: ['bcrypt'],
  webpack: (config, { isServer }) => {
    // Handle node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Mark bcrypt as external for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('bcrypt');
    }

    return config;
  },
};

module.exports = nextConfig;
