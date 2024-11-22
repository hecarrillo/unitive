/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
      domains: ['es.wikipedia.org'],
  },
  // This ensures proper static/dynamic rendering
  output: 'standalone',
}

export default nextConfig;