/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
      domains: ['es.wikipedia.org'],
  },
  // Add these
  experimental: {
      serverActions: true
  },
  // This ensures proper static/dynamic rendering
  output: 'standalone',
}

export default nextConfig;