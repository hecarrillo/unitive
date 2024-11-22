/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  images: {
    domains: ['es.wikipedia.org'],
  },
  middleware: {
    // Configure to use Edge Runtime
    runtime: 'edge',
  },
};

export default nextConfig;
