/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@buildmyhouse/shared-types', '@buildmyhouse/shared-ui'],
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid intermittent corrupted .next filesystem cache during local development.
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig

