/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@buildmyhouse/shared-types', '@buildmyhouse/shared-ui'],
}

module.exports = nextConfig

